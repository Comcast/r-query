import { IQueryIntermediateFormValidator } from "../../models/queryValidator";
import {
	IQueryIntermediateForm,
	ISelectStatement,
	ISelectCondition,
	ISelectConditions
} from "../../models/queryIntermediateForm";
import { QueryIntermediateForm } from "../queryIntermediateForm/queryIntermediateForm";
import { IFieldType } from "../../models/fieldType";
import { IComparer } from "../../models/comparer";
import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";

export class QueryIntermediateFormValidator
	implements IQueryIntermediateFormValidator {
	constructor(
		private fieldTypes: Array<IFieldType>,
		private comparisons: Array<IComparer<any, any>>,
		private defaultFromSelect?: Array<string>
	) {}

	validate(query: IQueryIntermediateForm): IQueryIntermediateForm {
		return new QueryIntermediateForm({
			select: this.validateSelectStatements(query.select),
			from: this.validateFromStatements(query.from),
			where: this.validateWhereStatements(query)
		});
	}

	private validateFromStatements(from: Array<string>): Array<string> {
		if (from && from.length > 0) {
			return [...from];
		}

		if (this.defaultFromSelect) {
			return [...this.defaultFromSelect];
		}

		throw new QueryProcessorError(
			`Error in query validator: no from field specified and no default values specified!`
		);
	}

	/**
	 * Validate that all select statements are from valid fields
	 * Map field names (not field alias) to normalized names
	 * @param select
	 */
	private validateSelectStatements(
		select: Array<ISelectStatement>
	): Array<ISelectStatement> {
		return select.map(item => {
			const validEntry = this.fieldTypes.find(vd =>
				item.fieldName.match(vd.fieldNameRegularLangugage)
			);
			if (!validEntry) {
				throw new QueryProcessorError(
					`${item.fieldName} is not a valid field (thrown by invalid select statement)!`
				);
			}
			return {
				fieldName: validEntry.fieldName,
				fieldAlias: item.fieldAlias
			};
		});
	}

	/**
	 * Validate that where statements do not reference invalid fields
	 * @param query
	 */
	private validateWhereStatements(
		query: IQueryIntermediateForm
	): Array<ISelectConditions> {
		if (!query.where) {
			return query.where;
		}

		const mapWhere = (input: ISelectConditions): ISelectConditions => {
			if (Array.isArray(input)) {
				if (query.where.length % 2 === 0 && query.where.length > 0) {
					throw new QueryProcessorError(
						`Query has an invalid length of 2n, each other item must be an 'and' or 'or': ${query.where.join(
							" "
						)}`
					);
				}
				return input.map(item => mapWhere(item));
			} else if (input !== "and" && input !== "or") {
				return this.validateSingleWhereStatement(input as ISelectCondition);
			} else {
				return input;
			}
		};

		return mapWhere(query.where) as Array<ISelectConditions>;
	}

	private validateSingleWhereStatement(
		condition: ISelectCondition | string
	): ISelectCondition | string {
		if (typeof condition === "string") {
			return condition;
		}

		condition = { ...condition };
		//validate field name
		const field = condition.field;
		const validEntry = this.fieldTypes.find(vd => {
			return field.match(vd.fieldNameRegularLangugage);
		});
		if (!validEntry) {
			throw new QueryProcessorError(
				`${field} is not a valid field type (thrown by invalid where condition)!`
			);
		}

		condition.field = validEntry.fieldName;
		const comparison =
			this.comparisons.find(cp => cp.typeName === validEntry.fieldName) ||
			this.comparisons.find(cp => cp.typeName === validEntry.primitiveType);
		if (!comparison) {
			throw new QueryProcessorError(
				`There is no valid comparison of type ${condition.comparison} for field type ${field} (thrown by invalid where condition)!`
			);
		}

		if (
			Array.isArray(condition.comparedTo) &&
			condition.comparedTo.length === 0
		) {
			throw new QueryProcessorError(
				`If comparison is a tuple, it cannot be empty!`
			);
		}

		return condition;
	}
}
