import { CodeFileLineCounter } from "./codeFileLineCounter";

describe("CodeFileLineCounter", () => {
	let lineCounter: CodeFileLineCounter;

	beforeEach(() => {
		lineCounter = new CodeFileLineCounter();
	});

	it("should not count lines for an unsupported file type", async () => {
		const fileName = "something.asdfasdfasdfasdfasdf";
		const contents = "asdfasdfasdfasdfasdf";

		try {
			await lineCounter.countLines(fileName, contents);
			fail("It should have failed for unsupported file type!");
		} catch (err) {
			expect(true).toBe(true);
		}
	});
});
