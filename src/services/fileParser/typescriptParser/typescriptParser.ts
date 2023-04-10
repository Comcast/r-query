import {
	IFileParser,
	IFileParsedData,
	IFileImport,
	IFileExport
} from "../../../models/iFileParser";
import { TypescriptParser } from "typescript-parser";
import { QueryProcessorError } from "../../../utilities/queryProcessorError/queryProcessorError";

export class TypescriptFileParser implements IFileParser {
	private parser;

	constructor() {
		this.parser = new TypescriptParser();
	}

	async parse(
		fileName: string,
		fileContents: string
	): Promise<IFileParsedData> {
		const ext = fileName.split(".").pop().toLowerCase();

		if (ext !== "ts") {
			throw new QueryProcessorError(
				`The typescript file parser can only be used on typescript files!`
			);
		}

		const parsed = await this.parser.parseSource(fileContents);
		parsed.imports = parsed.imports || [];
		parsed.declarations = parsed.declarations || [];

		const imports = parsed.imports
			.map(stmt => {
				stmt.specifiers = stmt.specifiers || [];
				if (stmt.specifiers && stmt.specifiers.length > 0) {
					return stmt.specifiers.map(spc => {
						return <IFileImport>{
							fromSource: stmt.libraryName,
							moduleName: spc.specifier,
							moduleAlias: spc.alias || spc.specifier
						};
					});
				} else if (stmt.libraryName) {
					return <IFileImport>{
						fromSource: stmt.libraryName,
						moduleName: stmt.defaultAlias || "",
						moduleAlias: stmt.defaultAlias || ""
					};
				} else {
					return null;
				}
			})
			.filter(r => r !== null)
			.flat();

		const exportStatements = parsed.declarations
			.filter(dc => dc.isExported)
			.map(dc => {
				let type = dc.type;
				if (!type) {
					const cnName =
						(dc.constructor && dc.constructor.name) || "";
					if (cnName.indexOf("Interface") > -1) {
						type = "interface";
					} else if (cnName.indexOf("Class") > -1) {
						type = "class";
					} else {
						type = "<implicit>";
					}
				}

				return <IFileExport>{
					name: dc.name,
					type: type
				};
			});

		return {
			imports,
			exports: exportStatements
		};
	}
}
