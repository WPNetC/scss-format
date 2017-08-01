'use strict';

const lintParse = require('./lintFileParser'),
    fs = require('fs'),
    path = require('path'),
    scan = require('./scan'),
    scssParse = require('./scssParser'),
    scssWrite = require('./scssWriter');

let parseAndFormat = function (root, data, lintRules) {

    if (data == void 0 || data === '')
        return 'Error: No data supplied';

    let tScssParse0 = process.hrtime();
    var scssObj = scssParse(data);
    if (!scssObj.output) {
        console.error("Could not parse .scss file.");
        return 'Error: Could not parse .scss file';
    }
    let scssParseTime = process.hrtime(tScssParse0);
    console.log("Scss file parsed in " + scssParseTime[0] + "s " + scssParseTime[1] + "ns");

    let tScssWrite0 = process.hrtime();
    var scssText = scssWrite(scssObj.output, lintRules);
    if (!scssText.output) {
        console.error("Could not write .scss file.");
        return 'Error: Could not write .scss file';
    }
    let tScssWriteTime = process.hrtime(tScssWrite0);
    console.log("Scss file written in " + tScssWriteTime[0] + "s " + tScssWriteTime[1] + "ns");

    console.log("\nSuccess");
    return scssText.output;
}

// Get lint rules (if any)
let getLintFile = function (root) {

    let lintFilePath = path.join(root, '.scsslint.yml');
    let lintRules = {};
    if (fs.exists(lintFilePath)) {

        let tLint0 = process.hrtime();
        let lintText = scan(lintFilePath, parseAndFormat, false).text.toString();
        lintRules = lintParse(lintText).parseFile;
        let lintTime = process.hrtime(tLint0);

        console.log("Lint file parsed in " + lintTime[0] + "s " + lintTime[1] + "ns");
    } else {
        lintRules = lintParse('').linterRules;
        console.log('\nNo lint rules file supplied. Will use standard ruleset: ' + JSON.stringify(lintRules.linterRules));
    }
    return lintRules;
}

let run = function (data, root) {
    let lintRules = getLintFile(root);
    let result = parseAndFormat(root, data, lintRules);
    return result;
}

module.exports = function (data, root) {
    return {
        run: run(data, root)
    };
};