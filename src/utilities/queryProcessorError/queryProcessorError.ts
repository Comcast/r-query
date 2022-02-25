export class QueryProcessorError extends Error {
	constructor(
		public readonly message: string,
		public readonly previousError?: QueryProcessorError | Error,
		public readonly data?: any
	) {
		super();
	}

	get errorStack(): Array<QueryProcessorError> {
		if (!this.previousError) {
			return [this];
		}
		const prev = this.previousError as QueryProcessorError;
		if (!prev.errorStack) {
			return [this, prev];
		}
		return [this].concat(prev.errorStack as any);
	}

	get errorStackMessages(): Array<string> {
		return this.errorStack.map(err => err.message || err.toString());
	}
}
