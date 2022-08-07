const { getDBInfo, capitalize } = require('./helpers');
const { SQLITE_TO_OPENAPI_FIELD_TYPE } = require('./constants');

const GET = require('./verb.get');

async function getRESTFrom({ filename, openapi_info = {
    title: `Unknown API`,
    version: '1.0.0',
} }) {
    const { tableColumns, tableNames, knex } = await getDBInfo(filename);

    // OpenAPI JSON
    const DOCS = {
        openapi: "3.0.0",
        info: openapi_info,
        paths: {},
        definitions: {
            Error400Response: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        example: 'A detailed error message for the attempted operation'
                    }
                }
            }
        }
    };

    const API = {
        'get'   : [],   // Read
        'post'  : [],   // Create
        'patch' : [],   // Update
        'put'   : [],   // Upsert
        'delete': []    // Delete
    };

    // Generate route matchers + handlers
    for (const tableName of tableNames) {
        const matcher = `/${tableName}`;

        DOCS.paths[matcher] = {};

        // GET documentation and route middleware

        const GetResponseDefName = `${capitalize(tableName)}GetResponse`;
        const GetResponseItemDefName = `${capitalize(tableName)}GetResponseItem`;

        DOCS.paths[matcher].get = {
            summary: `Get ${tableName}`,
            description: `Get all ${tableName} matching the query`,
            parameters: [],
            responses: {
                "200": {
                    description: 'OK',
                    content: {
                        'application/json': { schema: { $ref: `#/definitions/${GetResponseDefName}` } }
                    }
                },
                "400": {
                    description: 'ERROR',
                    content: {
                        'application/json': { schema: { $ref: '#/definitions/Error400Response' } }
                    }
                },
            }
        };

        DOCS.definitions[GetResponseDefName] = {
            type: 'array',
            items: { $ref: `#/definitions/${GetResponseItemDefName}` },
        };

        DOCS.definitions[GetResponseItemDefName] = {
            type: 'object',
            properties: {},
        };

        for (const columnName in tableColumns[tableName]) {
            const columnResponseSchema = {
                type: SQLITE_TO_OPENAPI_FIELD_TYPE[tableColumns[tableName][columnName].type],
                example: tableColumns[tableName][columnName].example,
            };

            // Don't show docs for querying a blob column
            if (columnResponseSchema.type === 'binary') {
                continue;
            }

            DOCS.definitions[GetResponseItemDefName].properties[columnName] = columnResponseSchema;

            const columnRequestSchema = {
                ...columnResponseSchema,
            };

            DOCS.paths[matcher].get.parameters.push({
                name: columnName,
                in: 'query',
                required: false,
                schema: columnRequestSchema,
            });
        }

        API.get.push({
            matcher,
            handler: await GET.createHandler(tableColumns, knex, tableName),
            responder: GET.responder,
        });            
    }

    return { API, knex, DOCS };
}

module.exports = getRESTFrom;