import { IAsyncIterator } from "./iterator";
import * as fs from "fs";

export interface IRepositoryReader {
	listRepositories(): Promise<Array<string>>;

	repositoryExists(...repoNames: Array<string>): Promise<boolean>;

	iterateFilesInRepo(
		repoName: string
	): IAsyncIterator<{
		filename: string;
		stats: fs.Stats;
	}>;

	readFile(repoName: string, filename: string): Promise<string>;
}
