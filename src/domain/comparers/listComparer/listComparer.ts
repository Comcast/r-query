import { BaseComparer } from "../baseComparer";
import { StringComparer } from "../stringComparer/stringComparer";
import { NumberComparer } from "../numberComparer/numberComparer";

export class ListComparer extends BaseComparer<Array<any>, Array<any>> {
	constructor(
		private stringComparer: StringComparer,
		private numberComparer: NumberComparer
	) {
		super();
	}

	typeName = "list";
	validComparisonTokens = [
		{
			name: "contains",
			tokenRegularLanguage: /contains/i
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
			name: "size_equals",
			tokenRegularLanguage: /size(_|-)?(=|equals)/i
		},
		{
			name: "size_less_than",
			tokenRegularLanguage: /size(_|-)?(<|less(_|-)?than)/i
		},
		{
			name: "size_greater_than",
			tokenRegularLanguage: /size(_|-)?(>|greater(_|-)?than)/i
		},
		{
			name: "size_less_than_equal_to",
			tokenRegularLanguage: /size(_|-)?(<=|less(_|-)?than(_|-)?equal(_|-)?to)/i
		},
		{
			name: "size_greater_than_equal_to",
			tokenRegularLanguage: /size(_|-)?(>=|greater(_|-)?than(_|-)?equal(_|-)?to)/i
		}
	];

	isRightHandValid(rightHand: any[]): boolean {
		return true;
	}

	doCompare(
		leftHand: any[],
		rightHand: string | RegExp | Array<string | RegExp>,
		comparisonToken: string
	): boolean {
		switch (comparisonToken) {
			case "contains":
				return leftHand.reduce((bool, item) => {
					return (
						bool ||
						this.stringComparer.compare(item, rightHand as string, "equals")
					);
				}, false);
			case "contains_any":
				return leftHand.reduce((bool, item) => {
					return (
						bool ||
						!!(rightHand as Array<string>).find(rh =>
							this.stringComparer.compare(item, rh, "equals")
						)
					);
				}, false);
			case "contains_all":
				return (
					(rightHand as Array<string>).filter(rh => {
						return !!leftHand.find(lh =>
							this.stringComparer.compare(lh, rh, "equals")
						);
					}).length === (rightHand as Array<string>).length
				);
			case "matches":
				return leftHand.reduce((bool, item) => {
					return (
						bool ||
						this.stringComparer.compare(item, rightHand as string, "matches")
					);
				}, false);
			case "matches_any":
				return leftHand.reduce((bool, item) => {
					return (
						bool ||
						!!(rightHand as Array<string>).find(rh =>
							this.stringComparer.compare(item, rh, "matches")
						)
					);
				}, false);
			case "matches_all":
				return (
					(rightHand as Array<string>).filter(rh => {
						return !!leftHand.find(lh =>
							this.stringComparer.compare(lh, rh, "matches")
						);
					}).length === (rightHand as Array<string>).length
				);
			case "size_equals":
				return this.numberComparer.compare(
					leftHand.length,
					parseInt(rightHand as string),
					"equals"
				);
			case "size_less_than":
				return this.numberComparer.compare(
					leftHand.length,
					parseInt(rightHand as string),
					"<"
				);
			case "size_greater_than":
				return this.numberComparer.compare(
					leftHand.length,
					parseInt(rightHand as string),
					">"
				);
			case "size_less_than_equal_to":
				return this.numberComparer.compare(
					leftHand.length,
					parseInt(rightHand as string),
					"<="
				);
			case "size_greater_than_equal_to":
				return this.numberComparer.compare(
					leftHand.length,
					parseInt(rightHand as string),
					">="
				);
		}
	}
}
