var vscode = require('vscode'),
    app = require('./src/app');


const documentEdit = (range, newText) => [vscode.TextEdit.replace(range, newText)];
const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));

function activate(context) {
    var disposable = vscode.commands.registerCommand('extension.lintFormat', function () {
        var root = vscode.workspace.rootPath;
        var actEd = vscode.window.activeTextEditor;

        if (actEd == void 0 || actEd.document.fileName.indexOf('.scss') === -1)
            return;

        var docText = actEd.document.getText();

        if (docText == void 0 || docText.trim() === '')
            return;


        var result = app(docText, root).run;

        if (result.indexOf('Error') === 0) {
            vscode.window.showErrorMessage(result);
        } else {
            var rng = fullRange(actEd.document);
            var edits = documentEdit(rng, result);
            actEd.edit(editorEdit => {
                for (let i = 0; i < edits.length; i++) {
                    editorEdit.replace(edits[i].range, edits[i].newText);
                }
            });
        }
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;