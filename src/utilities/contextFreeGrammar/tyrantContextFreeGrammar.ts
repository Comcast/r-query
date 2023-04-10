import {
	IContextFreeGrammar,
	ICfgDefinition,
	ICfgToken,
	ICfgRule
} from "../../models/contextFreeGrammar";
import { tyrant } from "tyranny";
import { QueryProcessorError } from "../queryProcessorError/queryProcessorError";

export class TyrantContextFreeGrammar<ParseReturnType>
	implements IContextFreeGrammar<ParseReturnType>
{
	constructor(
		public readonly tokens: ICfgToken[],
		public readonly rules: ICfgRule[],
		public readonly entryRuleName: string,
		private readonly parseSetup: () => ParseReturnType,
		private readonly parseCallbacks: [
			string,
			(
				state: ParseReturnType,
				items: string | string[]
			) => ParseReturnType
		][]
	) {
		this.validateTokensRules(this.tokens, this.rules);
	}

	stringMatches(str: string): boolean {
		try {
			this.parseString(str);
			return true;
		} catch (err) {
			return false;
		}
	}

	substringMatches(str: string): boolean {
		if (this.stringMatches(str)) {
			return true;
		}

		let isFindingStartTokenName = true;
		let startRuleName = this.entryRuleName;
		let startTokenName = null;
		let visitedRuleNames = [];
		//find the first token to get the index based on regular expression search
		while (isFindingStartTokenName) {
			let index = 0;
			let splitNames = this.rules
				.find(rl => rl[0] === startRuleName)[1]
				.split(" ");
			let firstRuleToken = splitNames[index];
			while (
				visitedRuleNames.findIndex(
					str => str.indexOf(`{${firstRuleToken}}`) === 0
				) > -1
			) {
				index++;
				if (splitNames[index]) {
					firstRuleToken = splitNames[index];
				} else {
					throw new Error(
						`Unknown error while processing substring matches!`
					);
				}
			}

			if (firstRuleToken.indexOf("{") === 0) {
				startRuleName = firstRuleToken.substring(
					1,
					firstRuleToken.indexOf("}")
				);
				if (visitedRuleNames.indexOf(startRuleName) === -1) {
					visitedRuleNames.push("{" + startRuleName + "}");
				}
			} else {
				startTokenName = firstRuleToken;
				isFindingStartTokenName = false;
			}
		}

		let startTokens = [];
		if (startTokenName.indexOf("|") > -1) {
			startTokens = startTokenName
				.replace(/\(|\[|\)|\]|\s]/g, "")
				.split("|");
		} else {
			startTokens = [startTokenName];
		}

		let startTokenMatches = startTokens
			.map(tkName => {
				const reg = this.tokens.find(tk => tk[0] === tkName)[1];
				const rg = new RegExp(reg.source, "g" + reg.flags);
				//@ts-ignore
				return Array.from(str.matchAll(rg)) as RegExpMatchArray[];
			})
			.flat()
			.filter(r => !!r)
			.sort((a, b) => {
				return a.index - b.index;
			});
		if (startTokenMatches.length === 0) {
			return false;
		}

		//find the last token to get the index based on regular expression search
		let isFindingEndTokenName = true;
		let endTokenName = null;
		let endRuleName = this.entryRuleName;

		while (isFindingEndTokenName) {
			let splitNames = this.rules
				.find(rl => rl[0] === endRuleName)[1]
				.split(" ");
			let index = splitNames.length - 1;
			let lastRuleToken = splitNames[index];
			while (
				visitedRuleNames.findIndex(
					str => str.indexOf(`{${lastRuleToken}}`) === 0
				) > -1
			) {
				index--;
				if (index > -1) {
					lastRuleToken = splitNames[index];
				} else {
					throw new Error(
						`Unknown error while processing substring matches!`
					);
				}
			}

			if (lastRuleToken.indexOf("{") === 0) {
				endRuleName = lastRuleToken.substring(
					1,
					lastRuleToken.indexOf("}")
				);
				if (visitedRuleNames.indexOf(endRuleName) === -1) {
					visitedRuleNames.push("{" + endRuleName + "}");
				}
			} else {
				endTokenName = lastRuleToken;
				isFindingEndTokenName = false;
			}
		}

		let endTokens = [];
		if (endTokenName.indexOf("|") > -1) {
			endTokens = endTokenName.replace(/\(|\[|\)|\]|\s]/g, "").split("|");
		} else {
			endTokens = [endTokenName];
		}

		let endTokenMatches = endTokens
			.map(tkName => {
				const reg = this.tokens.find(tk => tk[0] === tkName)[1];
				const rg = new RegExp(reg.source, "g" + reg.flags);
				//@ts-ignore
				return Array.from(str.matchAll(rg)) as RegExpMatchArray[];
			})
			.flat()
			.filter(r => !!r)
			.sort((a, b) => {
				return a.index + a[0].length - (b.index + b[0].length);
			});
		if (endTokenMatches.length === 0) {
			return false;
		}

		//const endIndex = endTokenMatches.reduce((maxIndex, tk) => tk.index + tk[0].length > maxIndex ? tk.index + tk[0].length : maxIndex, 0);

		for (
			let startMatchesIndex = 0;
			startMatchesIndex < startTokenMatches.length;
			startMatchesIndex++
		) {
			let start = startTokenMatches[startMatchesIndex].index;

			let endIndexStart = endTokenMatches.findIndex(
				endToken => endToken.index + endToken[0].length > start
			);
			for (
				let endMatchIndex = endIndexStart;
				endMatchIndex !== -1 && endMatchIndex < endTokenMatches.length;
				endMatchIndex++
			) {
				let end =
					endTokenMatches[endMatchIndex].index +
					endTokenMatches[endMatchIndex][0].length;
				if (start < end) {
					const substr = str.substring(start, end);
					if (this.stringMatches(substr)) {
						return true;
					}
				}
			}
		}

		return false;
	}

	parseString(input: string): ParseReturnType {
		let state = this.parseSetup();

		const processor = new tyrant();
		const tyrantTokens = this.tokens.reduce((obj, tkn) => {
			obj[tkn[0]] = tkn[1];
			let src = obj[tkn[0]].source;
			if (src[0] !== "^") {
				src = `^${src}`;
			}
			if (src[src.length - 1] !== "$") {
				src = `${src}$`;
			}
			obj[tkn[0]] = new RegExp(src, obj[tkn[0]].flags);
			return obj;
		}, {});
		processor.addTokens(tyrantTokens);
		const tyrantRules = this.rules.reduce((obj, rule) => {
			obj[rule[0]] = processor.compile(rule[1]);

			if (!obj[rule[0]]) {
				throw new QueryProcessorError(
					`There was an unknown error while assembling the context free grammar!`
				);
			}

			const callback = this.parseCallbacks.find(pc => pc[0] === rule[0]);
			if (callback) {
				obj[rule[0]] = obj[rule[0]].apply((items: string[]) => {
					state = callback[1](state, items);
				});
			}

			return obj;
		}, {});
		processor.addRules(tyrantRules);

		const response = processor.parse(input, [this.entryRuleName]);
		if (!response) {
			throw new QueryProcessorError(
				`There was an unknown error while parsing the input!  Check the query syntax!`
			);
		}

		return state;
	}

	private validateTokensRules(tokens: ICfgToken[], rules: ICfgRule[]): void {
		rules.forEach(rule => {
			const references = rule[1]
				.replace(/[^a-zA-Z\d\s:{}\_\|]/g, "")
				.replace(/\|/g, " ")
				.split(" ")
				.filter(item => !!item);
			references.forEach(ref => {
				if (ref.indexOf("{") === 0) {
					const refName = ref.substring(1, ref.length - 1);
					if (!rules.find(rl => rl[0] === refName)) {
						throw new Error(
							`Error in CFG: rule ${rule[0]} references rule ${refName} but there is no rule named ${refName}`
						);
					}
				} else {
					if (!tokens.find(tk => tk[0] === ref)) {
						throw new Error(
							`Error in CFG: rule ${rule[0]} references token ${ref} but there is no token named ${ref}`
						);
					}
				}
			});
		});
	}
}
