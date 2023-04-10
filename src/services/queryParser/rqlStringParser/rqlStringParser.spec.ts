import { RqlStringParser } from "./rqlStringParser";
import { IQueryIntermediateForm } from "../../../models/queryIntermediateForm";
import { QueryIntermediateForm } from "../../queryIntermediateForm/queryIntermediateForm";
import { COMPARERS } from "../../../domain/allComparers";

interface TestCase {
	input: string;
	expected: IQueryIntermediateForm;
}

describe("RqlStringParser", () => {
	let parser: RqlStringParser;

	beforeEach(() => {
		parser = new RqlStringParser(COMPARERS);
	});

	it("should parse single field and source", () => {
		const testCases: Array<TestCase> = [
			{
				input: "select color from pallete",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "color",
							fieldAlias: "color"
						}
					],
					from: ["pallete"],
					where: []
				})
			},
			{
				input: "SELECT elephant FROM zoo",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "elephant",
							fieldAlias: "elephant"
						}
					],
					from: ["zoo"],
					where: []
				})
			}
		];

		testCases.forEach(tc => {
			const response = parser.parseInput(tc.input);
			expect(response).toEqual(tc.expected);
		});
	});

	it("should parse multiple fiels and/or sources", () => {
		const testCases: Array<TestCase> = [
			{
				input: "select color, brightness from pallete",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "color",
							fieldAlias: "color"
						},
						{
							fieldName: "brightness",
							fieldAlias: "brightness"
						}
					],
					from: ["pallete"],
					where: []
				})
			},
			{
				input: "SELECT elephant FROM zoo, wild",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "elephant",
							fieldAlias: "elephant"
						}
					],
					from: ["zoo", "wild"],
					where: []
				})
			}
		];

		testCases.forEach(tc => {
			const response = parser.parseInput(tc.input);
			expect(response).toEqual(tc.expected);
		});
	});

	it("should parse single where condition", () => {
		const testCases: Array<TestCase> = [
			{
				input: "select color from pallete where color = true",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "color",
							fieldAlias: "color"
						}
					],
					from: ["pallete"],
					where: [
						{
							field: "color",
							comparison: "=",
							isNegated: false,
							comparedTo: "true"
						}
					]
				})
			},
			{
				input: "SELECT elephant FROM zoo where enclosure != entrance",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "elephant",
							fieldAlias: "elephant"
						}
					],
					from: ["zoo"],
					where: [
						{
							field: "enclosure",
							comparison: "=",
							isNegated: true,
							comparedTo: "entrance"
						}
					]
				})
			},
			{
				input: "Select fileContents From repo-e2e-library Where filename = 'package.json'",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "fileContents",
							fieldAlias: "fileContents"
						}
					],
					from: ["repo-e2e-library"],
					where: [
						{
							field: "filename",
							comparison: "=",
							isNegated: false,
							comparedTo: "'package.json'"
						}
					]
				})
			}
		];

		testCases.forEach(tc => {
			const response = parser.parseInput(tc.input);
			expect(response).toEqual(tc.expected);
		});
	});

	it("should parse multiple where conditions", () => {
		const testCases: Array<TestCase> = [
			{
				input: "select color from pallete where color = true and included=true",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "color",
							fieldAlias: "color"
						}
					],
					from: ["pallete"],
					where: [
						{
							field: "color",
							comparison: "=",
							isNegated: false,
							comparedTo: "true"
						},
						"and",
						{
							field: "included",
							comparison: "=",
							isNegated: false,
							comparedTo: "true"
						}
					]
				})
			},
			{
				input: "SELECT elephant FROM zoo where enclosure != 'entrance'",
				expected: new QueryIntermediateForm({
					select: [
						{
							fieldName: "elephant",
							fieldAlias: "elephant"
						}
					],
					from: ["zoo"],
					where: [
						{
							field: "enclosure",
							comparison: "=",
							comparedTo: "'entrance'",
							isNegated: true
						}
					]
				})
			}
		];

		testCases.forEach(tc => {
			const response = parser.parseInput(tc.input);
			expect(response).toEqual(tc.expected);
		});
	});
});
