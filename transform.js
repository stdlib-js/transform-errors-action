// MODULES //

const github = require( '@actions/github' );
const pkg2id = require( '@stdlib/error-tools-pkg2id' );
const msg2id = require( '@stdlib/error-tools-msg2id' );


// VARIABLES //

const pkg = '@stdlib/' + github.context.payload.repository.name;
const id = pkg2id( pkg );
console.log( 'Package identifier: %s', id );


// MAIN //

function transformer( fileInfo, api ) {
	console.log( 'Transforming file: %s', fileInfo.path );
	return api
		.jscodeshift( fileInfo.source )
		.find( api.jscodeshift.String )
		.forEach( function onString( node ) {
			console.log( 'String: '+node );
			if ( node.value === '@stdlib/string-format' ) {
				api.jscodeshift( node )
					.replaceWith( api.jscodeshift.stringLiteral( '@stdlib/error-tools-fmtprodmsg' ) );
			}
		})
		.toSource();
}


// EXPORTS //

module.exports = transformer;