import { IComparer } from "../models/comparer";
import { StringComparer } from "./comparers/stringComparer/stringComparer";
import { ExportStatementComparer } from "./comparers/exportStatementComparer/exportStatementComparer";
import { ImportStatementComparer } from "./comparers/importStatementComparer/importStatementComparer";
import { NumberComparer } from "./comparers/numberComparer/numberComparer";
import { ListComparer } from "./comparers/listComparer/listComparer";

const strComp = new StringComparer();
const numComp = new NumberComparer();

export const COMPARERS: Array<IComparer<any, any>> = [
	strComp,
	new ExportStatementComparer(numComp),
	new ImportStatementComparer(numComp),
	numComp,
	new ListComparer(strComp, numComp)
];
