/**
 * Helper file for git purposes
 */
const { exec } = require("child_process");

/**
 * Configure the script to run the following commands in parallel
 * Items in a subarray will be executed sequentially
 */
const EXTERNAL_COMMANDS = ["npm run format", "npm run test"];

/**
 * This object will enhance logging to output colors.
 */
class Logger {
	constructor() {
		this._colors = {
			default: "\x1b[0m",
			red: "\x1b[31m",
			yellow: "\x1b[33m",
			green: "\x1b[32m"
		};

		this._consoleFuncs = {
			log: "log",
			warn: "warn",
			error: "error"
		};
	}

	logMessage(...params) {
		this._log(this._colors.default, this._consoleFuncs.log, ...params);
	}

	logSuccess(...params) {
		this._log(this._colors.green, this._consoleFuncs.log, ...params);
	}

	logWarning(...params) {
		this._log(this._colors.yellow, this._consoleFuncs.warn, ...params);
	}

	logError(...params) {
		this._log(this._colors.red, this._consoleFuncs.error, ...params);
	}

	_log(color, func, ...params) {
		const logParams = params.reduce((ar, item) => {
			let transformedItem = [];
			if (typeof item === "object") {
				transformedItem = transformedItem
					.concat([`${color}`])
					.concat(item)
					.concat([`${this._colors.default}`]);
			} else {
				transformedItem.push(`${color}${item}${this._colors.default}`);
			}
			return ar.concat(transformedItem);
		}, []);

		console[func].apply(console, logParams);
	}
}

/**
 * This encapsulates functionality to run external commands.
 * execute() returns a promise
 * Can also kill a process while it is running
 */
class ExternalCommandExecutor {
	constructor(cmd) {
		this.cmd = cmd;
		this._spawnRef = null;
	}

	execute() {
		return new Promise((resolve, reject) => {
			this._spawnRef = exec(this.cmd, (err, stdout, stderr) => {
				if (err) {
					reject(err);
				}
				resolve();
			});
		});
	}

	kill() {
		if (!this._spawnRef) {
			return;
		}
		this._spawnRef.stdin.pause();
		this._spawnRef.kill();
		this._spawnRef = null;
	}
}

/**
 * Handles the logic for running the pre-commit actions
 */
class PreCommit {
	constructor(externalCommands) {
		this.logger = new Logger();
		this.externalCommands = externalCommands;
	}

	run() {
		this.logger.logMessage(`Pre-commit started.`);
		const { executors, promises } = this._runMultipleParallel(
			this.externalCommands
		);

		Promise.all(promises)
			.then(() => {
				this.logger.logSuccess(`Pre commit complete!`);
				process.exit(0);
			})
			.catch(err => {
				this.logger.logError(`Pre commit failed!`, err);
				executors.forEach(ex => ex.kill());
				process.exit(1);
			});
	}

	_runSingle(cmd) {
		this.logger.logMessage(`Starting command: ${cmd}`);
		const executor = new ExternalCommandExecutor(cmd);
		const promise = executor
			.execute()
			.then(data => {
				this.logger.logMessage(`Execution of command complete: ${cmd}`);
			})
			.catch(err => {
				this.logger.logError(`Error running ${cmd}: `, err);
				throw err;
			});
		return {
			executor,
			promise
		};
	}

	_runMultipleParallel(cmds) {
		let executors = [];
		let promises = [];

		cmds.forEach(cmd => {
			if (Array.isArray(cmd)) {
				const response = this._runMultipleSequential(cmd);
				executors = executors.concat(response.executors);
				promises = promises.concat(response.promises);
			} else {
				const { executor, promise } = this._runSingle(cmd);
				executors.push(executor);
				promises.push(promise);
			}
		});

		return {
			executors,
			promises
		};
	}

	_runMultipleSequential(cmds) {
		let executors = [];
		let promise = Promise.resolve();

		for (let i = 0; i < cmds.length; i++) {
			const cmd = cmds[i];
			promise = promise.then(() => {
				const response = this._runSingle(cmd);
				executors.push(response.executor);
				return response.promise;
			});
		}

		return {
			executors,
			promises: [promise]
		};
	}
}

//start the process
new PreCommit(EXTERNAL_COMMANDS).run();
