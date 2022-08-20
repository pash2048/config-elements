const fs = require('fs');
const util = require('util-pack');

// {path,mtime,format,save}
var saves = {},
	comment = '#',
	logging = true,
	space = 4,
	splitter = 'char',
	stringFormater = "'";

function settings(map) {
	if (map.comment !== undefined) {
		comment = map.comment;
	}
	if (map.log !== undefined) {
		logging = map.log;
	}
	if (map.space !== undefined) {
		space = map.space;
	}
	if (map.splitter !== undefined) {
		splitter = map.splitter;
	}
	if (map.stringFormater !== undefined) {
		stringFormater = map.stringFormater;
	}
}

function err(message) {
	console.log(
		`==================================\n${message}\n==================================`
	);
}

// return {type, path, item, spaces, load}
function eachLine({ line, log, lineNum, path }) {
	try {
		if (log === undefined) {
			log = logging;
		}
		line = line.split(comment)[0];
		var type,
			path,
			item,
			spaces,
			load = true;

		// check spaces
		const trimmed = line.trim();
		if (trimmed === '') {
			load = false;
		} else {
			spaces = line.indexOf(trimmed) / space;
			if (Number.isInteger(spaces)) {
				// correct number of spaces
				// check type
				// 1: path 2: item 3: shorthand
				if (splitter !== "char") {
					type = 3;
					var shorthand = trimmed.split(splitter).filter(Boolean);
					path = shorthand[0];
					item = shorthand.slice(1).join('');
				} else if (trimmed.endsWith(':')) {
					type = 1;
					path = trimmed.slice(0, -1);
				} else if (trimmed.startsWith('-')) {
					type = 2;
					item = trimmed.slice(2);
				} else if (trimmed.includes(': ')) {
					type = 3;
					var shorthand = trimmed.split(': ');
					path = shorthand[0];
					item = shorthand.slice(1).join('');
				} else {
					// undefined type
					load = false;
					if (log) {
						if (lineNum !== undefined && path) {
							err(
								`Code confused at ${lineNum + 1} of ${path}\nSkipping this line`
							);
						} else {
							err('Code confused\nSkipping line');
						}
					}
				}
			} else {
				// wrong spaces number
				load = false;
				if (log) {
					if (lineNum !== undefined && path) {
						err(
							`Wrong number of spaces in line ${lineNum +
							1} of ${path}\nSkipping this line`
						);
					} else {
						err('Wrong number of spaces\nSkipping line');
					}
				}
			}
		}

		if (load && item) {
			var itemErr = false;
			// console.log(item);
			switch (item) {
				case 'undefined':
					item = undefined;
					break;
				case 'null':
					item = null;
					break;
				case 'true':
					item = true;
					break;
				case 'false':
					item = false;
					break;
				case 'NaN':
					item = NaN;
					break;
				case 'Infinity':
					item = Infinity;
					break;
				default:
					const num = parseFloat(item);
					if (isNaN(num)) {
						if (
							(item.startsWith("'") && item.endsWith("'")) ||
							(item.startsWith('"') && item.endsWith('"'))
						) {
							item = item.slice(1, -1);
						} else if (item.startsWith('BigInt(') && item.endsWith(')')) {
							var bigint = item.slice(7, -1);
							if (
								(bigint.startsWith("'") && bigint.endsWith("'")) ||
								(bigint.startsWith('"') && bigint.endsWith('"'))
							) {
								bigint = bigint.slice(1, -1);
							}
							try {
								item = BigInt(bigint);
							} catch (error) {
								load = false;
								if (lineNum !== undefined && path) {
									err(
										`Fatal BigInt error in line ${lineNum +
										1} of ${path}\nSkipping this line`
									);
								} else {
									err('Fatal BigInt error \nSkipping line');
								}
							}
						} else {
							itemErr = true;
							load = false;
						}
					} else {
						item = num;
					}
			}

			if (itemErr && log) {
				if (lineNum !== undefined && path) {
					err(
						`Confusing item at ${lineNum +
						1} of ${path} (Missing/Wrong typing)\nSkipping this line`
					);
				} else {
					err('Confusing item (Missing/Wrong typing)\nSkipping line');
				}
			}
		}

		return { type: type, path: path, item: item, spaces: spaces, load: load };
	} catch (err) {
		console.log(err);
	}
}

