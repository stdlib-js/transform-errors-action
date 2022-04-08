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
			console.log( node.parent );
			if ( node.value.value === '@stdlib/string-format' ) {
				console.log( 'Replacing `@stdlib/string-format` with `@stdlib/error-tools-fmtprodmsg`...' );
				api.jscodeshift( node )
				.replaceWith( api.jscodeshift.stringLiteral( '@stdlib/error-tools-fmtprodmsg' ) );
			} 
			// If the string literal is inside a ThrowStatement, replace it with error code:
			console.log( 'Ancestors: ' );
			console.log( node.parent.value );
			console.log( node.parent.parent.value );
			console.log( node.parent.parent.parent.value );
			if ( 
				node.parent.value.type === 'ThrowStatement' ||
				node.parent.parent.value.type === 'ThrowStatement' 
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