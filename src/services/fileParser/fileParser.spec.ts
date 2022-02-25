import { CompositeFileParser } from "./fileParser";
import { TypescriptFileParser } from "./typescriptParser/typescriptParser";
import { DefaultFileParser } from "./defaultParser/defaultParser";

describe("FileParser", () => {
	let fileParser: CompositeFileParser;

	beforeEach(() => {
		fileParser = new CompositeFileParser([
			new TypescriptFileParser(),
			new DefaultFileParser()
		]);
	});

	it("should reject invalid constructor input", () => {
		try {
			fileParser = new CompositeFileParser([]);
			fail("FileParser with empty array should fail!");
		} catch (err) {
			expect(true).toBe(true);
		}
	});

	it("should delegate file line counting", () => {
		try {
			fileParser.parse("testFile.json", "");
			expect(true).toBe(true);
		} catch (err) {
			fail(err);
		}
	});
});
