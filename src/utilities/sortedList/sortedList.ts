import { ISortedList } from "../../models/sortedList";

export class SortedList<T> implements ISortedList<T> {
	private items: Array<T> = [];

	get length(): number {
		return this.items.length;
	}

	constructor(public readonly compare: (a, b) => number, ar?: Array<T>) {
		if (ar && ar.length > 0) {
			this.items = [...ar];
			this.items.sort(compare);
		}
	}

	/**
	 * Clone this list exactly as it is (deep clone internal array)
	 * This will not re-sort upon copy
	 */
	clone(): SortedList<T> {
		const newList = new SortedList<T>(this.compare);
		newList.items = [...this.items];
		return newList;
	}

	add(item: T): void {
		const { index } = this.findRecord(item);
		this.items.splice(index, 0, item);
	}

	remove(item: T): void {
		const record = this.findRecord(item);
		if (record.matches) {
			this.items.splice(record.index, 1);
		}
	}

	forEach(callback: (item: T) => any): void {
		this.items.forEach(callback);
	}

	map<M>(
		callback: (item: T, index?: number, list?: SortedList<T>) => any,
		newCompare?: (a, b) => number
	): SortedList<M> {
		const newAr = this.items.map((item, index) => {
			return callback(item, index, this);
		});
		return new SortedList<M>(newCompare || this.compare, newAr);
	}

	filter(
		lowerItem: Partial<T>,
		higherItem?: Partial<T>,
		negated = false
	): SortedList<T> {
		let higherNext = false;
		if (typeof higherItem === "undefined") {
			higherItem = lowerItem;
		}

		if (lowerItem === higherItem) {
			higherNext = true;
		}

		const lowerIndex = this.findRecord(lowerItem);
		const higherIndex = this.findRecord(higherItem, higherNext);

		let newList;
		if (negated) {
			newList = [...this.items]
				.splice(0, lowerIndex.index)
				.concat([...this.items].splice(higherIndex.index));
		} else {
			newList = [...this.items].splice(
				lowerIndex.index,
				higherIndex.index - lowerIndex.index
			);
		}

		const newSortedList = new SortedList<T>(this.compare);
		newSortedList.items = newList;
		return newSortedList;
	}

	find(item: T): T {
		const record = this.findRecord(item);
		if (!record.matches) {
			return undefined;
		}
		return this.items[record.index];
	}

	toArray(): Array<T> {
		return [...this.items];
	}

	/**
	 * Find a single record index based on the item and default comparison
	 * Will return if the index matches or not (if not match, useful for insertion)
	 * If nextItem = true, this will move to the right until something which does not match is found
	 * @param item
	 */
	private findRecord(
		item: Partial<T>,
		nextItem = false
	): { index: number; matches: boolean } {
		let start = 0;
		let end = this.items.length;

		const ind = () => Math.floor((end - start) / 2 + start);
		const compare = (offset: number = 0) =>
			ind() + offset === this.items.length
				? 1
				: this.compare(item, this.items[ind() + offset]);

		while (start !== end) {
			const prevStart = start;
			const prevEnd = end;
			const comp = compare();
			if (comp === 0) {
				start = ind();
				end = start;
			} else if (comp < 0) {
				end = ind();
				if (end === prevEnd) {
					end--;
				}
			} else {
				start = ind();
				if (start === prevStart) {
					start++;
				}
			}
		}

		if (nextItem) {
			while (start < this.items.length && compare(1) === 0) {
				start++;
				end++;
			}
			start++;
			end++;
		} else {
			//move to the left until we find the first item which matches (in case of ties)
			while (start > 0 && compare(-1) === 0) {
				start--;
				end--;
			}
		}

		return {
			index: ind(),
			matches: compare() === 0
		};
	}
}
