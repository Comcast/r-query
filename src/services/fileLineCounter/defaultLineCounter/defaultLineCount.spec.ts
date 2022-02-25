import { DefaultFileLineCounter } from "./defaultLineCount";

describe("DefaultFileLineCounter", () => {
	let lineCounter: DefaultFileLineCounter;

	beforeEach(() => {
		lineCounter = new DefaultFileLineCounter();
	});

	it("should count num lines in files", async () => {
		const test = [
			{
				name: "testOne.txt",
				contents: "a\r\nb\r\nc\r\n",
				expected: 4
			},
			{
				name: "testTwo.txt",
				contents: "abc",
				expected: 1
			},
			{
				name: "testThree.txt",
				contents: "a\r\nasdfasfasdfasf",
				expected: 2
			}
		];

		for (let i = 0; i < test.length; i++) {
			const testCase = test[i];
			const result = await lineCounter.countLines(
				testCase.name,
				testCase.contents
			);
			expect(result.physical).toBe(testCase.expected);
		}
	});

	it("should count num empty lines in files", async () => {
		const test = [
			{
				name: "testOne.txt",
				contents: "a\r\nb\r\nc\r\n\r\n",
				expected: 2
			},
			{
				name: "testTwo.txt",
				contents: "abc",
				expected: 0
			},
			{
				name: "testThree.txt",
				contents: "\r\n\r\n\r\na\r\nasdfasfasdfasf",
				expected: 3
			}
		];

		for (let i = 0; i < test.length; i++) {
			const testCase = test[i];
			const result = await lineCounter.countLines(
				testCase.name,
				testCase.contents
			);
			expect(result.empty).toBe(testCase.expected);
		}
	});
});
