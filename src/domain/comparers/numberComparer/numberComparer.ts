import { BaseComparer } from "../baseComparer";

export class NumberComparer extends BaseComparer<
	string | number,
	string | number
> {
	typeName = "number";
	validComparisonTokens = [
		{
			name: "equals",
			tokenRegularLanguage: /=|equals/i
		},
		{
			name: ">",
			tokenRegularLanguage: />/i
		},
		{
			name: "<",
			tokenRegularLanguage: /</i
		},
		{
			name: ">=",
			tokenRegularLanguage: />=/i
		},
		{
			name: "<=",
			tokenRegularLanguage: /<=/i
		}
	];

	isRightHandValid(rightHand: string | number): boolean {
		return !isNaN(rightHand as number);
	}

	doCompare(
		leftHand: string | number,
		rightHand: string | number,
		comparisonToken: string
	): boolean {
		const left = parseFloat(leftHand + "");
		const right = parseFloat(rightHand + "");

		switch (comparisonToken) {
			case "equals":
				return left === right;
			case ">":
				return left > right;
			case "<":
				return left < right;
			case ">=":
				return left >= right;
			case "<=":
				return left <= right;
		}
	}
}
