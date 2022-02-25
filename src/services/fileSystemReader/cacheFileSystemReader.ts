import {
	IFileLineStats,
	IFileParsedData,
	IFileSystemReader,
	IAsyncIterator
} from "../../public-api";
import { SortedList } from "../../utilities/sortedList/sortedList";
import { BehaviorSubject } from "rxjs";
import { filter, take } from "rxjs/operators";

import path from "path";
import fs from "fs";
import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";

const $false = filter(r => !r);
const $true = filter(r => !!r);
const $takeOne = take(1);
const $isZero = filter(r => r === 0);

interface ICachedFile {
	filename: string;
	stats: fs.Stats;
	contents: string;
	numLines: IFileLineStats;
	parsedData: IFileParsedData;
}

export class CacheFileSystemReader implements IFileSystemReader {
	private filesListLocked$ = new BehaviorSubject<number>(0);
	private fileCompare = (a, b) => a.filename.localeCompare(b.filename);
	private filesList: SortedList<ICachedFile> = new SortedList(this.fileCompare);

	private options;

	constructor(
		private fileSystemReader: IFileSystemReader,
		options?: {
			excludedDirs: Array<string>;
			rootDir: string;
			fileContentsCacheLimit?: number;
		}
	) {
		this.options = {
			excludedDirs: [],
			numParallel: 5,
			fileContentsCacheLimit: Math.pow(2, 15),
			...(options || {})
		};
		this.options.rootDir = path.resolve(this.options.rootDir);
		if (typeof options.rootDir === undefined || options.rootDir === null) {
			throw new QueryProcessorError(
				`A root directory must be provided in the constructor, none or falsey given!`
			);
		}
	}

	lockOperations(): void {
		this.filesListLocked$.next(this.filesListLocked$.value + 1);
	}

	async rescanAll(): Promise<void> {
		this.lockOperations();

		try {
			const data = await this.rescanDirectoriesFromRoot(this.options.rootDir);
			this.filesList = data;
		} finally {
			this.unlockOperations();
		}
	}

	async rescanRepo(repoName: string): Promise<void> {
		this.lockOperations();

		try {
			const newData = await this.rescanDirectoriesFromRoot(
				this.options.rootDir,
				repoName
			);
			const repoRoot = path.resolve(this.options.rootDir + "/" + repoName);
			this.filesList = this.filesList.filter(
				{
					filename: repoRoot
				},
				{
					filename: repoRoot + "#"
				},
				true
			);

			newData.toArray().forEach(data => {
				this.filesList.add(data);
			});
		} finally {
			this.unlockOperations();
		}
	}

	unlockOperations(full = false): void {
		if (full) {
			this.filesListLocked$.next(0);
		} else {
			this.filesListLocked$.next(this.filesListLocked$.value - 1);
		}
	}

	async listDirectoriesInDir(directory: string): Promise<string[]> {
		await this.filesListLocked$
			.pipe(
				$isZero,
				$takeOne
			)
			.toPromise();

		const directories = await this.fileSystemReader.listDirectoriesInDir.call(
			this,
			directory
		);
		return directories;
	}

	async listFilesInDir(directory: string): Promise<string[]> {
		await this.filesListLocked$
			.pipe(
				$isZero,
				$takeOne
			)
			.toPromise();

		const files = await this.fileSystemReader.listFilesInDir.call(
			this,
			directory
		);
		return files;
	}