function readSync({ content, path, encoding, log }) {
	try {
		var mtime,
			notInSaves = true,
			out = {};
		if (!content) {
			// init
			if (path === undefined) {
				throw new Error('Undefined path');
			}
			if (encoding === undefined) {
				encoding = 'utf8';
			}
			if (log === undefined) {
				log = logging;
			}
			mtime = fs.statSync(path).mtime.getTime();

			// check if in saves
			if (saves[path] !== undefined && saves[path].mtime == mtime) {
				notInSaves = false;
				out = saves[path].value;
			}
		}

		if (notInSaves) {
			// not in saved
			var data,
				tempPath = [];
			if (content) {
				data = content.split('\n');
			} else {
				data = fs.readFileSync(path, { encoding: encoding }).split('\n');
			}

			// loop through each line
			data.forEach((item, index) => {
				const line = eachLine({
					line: item,
					log: log,
					lineNum: index,
					path: path
				});
				if (line.load) {
					// change path
					if (
						line.spaces >= tempPath.length &&
						(line.type == 1 || line.type == 3)
					) {
						var fetched = util.fetch(out, tempPath);
						if (fetched === undefined) {
							tempPath.push(line.path);
						}
					} else if (line.spaces - 1 < tempPath.length) {
						tempPath = tempPath.slice(0, line.spaces);
						if (line.type == 1 || line.type == 3) {
							var fetched = util.fetch(out, tempPath);
							if (fetched === undefined) {
								tempPath.push(line.path);
							}
						}
					}
					switch (line.type) {
						case 2:
							var fetched = util.fetch(out, tempPath);
							if (fetched === undefined) {
								util.assign(out, tempPath, [line.item]);
							} else if (Array.isArray(fetched)) {
								fetched.push(line.item);
								util.assign(out, tempPath, fetched);
							} else if (log) {
								err(
									`Duplicate input in line ${index +
										1} of ${path}\nSkipping this line`
								);
							}
							break;
						case 3:
							if (util.fetch(out, tempPath) === undefined) {
								util.assign(out, tempPath, line.item);
							} else {
								if (log) {
									err(
										`Duplicate input in line ${index +
											1} of ${path}\nSkipping this line`
									);
								}
							}
					}
				}
			});
			if (path) {
				saves[path] = {
					value: out,
					mtime: mtime
				};
			}
		}
		return out;
	} catch (err) {
		console.log(err);
	}
}

function typing(variable) {
	if (typeof variable == 'string') {
		variable = `${stringFormater}${variable}${stringFormater}`;
	} else if (typeof variable == 'bigint') {
		variable = `BigInt(${variable})`;
	}
	return variable;
}

function writeRecur(object, file, currentPath) {
	if (file === undefined) {
		file = '';
	}
	if (currentPath == undefined) {
		currentPath = [];
	}
	for (const key in object) {
		if (file && file.slice(-2) != '\n') {
			file += '\n';
		}
		file += `${' '.repeat(space).repeat(currentPath.length)}${key}`;
		if (Array.isArray(object[key])) {
			object[key].forEach(item => {
				item = typing(item);
				file += `\n${'    '.repeat(currentPath.length + 1)}- ${item}`;
			});
		} else if (typeof object[key] == 'object') {
			file = writeRecur(object[key], file, currentPath.concat(key));
		} else {
			file += ` ${typing(object[key])}`;
		}
	}
	return file;
}

function writeSync({ object, path, encoding }) {
	try {
		if (encoding === undefined) {
			encoding = 'utf8';
		}
		const file = writeRecur(object, '', []);
		if (path) {
			fs.writeFileSync(path, file, {
				encoding: encoding
			});
			saves[path] = {
				value: object,
				mtime: new Date().getTime()
			};
		}
		return file;
	} catch (err) {
		console.log(err);
	}
}

module.exports = {
	settings: settings,
	readSync: readSync,
	writeSync: writeSync
};