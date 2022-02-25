import {
	IFileLineCounter,
	IFileLineStats
} from "../../models/iFileLineCounter";
import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";

export class CompositeFileLineCounter implements IFileLineCounter {
	constructor(private fileLineCounters: Array<IFileLineCounter>) {
		if (!this.fileLineCounters || this.fileLineCounters.length === 0) {
			throw new Error("Provide fileLineCounters must be array > 0!");
		}
	}

	async countLines(
		fileName: string,
		fileContents: string
	): Promise<IFileLineStats> {
		let result: IFileLineStats;
		let lastErr;
		for (let i = 0; !result && i < this.fileLineCounters.length; i++) {
			try {
				result = await this.fileLineCounters[i].countLines(
					fileName,
					fileContents
				);
			} catch (err) {
				if (lastErr) {
					lastErr = new QueryProcessorError(err.message || err.toString(), err);
				} else {
					lastErr = err;
				}
			}
		}

		if (result) {
			return result;
		}
		throw lastErr;
	}
}
