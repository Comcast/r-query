import { CmdProgram } from "./commandLineProgram/program";
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
} from "./services/public-api";
import { COMPARERS, FIELD_TYPES } from "./domain/public-api";
import { IQueryIntermediateFormValidator, IQueryExecutor } from "./public-api";
import { AsyncBooleanEvaluator } from "lazy-boolean-evaluator";
import * as fs from "fs";

const args = process.argv;
args.splice(0, 2);
new CmdProgram(
	__dirname,
	args,
	console,
	new RqlStringParser(COMPARERS),
	(defaultFrom: Array<string>): IQueryIntermediateFormValidator => {
		return new QueryIntermediateFormValidator(
			FIELD_TYPES,
			COMPARERS,
			defaultFrom
		);
	},
	(workingDir: string, dontFilter: boolean): IQueryExecutor => {
		let excludedDirs = [];
		if (!dontFilter) {
			excludedDirs = ["node_modules", "dist", ".git", ".vscode", ".vs", "bin"];
		}

		return new QueryExecutor(
			new RepositoryReader(
				workingDir,
				new FileSystemReader(fs, {
					excludedDirs
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
).start();
