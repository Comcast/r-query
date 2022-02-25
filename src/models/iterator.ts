export interface IIterator<ItemType> {
	hasNext: () => boolean;
	reset: () => void;
	getNext: () => ItemType;

	each(callback: (item: ItemType) => void): void;
}

export interface IAsyncIterator<ItemType> {
	hasNext: () => Promise<boolean>;
	reset: () => Promise<void>;
	getNext: () => Promise<ItemType>;

	each(callback: (item: ItemType) => Promise<void>): Promise<void>;
}
