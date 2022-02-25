import { IQueryIntermediateForm } from "./queryIntermediateForm";

export interface IQueryExecutor {
	execute(query: IQueryIntermediateForm): Promise<IQueryExecutorResponse>;
}

export interface IQueryExecutorResponse {
	selectedRepositories: Array<string>;
	data: Array<IQueryResponse>;
}

export interface IQueryResponse {
	[key: string]: any;
}
