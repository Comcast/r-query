import { ExportStatementComparer } from "./exportStatementComparer";
import { NumberComparer } from "../numberComparer/numberComparer";
import { IFileExport } from "../../../models/public-api";

const testExpStmts: Array<IFileExport> = [
	{
		type: "class",
		name: "TestService"
	},
	{
		type: "class",
		name: "ColorService"
	}
];

describe("ExportStatementComparer", () => {
	let comparer: ExportStatementComparer;

	beforeEach(() => {
		comparer = new ExportStatementComparer(new NumberComparer());
	});

	runComparisonDualTest(testExpStmts, "contains", "TestService", "Bad");
	runComparisonDualTest(testExpStmts, "matches", /service/i, /z/);
	runComparisonDualTest(testExpStmts, "size=", testExpStmts.length, -1);
	runComparisonDualTest(
		testExpStmts,
		"size>=",
		testExpStmts.length - 1,
		testExpStmts.length + 1
	);
	runComparisonDualTest(
		testExpStmts,
		"size<=",
		testExpStmts.length + 1,
		testExpStmts.length - 1
	);
	runComparisonDualTest(
		testExpStmts,
		"size>",
		testExpStmts.length - 1,
		testExpStmts.length + 1
	);
	runComparisonDualTest(
		testExpStmts,
		"size<",
		testExpStmts.length + 1,
		testExpStmts.length - 1
	);

	function runComparisonDualTest(
		leftHand: any,
		comparisonToken: string,
		rightHandCorrect: any,
		rightHandIncorrect: any
	): void {
		it(`should return true when ${comparisonToken} is correct`, () => {
			expect(
				comparer.compare(leftHand, rightHandCorrect, comparisonToken)
			).toBe(true);
		});

		it(`should return false when ${comparisonToken} is incorrect`, () => {
			expect(
				comparer.compare(leftHand, rightHandIncorrect, comparisonToken)
			).toBe(false);
		});
	}
});
