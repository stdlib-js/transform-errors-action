/**
* @license Apache-2.0
*
* Copyright (c) 2022 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

// MODULES //

import { FileInfo, API, CallExpression, ASTPath, Literal } from 'jscodeshift';
import { context } from '@actions/github';
import pkg2id from '@stdlib/error-tools-pkg2id';
import msg2id from '@stdlib/error-tools-msg2id';


// VARIABLES //

if ( !context.payload.repository ) {
	throw new Error( 'Repository is undefined.' );
}
const repo = context.payload.repository.name;
const pkg = '@stdlib/' + repo;
const prefix = pkg2id( pkg );
console.log( 'Replacing error messages with error codes for package %s (id: %s).', pkg, prefix );
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

/**
* Transforms a file.
*
* @param fileInfo - file information
* @param api - JSCodeshift API
* @returns transformed file
*/
function transformer( fileInfo: FileInfo, api: API ) {
	const j = api.jscodeshift;
	const root = j( fileInfo.source );

	console.log( 'Transforming file: %s', fileInfo.path );
	return root
		.find( j.Literal )
		.forEach( function onStringLiteral( node: ASTPath<Literal> ) {
			if ( node.value.value === '@stdlib/string-format' ) {
				console.log( 'Replacing `@stdlib/string-format` with `@stdlib/error-tools-fmtprodmsg`...' );
				j( node )
				.replaceWith( j.stringLiteral( '@stdlib/error-tools-fmtprodmsg' ) );
			}
			// If the string literal is inside a NewExpression for an error, replace the string literal with the error message...
			else if (
				// Case: new Error( format( '...', ... ) )
				( node.parent.parent.value.type === 'NewExpression' &&
				ERROR_NAMES.includes( node.parent.parent.value.callee.name ) )
			) {
				const id = msg2id( String( node.value.value ) );
				if ( id ) {
					const code = prefix + id;
					console.log( 'Replacing format string "'+node.value.value+'" with error code "'+code+'"...' );
					j( node )
						.replaceWith( j.stringLiteral( code ) );
				}
			}
			else if (
				// Case: new Error( '...' )
				( node.parent.value.type === 'NewExpression' &&
				ERROR_NAMES.includes( node.parent.value.callee.name ) )
			) {
				const id = msg2id( String( node.value.value ) );
				if ( id ) {
					const code = prefix + id;
					console.log( 'Replacing string literal "'+node.value.value+'" with error code "'+code+'"...' );

					// Replace with call to `format` with the error code...
					const replacement = j.callExpression(
						j.identifier( 'format' ),
						[
							j.stringLiteral( code )
						]
					);
					j( node ).replaceWith( replacement );

					// Add `require` call to `@stdlib/error-tools-fmtprodmsg` if not already present...
					const requires = root.find( j.CallExpression, {
						callee: {
							name: 'require',
							type: 'Identifier'
						}
					});
					const nRequires = requires.size();
					console.log( 'Found ' + nRequires + ' `require` calls...' );
					if ( !requires.some( hasRequire ) ) {
						const formatRequire = j.variableDeclaration(
							'var',
							[
								j.variableDeclarator(
									j.identifier( 'format' ),
									j.callExpression(
										j.identifier( 'require' ),
										[
											j.stringLiteral( '@stdlib/error-tools-fmtprodmsg' )
										]
									)
								)
							]
						);
						console.log( 'Adding `require` call to `@stdlib/error-tools-fmtprodmsg`...' );
						j( root.find( j.Declaration ).at( 0 ).get() ).insertBefore( formatRequire );
					}
				}
			}
		})
		.toSource({
			'quote': 'single',
			'lineTerminator': '\n',
			'reuseWhitespace': false,
			'useTabs': true
		});

	/**
	* Tests whether a path is a require call for `@stdlib/error-tools-fmtprodmsg` or `@stdlib/string-format`.
	*
	* @private
	* @param path - AST node path
	* @returns boolean indicating whether a path is a require call for `@stdlib/error-tools-fmtprodmsg` or `@stdlib/string-format`
	*/
	function hasRequire( node: ASTPath<CallExpression> ) {
		if (
			node.value.callee.type === 'Identifier' &&
			node.value.arguments.length > 0 &&
			(node.value.arguments[0].type === 'Literal' || node.value.arguments[0].type === 'StringLiteral') &&
			node.value.callee.name === 'require'
		) {
			const value = node.value.arguments[0].value;
			return value === '@stdlib/error-tools-fmtprodmsg' || value === '@stdlib/string-format';
		}
		return false;
	}
}


// EXPORTS //

export default transformer;
