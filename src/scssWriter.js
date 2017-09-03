'use strict';

const _C = require('./constants');

let buffer = '';

let baseRules = {
    betweenBlock: '\r\n',
    indentChar: '\t',
    postComma: ' ',
    postPropColon: ' ',
    postPropName: '',
    postVarName: ' ',
    preBrace: ' ',
    prePostOperator: '',
    postPreParens: ''
};

let writeIndent = function (nestingLevel) {
    let result = '';
    for (let i = 0; i < nestingLevel; i++) {
        result += baseRules.indentChar;
    }
    return result;
}

let processLintObject = function (lintRules) {

    // Indentation
    if (lintRules.Indentation.enabled) {
        let c = lintRules.Indentation.character == 'tab' ? '\t' : ' ';
        for (var ii = 1; ii < lintRules.Indentation.width; ii++) {
            c += c;
        }
        baseRules.indentChar = c;
    } else {
        baseRules.indentChar = '';
    }

    // Space between blocks
    if (lintRules.EmptyLineBetweenBlocks.enabled) {
        baseRules.betweenBlock = '\r\n';
    } else {
        baseRules.betweenBlock = '';
    }

    // Space after comma
    if (lintRules.SpaceAfterComma.enabled) {
        if (lintRules.SpaceAfterComma.style === 'no_space') {
            baseRules.postComma = '';
        } else {
            baseRules.postComma = ' ';
        }
    }

    // Space after property colon
    if (lintRules.SpaceAfterPropertyColon.enabled) {
        if (lintRules.SpaceAfterPropertyColon.style === 'no_space') {
            baseRules.postPropColon = '';
        } else if (lintRules.SpaceAfterPropertyColon.style === 'one_space') {
            baseRules.postPropColon = ' ';
        } else {
            baseRules.postPropColon = '\t\t\t';
        }
    }
    
    // Space after property name
    if (lintRules.SpaceAfterPropertyName.enabled) {
        baseRules.postPropName = ' ';
    } else {
        baseRules.postPropName = '';
    }
    
    // Space after variable name
    if (lintRules.SpaceAfterVariableName.enabled) {
        baseRules.postVarName = ' ';
    } else {
        baseRules.postVarName = '';
    }
    
    // Space around operator
    if (lintRules.SpaceAroundOperator.enabled) {
        if (lintRules.SpaceAroundOperator.style === 'no_space') {
            baseRules.prePostOperator = '';
        } else {
            baseRules.prePostOperator = ' ';
        }
    }

    // Space before brace
    if (lintRules.SpaceBeforeBrace.enabled) {
        if (lintRules.SpaceBeforeBrace.style === 'space') {
            baseRules.preBrace = ' ';
        } else {
            baseRules.preBrace = '\r\n';
        }
    }
    
    // Space between parens
    if (lintRules.SpaceBetweenParens.enabled) {
        let c = '';
        for (var ii = 0; ii < lintRules.SpaceBetweenParens.spaces; ii++) {
            c += ' ';
        }
        baseRules.postPreParens = c;
    } else {
        baseRules.postPreParens = '';
    }

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
        for (let ii = 0; ii < node.data.length; ii++) {
            buffer += writeIndent(node.depth);
            buffer += node.data[ii].value;
            buffer += '\r\n';
        }
        return;
    }

    buffer += writeIndent(node.depth); // Write indent
    let sChr = getStartingChar(node);
    if (sChr != '' && node.name.indexOf(sChr) != 0) {
        node.name = sChr + node.name;
    }

    if (node.name.indexOf(':') > -1) {
        node.name = node.name.replace(':', '') + baseRules.postPropName + ':' + baseRules.postPropColon;
    } else if (node.name.indexOf(' ') == -1) {
        node.name += ' ';
    }

    buffer += node.name; // Write name with formatted colon. :)
    buffer += node.data[0].name || '';
    buffer += (node.data[0].value + ';');
    buffer += '\r\n';
};

// let processData = function (data) {
//     let result = '';
//     if (!data)
//         return result;

//     for (let ii = 0; ii < data.length; ii++) {
//         let name = data[ii].name || '';
//         if (name.indexOf(':') > -1) {
//             name = name.replace(':', '') +
//                 baseRules.postPropName +
//                 ':' +
//                 baseRules.postPropColon;
//         }
//         result += name;
//         result += data[ii].value || '';
//     }
// }

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
    let root = obj;
    if (!root || root.name != _C.ROOT_TAG) {
        console.error("Bad root node: " + root);
        return;
    }

    processLintObject(lintRules);

    buffer = '';
    for (let node of root.childNodes) {
        recurse(node);
    }
    return buffer;
};


module.exports = function (jObj, lintRules) {
    return {
        output: write(jObj, lintRules)
    };
};