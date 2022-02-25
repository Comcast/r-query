import { IFileSystemReader } from "../../models/public-api";
import { FileSystemReader } from "./fileSystemReader";
import { FsMock } from "./fs.mock";
import { CacheFileSystemReader } from "./cacheFileSystemReader";

describe("FileSystemReader", () => {
	//some tests can be run on fileSystemReader and cacheFileSystemReader
	let fileSystemReader: IFileSystemReader;
	let cacheFileSystemReader: CacheFileSystemReader;

	beforeEach(async () => {
		fileSystemReader = new FileSystemReader(new FsMock());
		cacheFileSystemReader = new CacheFileSystemReader(fileSystemReader, {
			rootDir: "T:/",
			excludedDirs: []
		});
		await cacheFileSystemReader.rescanAll();
	});

	runTestOnAllReaders("should read files", async reader => {
		const tests = [
			"T:\\eing-test\\package.json",
			"T:\\eing-something\\src\\components\\component.ts"
		];

		for (let i = 0; i < tests.length; i++) {
			const contents = await reader.readFile(tests[i]);
			expect(contents).toBeTruthy();
		}
	});

	runTestOnAllReaders("should read dir", async reader => {
		const dir = "T:\\";
		const expected = ["eing-test", "emc-test", "eing-something"].sort();

		const result = await reader.readDir(dir);
		expect(result.sort()).toStrictEqual(expected);
	});

	runTestOnAllReaders("should list files in dir", async reader => {
		const dir = "T:\\eing-test\\";
		const expected = ["package.json", "readme.md"];

		const result = await reader.listFilesInDir(dir);
		expect(result).toStrictEqual(expected);
	});

	runTestOnAllReaders("should list dirs in dir", async reader => {
		const dir = "T:\\eing-test\\";
		const expected = ["src"];

		const result = await reader.listDirectoriesInDir(dir);
		expect(result).toStrictEqual(expected);
	});

	function runTestOnAllReaders(
		testMessage: string,
		test: (reader: IFileSystemReader) => Promise<void>
	): void {
		it(testMessage + " : fileSystemReader", async () => {
			await test(fileSystemReader);
		});

		it(testMessage + " : cacheFileSystemReader", async () => {
			await test(cacheFileSystemReader);
		});
	}
});
