import {
	IFileLineCounter,
	IFileLineStats
} from "../../../models/iFileLineCounter";
import * as sloc from "sloc";
import { QueryProcessorError } from "../../../utilities/queryProcessorError/queryProcessorError";

export class CodeFileLineCounter implements IFileLineCounter {
	async countLines(
		fileName: string,
		fileContents: string
	): Promise<IFileLineStats> {
		const ext = fileName.split(".").pop().toLowerCase();
		const map = {
			ts: "typescript",
			js: "javascript",
			coffee: "coffee",
			c: "c",
			cpp: "c#",
			html: "html",
			chtml: "chtml"
		};
		const lang = map[ext];
		if (!lang) {
			//note, sloc tool supports more than the extensions above,
			throw new QueryProcessorError(
				`File extension ${ext} is not currently supported!`
			);
		}

		return sloc(fileContents, lang);
	}
}
