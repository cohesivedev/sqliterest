const { SQLITE_TO_OPENAPI_FIELD_TYPE, OPERATORS_WHERE, CHARACTER_REGEX } = require('../constants');
const { capitalize } = require('../helpers');

async function createHandler(tableColumns, knex, tableName) {

    return async (req, res, next) => {
        const { query } = req;

        req.preparedResponse = {};

        try {
            let dbQuery = knex.table(tableName);

            if (Object.keys(query).length === 0) {
                throw new Error('No deletion parameters provided; total table deletion will not occur');
            }

            for (const key in query) {
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

            dbQuery = dbQuery.del();

            const resBody = await dbQuery;

            req.preparedResponse = {
                contentType: 'application/json',
                body: {},
            };
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
    const DeleteResponseDefName = `${tableNameCapitalized}DeleteResponse`;

    const docPath = docs.paths[matcher];

    docPath.delete = {
        tags: [tableNameCapitalized],
        summary: `Delete ${tableName}`,
        description: `Delete all ${tableName} matching the query`,
        parameters: [],
        responses: {
            "200": {
                description: 'OK',
                content: { 'application/json': { schema: { $ref: `#/definitions/${DeleteResponseDefName}` } } }
            },
            "400": {
                description: 'ERROR',
                content: { 'application/json': { schema: { $ref: '#/definitions/Error400Response' } } }
            },
        }
    };

    docs.definitions[DeleteResponseDefName] = {
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

        const columnRequestSchema = {
            ...columnResponseSchema,
        };

        docPath.delete.parameters.push({
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