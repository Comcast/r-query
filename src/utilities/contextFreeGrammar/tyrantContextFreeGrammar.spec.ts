import { TyrantContextFreeGrammar } from "./tyrantContextFreeGrammar";
import { ICfgToken, ICfgRule } from "../../models/contextFreeGrammar";

describe("TyrantContextFreeGrammar", () => {
	it("should parse with callback in simple x{check}y grammar", () => {
		const tokens: ICfgToken[] = [
			["X", /^x$/],
			["Y", /^y$/]
		];
		const rules: ICfgRule[] = [["xy_rule", "X {xy_rule}? Y"]];
		const initialize = () => 0;
		const callback: [
			string,
			(state: number, items: string | string[]) => number
		][] = [
			[
				rules[0][0],
				(state: number, items: string | string[]) =>
					state + items.length / 2
			]
		];

		const TEST_CASES = [
			{
				input: "xxyy",
				expected: 2
			},
			{
				input: "xxxyyy",
				expected: 3
			},
			{
				input: "xy",
				expected: 1
			},
			{
				input: "xxxxxxxxxxyyyyyyyyyy",
				expected: 10
			},
			{
				input: "xxy", //invalid
				expected: null
			},
			{
				input: "xyy", //invalid
				expected: null
			}
		];

		const parser = new TyrantContextFreeGrammar<number>(
			tokens,
			rules,
			rules[0][0],
			initialize,
			callback
		);

		TEST_CASES.forEach(tc => {
			try {
				const result = parser.parseString(tc.input);
				expect(result).toBe(tc.expected);
			} catch (err) {
				expect(tc.expected).toBe(null);
			}
		});
	});

	it("should match an expect() with no (.toBe) or similar (real use case)", () => {
		const tokens: ICfgToken[] = [
			["EXPECT", /expect/],
			["LP", /\(/],
			["RP", /\)/],
			["SEMICOLON", /;/],
			["RB", /\}/],
			["WTSP", /(\s|\t)+/],
			["NOT_P", /[^(\(|\))]/]
		];
		const rules: ICfgRule[] = [
			["left_right_pair", "LP NOT_P* {left_right_pair}? NOT_P* RP"],
			[
				"bad_expect",
				"EXPECT WTSP? {left_right_pair} WTSP? [SEMICOLON|RB]"
			]
		];

		const LEFT_RIGHT_PAIR_TEST_CASES = [
			{
				input: "()",
				matches: true
			},
			{
				input: "(true)",
				matches: true
			},
			{
				input: "(())",
				matches: true
			},
			{
				input: "(()))",
				matches: false
			}
		];

		const leftRightPairParser = new TyrantContextFreeGrammar<true>(
			tokens,
			rules,
			"left_right_pair",
			() => true,
			[]
		);

		LEFT_RIGHT_PAIR_TEST_CASES.forEach(tc => {
			const result = leftRightPairParser.stringMatches(tc.input);
			expect(result).toBe(tc.matches);
		});

		const EXPECT_TEST_CASES = [
			{
				input: "expect();",
				matches: true
			},
			{
				input: "expect()}",
				matches: true
			},
			{
				input: "expect(true);",
				matches: true
			},
			{
				input: "expect(true).",
				matches: false
			},
			{
				input: "expect(true).toBe(true)",
				matches: false
			},
			{
				input: "expect(call(true));",
				matches: true
			},
			{
				input: "expect(call(true)).to",
				matches: false
			},
			{
				input: "expect(true); ....",
				matches: true
			},
			{
				input: "something; expect(true);",
				matches: true
			},
			{
				input: "something; expect(true); ...",
				matches: true
			}
		];

		const expectParser = new TyrantContextFreeGrammar<true>(
			tokens,
			rules,
			"bad_expect",
			() => true,
			[]
		);

		EXPECT_TEST_CASES.forEach(tc => {
			const result = expectParser.substringMatches(tc.input);
			expect(result).toBe(tc.matches);
		});
	});
});
