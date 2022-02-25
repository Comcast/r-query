import { IFileParser, IFileParsedData } from "../../../models/iFileParser";

export class DefaultFileParser implements IFileParser {
	async parse(
		fileName: string,
		fileContents: string
	): Promise<IFileParsedData> {
		return {
			imports: [],
			exports: []
		};
	}
}
