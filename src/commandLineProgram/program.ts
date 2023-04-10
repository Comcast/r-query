import * as path from "path";
import * as fs from "fs";
import {
	IQueryIntermediateFormValidator,
	IQueryExecutor,
	IQueryParser
} from "../models/public-api";

export class CmdProgram {
	constructor(
		private dirname: string,
		private cmdArgs: Array<string>,
		private console: any,
		private queryParser: IQueryParser<any>,
		private createQueryValidator: (
			defaultFrom: Array<string>
		) => IQueryIntermediateFormValidator,
		private createQueryExecutor: (
			workingDir: string,
			dontFilter: boolean
		) => IQueryExecutor
	) {}

	private getInputQuery(): string {
		return this.cmdArgs[0];
	}

	private getOutFile(): string {
		return this.getConfigParam("outFile");
	}

	private isVerboseLogging(): boolean {
		return (
			["yes", "true", "verbose"].indexOf(
				(this.getConfigParam("verbose") || "").toLowerCase()
			) > -1
		);
	}

	private dontFilter(): boolean {
		return (
			["yes", "true"].indexOf(
				(this.getConfigParam("includeAllFiles") || "").toLowerCase()
			) > -1
		);
	}

	private getConfigParam(name: string): string {
		const arg = this.cmdArgs.find(arg =>
			arg.match(new RegExp(`^--${name}`, "i"))
		);
		if (!arg) {
			return null;
		}

		return arg.split("=").pop();
	}

	private getWorkingDirectory(): string {
		if (this.getConfigParam("workingDirectory")) {
			return this.getConfigParam("workingDirectory");
		}
		return this.dirname;
	}

	private logV(...params: Array<any>): void {
		if (this.isVerboseLogging()) {
			this.console.log(...params);
		}
	}

	async start() {
		let workingDir, defaultFrom;
		this.logV("Verbose logging enabled.");

		let query = this.getInputQuery();
		this.logV(`Processing query:`, query);
		let parsedQuery = this.queryParser.parseInput(query);

		//if no from specified, assume current dir is root of repository
		//else, assume current dir is working directory
		if (parsedQuery.from.length === 0) {
			workingDir = path.dirname(this.getWorkingDirectory());
			defaultFrom = [path.basename(this.getWorkingDirectory())];
			this.logV(`From location set to ${defaultFrom}.`);
		} else {
			workingDir = this.getWorkingDirectory();
			defaultFrom = [];
		}
		this.logV(`Working directory set to ${workingDir}.`);

		this.logV(`Validating intermediate form.`);
		let validatedQuery =
			this.createQueryValidator(defaultFrom).validate(parsedQuery);
		this.logV(JSON.stringify(validatedQuery, null, 4));

		//run the query
		const result = await this.createQueryExecutor(
			workingDir,
			this.dontFilter()
		).execute(validatedQuery);

		const outFile = this.getOutFile();
		if (outFile) {
			await this.writeFile(outFile, JSON.stringify(result.data, null, 4));
			this.console.log(
				`${result.data.length} rows.  Results were written to ${outFile}`
			);
		} else {
			this.console.log(result);
		}
	}

	private writeFile(file, contents): Promise<void> {
		return new Promise((resolve, reject) => {
			fs.writeFile(file, contents, err => {
				if (err) {
					reject(err);
				}
				resolve();
			});
		});
	}
}
