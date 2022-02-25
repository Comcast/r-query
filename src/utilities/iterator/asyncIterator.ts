import { IAsyncIterator } from "../../models/iterator";

export class AsyncIterator<ItemType> implements IAsyncIterator<ItemType> {
	readonly hasNext: () => Promise<boolean>;
	readonly reset: () => Promise<void>;
	readonly getNext: () => Promise<ItemType>;

	constructor(callbacks: {
		hasNext: () => Promise<boolean>;
		reset: () => Promise<void>;
		getNext: () => Promise<ItemType>;
	}) {
		this.hasNext = callbacks.hasNext;
		this.reset = callbacks.reset;
		this.getNext = callbacks.getNext;
	}

	async each(callback: (item: ItemType) => void): Promise<void> {
		await this.reset();
		let hasNext = await this.hasNext();
		let next = null;
		while (hasNext) {
			next = await this.getNext();
			await callback(next);
			hasNext = await this.hasNext();
		}
	}
}
