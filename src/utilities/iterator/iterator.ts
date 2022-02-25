import { IIterator } from "../../models/iterator";

export class Iterator<ItemType> implements IIterator<ItemType> {
	readonly hasNext: () => boolean;
	readonly reset: () => void;
	readonly getNext: () => ItemType;

	constructor(callbacks: {
		hasNext: () => boolean;
		reset: () => void;
		getNext: () => ItemType;
	}) {
		this.hasNext = callbacks.hasNext;
		this.reset = callbacks.reset;
		this.getNext = callbacks.getNext;
	}

	each(callback: (item: ItemType) => void): void {
		this.reset();
		while (this.hasNext()) {
			callback(this.getNext());
		}
	}
}
