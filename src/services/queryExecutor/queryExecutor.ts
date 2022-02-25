import {
	IQueryExecutor,
	IQueryResponse,
	IQueryExecutorResponse
} from "../../models/queryExecutor";
import { IRepositoryReader } from "../../models/repositoryReader";
import {
	IQueryIntermediateForm,
	ISelectConditions,
	ISelectCondition
} from "../../models/queryIntermediateForm";
import { QueryIntermediateForm } from "../queryIntermediateForm/queryIntermediateForm";
import {
	AAND,
	AOR,
	IAsyncBooleanEvaluator,
	AsyncBooleanPhrase,
	TrueA
} from "lazy-boolean-evaluator";
import { IFileParser } from "../../models/iFileParser";
import { FIELD_TYPES_DICT } from "../../domain/fields";
import { IComparer } from "../../models/comparer";
import { IFieldType } from "../../models/fieldType";
import { IFileLineCounter } from "../../models/iFileLineCounter";
import * as path from "path";
import { QueryProcessorError } from "../../utilities/queryProcessorError/queryProcessorError";

export class QueryExecutor implements IQueryExecutor {
	constructor(
		private repoReader: IRepositoryReader,
		private fieldTypes: Array<IFieldType>,
		private comparers: Array<IComparer<any, any>>,
		private asyncBooleanEvaluator: IAsyncBooleanEvaluator,
		private fileParser: IFileParser,
		private fileLineCounter: IFileLineCounter
	) {}

	async execute(
		query: IQueryIntermediateForm
	): Promise<IQueryExecutorResponse> {
		query = await this.validateRepos(query);

		let rows: Array<IQueryResponse> = [];
		let repositoryP: Array<Promise<void>> = [];
		for (let i = 0; i < query.from.length; i++) {
			const repo = query.from[i];
			repositoryP.push(
				this.queryRepository(repo, query).then(newRows => {
					rows = rows.concat(newRows);
				})
			);
			/*await this.queryRepository(repo, query).then(newRows => {
				rows = rows.concat(newRows);
			});*/
		}

		await Promise.all(repositoryP);
		return {
			data: rows,
			selectedRepositories: query.from
		};
	}

	/**
	 * Ensure all targeted repos exist
	 * If a * entry exists, replace from statement with list of all repos
	 * @param query
	 */
	private async validateRepos(
		query: IQueryIntermediateForm
	): Promise<IQueryIntermediateForm> {
		if (query.from.indexOf("*") > -1) {
			const allRepos = await this.repoReader.listRepositories();
			return new QueryIntermediateForm({
				select: query.select,
				from: allRepos,
				where: query.where
			});
		} else {
			let from: Array<string> = [...query.from];
			const regExps = from.filter(qf => qf.substring(0, 1) === "/");
			if (regExps.length > 0) {
				const allRepos = await this.repoReader.listRepositories();
				regExps.forEach(rg => {
					const expr = this.processInputToken(rg); //convert to actual regexp
					const matches = allRepos.filter(rp => !!rp.match(expr));
					from = from.concat(matches);
				});

				from = from.filter(fm => fm.substring(0, 1) !== "/");
			}

			const reposExist = await this.repoReader.repositoryExists(...from);
			if (!reposExist) {
				throw new QueryProcessorError(
					`At least one repository selected does not exist: ${from}!`
				);
			}
			return new QueryIntermediateForm({
				select: query.select,
				from,
				where: query.where
			});
		}
	}

	/**
	 * Run the query against a single repository
	 * @param repoName
	 * @param query
	 */
	private async queryRepository(
		repoName: string,
		query: IQueryIntermediateForm
	): Promise<Array<IQueryResponse>> {
		const rows: Array<IQueryResponse> = [];

		const asyncIterator = this.repoReader.iterateFilesInRepo(repoName);
		await asyncIterator
			.each(async file => {
				const fileResponse = await this.processFile(
					file.filename,
					repoName,
					query
				).catch(err => {
					throw new QueryProcessorError(
						`Error processing file ${repoName} => ${file.filename}`,
						err
					);
				});
				if (fileResponse) {
					rows.push(fileResponse);
				}
			})
			.catch(err => {
				throw new QueryProcessorError(`Error in querying repository`, err);
			});

		return rows;
	}

