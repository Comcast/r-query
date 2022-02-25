import { ICfgRule } from "../../../../models/contextFreeGrammar";

/**
 * CFG Grammar Definition for RQL
 *
 * A terminal is referenced directly by name
 * A production rule (non-terminal) is referenced by name enclosed in curly braces
 */
export const GRAMMAR_RULES_PROCESS: ICfgRule[] = [
	["SELECT_ITEM_APPLY", "field [wtsp as wtsp quoted_string]?"],
	[
		"SELECT_STATEMENT",
		"[{SELECT_ITEM_APPLY} wtsp? cma wtsp?]* {SELECT_ITEM_APPLY}"
	],
	["FULL_ITEM", "[number|field|quoted_string|regular_expression]"],
	[
		"TUPLE",
		"(left_curly wtsp? [{FULL_ITEM}|{TUPLE}] [wtsp? cma wtsp? [{FULL_ITEM}|{TUPLE}]]* wtsp? right_curly)"
	],
	["FROM_ITEM_APPLY", "[field|star|regular_expression]"],
	["FROM_STATEMENT", "[{FROM_ITEM_APPLY} wtsp? cma wtsp?]* {FROM_ITEM_APPLY}"],
	["CONDITION_STATEMENT", "field wtsp? comparison wtsp? [{FULL_ITEM}|{TUPLE}]"],
	[
		"WHERE_STATEMENT_NESTED",
		"left_paren wtsp* {WHERE_STATEMENT_TOP_LEVEL} wtsp* right_paren"
	],
	[
		"WHERE_STATEMENT_TOP_LEVEL",
		"[({CONDITION_STATEMENT})|({WHERE_STATEMENT_NESTED})] [wtsp where_conjunction wtsp ({WHERE_STATEMENT_TOP_LEVEL})]*"
	],
	["FULL_WHERE_STATEMENT_APPLY", "where wtsp {WHERE_STATEMENT_TOP_LEVEL}"],
	[
		"QUERY",
		"wtsp? select wtsp {SELECT_STATEMENT} [wtsp from wtsp {FROM_STATEMENT}]? [wtsp {FULL_WHERE_STATEMENT_APPLY}]? wtsp?"
	]
];
