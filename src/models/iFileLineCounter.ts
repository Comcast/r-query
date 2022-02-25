export interface IFileLineStats {
	physical: number;
	source: number;
	comment: number;
	empty: number;
	todo: number;
}

export interface IFileLineCounter {
	countLines(fileName: string, fileContents: string): Promise<IFileLineStats>;
}
