const { getDBInfo, addClauseFromReservedKeywords, capitalize } = require('./helpers');
const { RESERVED_KEYWORDS, OPERATORS_WHERE, CHARACTER_REGEX, SQLITE_TO_OPENAPI_FIELD_TYPE } = require('./constants');

async function getRESTFrom({ filename, openapi_info = {
    title: `Unknown API`,
    version: '1.0.0',
} }) {
    const { tableColumns, tableNames, knex } = await getDBInfo(filename);

    const { fileTypeFromBuffer } = await import('file-type');

    // OpenAPI JSON
    const DOCS = {
        openapi: "3.0.0",
        info: openapi_info,
        paths: {},
        produces: ['application/json'],
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
        'get': [],    // Read
        'post': [],   // Create
        'patch': [],  // Update
        'delete': []  // Delete
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

            DOCS.definitions[GetResponseItemDefName].properties[columnName] = columnResponseSchema;

            // Should not query for binary column
            if (columnResponseSchema.type === 'binary') {
                continue;
            }

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
            handler: async (req, res) => {
                const { query } = req;

                try {
                    // Defaults
                    let dbQuery = knex.table(tableName)
                        .limit(10);

                    for (const key in query) {
                        if (RESERVED_KEYWORDS.includes(key)) {
                            addClauseFromReservedKeywords(dbQuery, query, key);
                        } else {
                            const columnInfo = tableColumns[tableName][key];

                            // Don't allow queries on blobs
                            if (columnInfo && columnInfo.type === 'blob') continue;

                            let whereQueryTemplate = `${key} = ?`;
                            let whereValue = query[key];

                            Object.keys(OPERATORS_WHERE).forEach(operator => {
                                if (query[key].includes(operator)) {
                                    whereQueryTemplate = `${key} ${OPERATORS_WHERE[operator]} ?`;
                                    whereValue = whereValue.replace(operator, '');

                                    if (operator === 'like.') {
                                        whereValue = decodeURIComponent(whereValue);
                                        whereValue = whereValue.replace(CHARACTER_REGEX.ASTERISK, `%`);
                                        whereValue = whereValue.replace(CHARACTER_REGEX.DOUBLE_QUOTE, '');

                                    } else if (operator === 'in.') {
                                        whereValue = decodeURIComponent(whereValue);
                                        whereValue = whereValue.substring(1, whereValue.length - 1); // Strip off the parentheses
                                        whereValue = JSON.parse(`[${whereValue}]`);
                                        whereQueryTemplate = `${key} IN (${whereValue.map(() => '?').join(',')})`;
                                    } else if (operator === 'is.') {
                                        const whereValueLowerCase = whereValue.toLowerCase();

                                        if (whereValueLowerCase === 'null') {
                                            whereValue = null;
                                        } else if (whereValueLowerCase === 'false') {
                                            whereValue = false;
                                        } else if (whereValueLowerCase === 'true') {
                                            whereValue = true;
                                        }
                                    }
                                }
                            });
                            dbQuery = dbQuery.whereRaw(whereQueryTemplate, whereValue);
                        }
                    }

                    // console.log(dbQuery.toString());

                    const resBody = await dbQuery;

                    // Return the raw blob if there's only one result
                    if (resBody.length === 1 && Object.keys(resBody[0]).length === 1 && Buffer.isBuffer(Object.values(resBody[0])[0])) {
                        const contentType = await fileTypeFromBuffer(Object.values(resBody[0])[0].slice(0, 64));
                        res.contentType(contentType ? contentType.mime : 'application/octet-stream');
                        res.send(Object.values(resBody[0])[0]);
                    } else {
                        res.json(resBody);
                    }
                } catch (e) {
                    // console.trace(e);
                    res.status(400).json({ error: e.message });
                }
            }
        });
    }

    return { API, knex, DOCS };
}

module.exports = getRESTFrom;