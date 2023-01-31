<!--

@license Apache-2.0

Copyright (c) 2021 The Stdlib Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

-->

# Transform Error Messages

> A GitHub action to transform full-length error messages to shortened error messages for production.

## Example Workflow

```yml
name: transform_errors

# Workflow triggers:
on:
  workflow_dispatch:
  push:

# Workflow jobs:
jobs:
  transform:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          repository: 'stdlib-js/string-snakecase'
          ref: main
      - name: Create new `error` branch
        run: |
          git checkout -b error
      - name: Transform Error Messages
        id: transform-error-messages
        uses: stdlib-js/transform-errors-action@main
      - name: Change `@stdlib/string-format` to `@stdlib/error-tools-fmtprodmsg` in package.json if the former is a dependency, otherwise insert it as a dependency
        run: |
          if grep -q '"@stdlib/string-format"' package.json; then
            sed -i "s/\"@stdlib\/string-format\"/\"@stdlib\/error-tools-fmtprodmsg\"/g" package.json
          else
            sed -i "s/\"dependencies\": {/\"dependencies\": {\\n    \"@stdlib\/error-tools-fmtprodmsg\": \"^0.0.x\"/g" package.json
          fi
      - name: Configure git
        run: |
          git config --local user.email "noreply@stdlib.io"
          git config --local user.name "stdlib-bot"
      - name: Commit changes
        run: |
          git add -A
          git commit -m "Auto-generated commit"
      - name: Push changes
        run: |
          SLUG=${{ github.repository }}
          echo "Pushing changes to $SLUG..."
          git push "https://$GITHUB_ACTOR:$GITHUB_TOKEN@github.com/$SLUG.git" error --force
```

## License

See [LICENSE][stdlib-license].


## Copyright

Copyright &copy; 2022-2023. The Stdlib [Authors][stdlib-authors].

<!-- Section for all links. Make sure to keep an empty line after the `section` element and another before the `/section` close. -->

<section class="links">

[stdlib]: https://github.com/stdlib-js/stdlib

[stdlib-authors]: https://github.com/stdlib-js/stdlib/graphs/contributors

[stdlib-license]: https://raw.githubusercontent.com/stdlib-js/check-markdown-src-action/main/LICENSE

</section>

<!-- /.links -->
