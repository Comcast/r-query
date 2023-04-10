import { BaseComparer } from "../baseComparer";
import { ICfgToken, ICfgRule } from "../../../models/contextFreeGrammar";
import { QueryProcessorError } from "../../../utilities/public-api";
import { TyrantContextFreeGrammar } from "../../../utilities/contextFreeGrammar/tyrantContextFreeGrammar";

export class StringComparer extends BaseComparer<
	string,
	string | RegExp | Array<string | RegExp> | [string, string | RegExp][]
> {
	typeName = "string";
	validComparisonTokens = [
		{
			name: "equals_any",
			tokenRegularLanguage: /=(_|-)?any|equals(_|-)?any/i
		},
		{
			name: "equals",
			tokenRegularLanguage: /=|equals/i
		},
		{
			name: "contains",
			tokenRegularLanguage: /contains/i
		},
		{
			name: "matches_grammar",
			tokenRegularLanguage: /matches(_|-)?grammar/i
		},
		{
			name: "matches",
			tokenRegularLanguage: /matches/i
		},
		{
			name: "matches_all",
			tokenRegularLanguage: /matches(_|-)?all/i
		},
		{
			name: "matches_any",
			tokenRegularLanguage: /matches(_|-)?any/i
		},
		{
			name: "contains_all",
			tokenRegularLanguage: /contains(_|-)?all/i
		},
		{
			name: "contains_any",
			tokenRegularLanguage: /contains(_|-)?any/i
		},
		{
			name: "like",
			tokenRegularLanguage: /like/i
		},
		{
			name: "contains_something_like",
			tokenRegularLanguage: /contains(_|-)?something(_|-)?like/i
		}
	];

	private likeCache = {};
	private someCache = {};

	isRightHandValid(rightHand: string | RegExp): boolean {
		return true; //TODO: handle appropriately
	}

	doCompare(
		leftHand: string,
		rightHand:
			| string
			| RegExp
			| string[]
			| RegExp[]
			| [string, string | RegExp][],
		comparisonToken: string
	): boolean {
		leftHand = leftHand || "";

		switch (comparisonToken.toLowerCase()) {
			case "equals":
				return leftHand == rightHand;
			case "equals_any":
				return (rightHand as string[]).reduce(
					(bool: boolean, str) => bool || leftHand == str,
					false
				);
			case "contains":
				return leftHand.indexOf(`${rightHand}`) > -1;
			case "matches_grammar":
				return this.matchGrammar(
					leftHand,
					rightHand as [string, string | RegExp][]
				);
			case "matches":
				return !!leftHand.match(rightHand as RegExp);
			case "matches_all":
				return (rightHand as Array<RegExp>).reduce(
					(bool: boolean, item) => {
						return bool && !!leftHand.match(item);
					},
					true
				);
			case "matches_any":
				return (rightHand as Array<RegExp>).reduce(
					(bool: boolean, item) => {
						return bool || !!leftHand.match(item);
					},
					false
				);
			case "contains_all":
				return (rightHand as Array<string>).reduce(
					(bool: boolean, item) => {
						return bool && leftHand.indexOf(`${item}`) > -1;
					},
					true
				);
			case "contains_any":
				return (rightHand as Array<string>).reduce(
					(bool: boolean, item) => {
						return bool || leftHand.indexOf(`${item}`) > -1;
					},
					false
				);
			case "like":
				//replace sql syntax with regular
				const originalPattern = rightHand as string;
				if (!this.likeCache[originalPattern]) {
					let pattern = originalPattern;
					pattern = pattern.replace(/\./g, "\\.");
					const specialChars = [
						["%", ".*"],
						["_", "."],
						["\\(", "\\\\("],
						["\\)", "\\\\)"],
						["\\\\", "\\"],
						["//", "\\/\\/"]
					];
					specialChars.forEach(item => {
						const regex = new RegExp(
							`(?<!\\\\)(\\\\\\\\)*${item[0]}`,
							"g"
						);
						pattern = pattern.replace(regex, item[1]);
					});

					this.likeCache[originalPattern] = new RegExp(pattern);
				}
				return !!leftHand.match(this.likeCache[originalPattern]);
			case "contains_something_like":
				//replace syntax with regular
				const originalSomePattern = rightHand as string;
				if (!this.someCache[originalSomePattern]) {
					let pattern = originalSomePattern;
					//strip whitespace
					pattern = pattern.replace(/\s+/g, "");
					//strip punctuation
					pattern = pattern.replace(/(\.|\?|\!|\(|\)|,|_)/g, "");

					this.someCache[originalSomePattern] = new RegExp(
						pattern,
						"gmi"
					);
				}
				return !!leftHand.match(this.someCache[originalSomePattern]);
		}
	}

	private matchGrammar(
		leftHand: string,
		rightHand: [string, string | RegExp][]
	): boolean {
		const tokens: ICfgToken[] = [];
		const rules: ICfgRule[] = [];
		rightHand.forEach((item: [string, string | RegExp]) => {
			if (typeof item[1] === "string") {
				rules.push(item as ICfgRule);
			} else {
				tokens.push(item as ICfgToken);
			}
		});
		if (tokens.length === 0 || rules.length === 0) {
			throw new QueryProcessorError(
				`There must be at least one rule and one token provided to the CFG!`
			);
		}

		const entryRule = rules[rules.length - 1][0];
		const parser = new TyrantContextFreeGrammar<true>(
			tokens,
			rules,
			entryRule,
			() => true,
			[]
		);
		return parser.substringMatches(leftHand);
	}
}
