import { ICfgToken } from "../../../../models/contextFreeGrammar";

export const TOKENS_PROCESS: (comparisons) => ICfgToken[] = comparisons => {
	return [
		["star", /\*/],
		["as", /as/i],
		["wtsp", /(\s|\t)+/],
		["cma", /,/],
		["left_paren", /\(/],
		["right_paren", /\)/],
		["left_curly", /\{/],
		["right_curly", /\}/],
		["where_conjunction", /(and|or)/i],
		["select", /select/i],
		["from", /from/i],
		["where", /where/i],
		["comparison", new RegExp(`!?(` + comparisons.join("|") + `)`, "i")],
		["regular_expression", /\/(?:[^\/\\]|\\.)*\/[a-z]*/],
		["field", /[a-z0-9_\-]+/i],
		["number", /[0-9]+(\.[0-9]+)?/],
		["quoted_string", /'(?:[^'\\]|\\.)*'/]
	];
};
