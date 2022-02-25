export interface IFileImport {
	moduleName: string;
	moduleAlias: string;
	fromSource: string;
}

export interface IFileExport {
	name: string;
	type: string;
}

export interface IFileParsedData {
	imports: Array<IFileImport>;
	exports: Array<IFileExport>;
}

export interface IFileParser {
	parse(fileName: string, fileContents: string): Promise<IFileParsedData>;
}
