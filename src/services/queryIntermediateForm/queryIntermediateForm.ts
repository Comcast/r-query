import {
	IQueryIntermediateForm,
	ISelectStatement,
	ISelectConditions
} from "../../models/queryIntermediateForm";

export class QueryIntermediateForm implements IQueryIntermediateForm {
	readonly select: ISelectStatement[];
	readonly from: string[];
	readonly where: Array<ISelectConditions>;

	constructor(query: IQueryIntermediateForm) {
		query = this.freezeRecursive({ ...query });

		this.select = query.select;
		this.from = query.from;
		this.where = query.where;
	}

	private freezeRecursive(obj: any): any {
		if (obj === null || typeof obj === "undefined") {
			return obj;
		}

		Object.freeze(obj);
		if (Array.isArray(obj)) {
			obj.forEach(item => this.freezeRecursive(item));
		} else if (typeof obj === "object") {
			Object.keys(obj).forEach(key => {
				this.freezeRecursive(obj[key]);
			});
		}
		return obj;
	}

	toString(): string {
		return JSON.stringify(this, null, 4);
	}
}
