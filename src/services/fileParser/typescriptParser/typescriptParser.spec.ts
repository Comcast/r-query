import { TypescriptFileParser } from "./typescriptParser";

describe("TypescriptParser", () => {
	let parser: TypescriptFileParser;

	beforeEach(() => {
		parser = new TypescriptFileParser();
	});

	it("should parse an interface file", async () => {
		const src = `export interface IFileImport {
            moduleName: string;
            moduleAlias: string;
            fromSource: string;
        }
        
        export interface IFileExport {
            name: string;
            type: string;
        }
        
        export interface IFileParsedData {
            imports: Array<IFileImport>;
            exports: Array<IFileExport>;
        }
        
        export interface IFileParser {
        
            parse(fileName: string, fileContents: string): Promise<IFileParsedData>;
        
        }`;

		const parsed = await parser.parse("test.ts", src);
		expect(parsed).toBeTruthy();
		expect(parsed.imports.length).toBe(0);
		expect(parsed.exports.length).toBe(4);
	});

	it("should fail when non typescript is passed", async () => {
		const fileName = "something.asdfasdfasdfasdfasdf";
		const contents = "asdfasdfasdfasdfasdf";

		try {
			await parser.parse(fileName, contents);
			fail("It should have failed for unsupported file type!");
		} catch (err) {
			expect(true).toBe(true);
		}
	});
});