	/**
	 * Evaluate a single file
	 * If it passes filters, respond with a row
	 * If not, respond with a falsey value
	 * @param filename
	 * @param repoName
	 * @param query
	 */
	private async processFile(
		filename: string,
		repoName: string,
		query: IQueryIntermediateForm
	): Promise<IQueryResponse> {
		let fileContext = this.initializeFileValues(filename, repoName);
		let row: IQueryResponse = {};

		//check this passes filters in where condition
		if (query.where && query.where.length > 0) {
			const whereEvaluation = await this.evaluateSelectCondition(
				fileContext,
				query.where
			).catch(err => {
				throw new QueryProcessorError(
					`Error in evaluation of select condition: ${query.where.join(" ")}`,
					err
				);
			});
			if (!whereEvaluation) {
				return null;
			}
		}

		//if conditions pass, create the result and return
		for (let i = 0; i < query.select.length; i++) {
			const qs = query.select[i];
			row[qs.fieldAlias] = await this.getFileValue(fileContext, qs.fieldName);
		}

		return row;
	}

	/**
	 * Reset the values of the current file with some initial (given) values
	 * @param newFileName
	 * @param newRepoName
	 */
	private initializeFileValues(newFileName: string, newRepoName: string) {
		const fileContext = {
			[FIELD_TYPES_DICT.file_name.fieldName]: newFileName,
			[FIELD_TYPES_DICT.repo_name.fieldName]: newRepoName
		};
		return fileContext;
	}

	/**
	 * Get a file field value
	 * If the value is already defined, return it
	 * Otherwise, get value and cache it
	 * @param fieldName
	 */
	private async getFileValue(fileContext, fieldName: string): Promise<string> {
		if (typeof fileContext[fieldName] === "undefined") {
			switch (fieldName) {
				case FIELD_TYPES_DICT.file_name_extension.fieldName:
					fileContext[fieldName] = fileContext[
						FIELD_TYPES_DICT.file_name.fieldName
					]
						.split(".")
						.pop();
					break;
				case FIELD_TYPES_DICT.file_name_split.fieldName:
					fileContext[fieldName] = fileContext[
						FIELD_TYPES_DICT.file_name.fieldName
					]
						.replace(/\\/g, "/")
						.split("/");
					break;
				case FIELD_TYPES_DICT.file_contents.fieldName:
					fileContext[fieldName] = await this.repoReader.readFile(
						await this.getFileValue(
							fileContext,
							FIELD_TYPES_DICT.repo_name.fieldName
						),
						await this.getFileValue(
							fileContext,
							FIELD_TYPES_DICT.file_name.fieldName
						)
					);
					break;
				case FIELD_TYPES_DICT.file_import_statements.fieldName:
				case FIELD_TYPES_DICT.file_export_statements.fieldName:
					fileContext["_parsed_file"] = await this.fileParser.parse(
						await this.getFileValue(
							fileContext,
							FIELD_TYPES_DICT.file_name.fieldName
						),
						await this.getFileValue(
							fileContext,
							FIELD_TYPES_DICT.file_contents.fieldName
						)
					);
					fileContext[FIELD_TYPES_DICT.file_import_statements.fieldName] =
						fileContext["_parsed_file"].imports;
					fileContext[FIELD_TYPES_DICT.file_export_statements.fieldName] =
						fileContext["_parsed_file"].exports;
					break;
				case FIELD_TYPES_DICT.file_num_lines.fieldName:
				case FIELD_TYPES_DICT.file_num_lines_commented.fieldName:
				case FIELD_TYPES_DICT.file_num_lines_source.fieldName:
				case FIELD_TYPES_DICT.file_num_lines_todo.fieldName:
					fileContext["_num_lines"] = await this.fileLineCounter.countLines(
						await this.getFileValue(
							fileContext,
							FIELD_TYPES_DICT.file_name.fieldName
						),
						await this.getFileValue(
							fileContext,
							FIELD_TYPES_DICT.file_contents.fieldName
						)
					);
					fileContext[FIELD_TYPES_DICT.file_num_lines.fieldName] =
						fileContext["_num_lines"].physical;
					fileContext[FIELD_TYPES_DICT.file_num_lines_source.fieldName] =
						fileContext["_num_lines"].source;
					fileContext[FIELD_TYPES_DICT.file_num_lines_commented.fieldName] =
						fileContext["_num_lines"].comment;
					fileContext[FIELD_TYPES_DICT.file_num_lines_todo.fieldName] =
						fileContext["_num_lines"].todo;
					break;
				default:
					throw new QueryProcessorError(`Unknown file field name ${fieldName}`);
			}
		}

		return fileContext[fieldName];
	}

