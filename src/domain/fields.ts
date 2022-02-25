import { IFieldType } from "../models/fieldType";

export const FIELD_TYPES_DICT = {
	repo_name: {
		fieldName: "repo_name",
		fieldNameRegularLangugage: /^repo(-|_)?name$/i,
		primitiveType: "string"
	},
	file_name: {
		fieldName: "file_name",
		fieldNameRegularLangugage: /^file(-|_)?name$/i,
		primitiveType: "string"
	},
	file_name_split: {
		fieldName: "file_name_split",
		fieldNameRegularLangugage: /^file(-|_)?name(-|_)?split$/i,
		primitiveType: "list"
	},
	file_name_extension: {
		fieldName: "file_name_extension",
		fieldNameRegularLangugage: /^file(-|_)?(name(-|_)?)?ext(ension)?$/i,
		primitiveType: "string"
	},
	file_contents: {
		fieldName: "file_contents",
		fieldNameRegularLangugage: /^file(-|_)?contents$/i,
		primitiveType: "string"
	},
	file_import_statements: {
		fieldName: "file_import_statements",
		fieldNameRegularLangugage: /^file(-|_)?import(-|_)?statements$/i
	},
	file_export_statements: {
		fieldName: "file_export_statements",
		fieldNameRegularLangugage: /^file(-|_)?export(-|_)?statements$/i
	},
	file_num_lines: {
		fieldName: "file_num_lines",
		fieldNameRegularLangugage: /^file(-|_)?num(-|_)?lines$/i,
		primitiveType: "number"
	},
	file_num_lines_commented: {
		fieldName: "file_num_lines_commented",
		fieldNameRegularLangugage: /^file(-|_)?num(-|_)?lines(-|_)?comment[ed|s]$/i,
		primitiveType: "number"
	},
	file_num_lines_source: {
		fieldName: "file_num_lines_source",
		fieldNameRegularLangugage: /^file(-|_)?num(-|_)?lines(-|_)?source$/i,
		primitiveType: "number"
	},
	file_num_lines_todo: {
		fieldName: "file_num_lines_todo",
		fieldNameRegularLangugage: /^file(-|_)?num(-|_)?lines(-|_)?todo$/i,
		primitiveType: "number"
	}
};

export const FIELD_TYPES: Array<IFieldType> = Object.keys(FIELD_TYPES_DICT).map(
	key => FIELD_TYPES_DICT[key]
);
