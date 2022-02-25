import { Iterator } from "./iterator";
import { AsyncIterator } from "./asyncIterator";

describe("Iterator", () => {
	it("should process iterator", () => {
		let subject = [1, 2, 3];
		let index = 0;

		const iterator = new Iterator({
			hasNext: () => index < subject.length,
			getNext: () => subject[index++],
			reset: () => (index = 0)
		});

		let numHit = 0;
		iterator.each(item => {
			numHit++;
		});

		expect(numHit).toBe(subject.length);
	});

	it("should process async iterator", async () => {
		let subject = [1, 2, 3];
		let index = 0;

		const iterator = new AsyncIterator({
			hasNext: async () => index < subject.length,
			getNext: async () => subject[index++],
			reset: async () => {
				index = 0;
			}
		});

		let numHit = 0;
		await iterator.each(item => {
			numHit++;
		});

		expect(numHit).toBe(subject.length);
	});
});
