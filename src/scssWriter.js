'use strict';

const _C = require('./constants');

let buffer = '';

let baseRules = {
    betweenBlock: '',
    indentChar: '\t',
    postComma: ' ',
    postPropColon: ' ',
    postPropName: '',
    postVarName: ' ',
    preBrace: ' ',
    prePostOperator: '',
    postPreParens: ''
};

/*
let node = {
		guid: tools().getGuid,
		type: args.type,
		name: args.name || '',
		data: tools(args.data).toDataArray,
		depth: nestingLevel,
		parent: args.parent, // Causes recursion issue when serializing if not handled.
		isBlock: args.isBlock,
		childIndex: cIdx,
		childNodes: args.childNodes || []
	};
*/

let writeIndent = function (nestingLevel) {
    let result = '';
    for (let i = 0; i < nestingLevel; i++) {
        result += baseRules.indentChar;
    }
    return result;
}

let processBlock = function (node) {

    // Handle space between blocks.
    if (buffer != '') {
        if (node.depth === 0) {
            buffer += baseRules.betweenBlock;
        } else {
            var parHasVals = (node.parent === undefined || node.parent.data === undefined) ?
                false : node.parent.data.length > 0;
            if (parHasVals) {
                buffer += baseRules.betweenBlock;
            }
        }
    }
    // Write block opening
    let sChr = getStartingChar(node);
    buffer += writeIndent(node.depth);
    if (sChr != '' && node.name.indexOf(sChr) != 0) {
        buffer += sChr;
    }
    buffer += (node.name + baseRules.preBrace + '{\r\n');

    // Write block properties
    if (node.data) {
        for (let rIdx = 0; rIdx < node.data.length; rIdx++) {
            let rule = node.data[rIdx];
            buffer += writeIndent(node.depth + 1);
            if (rule.name) {
                buffer += (rule.name + baseRules.postPropName + ':' + baseRules.postPropColon); // Write name with formatted colon. :)
                buffer += (rule.value + ';');
            } else {
                buffer += (rule.value + ';');
            }
            buffer += '\r\n';
        }
    }

    // Write sub-blocks
    if (node.childNodes) {
        for (let child of node.childNodes) {
            recurse(child);
        }
    }
    // Write block close
    buffer += writeIndent(node.depth);
    buffer += '}\r\n';
};

let processNonBlock = function (node) {

    if (node.type === _C.COMMENT_MULTI_TAG || node.type === _C.COMMENT_SINGLE_TAG) {
        return;
    }

    buffer += writeIndent(node.depth); // Write indent
    let sChr = getStartingChar(node);
    if (sChr != '' && node.name.indexOf(sChr) != 0) {
        node.name = sChr + node.name;
    }

    if(node.name.indexOf(':') > -1){
        node.name = node.name.replace(':', '') + baseRules.postPropName + ':'+ baseRules.postPropColon;
    } else if (node.name.indexOf(' ') == -1){
        node.name += ' ';
    }

    buffer += node.name; // Write name with formatted colon. :)
    buffer += (node.data[0].value + ';');
    buffer += '\r\n';
};

let getStartingChar = function (node) {
    switch (node.type) {
        case _C.CLASS_TAG:
            return '.';
        case _C.ID_TAG:
            return '#';
        case _C.VARIABLE_TAG:
            return '$';
        case _C.PARENT_SELECTOR_TAG:
            return '&';
        case _C.HTML_TAG:
            return '';
        case _C.COMMENT_SINGLE_TAG:
        case _C.COMMENT_MULTI_TAG:
            return '/';
        default:
            return '@';
    }

}

let recurse = function (currentNode) {
    // Don't want to write anything from root object,
    // but want to step through it's children.
    if (currentNode.type === _C.ROOT_TAG) {
        for (let node of currentNode.childNodes) {
            recurse(node);
        }
        return;
    }

    switch (currentNode.isBlock) {
        case true:
            // These may recurse
            processBlock(currentNode);
            break;
        case false:
        default:
            // These should not
            processNonBlock(currentNode);
            break;
    }
};

let write = function (obj, lintRules) {
    if (!obj)
        return;

    

    let root = obj;
    if (!root || root.name != _C.ROOT_TAG) {
        console.error("Bad root node: " + root);
        return;
    }

    buffer = '';
    recurse(root);
    return buffer;
};


module.exports = function (jObj, lintRules) {
    return {
        output: write(jObj, lintRules)
    };
};