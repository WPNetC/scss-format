'use babel';

const lintParse = require('./lintFileParser'),
    fs = require('fs'),
    scan = require('./scan'),
    scssParse = require('./scssParser'),
    scssWrite = require('./scssWriter'),
    find = require('find');

let lintFilePath = '';
let lintRules = void 0;

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

// Get path to lint rules
let getLintFile = function (root) {
    if (lintFilePath === '') {
        let lintFilePaths = find.fileSync(/scsslint.yml/i, root);
        if (lintFilePaths.length === 1) {
            lintFilePath = lintFilePaths[0];
        }
    }
}

let run = function (data, root, callback) {
    if (lintRules === void 0 || lintFilePath === '') {
        getLintFile(root);
    }

    fs.exists(lintFilePath, (exists) => {
        if (exists) {
            let tLint0 = process.hrtime();
            let lintText = scan(lintFilePath, parseAndFormat, false).text.toString();
            lintRules = lintParse(lintText).parseFile;
            let lintTime = process.hrtime(tLint0);

            console.log("Lint file parsed in " + lintTime[0] + "s " + lintTime[1] + "ns");
        } else {
            lintFilePath === '';
            lintRules = lintParse('').linterRules;
            console.log('\nNo lint rules file supplied. Will use standard ruleset: ' + JSON.stringify(lintRules.linterRules));
        }
        let result = parseAndFormat(root, data, lintRules);
        callback(result);
    });
}

exports.run = run;