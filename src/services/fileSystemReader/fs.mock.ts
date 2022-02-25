import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";
import * as path from "path";
const TEST_DATA = require("./testFileData.mock.json");
const TEST_DATA_FILES = Object.keys(TEST_DATA).reduce((ar, key) => {
	return ar.concat(TEST_DATA[key]);
}, []);

export class FsMock {
	stat(filepath: string, callback: (err, data) => any): void {
		const isDir = filepath.indexOf(".") === -1;
		const result = {
			isDirectory() {
				return isDir;
			},
			isFile() {
				return !isDir;
			}
		};
		setImmediate(() => callback(null, result));
	}

	readFile(
		filepath: string,
		encoding: string,
		callback: (err, data) => any
	): void {
		if (!callback) {
			callback = encoding as any;
		}
		filepath = path.resolve(filepath);
		const file = TEST_DATA_FILES.find(
			tdf => path.resolve(tdf.fileName) === filepath
		);
		if (!file) {
			throw new QueryProcessorError(`${filepath} does not exist!`);
		}
		const result = file.fileContents;
		setImmediate(() => callback(null, result));
	}

	readdir(inputDir: string, callback: (err, data) => any): void {
		let directory = path.resolve(inputDir);
		if (directory.substring(directory.length - 1) !== path.sep) {
			directory += path.sep;
		}

		const dirSplit = directory.split(path.sep);
		const result = TEST_DATA_FILES.filter(fl => {
			fl.fileName = path.resolve(fl.fileName);
			if (
				fl.fileName.indexOf(".") === -1 &&
				fl.fileName.substring(fl.fileName.length - 1) !== path.sep
			) {
				fl.fileName += path.sep;
			}

			return fl.fileName.indexOf(directory) === 0;
		})
			.map(fl => {
				const pathSplit = fl.fileName.split(path.sep);
				return pathSplit
					.splice(dirSplit.length - 1, 1)
					.join("")
					.replace(path.sep, "");
			})
			.filter((item, ind, ar) => ar.indexOf(item) === ind);

		setImmediate(() => callback(null, result));
	}
}
