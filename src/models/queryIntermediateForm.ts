export interface ISelectStatement {
	fieldName: string;
	fieldAlias: string;
}

export interface ISelectCondition {
	field: string;
	comparison: string;
	comparedTo: string | string[];
	isNegated: boolean;
}

export type ISelectConditions =
	| ISelectCondition
	| Array<ISelectConditions>
	| string;

export interface IQueryIntermediateForm {
	select: Array<ISelectStatement>;
	from: Array<string>;
	//where: ISelectCondition;
	where: Array<ISelectConditions>;
}
