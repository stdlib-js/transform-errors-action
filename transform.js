// MODULES //

const github = require( '@actions/github' );
const pkg2id = require( '@stdlib/error-tools-pkg2id' );
const msg2id = require( '@stdlib/error-tools-msg2id' );


// VARIABLES //

const pkg = '@stdlib/' + github.context.payload.repository.name;
const prefix = pkg2id( pkg );
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

function transformer( fileInfo, api ) {
	console.log( 'Transforming file: %s', fileInfo.path );
	return api
		.jscodeshift( fileInfo.source )
		.find( api.jscodeshift.Literal )
		.forEach( function onStringLiteral( node ) {
			if ( node.value.value === '@stdlib/string-format' ) {
				console.log( 'Replacing `@stdlib/string-format` with `@stdlib/error-tools-fmtprodmsg`...' );
				api.jscodeshift( node )
				.replaceWith( api.jscodeshift.stringLiteral( '@stdlib/error-tools-fmtprodmsg' ) );
			} 
			// If the string literal is inside a NewExpression for an error, replace the string literal with the error message...
			else if ( 
				// Case: new Error( format( '...', ... ) )
				( node.parent.parent.value.type === 'NewExpression' &&
				ERROR_NAMES.includes( node.parent.parent.value.callee.name ) )
			) {
				const id = msg2id( node.value.value );
				if ( id ) {
					const code = prefix + id;
					console.log( 'Replacing format string "'+node.value.value+'" with error code "'+code+'"...' );
					api.jscodeshift( node )
						.replaceWith( api.jscodeshift.stringLiteral( code ) );
				}
			} 
			else if (
				// Case: new Error( '...' )
				( node.parent.value.type === 'NewExpression' &&
				ERROR_NAMES.includes( node.parent.value.callee.name ) )
			) {
				const id = msg2id( node.value.value );
				if ( id ) {
					const code = prefix + id;
					console.log( 'Replacing string literal "'+node.value.value+'" with error code "'+code+'"...' );
					
					// Replace with call to `format` with the error code...
					const replacement = api.jscodeshift.callExpression(
						api.jscodeshift.identifier( 'format' ),
						[
							api.jscodeshift.stringLiteral( code )
						]
					);
					api.jscodeshift( node ).replaceWith( replacement );

					// Add `require` call to `@stdlib/error-tools-fmtprodmsg` if not already present...
					const requires = api.jscodeshift( fileInfo.source ).find( api.jscodeshift.CallExpression, {
						callee: {
							name: 'require',
							type: 'Identifier'
						}
					});
					if ( !requires.some( function hasRequire( node ) {
						return node.value.callee.name === 'require' &&
							node.value.arguments[ 0 ].value === '@stdlib/error-tools-fmtprodmsg';
					} ) ) {
						console.log( 'Adding `require` call to `@stdlib/error-tools-fmtprodmsg`...' );
						const requires = api.jscodeshift( fileInfo.source )
							.find( api.jscodeshift.CallExpression, {
								callee: {
									name: 'require',
									type: 'Identifier'
								}
							});
						console.log( 'Number of existing requires: %d', requires.size() );
						if ( requires.size() > 0 ) {
							requires.insertAfter( api.jscodeshift.callExpression(
									api.jscodeshift.identifier( 'require' ),
									[
										api.jscodeshift.stringLiteral( '@stdlib/error-tools-fmtprodmsg' )
									]
								) );
						} else {
							api.jscodeshift( fileInfo.source )
								.find( api.jscodeshift.Program )
								.get( 0 )
								.insertBefore( api.jscodeshift.callExpression(
									api.jscodeshift.identifier( 'require' ),
									[
										api.jscodeshift.stringLiteral( '@stdlib/error-tools-fmtprodmsg' )
									]
								) );
						}
					}
				}
			}
		})
		.toSource();
}


// EXPORTS //

module.exports = transformer;