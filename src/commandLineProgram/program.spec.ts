import { CmdProgram } from "./program";
import {
	RqlStringParser,
	QueryIntermediateFormValidator,
	QueryExecutor,
	RepositoryReader,
	FileSystemReader,
	CompositeFileParser,
	TypescriptFileParser,
	DefaultFileParser,
	CompositeFileLineCounter,
	CodeFileLineCounter,
	DefaultFileLineCounter
} from "../services/public-api";
import { COMPARERS, FIELD_TYPES } from "../domain/public-api";
import { FsMock } from "../services/fileSystemReader/fs.mock";
import { AsyncBooleanEvaluator } from "lazy-boolean-evaluator";

describe("CommandLineProgram", () => {
	it("should run basic queries", async () => {
		const queries = [
			"Select repoName, fileName From *",
			"Select fileName from eing-something"
		];

		for (let i = 0; i < queries.length; i++) {
			const query = queries[i];
			const result = await testCmd(query, []);
			expect(result.consoleOutput.length).toBeGreaterThan(0);
		}
	}, 10000);

	it("should enable verbose logging on flag", async () => {
		const query = "Select repoName, fileName From *";
		const flags = ["--verbose=true"];

		const result = await testCmd(query, flags);
		expect(result.consoleOutput.length).toBeGreaterThan(0);
		expect(
			result.consoleOutput.find(item => {
				return !!item.contents.find(inner =>
					inner.match(/verbose\s+log(ging)?\se/i)
				);
			})
		).toBeTruthy();
	}, 10000);

	async function testCmd(
		query: string,
		flags: Array<string>
	): Promise<{
		consoleOutput: Array<{
			level: string;
			contents: Array<any>;
		}>;
	}> {
		const logs = [];

		const newConsole = {
			log: (...params) => {
				logs.push({
					level: "log",
					contents: params
				});
			},
			warn: (...params) => {
				logs.push({
					level: "warn",
					contents: params
				});
			},
			error: (...params) => {
				logs.push({
					level: "error",
					contents: params
				});
			}
		};

		let program = new CmdProgram(
			"T:\\",
			[query].concat(flags),
			newConsole,
			new RqlStringParser(COMPARERS),
			(defaultFrom: string[]) => {
				return new QueryIntermediateFormValidator(
					FIELD_TYPES,
					COMPARERS,
					defaultFrom
				);
			},
			(workingDir: string, dontFilter: boolean) => {
				return new QueryExecutor(
					new RepositoryReader(
						workingDir,
						new FileSystemReader(new FsMock(), {
							excludedDirs: ["node_modules"]
						})
					),
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
			}
		);

		await program.start();
		return {
			consoleOutput: logs
		};
	}
});
