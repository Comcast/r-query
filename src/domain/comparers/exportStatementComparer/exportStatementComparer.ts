import { BaseComparer } from "../baseComparer";
import { IFileExport } from "../../../models/iFileParser";
import { NumberComparer } from "../numberComparer/numberComparer";

export class ExportStatementComparer extends BaseComparer<
	Array<IFileExport>,
	string | RegExp
> {
	constructor(private numberComparer: NumberComparer) {
		super();
	}

	typeName = "file_export_statements";
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

	isRightHandValid(rightHand: string | RegExp): boolean {
		return true; //TODO: update to check properly
	}

	doCompare(
		leftHand: IFileExport[],
		rightHand: string | RegExp,
		comparisonToken: string
	): boolean {
		switch (comparisonToken.toLowerCase()) {
			case "contains":
				return this.contains(leftHand, rightHand as string);
			case "matches":
				return this.matches(leftHand, rightHand as RegExp);
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

	private contains(leftHand: IFileExport[], exportName): boolean {
		return !!leftHand.find(expStmt => {
			return expStmt.name.indexOf(exportName) > -1;
		});
	}

	private matches(leftHand: IFileExport[], exportName: RegExp): boolean {
		return !!leftHand.find(expStmt => {
			return !!expStmt.name.match(exportName);
		});
	}
}
