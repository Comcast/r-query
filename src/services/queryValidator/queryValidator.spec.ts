import { QueryIntermediateForm } from "../queryIntermediateForm/queryIntermediateForm";
import { QueryIntermediateFormValidator } from "./queryValidator";
import { FIELD_TYPES } from "../../domain/fields";
import { COMPARERS } from "../../domain/allComparers";

describe("QueryValidator", () => {
	let validator: QueryIntermediateFormValidator;

	beforeEach(() => {
		validator = new QueryIntermediateFormValidator(FIELD_TYPES, COMPARERS);
	});

	it("should accept valid select conditions", () => {
		const testCases = [
			{
				select: [
					{
						fieldName: "file_contents",
						fieldAlias: "fileContents"
					},
					{
						fieldName: "file_name",
						fieldAlias: "fileName"
					}
				],
				from: ["somewhere", "elsewhere"],
				where: null
			},
			{
				select: [
					{
						fieldName: "file_name",
						fieldAlias: "file_name"
					},
					{
						fieldName: "file_contents",
						fieldAlias: "file-contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "file_name",
						comparison: "contains",
						isNegated: false,
						comparedTo: "'component.ts'"
					}
				]
			}
		].map(cs => new QueryIntermediateForm(cs));

		testCases.forEach(tc => {
			const validated = validator.validate(tc);
			expect(validated).toBeTruthy();
		});
	});

	it("should reject invalid select conditions", () => {
		const testCases = [
			{
				select: [
					{
						fieldName: "badField",
						fieldAlias: "badField"
					},
					{
						fieldName: "badField2",
						fieldAlias: "badField2"
					}
				],
				from: ["somewhere", "elsewhere"],
				where: null
			},
			{
				select: [
					{
						fieldName: "file_name_invalid",
						fieldAlias: "file_name_invalid"
					},
					{
						fieldName: "file_contents_invalid",
						fieldAlias: "file-contents_invalid"
					},
					{
						fieldName: "invalid_file_name",
						fieldAlias: "invalid_file_name"
					},
					{
						fieldName: "invalid_file_contents",
						fieldAlias: "invalid_file_contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "file_name",
						comparison: "contains",
						isNegated: false,
						comparedTo: "'component.ts'"
					}
				]
			}
		].map(cs => new QueryIntermediateForm(cs));

		testCases.forEach(tc => {
			try {
				validator.validate(tc);
				fail();
			} catch (err) {
				expect(true).toBeTruthy();
			}
		});
	});

	it("should accept valid where clause fields", () => {
		const testCases = [
			{
				select: [
					{
						fieldName: "file_contents",
						fieldAlias: "fileContents"
					},
					{
						fieldName: "file_name",
						fieldAlias: "fileName"
					}
				],
				from: ["somewhere", "elsewhere"],
				where: null
			},
			{
				select: [
					{
						fieldName: "file_name",
						fieldAlias: "file_name"
					},
					{
						fieldName: "file_contents",
						fieldAlias: "file-contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "file_name",
						comparison: "contains",
						isNegated: false,
						comparedTo: "'component.ts'"
					}
				]
			},
			{
				select: [
					{
						fieldName: "file_name",
						fieldAlias: "file_name"
					},
					{
						fieldName: "file_contents",
						fieldAlias: "file-contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "file_name",
						comparison: "contains",
						isNegated: false,
						comparedTo: "'component.ts'"
					},
					"and",
					{
						field: "file_contents",
						comparison: "contains",
						isNegated: true,
						comparedTo: "'Store'"
					}
				]
			}
		].map(cs => new QueryIntermediateForm(cs));

		testCases.forEach(tc => {
			const validated = validator.validate(tc);
			expect(validated).toBeTruthy();
		});
	});

	it("should reject invalid where clause fields", () => {
		const testCases = [
			{
				select: [
					{
						fieldName: "file_name",
						fieldAlias: "file_name"
					},
					{
						fieldName: "file_contents",
						fieldAlias: "file-contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "asdfasdfasdfasd",
						comparison: "contains",
						isNegated: false,
						comparedTo: "'component.ts'"
					}
				]
			},
			{
				select: [
					{
						fieldName: "file_name",
						fieldAlias: "file_name"
					},
					{
						fieldName: "file_contents",
						fieldAlias: "file-contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "bad_file_name",
						comparison: "contains",
						isNegated: false,
						comparedTo: "'component.ts'"
					},
					"and",
					{
						field: "file_contents_invalid",
						comparison: "contains",
						isNegated: true,
						comparedTo: "'Store'"
					}
				]
			}
		].map(cs => new QueryIntermediateForm(cs));

		testCases.forEach(tc => {
			try {
				validator.validate(tc);
				fail();
			} catch (err) {
				expect(true).toBeTruthy();
			}
		});
	});

	it("should accept valid comparisons", () => {
		const testCases = [
			{
				select: [
					{
						fieldName: "file_contents",
						fieldAlias: "fileContents"
					},
					{
						fieldName: "file_name",
						fieldAlias: "fileName"
					}
				],
				from: ["somewhere", "elsewhere"],
				where: null
			},
			{
				select: [
					{
						fieldName: "file_name",
						fieldAlias: "file_name"
					},
					{
						fieldName: "file_contents",
						fieldAlias: "file-contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "file_name",
						comparison: "contains",
						isNegated: false,
						comparedTo: "'component.ts'"
					}
				]
			},
			{
				select: [
					{
						fieldName: "file_name",
						fieldAlias: "file_name"
					},
					{
						fieldName: "file_contents",
						fieldAlias: "file-contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "file_name",
						comparison: "contains",
						isNegated: false,
						comparedTo: "'component.ts'"
					},
					"and",
					{
						field: "file_contents",
						comparison: "contains",
						isNegated: true,
						comparedTo: "'Store'"
					}
				]
			}
		].map(cs => new QueryIntermediateForm(cs));

		testCases.forEach(tc => {
			const validated = validator.validate(tc);
			expect(validated).toBeTruthy();
		});
	});

	it("should reject invalid comparisons", () => {
		const testCases = [
			{
				select: [
					{
						fieldName: "file_name",
						fieldAlias: "file_name"
					},
					{
						fieldName: "bad",
						fieldAlias: "file-contents"
					}
				],
				from: ["repo-container"],
				where: [
					{
						field: "file_name",
						comparison: "asdfasd",
						isNegated: false,
						comparedTo: "'component.ts'"
					},
					"and",
					{
						field: "file_contents",
						comparison: "---",
						isNegated: true,
						comparedTo: "'Store'"
					}
				]
			}
		].map(cs => new QueryIntermediateForm(cs));

		testCases.forEach(tc => {
			try {
				validator.validate(tc);
				fail();
			} catch (err) {
				expect(true).toBeTruthy();
			}
		});
	});
});