	async readDir(dir: string): Promise<string[]> {
		await this.filesListLocked$
			.pipe(
				$isZero,
				$takeOne
			)
			.toPromise();

		if (dir.substring(dir.length - 1) === path.sep) {
			dir = dir.substring(0, dir.length - 1);
		}
		const originalDir = dir;
		dir = path.resolve(dir);

		if (dir.substring(dir.length - 1) !== path.sep) {
			dir += path.sep;
		}

		//hypothetical next dir in alphabetical order (excluding subdirs)
		const nextDir = originalDir + "#" + path.sep;

		const numDirs = dir.split(path.sep).length;
		return this.filesList
			.filter(
				{
					filename: dir,
					stats: null
				},
				{
					filename: nextDir,
					stats: null
				}
			)
			.toArray()
			.filter(file => {
				return file.filename.split(path.sep).length === numDirs;
			})
			.map(file => {
				return path.basename(file.filename);
			}) as Array<string>;
	}
	async readDirStats(
		dir: string
	): Promise<{ filename: string; stats: fs.Stats; contents: string }[]> {
		await this.filesListLocked$
			.pipe(
				$isZero,
				$takeOne
			)
			.toPromise();

		const originalDir = dir;
		dir = path.resolve(dir) + path.sep;
		//hypothetical next dir in alphabetical order (excluding subdirs)
		const nextDir = path.resolve(originalDir + "#") + path.sep;

		const numDirs = dir.split(path.sep).length;
		return (this.filesList
			.filter(
				{
					filename: dir,
					stats: null
				},
				{
					filename: nextDir,
					stats: null
				}
			)
			.toArray() as { filename: string; stats: fs.Stats; contents: null }[])
			.filter(file => {
				return file.filename.split(path.sep).length === numDirs;
			})
			.map(file => {
				file = { ...file, contents: null };
				file.filename = path.basename(file.filename);
				return file;
			});
	}

	async statFile(filepath: string): Promise<fs.Stats> {
		await this.filesListLocked$
			.pipe(
				$isZero,
				$takeOne
			)
			.toPromise();

		filepath = path.resolve(filepath);
		const file = this.filesList.find({
			filename: filepath,
			stats: null,
			contents: null,
			parsedData: null,
			numLines: null
		});

		if (!file) {
			throw new QueryProcessorError(
				`Error in cacheFileReader: file stats undefined for ${filepath}`
			);
		}

		return file.stats;
	}

	async readFile(filename: string): Promise<string> {
		await this.filesListLocked$
			.pipe(
				$isZero,
				$takeOne
			)
			.toPromise();

		const fileEntry = this.filesList.find({
			filename,
			stats: null,
			contents: null,
			numLines: null,
			parsedData: null
		});

		let contents;
		if (
			fileEntry &&
			typeof fileEntry.contents !== "undefined" &&
			fileEntry.contents !== null
		) {
			contents = fileEntry.contents;
		} else {
			contents = await this.fileSystemReader.readFile(filename);

			if (contents.length < this.options.fileContentsCacheLimit) {
				fileEntry.contents = contents;
			} else {
				fileEntry.contents = null;
			}
		}

		return contents;
	}

	iterateFilesInDir(
		dir: string
	): IAsyncIterator<{
		filename: string;
		stats: fs.Stats;
	}> {
		//re-use the fileSystemReader functionality bound to the caching here
		return this.fileSystemReader.iterateFilesInDir.call(this, dir);
	}

	/**
	 * Rescan the directories from the root path and cache in memory
	 */
	private async rescanDirectoriesFromRoot(
		rootDir: string,
		repoName?: string
	): Promise<SortedList<ICachedFile>> {
		const rootFiles = await this.fileSystemReader.readDirStats(rootDir);

		let allFiles = [...rootFiles];

		if (repoName) {
			allFiles = allFiles.filter(file => {
				return path.basename(file.filename) === repoName;
			});
		}

		for (let i = 0; i < allFiles.length; i++) {
			const file = allFiles[i];
			if (!file) {
				throw new QueryProcessorError(
					`Error in rescan root: File of index ${i} is falsey while scanning ${rootDir}`
				);
			}
			if (!file.stats.isFile()) {
				const newFiles = await this.fileSystemReader.readDirStats(
					file.filename
				);
				allFiles = allFiles.concat(newFiles);
			}
		}

		return new SortedList(this.fileCompare, allFiles as any);
	}
}
