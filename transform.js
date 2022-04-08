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
	const j = api.jscodeshift;
	const root = j( fileInfo.source );

	console.log( 'Transforming file: %s', fileInfo.path );
	return root
		.find( j.Literal )
		.forEach( function onStringLiteral( node ) {
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
				const id = msg2id( node.value.value );
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
				const id = msg2id( node.value.value );
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
					if ( !requires.some( function hasRequire( node ) {
						return node.value.callee.name === 'require' &&
							node.value.arguments[ 0 ].value === '@stdlib/error-tools-fmtprodmsg';
					} ) ) {
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
		.toSource();
}


// EXPORTS //

module.exports = transformer;