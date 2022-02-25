import { IFileSystemReader } from "../../models/fileSystemReader";
import { IAsyncIterator } from "../../models/iterator";
import * as fs from "fs";
import * as path from "path";
import { AsyncIterator } from "../../utilities/iterator/asyncIterator";
import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";

export class FileSystemReader implements IFileSystemReader {
	private options;

	constructor(private nodeFs: any, options?: { excludedDirs: Array<string> }) {
		this.options = {
			excludedDirs: [],
			numParallel: 5,
			...(options || {})
		};
	}

	async listDirectoriesInDir(directory: string): Promise<string[]> {
		directory = path.resolve(directory);
		const baseFiles = await this.readDirStats(directory);
		const files = baseFiles.map(bf => {
			bf.filename = bf.filename.replace(directory, "");
			if (bf.filename.indexOf(path.sep) === 0) {
				bf.filename = bf.filename.substring(1);
			}
			return bf;
		});
		return files
			.filter(file => !file.stats.isFile())
			.map(file => file.filename);
	}
	async listFilesInDir(directory: string): Promise<string[]> {
		directory = path.resolve(directory);
		const baseFiles = await this.readDirStats(directory);
		const files = baseFiles.map(bf => {
			bf.filename = bf.filename.replace(directory, "");
			if (bf.filename.indexOf(path.sep) === 0) {
				bf.filename = bf.filename.substring(1);
			}
			return bf;
		});
		return files.filter(file => file.stats.isFile()).map(file => file.filename);
	}

	iterateFilesInDir(
		dir: string
	): IAsyncIterator<{
		filename: string;
		stats: fs.Stats;
	}> {
		let currentDir;
		let index;
		let currentDirFiles: Array<string>;
		let dirsToBeScanned: Array<string>;
		let scanIsComplete;
		const reset = () => {
			currentDir = dir;
			index = 0;
			currentDirFiles = [];
			dirsToBeScanned = [dir];
			scanIsComplete = false;
		};
		reset();

		const init = async () => {
			if (index === currentDirFiles.length) {
				let isSearching = true;
				while (isSearching && dirsToBeScanned.length > 0) {
					currentDir = dirsToBeScanned.pop();
					currentDirFiles = await this.readDir(currentDir);
					if (currentDirFiles.length > 0) {
						index = 0;
						isSearching = false;
					}
				}
				if (isSearching) {
					scanIsComplete = true;
					return;
				}
			}
		};

		let currentFile;
		const getNext = async () => {
			await init();
			if (scanIsComplete) {
				throw new QueryProcessorError("Scan is already complete!");
			}
			const item = currentDirFiles[index];
			currentFile = path.resolve(`${currentDir}/${item}`);
			const stat = await this.statFile(currentFile);
			if (!stat) {
				throw new QueryProcessorError(
					`Error in async file iterator, stat is falsey for ${currentFile}`
				);
			}

			index++;
			if (
				!stat.isFile() &&
				this.options.excludedDirs.indexOf(path.basename(currentFile)) === -1
			) {
				dirsToBeScanned.push(currentFile);
				return getNext();
			}

			return {
				filename: currentFile,
				stats: stat
			};
		};

		return new AsyncIterator({
			hasNext: async () => {
				await init();
				return !scanIsComplete;
			},
			reset: async () => {
				await reset();
			},
			getNext: async () => {
				return getNext().catch(err => {
					throw new QueryProcessorError(
						`Error in iterateFilesInDir getNext for file or following file: ${currentFile}`,
						err
					);
				});
			}
		});
	}

	statFile(filepath: string): Promise<fs.Stats> {
		return this.fsToPromise<fs.Stats>("stat", [filepath]).catch(err => {
			throw new QueryProcessorError(`Error in stat of file ${filepath}`, err);
		});
	}

	readFile(filename: string): Promise<string> {
		return this.fsToPromise<string>("readFile", [filename, "utf-8"]).catch(
			err => {
				throw new QueryProcessorError(`Error reading of file ${filename}`, err);
			}
		);
	}

	/**
	 * Read files in a directory and get array of strings
	 * @param dir
	 */
	async readDir(dir: string): Promise<Array<string>> {
		const items = await this.fsToPromise<Array<string>>("readdir", [dir]);
		const itemsFiltered = items.filter(item => {
			return this.options.excludedDirs.indexOf(path.basename(item)) === -1;
		});
		return itemsFiltered;
	}

	async readDirStats(
		dir: string
	): Promise<Array<{ filename: string; stats: fs.Stats }>> {
		const items = await this.readDir(dir);
		const stats = [];
		for (let i = 0; i < items.length; i++) {
			const fullPath = path.resolve(dir + "/" + items[i]);
			const stat = await this.statFile(fullPath);
			stats.push({
				filename: fullPath,
				stats: stat
			});
		}
		return stats;
	}

	/**
	 * Utiltity to convert an fs method w/ callback to a method which returns promise
	 * @param method
	 * @param params
	 */
	private fsToPromise<ReturnType = void>(
		method: string,
		params: Array<any>
	): Promise<ReturnType> {
		return new Promise<ReturnType>((resolve, reject) => {
			this.nodeFs[method](
				...params.concat((err, data) => {
					if (err) {
						reject(err);
					}
					resolve(<ReturnType>data);
				})
			);
		});
	}
}
