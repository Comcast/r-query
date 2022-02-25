import { IQueryResponse } from "./queryExecutor";
import { IQueryIntermediateForm } from "./queryIntermediateForm";

export interface IQueryProcessorResponse<InputQueryType> {
	inputQuery: InputQueryType;
	queryIntermediateForm: IQueryIntermediateForm;
	queryResponse: IQueryResponse;
	selectedRepositories: Array<string>;
}

export interface IQueryProcessor<QueryType> {
	process(query: QueryType): Promise<IQueryProcessorResponse<QueryType>>;
}
