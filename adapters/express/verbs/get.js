const { SQLITE_TO_OPENAPI_FIELD_TYPE, RESERVED_KEYWORDS, OPERATORS_WHERE, CHARACTER_REGEX } = require('../constants');
const { capitalize } = require('../helpers');

function addClauseFromReservedKeywords(dbQuery, query, keyword) {
    switch (keyword) {
        case 'select':
            dbQuery = dbQuery.select(query.select.split(','));
            break;
        case 'offset':
            dbQuery = dbQuery.offset(query.offset);
            break;
        case 'limit':
            dbQuery = dbQuery.limit(query.limit);
            break;
        case 'order':
            query.order.split(',').forEach(orderByString => {
                const [column, direction] = orderByString.split('.');
                dbQuery = dbQuery.orderBy(column, direction);
            });
            break;
    }
}

async function createHandler(tableColumns, knex, tableName) {
    const { fileTypeFromBuffer } = await import('file-type');

    return async (req, res, next) => {
        let { query } = req;
        query = { ...query, ...req.queryOverrides };

        req.preparedResponse = {};

        try {
            // Defaults
            let dbQuery = knex.table(tableName)
                .limit(10);

            for (const key in query) {
                if (RESERVED_KEYWORDS.includes(key)) {
                    addClauseFromReservedKeywords(dbQuery, query, key);
                    continue;
                }

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

            // console.log(dbQuery.toString());

            const resBody = await dbQuery;

            // Return the raw blob if there's only one result
            if (resBody.length === 1 && Object.keys(resBody[0]).length === 1 && Buffer.isBuffer(Object.values(resBody[0])[0])) {
                const foundContentType = await fileTypeFromBuffer(Object.values(resBody[0])[0].slice(0, 64));

                req.preparedResponse = {
                    contentType: foundContentType ? foundContentType.mime : 'application/octet-stream',
                    body: Object.values(resBody[0])[0]
                };
            } else {
                req.preparedResponse = {
                    contentType: 'application/json',
                    body: resBody,
                };
            }
        } catch (e) {
            // console.trace(e);

            req.preparedResponse = {
                contentType: 'application/json',
                statusCode: 400,
                body: { error: e.message }
            };
        }

        next();
    }
}

function createDocumentation(docs, tableColumns, tableName) {
    const matcher = `/${tableName}`;
    docs.paths[matcher] = docs.paths[matcher] || {};

    const tableNameCapitalized = capitalize(tableName);
    const GetResponseDefName = `${tableNameCapitalized}GetResponse`;
    const GetResponseItemDefName = `${tableNameCapitalized}GetResponseItem`;

    const docPath = docs.paths[matcher];

    docPath.get = {
        tags: [tableNameCapitalized],
        summary: `Get ${tableName}`,
        description: `Get all ${tableName} matching the query`,
        parameters: [],
        responses: {
            "200": {
                description: 'OK',
                content: { 'application/json': { schema: { $ref: `#/definitions/${GetResponseDefName}` } } }
            },
            "400": {
                description: 'ERROR',
                content: { 'application/json': { schema: { $ref: '#/definitions/Error400Response' } } }
            },
        }
    };

    docs.definitions[GetResponseDefName] = {
        type: 'array',
        items: { $ref: `#/definitions/${GetResponseItemDefName}` },
    };

    docs.definitions[GetResponseItemDefName] = {
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

        docs.definitions[GetResponseItemDefName].properties[columnName] = columnResponseSchema;

        const columnRequestSchema = {
            ...columnResponseSchema,
        };

        docPath.get.parameters.push({
            name: columnName,
            in: 'query',
            required: false,
            schema: columnRequestSchema,
        });
    }
}

module.exports = {
    createHandler,
    createDocumentation,
};