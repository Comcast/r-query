import { IComparer } from "../../models/comparer";
import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";

export abstract class BaseComparer<LeftType, RightType>
	implements IComparer<LeftType, RightType>
{
	abstract typeName: string;
	abstract validComparisonTokens: Array<{
		name: string;
		tokenRegularLanguage: RegExp;
	}>;

	abstract doCompare(
		leftHand: LeftType,
		rightHand: RightType,
		comparisonToken: string
	): boolean;
	abstract isRightHandValid(rightHand: RightType): boolean;

	compare(
		leftHand: LeftType,
		rightHand: RightType,
		comparisonToken: string
	): boolean {
		if (!this.isRightHandValid(rightHand)) {
			throw new QueryProcessorError(
				`Invalid right hand comparison for type ${this.typeName}`
			);
		}

		const tokenEntry = this.validComparisonTokens.find(tk =>
			comparisonToken.match(
				new RegExp(`^${tk.tokenRegularLanguage.source}$`, "i")
			)
		);
		if (!tokenEntry) {
			throw new QueryProcessorError(
				`${comparisonToken} is not a valid comparison operator!`
			);
		}

		comparisonToken = tokenEntry.name;

		let comparison;
		try {
			comparison = this.doCompare(leftHand, rightHand, comparisonToken);
		} catch (err: any) {
			throw new QueryProcessorError(
				`Error in comparison: [${leftHand}] ${comparisonToken} [${rightHand}] : ` +
					err,
				err
			);
		}
		if (typeof comparison === "undefined" || comparison === null) {
			throw new QueryProcessorError(
				`Invalid comparison for ${this.typeName} : ${comparisonToken}`
			);
		}
		return comparison;
	}
}