	/**
	 * Evaluate a full select condition, including its inner conditions + concatenations
	 * @param condition
	 */
	private async evaluateSelectCondition(
		fileContext,
		condition: Array<ISelectConditions>
	): Promise<boolean> {
		//prepare callbacks for all conditions
		const createExpression = async (condition: ISelectConditions) => {
			let expr;
			if (typeof condition === "string") {
				condition = condition.toLowerCase();
				if (condition === "and") {
					expr = AAND;
				} else if (condition === "or") {
					expr = AOR;
				} else {
					throw new QueryProcessorError(
						`Unknown condition token: ${condition}`
					);
				}
			} else if (Array.isArray(condition)) {
				expr = [];
				for (let i = 0; i < condition.length; i++) {
					expr[i] = await createExpression(condition[i]);
				}
			} else {
				const comp = condition as ISelectCondition;
				expr = async () => {
					const fieldValue = await this.getFileValue(
						fileContext,
						comp.field
					).catch(err => {
						throw new QueryProcessorError(
							`Cannot get file value: ${comp.field}`,
							err
						);
					});
					return this.evaluateSingleSelectCondition(fieldValue, comp).catch(
						err => {
							throw new QueryProcessorError(
								`Cannot evaluate condition for field ${comp.field}`,
								err
							);
						}
					);
				};
			}
			return expr;
		};

		let conditions = await createExpression(condition);
		if (!Array.isArray(conditions)) {
			conditions = [conditions];
		}

		return this.asyncBooleanEvaluator.evaluate(conditions).catch(err => {
			throw new QueryProcessorError(`Error in async boolean evaluation`, err);
		});
	}

	/**
	 * Evaluate a single select condition
	 * @param fieldValue
	 * @param condition
	 */
	private async evaluateSingleSelectCondition(
		fieldValue,
		condition: ISelectCondition
	): Promise<boolean> {
		const isNegated = condition.isNegated;

		const conditionFieldType = this.fieldTypes.find(
			ft => ft.fieldName === condition.field
		);
		if (!conditionFieldType) {
			throw new QueryProcessorError(
				`Invalid field type ${condition.field} (thown in query executor)!`
			);
		}

		const comparisonValue = this.processInputToken(condition.comparedTo);

		const evaluation: boolean = this.compare(
			conditionFieldType,
			fieldValue,
			comparisonValue,
			condition.comparison
		);

		return isNegated ? !evaluation : evaluation;
	}

	/**
	 * Infer the token type for a comparison based on the structure of the string
	 * @param token
	 */
	private processInputToken(token) {
		if (Array.isArray(token)) {
			return token.map(tk => this.processInputToken(tk));
		}

		if (token[0] === "/") {
			//regular expression
			const regExpParts = token.split("/");
			const flags = regExpParts.pop();
			const fullInner = regExpParts.join("/");
			const param = fullInner.substring(1);

			return new RegExp(param, flags);
		}

		if (token[0] === "'") {
			return token.substring(1, token.length - 1).replace(/\\/g, "");
		}

		if (["true", "false"].indexOf(token.toLowerCase()) > -1) {
			return token.toLowerCase() === "true" ? true : false;
		}

		if (!isNaN(token)) {
			return parseFloat(token);
		}

		throw new QueryProcessorError(
			`Cannot process token ${token} (thrown in process token of Query Executor)!`
		);
	}

	/**
	 * Compare two values based on the comparison string
	 * @param left
	 * @param right
	 * @param comparison
	 */
	private compare(fieldType: IFieldType, left, right, comparison): boolean {
		const cp =
			this.comparers.find(cp => cp.typeName === fieldType.fieldName) ||
			this.comparers.find(cp => cp.typeName === fieldType.primitiveType);
		if (!cp) {
			throw new QueryProcessorError(`Invalid comparison token: ${comparison}`);
		}
		return cp.compare(left, right, comparison);
	}
}
