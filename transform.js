// MODULES //

const github = require( '@actions/github' );
const pkg2id = require( '@stdlib/error-tools-pkg2id' );
const msg2id = require( '@stdlib/error-tools-msg2id' );


// VARIABLES //

const pkg = '@stdlib/' + github.context.payload.repository.name;
const prefix = pkg2id( pkg );


// MAIN //

function transformer( fileInfo, api ) {
	console.log( 'Transforming file: %s', fileInfo.path );
	console.log( api.jscodeshift.stringLiteral );
	return api
		.jscodeshift( fileInfo.source )
		.find( api.jscodeshift.Literal )
		.forEach( function onStringLiteral( node ) {
			console.log( node.value );
			if ( node.value.value === '@stdlib/string-format' ) {
				console.log( 'Replacing `@stdlib/string-format` with `@stdlib/error-tools-fmtprodmsg`...' );
				api.jscodeshift( node )
					.replaceWith( api.jscodeshift.stringLiteral( '@stdlib/error-tools-fmtprodmsg' ) );
			} 
			// If the string literal is inside a ThrowStatement, replace it with error code:
			else if ( 
				node.parent.type === 'ThrowStatement' ||
				node.parent.parent.type === 'ThrowStatement' 
			) {
				console.log( 'Replacing string literal with error code...' );
				const code = prefix + msg2id( node.value.value );
				api.jscodeshift( node )
					.replaceWith( api.jscodeshift.stringLiteral( code ) );
			}

		})
		.toSource();
}


// EXPORTS //

module.exports = transformer;