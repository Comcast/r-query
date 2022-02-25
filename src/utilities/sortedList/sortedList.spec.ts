import { SortedList } from "./sortedList";

describe("SortedList", () => {
	const numComp = (a, b) => a - b;

	it("should sort as it inserts", () => {
		const test = [5, 4, 6, 3, 7, 3, 7, -1, 0, 2, 8, 9, 8, 9];
		const expected = [...test].sort(numComp);

		const list = new SortedList(numComp);
		test.forEach(num => {
			list.add(num);
		});

		expect(list.toArray()).toEqual(expected);
	});

	it("should automatically sort a list which was input to the constructor", () => {
		const test = [5, 4, 6, 3, 7, 3, 7, -1, 0, 2];
		const expected = test.sort(numComp);

		const list = new SortedList(numComp, test);
		expect(list.toArray()).toEqual(expected);
	});

	it("should find a given item in the list", () => {
		const compare = (a, b) => a.name.localeCompare(b.name);
		const test = [
			{ name: "c", value: 15 },
			{ name: "z", value: 30 },
			{ name: "b", value: 3 },
			{ name: "d", value: -13 },
			{ name: "q", value: 4654654 }
		];
		const expected = [...test].sort(compare);

		const list = new SortedList(compare);
		test.forEach(tc => list.add(tc));

		expect(list.toArray()).toEqual(expected);
		test.forEach(tc => {
			const name = tc.name;
			const search = { name };
			expect(list.find(search)).toEqual(tc);
		});
	});

	it("should filter items in the list", () => {
		const compare = (a, b) => {
			let strC = a.name.localeCompare(b.name);
			if (strC === 0) {
				strC = a.value - b.value;
			}
			return strC;
		};
		const test = [
			{ name: "c", value: -1 },
			{ name: "c", value: 15 },
			{ name: "z", value: 31 },
			{ name: "z", value: 30 },
			{ name: "e", value: 3 },
			{ name: "d", value: -13 },
			{ name: "q", value: 123123 },
			{ name: "q", value: 4654654 }
		];
		const expected = [...test].sort(compare);

		const list = new SortedList(compare);
		test.forEach(tc => list.add(tc));

		expect(list.toArray()).toEqual(expected);

		const zItems = expected.filter(tc => tc.name === "z").sort(compare);

		const zFound = list
			.filter({ name: "z", value: -Infinity }, { name: "z", value: Infinity })
			.toArray()
			.sort(compare);
		expect(zFound.length).toBe(zItems.length);
		expect(zFound).toEqual(zItems);

		const qItems = expected.filter(tc => tc.name === "q").sort(compare);

		const qFound = list
			.filter({ name: "q", value: -Infinity }, { name: "q", value: Infinity })
			.toArray()
			.sort(compare);
		expect(qFound.length).toBe(qItems.length);
		expect(qFound).toEqual(qItems);

		const cItems = expected.filter(tc => tc.name === "c").sort(compare);

		const cFound = list
			.filter({ name: "c", value: -Infinity }, { name: "c", value: Infinity })
			.toArray()
			.sort(compare);
		expect(cFound.length).toBe(cItems.length);
		expect(cFound).toEqual(cItems);
	});

	it("should filter when only one condition is provided", () => {
		const compare = (a, b) => {
			return a.name.localeCompare(b.name);
		};
		const test = [
			{ name: "c", value: -1 },
			{ name: "c", value: 15 },
			{ name: "z", value: 31 },
			{ name: "z", value: 30 },
			{ name: "e", value: 3 },
			{ name: "d", value: -13 },
			{ name: "q", value: 123123 },
			{ name: "q", value: 4654654 }
		];
		const expected = [...test].sort(compare);

		const list = new SortedList(compare);
		test.forEach(tc => list.add(tc));

		const qItems = expected.filter(tc => tc.name === "q");

		const qFound = list.filter({ name: "q" }).toArray();
		expect(qFound.length).toBe(qItems.length);
	});

	it("should filter when folder-like structure provided (use case for r-query)", () => {
		const items = [
			{
				file: "T:/project/orangeModule/test.ts"
			},
			{
				file: "T:/project/blueModule/test.ts"
			},
			{
				file: "T:/project/orangeModule/src/package.json"
			},
			{
				file: "T:/project/blueModule/src/package.json"
			},
			{
				file: "T:/project/orangeModule-extended/src/package.json"
			}
		];
		const compare = (a, b) => a.file.localeCompare(b.file);

		const list = new SortedList(compare, items);

		//query for orangeModule should not give orangeModuleExtended
		const orange = list.filter(
			{ file: "T:/project/orangeModule/" },
			{ file: "T:/project/orangeModule#/" }
		);
		expect(
			orange.toArray().find(item => item.file.indexOf("Extended") > -1)
		).toBeUndefined();
		expect(orange.length).toBe(2);
	});

	it("should remove item", () => {
		const items = [
			{
				file: "T:/project/orangeModule/test.ts"
			},
			{
				file: "T:/project/blueModule/test.ts"
			},
			{
				file: "T:/project/orangeModule/src/package.json"
			},
			{
				file: "T:/project/blueModule/src/package.json"
			},
			{
				file: "T:/project/orangeModule-extended/src/package.json"
			}
		];
		const compare = (a, b) => a.file.localeCompare(b.file);

		const list = new SortedList(compare, items);
		const startLen = list.length;

		list.remove({
			file: "T:/project/orangeModule/test.ts"
		});

		expect(list.length).toBe(startLen - 1);
	});

	it("should run for-each on list", () => {
		const test = [5, 4, 6, 3, 7, 3, 7, -1, 0, 2, 8, 9, 8, 9];
		let numHit = 0;
		const list = new SortedList(numComp, test);

		list.forEach(item => {
			expect(item).toBeDefined();
			numHit++;
		});

		expect(numHit).toBe(test.length);
	});

	it("should map items", () => {
		const test = [5, 4, 6, 3, 7, 3, 7, -1, 0, 2, 8, 9, 8, 9];
		const transformTest = num => num * 2;
		const expected = [...test].sort(numComp).map(transformTest);

		const list = new SortedList(numComp, test);
		const newList = list.map(transformTest);

		expect(newList.toArray()).toStrictEqual(expected);
	});
});
