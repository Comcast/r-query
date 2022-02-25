export interface IComparer<LeftType, RightType> {
	//primitive type or non primitive type name
	typeName: string;

	validComparisonTokens: Array<{
		name: string;
		tokenRegularLanguage: RegExp;
	}>;

	compare(
		leftHand: LeftType,
		rightHand: RightType,
		comparisonToken: string
	): boolean;
}
