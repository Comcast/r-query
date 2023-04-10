import { StringComparer } from "./stringComparer";

describe("StringComparer", () => {
	let comparer: StringComparer;

	beforeEach(() => {
		comparer = new StringComparer();
	});

	runComparisonDualTest("something", "=", "something", "else");
	runComparisonDualTest(
		"something",
		"contains",
		"some",
		"a;sldkjf;askdjf;askdjf"
	);
	runComparisonDualTest(
		"something",
		"containsAll",
		["some", "thing"],
		["some", "a;sldkjf;askdjf;askdjf"]
	);
	runComparisonDualTest(
		"something",
		"containsAny",
		["some", "bad"],
		["bad", "a;sldkjf;askdjf;askdjf"]
	);
	runComparisonDualTest(
		"something",
		"matches",
		/some/,
		/a;sldkjf;askdjf;askdjf/
	);
	runComparisonDualTest(
		"something",
		"matchesAll",
		[/some/, /thing/],
		[/some/, /a;sldkjf;askdjf;askdjf/]
	);
	runComparisonDualTest(
		"something",
		"matchesAny",
		[/some/, /bad/],
		[/bad/, /asldkjfaskdjfaskdjf/]
	);
	runComparisonDualTest(" something ", "like", "something", "else");
	runComparisonDualTest(
		" something ",
		"containsSomethingLike",
		"something",
		"else"
	);
	runComparisonDualTest(
		"xxyy",
		"matches_grammar",
		[
			["match", "X {match}? Y"],
			["X", /^x$/],
			["Y", /^y$/]
		],
		[
			["match", "Z {match}? Y"],
			["Y", /^y$/],
			["Z", /^z$/]
		]
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
