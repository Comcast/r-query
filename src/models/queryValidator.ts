import { IQueryIntermediateForm } from "./queryIntermediateForm";

export interface IQueryIntermediateFormValidator {
	validate(query: IQueryIntermediateForm): IQueryIntermediateForm;
}
