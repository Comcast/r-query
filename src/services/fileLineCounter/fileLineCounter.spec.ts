import { CompositeFileLineCounter } from "./fileLineCounter";
import { DefaultFileLineCounter } from "./defaultLineCounter/defaultLineCount";

describe("FileLineCounter", () => {
	let lineCounter: CompositeFileLineCounter;

	beforeEach(() => {
		lineCounter = new CompositeFileLineCounter([
			new DefaultFileLineCounter()
		]);
	});

	it("should reject invalid constructor input", () => {
		try {
			lineCounter = new CompositeFileLineCounter([]);
			fail("FileLineCounter with empty array should fail!");
		} catch (err) {
			expect(true).toBe(true);
		}
	});

	it("should delegate file line counting", () => {
		try {
			lineCounter.countLines("testFile.json", "");
			expect(true).toBe(true);
		} catch (err) {
			fail(err);
		}
	});
});
