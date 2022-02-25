import { NumberComparer } from "./numberComparer";

describe("NumberComparer", () => {
	let comparer: NumberComparer;

	beforeEach(() => {
		comparer = new NumberComparer();
	});

	runComparisonDualTest(20, "=", 20, 21);
	runComparisonDualTest(20, ">", 19, 21);
	runComparisonDualTest(20, "<", 21, 19);
	runComparisonDualTest(20, ">=", 19, 21);
	runComparisonDualTest(20, "<=", 21, 19);

	it("should fail on bad comparison token", () => {
		try {
			comparer.compare(12, 24, "bad token asdfasfas");
			fail("Test should have failed on bad comparison token!");
		} catch (err) {
			expect(true).toBe(true);
		}
	});

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
