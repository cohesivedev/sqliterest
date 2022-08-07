# SQLiteRest

- Creates a RESTful API from a SQLite DB (the API is determined by the DB structure)
    - Generally follows the Postgrest design philosophy where appropriate for SQLite
    - Resource embedding 
        - https://postgrest.org/en/latest/api.html#resource-embedding
        - via https://github.com/knex/knex-schema-inspector#foreign-keys

- Creates an OpenAPI / Swagger document describing the generated API
    - https://stackoverflow.com/a/71413249/7216921
    - Client SDK generation via:
        - https://openapi-generator.tech/docs/generators
        - `openapi-generator-cli generate --skip-validate-spec -i openapi.json -g javascript -o sdk`

- Creates test suite (using cURL)
    - Performance test
        - https://noc.org/articles/using-curl-to-test-the-performance-of-a-website/
    - Snapshot tests
        - Save output and use Git itself as the diffing tool to determine if snapshot matches or not!

## How to use this

To run the included sample:

```
yarn
yarn run-sample-countries-api
```

It will create a local ExpressJS server on port 3000 and output its API documentation as the file `openapi.json`, which you can then consume with a variety of OpenAPI related tooling:

- Redoc: https://redocly.github.io/redoc/
- Postman
- SDK generators / Server generators

## Tests

```
# Run the test suite one time
yarn test

# Run the test suite in watch mode
yarn watch-test
```

## Why

- Why not use a sqlite to GraphQL tool like `tuql`?
    - GraphQL cannot return blobs efficiently
    - GraphQL requires additional development tooling on the client side (vs the simplicity of REST)
    - Following Postgrest, it is GraphQL in style but maintains a degree of RESTness about it

- Are there any alternatives?
    - As of 2022-08-06
        - https://github.com/olsonpm/sqlite-to-rest
            - Generates a skeleton NodeJS Koa server
            - Con: does not provide a set of API docs
        - https://github.com/dreamfactorysoftware/dreamfactory
            - Does all of the required for SQLite with a full plugin system
            - Limited commercial license, paid
            - Meant to be a "no-code" platform, rather than catering to developers
            - OSS but with a Commercial revenue stream
        - https://github.com/bradleyboy/tuql
            - GraphQL but does not cleanly install on MacOS Monterrey yet
            - Uses Koa (not as popular as Express)
        - https://github.com/nocodb/nocodb
            - 

## Sample / Tests

See the corresponding `tests/` and `samples/` folder.

```
CREATE TABLE "countries" (
    "iso3166alpha2" varchar NOT NULL, 
    "iso3166alpha3" varchar NOT NULL, 
    "name" text, 
    "official_name" text, 
    "sovereignty" varchar, 
    "numeric" integer, 
    "tld" varchar, 
    PRIMARY KEY ("iso3166alpha2")
    FOREIGN KEY("sovereignty") REFERENCES sovereignties(name) 
);
```
- Data source: https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes
- Flag image source: https://www.translatorscafe.com/cafe/ISO-3166-Country-Codes.htm
