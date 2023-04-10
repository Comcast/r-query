import { IFileParser, IFileParsedData } from "../../models/iFileParser";
import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";

export class CompositeFileParser implements IFileParser {
	constructor(private parsers: Array<IFileParser>) {
		if (!this.parsers || this.parsers.length === 0) {
			throw new Error(
				"FileParsers provided to constructor must be an array >0 length!"
			);
		}
	}

	async parse(
		fileName: string,
		fileContents: string
	): Promise<IFileParsedData> {
		let result: IFileParsedData;
		let lastErr;

		for (let i = 0; !result && i < this.parsers.length; i++) {
			try {
				result = await this.parsers[i].parse(fileName, fileContents);
			} catch (err: any) {
				if (lastErr) {
					lastErr = new QueryProcessorError(
						err.message || err.toString(),
						err
					);
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
