# SQLiteRest

This library allows developers to eliminate CRUD boilerplate in their code by:

- Creating RESTful APIs from SQLite DBs (the API is determined by the DB structure)
    - Generally follows the Postgrest design philosophy where appropriate for SQLite
    - **TODO** Resource embedding 
        - https://postgrest.org/en/latest/api.html#resource-embedding
        - via https://github.com/knex/knex-schema-inspector#foreign-keys

- Keeping the APIs up to date through the DBs
    - DB changes are reflected in the generated API + documentation
    - Minimal requirement for manually updating the code

- Creating OpenAPI / Swagger documentation describing the generated API
    - Client SDK generation via:
        - https://openapi-generator.tech/docs/generators
        - `openapi-generator-cli generate --skip-validate-spec -i openapi.json -g javascript -o sdk`

- **TODO** Creating a cURL performance test suite
    - https://noc.org/articles/using-curl-to-test-the-performance-of-a-website/

## [Roadmap](todo.md)

## How to use this

**TODO**

## Why

- Why not use a sqlite to GraphQL tool like `tuql`?
    - GraphQL cannot return blobs efficiently
    - GraphQL requires additional development tooling on the client side (vs the simplicity of REST)
    - Following Postgrest, it is GraphQL in style but maintains a degree of RESTness about it
    - [Other reasons where GraphQL may not be appropriate]()

- Are there any alternatives?
    - As of 2022-08-06
        - https://github.com/olsonpm/sqlite-to-rest
            - Generates a skeleton NodeJS Koa server
            - Con: does not provide a set of API docs
            - Con: updating your DB structure requires a new set of generated files / modification to the original set; meaning it's intended more as a "one-time-use" scaffolding tool
        - https://github.com/dreamfactorysoftware/dreamfactory
            - Does all of the required for SQLite with a full plugin system
            - Limited commercial license, paid
            - Meant to be a "no-code" platform, rather than catering to developers
            - OSS but with a Commercial revenue stream
        - https://github.com/bradleyboy/tuql
            - GraphQL but does not cleanly install on MacOS Monterrey yet
            - Uses Koa (not as popular as Express)
        - https://github.com/nocodb/nocodb
            - Tool is mainly aimed at non-coders
            - Pros / Cons: much more framework-like

## Used in these apps

- Coming soon...

## Sample / Tests

See the corresponding [`tests/`](tests/) and `samples/`(samples/) folder.

To run the included sample:

```
# Install all dependencies
yarn

# Run a sample ExpressJS server providing the Countries API
yarn run-sample-countries-api
```

These commands will start a local ExpressJS server and output its API documentation as `openapi.json`.  Consume this file with OpenAPI related tooling to add even more value to your project:

- Redoc: https://redocly.github.io/redoc/
- Postman
- Code generators for Server / Clients implementing this API

### Running the tests

```
# Run the test suite one time
yarn test

# Run the test suite in watch mode
yarn watch-test
```
### About `countries.sqlite3`

- Data source: https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes
- Flag image source: https://www.translatorscafe.com/cafe/ISO-3166-Country-Codes.htm
