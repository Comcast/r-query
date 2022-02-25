import { NumberComparer } from "../numberComparer/numberComparer";
import { ListComparer } from "./listComparer";
import { StringComparer } from "../stringComparer/stringComparer";

const testList = ["one", "two", "three"];

describe("ListComparer", () => {
	let comparer: ListComparer;

	beforeEach(() => {
		comparer = new ListComparer(new StringComparer(), new NumberComparer());
	});

	runComparisonDualTest(testList, "contains", "one", "zero");
	runComparisonDualTest(
		testList,
		"containsAll",
		["one", "two"],
		["zero", "one"]
	);
	runComparisonDualTest(
		testList,
		"containsAny",
		["zero", "two"],
		["zero", "bad"]
	);
	runComparisonDualTest(testList, "matches", /on/, /bad/);
	runComparisonDualTest(testList, "matchesAll", [/on/, /tw/], [/on/, /bad/]);
	runComparisonDualTest(
		testList,
		"matchesAny",
		[/on/, /zero/],
		[/zero/, /bad/]
	);
	runComparisonDualTest(testList, "size=", testList.length, -1);
	runComparisonDualTest(
		testList,
		"size>=",
		testList.length - 1,
		testList.length + 1
	);
	runComparisonDualTest(
		testList,
		"size<=",
		testList.length + 1,
		testList.length - 1
	);
	runComparisonDualTest(
		testList,
		"size>",
		testList.length - 1,
		testList.length + 1
	);
	runComparisonDualTest(
		testList,
		"size<",
		testList.length + 1,
		testList.length - 1
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
