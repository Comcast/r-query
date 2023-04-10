import { IRepositoryReader } from "../../models/repositoryReader";
import { IAsyncIterator } from "../../models/iterator";
import * as fs from "fs";
import * as path from "path";
import { AsyncIterator } from "../../utilities/iterator/asyncIterator";
import { IFileSystemReader } from "../../models/fileSystemReader";
import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";

export class RepositoryReader implements IRepositoryReader {
	constructor(
		public readonly rootDir: string,
		private fileSystemReader: IFileSystemReader
	) {
		this.rootDir = path.resolve(this.rootDir);
	}

	/**
	 * Assumes first level directories on the root dir corresponds to separate repos
	 */
	listRepositories(): Promise<string[]> {
		return this.fileSystemReader
			.listDirectoriesInDir(this.rootDir)
			.catch(err => {
				throw new QueryProcessorError(
					"Error listing repositories: ",
					err
				);
			})
			.then(repoPaths => {
				return repoPaths.map(rp => {
					rp = rp.replace(/\\/g, "/");
					return rp.split("/").pop();
				});
			});
	}
	async repositoryExists(...repoNames: string[]): Promise<boolean> {
		const repos = await this.listRepositories().catch(err => {
			throw new QueryProcessorError("Error checking repositories", err);
		});
		return repoNames.reduce((bool: boolean, rn: string) => {
			return bool && repos.indexOf(rn) > -1;
		}, true);
	}
	iterateFilesInRepo(repoName: string): IAsyncIterator<{
		filename: string;
		stats: fs.Stats;
	}> {
		const repoPath = path.resolve(this.rootDir + "/" + repoName);
		const iterator = this.fileSystemReader.iterateFilesInDir(repoPath);

		let current;
		let isDone = false;
		const init = async () => {
			let hasNext = await iterator.hasNext();
			if (!hasNext) {
				isDone = true;
			} else {
				current = await iterator.getNext();
				while (!isDone && !current.stats.isFile()) {
					hasNext = await iterator.hasNext();
					if (hasNext) {
						current = await iterator.getNext();
					} else {
						isDone = true;
					}
				}
			}
		};

		const reset = async () => {
			current = undefined;
			isDone = false;
			return iterator.reset();
		};

		const hasNext = async () => {
			await init();

			return !isDone;
		};

		const getNext = async () => {
			return {
				filename: current.filename.replace(repoPath, "").substring(1),
				stats: current.stats
			};
		};

		return new AsyncIterator({
			hasNext,
			reset,
			getNext
		});
	}
	readFile(repoName: string, filename: string): Promise<string> {
		const filePath = path.resolve(
			this.rootDir + "/" + repoName + "/" + filename
		);
		return this.fileSystemReader.readFile(filePath).catch(err => {
			throw new QueryProcessorError(
				`Error in RepoReader in reading file ${filePath}`,
				err
			);
		});
	}
}
