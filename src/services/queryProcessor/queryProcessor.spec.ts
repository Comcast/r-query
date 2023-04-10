import { QueryProcessor } from "./queryProcessor";
import { RqlStringParser } from "../queryParser/rqlStringParser/rqlStringParser";
import { COMPARERS, FIELD_TYPES } from "../../domain/public-api";
import { QueryIntermediateFormValidator } from "../queryValidator/queryValidator";
import { QueryExecutor } from "../queryExecutor/queryExecutor";
import { RepositoryReader } from "../repoReader/repositoryReader";
import { AsyncBooleanEvaluator } from "lazy-boolean-evaluator";
import { CompositeFileLineCounter } from "../fileLineCounter/fileLineCounter";
import { DefaultFileParser } from "../fileParser/defaultParser/defaultParser";
import { CompositeFileParser } from "../fileParser/fileParser";
import { DefaultFileLineCounter } from "../fileLineCounter/defaultLineCounter/defaultLineCount";
import { FileSystemReader } from "../fileSystemReader/fileSystemReader";
import { FsMock } from "../fileSystemReader/fs.mock";

/**
 * TODO: revisit
 * This setup might be more like integration testing even though certain modules are stubbed
 */
describe("QueryProcessor", () => {
	let queryProcessor: QueryProcessor<string>;

	beforeEach(() => {
		queryProcessor = new QueryProcessor(
			new RqlStringParser(COMPARERS),
			new QueryIntermediateFormValidator(FIELD_TYPES, COMPARERS),
			new QueryExecutor(
				new RepositoryReader(
					"T:\\",
					new FileSystemReader(new FsMock())
				),
				FIELD_TYPES,
				COMPARERS,
				new AsyncBooleanEvaluator(),
				new CompositeFileParser([new DefaultFileParser()]),
				new CompositeFileLineCounter([new DefaultFileLineCounter()])
			)
		);
	});

	it("should parse a query", async () => {
		const query = "Select filename From repo-something";
		const result = await queryProcessor.process(query).catch(err => {
			console.warn(`Error in parsing query`, err);
			throw err;
		});
		expect(result).toBeTruthy();
		expect(result.inputQuery).toBe(query);
		expect(result.selectedRepositories).toStrictEqual(["repo-something"]);
		expect(result.queryIntermediateForm).toBeTruthy();
		expect(result.queryResponse).toBeTruthy();
	});
});
