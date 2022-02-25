import { QueryProcessorError } from "./queryProcessorError";

describe("QueryProcessorError", () => {
	it("should create basic error", () => {
		const message = "Test error";
		const err = new QueryProcessorError(message);
		expect(err.message).toBe(message);
		expect(err.errorStack.length).toBe(1);
	});

	it("should create error with one normal error linked", () => {
		const message = "Test error";
		const innerMessage = "Inner";
		const err = new QueryProcessorError(message, new Error(innerMessage));
		expect(err.message).toBe(message);
		expect(err.errorStack.length).toBe(2);
	});

	it("should create error with multiple linked errors", () => {
		const message = "Test error";
		const err = new QueryProcessorError(
			message,
			new QueryProcessorError(message, new QueryProcessorError(message))
		);
		expect(err.errorStack.length).toBe(3);
	});

	it("should map stack to string array", () => {
		const message = "Test error";
		const err = new QueryProcessorError(
			message,
			new QueryProcessorError(message, new QueryProcessorError(message))
		);
		expect(err.errorStack.length).toBe(3);
		const strAr = err.errorStackMessages;
		expect(strAr.length).toBe(3);

		expect(true);
	});
});
