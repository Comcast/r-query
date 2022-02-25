export interface IContextFreeGrammar<ParseReturnType> {
	stringMatches(str: string): boolean;
	substringMatches(str: string): boolean;

	parseString(str: string): ParseReturnType;

	tokens: ICfgToken[];
	rules: ICfgRule[];

	entryRuleName: string;
}

export type ICfgToken = [string, RegExp];
export type ICfgRule = [string, string];

export type ICfgDefinition = (ICfgToken | ICfgRule)[];
