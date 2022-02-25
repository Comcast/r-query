import { IQueryIntermediateForm } from "./queryIntermediateForm";

export interface IQueryParser<IncomingQueryType> {
	parseInput(input: IncomingQueryType): IQueryIntermediateForm;
}

export interface IQueryFormatter<OutgoingQueryType> {
	formatIntermediateQuery(input: IQueryIntermediateForm): OutgoingQueryType;
}
