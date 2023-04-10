import { IAsyncIterator } from "./iterator";
import * as fs from "fs";

export interface IFileSystemReader {
	listDirectoriesInDir(directory: string): Promise<Array<string>>;

	listFilesInDir(directory: string): Promise<Array<string>>;

	iterateFilesInDir(directory: string): IAsyncIterator<{
		filename: string;
		stats: fs.Stats;
	}>;

	readDir(dir: string): Promise<Array<string>>;

	readDirStats(
		dir: string
	): Promise<Array<{ filename: string; stats: fs.Stats }>>;

	readFile(filename: string): Promise<string>;

	statFile(filepath: string): Promise<fs.Stats>;
}
