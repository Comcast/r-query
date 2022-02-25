import { RepositoryReader } from "./repositoryReader";
import { FileSystemReader } from "../fileSystemReader/fileSystemReader";
import { FsMock } from "../fileSystemReader/fs.mock";

describe("RepositoryReader", () => {
	let repoReader: RepositoryReader;

	beforeEach(() => {
		repoReader = new RepositoryReader(
			"T:\\",
			new FileSystemReader(new FsMock())
		);
	});

	it("should list repo names", async () => {
		const expected = ["repo-test", "repo-test", "repo-something"];

		const result = await repoReader.listRepositories().catch(err => {
			throw new Error(err.errorStackMessages || err.toString());
		});
		expect(result).toStrictEqual(expected);
	});

	it("should validate if repositories exist", async () => {
		const exists = "repo-test";
		const notExists = "asfasf";

		const oneExists = await repoReader.repositoryExists(exists);
		expect(oneExists).toBe(true);

		const twoExists = await repoReader.repositoryExists(notExists);
		expect(twoExists).toBe(false);
	});

	it("should read file", async () => {
		const repo = "repo-test";
		const file = "package.json";

		const contents = await repoReader.readFile(repo, file).catch(err => {
			throw new Error(err.errorStackMessages || err.toString());
		});
		expect(contents).toBeTruthy();
	});

	it("should iterate over repo", async () => {
		const repo = "repo-test";
		const expectedFiles = 3;
		let visited = 0;

		const iterator = repoReader.iterateFilesInRepo(repo);
		await iterator.each(async () => {
			visited++;
		});

		expect(visited).toBe(expectedFiles);
	});
});
