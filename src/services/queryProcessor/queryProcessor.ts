import {
	IQueryProcessor,
	IQueryProcessorResponse
} from "../../models/queryProcessor";
import { IQueryExecutor } from "../../models/queryExecutor";
import { IQueryParser } from "../../models/queryParser";
import { IQueryIntermediateFormValidator } from "../../models/queryValidator";
import { QueryProcessorError } from "../../utilities/public-api";

export class QueryProcessor<QueryType> implements IQueryProcessor<QueryType> {
	constructor(
		private queryParser: IQueryParser<QueryType>,
		private queryValidator: IQueryIntermediateFormValidator,
		private queryExecutor: IQueryExecutor
	) {}

	async process(
		query: QueryType
	): Promise<IQueryProcessorResponse<QueryType>> {
		let intermediateForm, validatedQuery, result;

		try {
			intermediateForm = await this.queryParser.parseInput(query);
			validatedQuery = await this.queryValidator.validate(
				intermediateForm
			);

			result = await this.queryExecutor.execute({ ...validatedQuery });
			return {
				inputQuery: query,
				queryIntermediateForm: validatedQuery,
				selectedRepositories: result.selectedRepositories,
				queryResponse: result.data
			};
		} catch (err: any) {
			throw new QueryProcessorError(
				`Error processing query: ${err}`,
				err,
				{
					inputQuery: query,
					queryIntermediateForm: validatedQuery,
					selectedRepositories: result
						? result.selectedRepositories
						: null,
					queryResponse: result ? result.data : null
				}
			);
		}
	}
}
