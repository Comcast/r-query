export interface ISortedList<T> {
	length: number;

	add(item: T): void;
	remove(item: T): void;
	forEach(callback: (item: T) => any): void;
	clone(): ISortedList<T>;
	map<M>(
		callback: (item: T, index?: number, list?: ISortedList<T>) => any,
		newCompare?: (a, b) => number
	): ISortedList<M>;
	filter(
		lowerItem: Partial<T>,
		higherItem?: Partial<T>,
		negated?: boolean
	): ISortedList<T>;
	find(item: T): T;
	toArray(): Array<T>;
}
