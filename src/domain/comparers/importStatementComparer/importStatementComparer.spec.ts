import { NumberComparer } from "../numberComparer/numberComparer";
import { IFileExport, IFileImport } from "../../../models/public-api";
import { ImportStatementComparer } from "./importStatementComparer";

const testImptStmts: Array<IFileImport> = [
	{
		fromSource: "TestModule",
		moduleName: "TestService",
		moduleAlias: "TestService"
	},
	{
		fromSource: "ColorModule",
		moduleAlias: "ColorService",
		moduleName: "ColorService"
	}
];

describe("ImportStatementComparer", () => {
	let comparer: ImportStatementComparer;

	beforeEach(() => {
		comparer = new ImportStatementComparer(new NumberComparer());
	});

	runComparisonDualTest(
		testImptStmts,
		"contains",
		["TestService", "TestModule"],
		["Bad", "Bad"]
	);
	runComparisonDualTest(
		testImptStmts,
		"matches",
		[/service/i, /.*/],
		[/z/, /z/]
	);
	runComparisonDualTest(testImptStmts, "size=", testImptStmts.length, -1);
	runComparisonDualTest(
		testImptStmts,
		"size>=",
		testImptStmts.length - 1,
		testImptStmts.length + 1
	);
	runComparisonDualTest(
		testImptStmts,
		"size<=",
		testImptStmts.length + 1,
		testImptStmts.length - 1
	);
	runComparisonDualTest(
		testImptStmts,
		"size>",
		testImptStmts.length - 1,
		testImptStmts.length + 1
	);
	runComparisonDualTest(
		testImptStmts,
		"size<",
		testImptStmts.length + 1,
		testImptStmts.length - 1
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
