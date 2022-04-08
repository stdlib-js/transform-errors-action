// MAIN //

function transformer( fileInfo, api ) {
	return api
		.jscodeshift( fileInfo.source )
		.find( api.jscodeshift.StringLiteral )
		.forEach( function onString( path ) {
			if ( path.value.name === '@stdlib/string-format' ) {
				api.jscodeshift( path )
					.replaceWith( api.jscodeshift.stringLiteral( '@stdlib/error-tools-fmtprodmsg' ) );
			}
		})
		.toSource();
}


// EXPORTS //

module.exports = transformer;