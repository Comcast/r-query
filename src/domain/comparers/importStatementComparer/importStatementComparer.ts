import { BaseComparer } from "../baseComparer";
import { IFileImport } from "../../../models/iFileParser";
import { NumberComparer } from "../numberComparer/numberComparer";

export class ImportStatementComparer extends BaseComparer<
	Array<IFileImport>,
	[string, string] | [RegExp, RegExp] | string
> {
	constructor(private numberComparer: NumberComparer) {
		super();
	}

	typeName = "file_import_statements";
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

	isRightHandValid(rightHand: [string, string] | [RegExp, RegExp]): boolean {
		return true;
	}

	doCompare(
		leftHand: IFileImport[],
		rightHand: [string, string] | [RegExp, RegExp] | string,
		comparisonToken: string
	): boolean {
		switch (comparisonToken.toLowerCase()) {
			case "contains":
				return this.contains(leftHand, rightHand as [string, string]);
			case "matches":
				return this.matches(leftHand, rightHand as [RegExp, RegExp]);
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

	private contains(
		leftHand: IFileImport[],
		rightHand: [string, string]
	): boolean {
		const importName = rightHand[0];
		const fromName = rightHand[1];

		return !!leftHand.find(impStmt => {
			return (
				impStmt.fromSource === fromName && impStmt.moduleName === importName
			);
		});
	}

	private matches(
		leftHand: IFileImport[],
		rightHand: [RegExp, RegExp]
	): boolean {
		const importName = rightHand[0];
		const fromName = rightHand[1];

		return !!leftHand.find(impStmt => {
			return (
				!!(impStmt.fromSource || "").match(fromName) &&
				!!(impStmt.moduleName || "").match(importName)
			);
		});
	}
}
