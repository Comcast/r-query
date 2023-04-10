/**
 * This implementation uses a tool called "tyrant" to parse an input string based on a context-free grammar defined here
 */

import { IQueryParser } from "../../../models/queryParser";
import {
	IQueryIntermediateForm,
	ISelectStatement,
	ISelectCondition,
	ISelectConditions
} from "../../../models/queryIntermediateForm";
import { QueryIntermediateForm } from "../../queryIntermediateForm/queryIntermediateForm";
import { IComparer } from "../../../models/comparer";
import { TOKENS_PROCESS } from "./grammar/tokens.process";
import { GRAMMAR_RULES_PROCESS } from "./grammar/grammar-rules.process";
import { QueryProcessorError } from "../../../utilities/queryProcessorError/queryProcessorError";
import {
	IContextFreeGrammar,
	ICfgToken
} from "../../../models/contextFreeGrammar";
import { TyrantContextFreeGrammar } from "../../../utilities/contextFreeGrammar/tyrantContextFreeGrammar";

export class RqlStringParser implements IQueryParser<string> {
	private grammar: IContextFreeGrammar<IQueryIntermediateForm>;

	private comparisons: Array<RegExp>;

	constructor(private comparers: Array<IComparer<any, any>>) {
		this.comparisons = this.comparers
			.map(cp =>
				cp.validComparisonTokens.map(tk => tk.tokenRegularLanguage)
			)
			.flat()
			.filter((token, ind, ar) => ar.indexOf(token) === ind);
		this.createProcessorGrammar();
	}

	parseInput(input: string): IQueryIntermediateForm {
		const grammar = this.createProcessorGrammar();

		//parse the pre-processed string
		const intermediateForm = grammar.parseString(input);

		return new QueryIntermediateForm(intermediateForm);
	}

	private processTokens(items: Array<IComparer<any, any>>): ICfgToken[] {
		const tokenStrings = items
			.map(item =>
				item.validComparisonTokens.map(
					vct => `${vct.tokenRegularLanguage.source}`
				)
			)
			.flat()
			.filter((item, ind, ar) => ar.indexOf(item) === ind);
		tokenStrings.sort((a, b) => b.length - a.length);
		const tokens: ICfgToken[] = TOKENS_PROCESS(tokenStrings);
		return tokens.map(item => {
			item[1] = new RegExp("^" + item[1].source + "$", item[1].flags);
			return item;
		});
	}

	/**
	 * The context free grammar here is SQL like in nature
	 */
	private createProcessorGrammar(): IContextFreeGrammar<IQueryIntermediateForm> {
		//define terminal symbols
		//a regular expression is considered a terminal token if it does not invoke other tokens or rules
		//must be defined in order of most specific accepted regular language to most general accepted regular language
		const mappedTokens = this.processTokens(this.comparers);

		//define nonterminal symbols
		//_APPLY is suffixed if the rule will change the query state directly
		const applyMap: [
			string,
			(
				state: IQueryIntermediateForm,
				items: string | string[]
			) => IQueryIntermediateForm
		][] = [
			[
				"FULL_WHERE_STATEMENT_APPLY",
				this.processWhereStatement.bind(this)
			],
			["FROM_ITEM_APPLY", this.addFromStatement.bind(this)],
			["SELECT_ITEM_APPLY", this.addSelectStatement.bind(this)]
		];

		return new TyrantContextFreeGrammar(
			mappedTokens,
			GRAMMAR_RULES_PROCESS,
			"QUERY",
			this.initIntermediateForm,
			applyMap
		);
	}

	private initIntermediateForm(): IQueryIntermediateForm {
		return {
			select: [],
			from: [],
			where: []
		};
	}

	/**
	 * Callback for input parsing to add a select statement
	 * @param item
	 */
	private addSelectStatement(
		state: IQueryIntermediateForm,
		field: string | string[]
	): IQueryIntermediateForm {
		if (!Array.isArray(field)) {
			field = [field];
		}

		let fieldAlias: string;
		let fieldName: string;
		if (field.length > 1) {
			field = field.filter(fd => !!fd.trim());
			fieldName = field[0];
			//field[1] = "as"
			fieldAlias = field[2].substring(1, field[2].length - 1);
		} else {
			fieldName = field[0];
			fieldAlias = field[0];
		}

		state.select.push({
			fieldName,
			fieldAlias
		});
		return state;
	}

	/**
	 * Callback for input parsing to add a from statement
	 * @param item
	 */
	private addFromStatement(
		state: IQueryIntermediateForm,
		item: string | string[]
	): IQueryIntermediateForm {
		if (Array.isArray(item)) {
			item = item[0];
		}

		state.from.push(item);
		return state;
	}

	/**
	 * Callback for input parsing to add the initial conditional statement
	 * @param items
	 */
	private processWhereStatement(
		state: IQueryIntermediateForm,
		items: string | string[]
	): IQueryIntermediateForm {
		if (!Array.isArray(items)) {
			items = [items];
		}

		items.splice(0, 1); //remove first "WHERE";

		const tuples = this.tuplizeConditions(items);
		//all arrays are now of size 3 (other than tuples), fieldname, comparison, comparedTo, or nested

		let processed = this.processTuple(tuples);

		if (!Array.isArray(processed)) {
			processed = [processed];
		}

		state.where = processed;
		return state;
	}

	private processTuple(item: Array<any>) {
		if (!Array.isArray(item)) {
			return item;
		}

		const searchRegex = cp => new RegExp(`^!?${cp.source}$`, "i");
		const foundComparison = item.find(entry => {
			return (
				typeof entry === "string" &&
				this.comparisons.find(cp => {
					return entry.match(searchRegex(cp));
				})
			);
		});

		if (foundComparison) {
			return this.processSelectCondition(item);
		}
		return item.map(it => this.processTuple(it));
	}

	private tuplizeConditions(items: Array<any>) {
		items = this.filterItems(items);

		let isTupleBracket = false;
		if (items[0] === "(") {
			items.splice(0, 1);
			items.splice(items.length - 1, 1);
		} else if (items[0] === "{") {
			isTupleBracket = true;
			items.splice(0, 1);
			items.splice(items.length - 1, 1);
			items = items.filter(item => item !== ",");
		}

		items = items.map(item => {
			if (Array.isArray(item)) {
				return this.tuplizeConditions(item);
			}
			return item;
		});

		if (items.length === 1 && !isTupleBracket) {
			return items[0];
		}
		return items;
	}

	private processSelectCondition(items: Array<string>): ISelectCondition {
		items = this.filterItems(items);

		let leftHand = items[0];
		let comparison = items[1];
		let rightHand: string | Array<string> = items[2];

		let isNegated = false;
		if (comparison[0] === "!") {
			isNegated = true;
			comparison = comparison.substring(1);
		}

		if (Array.isArray(rightHand)) {
			rightHand = rightHand.filter(item => {
				if (!item.trim) {
					return true;
				}
				item = item.trim();
				return item && item !== ",";
			});
		}

		return {
			field: leftHand,
			comparison,
			comparedTo: rightHand,
			isNegated
		};
	}

	private filterItems(items: any): any {
		if (Array.isArray(items)) {
			if (items[0].indexOf("/*") === 0) {
				return [];
			}
			return items
				.map(item => this.filterItems(item))
				.filter(item => {
					if (Array.isArray(item)) {
						return item.length > 0;
					} else if (typeof item === "string") {
						return !!item.trim();
					}
					return item;
				});
		} else {
			return items;
		}
	}
}
