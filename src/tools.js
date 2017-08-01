'use strict';

let pruneString = function (text) {
	if (!text)
		return;

	let result = text.replace(/\r\n/g, ' ');
	result = result.replace(/\n/g, ' ');
	result = result.replace(/\t/g, ' ');
	while (result.indexOf('  ') > -1) {
		result = result.replace(/  /g, ' ');
	}
	return result.trim() || '';
}

let prunedArray = function (text) {
	if (!text)
		return;

	let parts = pruneString(text)
	.split(';')
	.filter(function(entry) { return entry.trim() != ''; });

	let result = [];

	for (let item of parts) {
		if (item != void 0 && pruneString(item) != '') {
			var subParts = item.split(':');
			if (subParts.length === 2) {
				result.push({
					name: pruneString(subParts[0]),
					value: pruneString(subParts[1]),
					ruleIndex: result.length
				});
			} else {
				result.push({
					value: pruneString(item),
					ruleIndex: result.length
				});
			}
		}
	}

	return result.sort(function (a, b) {
		if (a.name && b.name) {
			let cA = pruneString(a.name)[0];
			let cB = pruneString(b.name)[0];
			return a - b;
		} else {
			if (a.name) {
				return b - a;
			} else if (b.name) {
				return a - b;
			} else {
				let cA = pruneString(a.value)[0];
				let cB = pruneString(b.value)[0];
				return a - b;
			}
		}
	});
};

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}

module.exports = function (text) {
	return {
		/**
		 * Creates an array of the data elements.
		 */
		toDataArray: prunedArray(text),
		/**
		 * Generates a unique guid.
		 */
		getGuid: guid(),
		prunedString: pruneString(text)
	};
};
