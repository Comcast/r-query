import {
	IFileLineCounter,
	IFileLineStats
} from "../../../models/iFileLineCounter";

/**
 * This should be used if the sloc tool cannot be used
 */
export class DefaultFileLineCounter implements IFileLineCounter {
	async countLines(
		fileName: string,
		fileContents: string
	): Promise<IFileLineStats> {
		const numLines = fileContents.split("\n").length;
		const empty = fileContents
			.split("\n")
			.map(line => line.trim())
			.filter(line => !line).length;

		return {
			physical: numLines,
			source: numLines,
			comment: 0,
			empty,
			todo: 0
		};
	}
}
