import { QueryExecutor } from "./queryExecutor";
import { AsyncBooleanEvaluator } from "lazy-boolean-evaluator";
import { IQueryIntermediateForm } from "../../models/queryIntermediateForm";
import { CompositeFileParser } from "../fileParser/fileParser";
import { TypescriptFileParser } from "../fileParser/typescriptParser/typescriptParser";
import { DefaultFileParser } from "../fileParser/defaultParser/defaultParser";
import { FIELD_TYPES } from "../../domain/fields";
import { COMPARERS } from "../../domain/allComparers";
import { CompositeFileLineCounter } from "../fileLineCounter/fileLineCounter";
import { CodeFileLineCounter } from "../fileLineCounter/codeFileLineCounter/codeFileLineCounter";
import { DefaultFileLineCounter } from "../fileLineCounter/defaultLineCounter/defaultLineCount";
import { RepositoryReader } from "../repoReader/repositoryReader";
import { FileSystemReader } from "../fileSystemReader/fileSystemReader";
import { FsMock } from "../fileSystemReader/fs.mock";

/**
 * Some expect values here depend upon the contents of testRepoData.spec.json,
 * It will be easier to append the file for new test cases with a new repo instead of modifying existing ones
 */

describe("QueryExecutor", () => {
	let executor: QueryExecutor;

	beforeEach(() => {
		executor = new QueryExecutor(
			new RepositoryReader("T:\\", new FileSystemReader(new FsMock())),
			FIELD_TYPES,
			COMPARERS,
			new AsyncBooleanEvaluator(),
			new CompositeFileParser([
				new TypescriptFileParser(),
				new DefaultFileParser()
			]),
			new CompositeFileLineCounter([
				new CodeFileLineCounter(),
				new DefaultFileLineCounter()
			])
		);
	});

	it("should list filenames and repos", async () => {
		const query: IQueryIntermediateForm = {
			select: [
				{
					fieldName: "repo_name",
					fieldAlias: "repoName"
				},
				{
					fieldName: "file_name",
					fieldAlias: "fileName"
				}
			],
			from: ["*"],
			where: null
		};

		const result = await executor.execute(query);
		expect(result).toBeTruthy();
		expect(result.data.length).toBeGreaterThan(1);
	});

	it("should list filenames within a single repo", async () => {
		const queryEmc = {
			select: [
				{
					fieldName: "repo_name",
					fieldAlias: "repoName"
				},
				{
					fieldName: "file_name",
					fieldAlias: "fileName"
				}
			],
			from: ["repo-test"],
			where: null
		};

		const resultEmc = await executor.execute(queryEmc);
		expect(resultEmc).toBeTruthy();
		expect(resultEmc.data.length).toBe(1);

		const queryEing = {
			select: [
				{
					fieldName: "repo_name",
					fieldAlias: "repoName"
				},
				{
					fieldName: "file_name",
					fieldAlias: "fileName"
				}
			],
			from: ["repo-test"],
			where: null
		};

		const resultEing = await executor.execute(queryEing);
		expect(resultEing).toBeTruthy();
		expect(resultEing.data.length).toBe(3);
	});

	it("should execute query with simple where condition", async () => {
		const query = {
			select: [
				{
					fieldName: "repo_name",
					fieldAlias: "repoName"
				},
				{
					fieldName: "file_name",
					fieldAlias: "fileName"
				},
				{
					fieldName: "file_contents",
					fieldAlias: "fileContents"
				}
			],
			from: ["repo-something"],
			where: [
				{
					field: "file_name",
					comparison: "contains",
					isNegated: false,
					comparedTo: "'component'"
				}
			]
		};

		const result = await executor.execute(query);
		expect(result).toBeTruthy();
		expect(result.data.length).toBe(1);
		expect(result.data[0].repoName).toBe("repo-something");
		expect(result.data[0].fileContents).toBeTruthy();
	});

	it("should query with regular expression from source", async () => {
		const query = {
			select: [
				{
					fieldName: "repo_name",
					fieldAlias: "repoName"
				}
			],
			from: ["/.*/"],
			where: null
		};

		const result = await executor.execute(query).catch(err => {
			throw err.errorStackMessages || err;
		});
		expect(result).toBeTruthy();
		expect(result.data.length).toBeGreaterThan(0);
	});
});
