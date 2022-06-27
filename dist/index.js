"use strict";
// MODULES //
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const github_1 = require("@actions/github");
const error_tools_pkg2id_1 = __importDefault(require("@stdlib/error-tools-pkg2id"));
const error_tools_msg2id_1 = __importDefault(require("@stdlib/error-tools-msg2id"));
// VARIABLES //
const pkg = '@stdlib/' + github_1.context.payload.repository.name;
const prefix = (0, error_tools_pkg2id_1.default)(pkg);
const ERROR_NAMES = [
    'Error',
    'AssertionError',
    'RangeError',
    'ReferenceError',
    'SyntaxError',
    'TypeError',
    'URIError'
];
// MAIN //
function transformer(fileInfo, api) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    console.log('Transforming file: %s', fileInfo.path);
    return root
        .find(j.Literal)
        .forEach(function onStringLiteral(node) {
        if (node.value.value === '@stdlib/string-format') {
            console.log('Replacing `@stdlib/string-format` with `@stdlib/error-tools-fmtprodmsg`...');
            j(node)
                .replaceWith(j.stringLiteral('@stdlib/error-tools-fmtprodmsg'));
        }
        // If the string literal is inside a NewExpression for an error, replace the string literal with the error message...
        else if (
        // Case: new Error( format( '...', ... ) )
        (node.parent.parent.value.type === 'NewExpression' &&
            ERROR_NAMES.includes(node.parent.parent.value.callee.name))) {
            const id = (0, error_tools_msg2id_1.default)(node.value.value);
            if (id) {
                const code = prefix + id;
                console.log('Replacing format string "' + node.value.value + '" with error code "' + code + '"...');
                j(node)
                    .replaceWith(j.stringLiteral(code));
            }
        }
        else if (
        // Case: new Error( '...' )
        (node.parent.value.type === 'NewExpression' &&
            ERROR_NAMES.includes(node.parent.value.callee.name))) {
            const id = (0, error_tools_msg2id_1.default)(node.value.value);
            if (id) {
                const code = prefix + id;
                console.log('Replacing string literal "' + node.value.value + '" with error code "' + code + '"...');
                // Replace with call to `format` with the error code...
                const replacement = j.callExpression(j.identifier('format'), [
                    j.stringLiteral(code)
                ]);
                j(node).replaceWith(replacement);
                // Add `require` call to `@stdlib/error-tools-fmtprodmsg` if not already present...
                const requires = root.find(j.CallExpression, {
                    callee: {
                        name: 'require',
                        type: 'Identifier'
                    }
                });
                const nRequires = requires.size();
                console.log('Found ' + nRequires + ' `require` calls...');
                if (!requires.some(function hasRequire(node) {
                    return node.value.callee.name === 'require' &&
                        node.value.arguments[0].value === '@stdlib/error-tools-fmtprodmsg';
                })) {
                    const formatRequire = j.variableDeclaration('var', [
                        j.variableDeclarator(j.identifier('format'), j.callExpression(j.identifier('require'), [
                            j.stringLiteral('@stdlib/error-tools-fmtprodmsg')
                        ]))
                    ]);
                    console.log('Adding `require` call to `@stdlib/error-tools-fmtprodmsg`...');
                    j(root.find(j.Declaration).at(0).get()).insertBefore(formatRequire);
                }
            }
        }
    })
        .toSource();
}
// EXPORTS //
exports.default = transformer;
//# sourceMappingURL=index.js.map