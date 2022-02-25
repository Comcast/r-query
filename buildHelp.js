const fs = require("fs");

const proj = process.argv[2];

switch (proj) {
	case "npm":
		HelpBuildNpm().catch(err => {
			console.error(err);
			process.exit(1);
		});
		break;
	default:
		throw new Error(`Invalid project: ${proj}!`);
}

async function HelpBuildNpm() {
	const json = await updatePackageJsonVersion();
	await writeFile(
		__dirname + "/dist/package.json",
		JSON.stringify(json, null, 4)
	);

	const bat = await readFile(__dirname + "/src/query-repo.bat");
	await writeFile(__dirname + "/dist/query-repo.bat", bat);
}

async function updatePackageJsonVersion() {
	const packageJson = await readFile(__dirname + "/package.json");
	const content = JSON.parse(packageJson);
	const version = content.version.split(".");
	version[2] = parseInt(version[2]) + 1;
	content.version = version.join(".");
	console.log(`Incrementing to version ${content.version}`);

	const updatedJson = JSON.stringify(content, null, 4);

	await writeFile(__dirname + "/package.json", updatedJson);
	return content;
}

async function readFile(filename) {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, "utf-8", (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

async function writeFile(filename, contents) {
	return new Promise((resolve, reject) => {
		fs.writeFile(filename, contents, err => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}
