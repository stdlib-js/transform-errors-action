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
	console.log( 'File: %s', fileInfo.path );
	return api
		.jscodeshift( fileInfo.source )
		.find( api.jscodeshift.StringLiteral )
		.forEach( function onString( path ) {
			console.log( 'String: '+path );
			if ( path.value.name === '@stdlib/string-format' ) {
				api.jscodeshift( path )
					.replaceWith( api.jscodeshift.stringLiteral( '@stdlib/error-tools-fmtprodmsg' ) );
			}
		})
		.toSource();
}


// EXPORTS //

module.exports = transformer;