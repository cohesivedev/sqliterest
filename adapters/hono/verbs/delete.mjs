import { SQLITE_TO_OPENAPI_FIELD_TYPE, OPERATORS_WHERE, CHARACTER_REGEX } from '../../constants.mjs';
import { capitalize } from '../helpers.mjs';

async function createHandler(tableColumns, db, tableName) {
    return async (c, next) => {
        const { req } = c;
        const query = { ...req.query(), ...req.queryOverrides };

        req.preparedResponse = {};

        try {
            if (Object.keys(query).length === 0) {
                throw new Error('No deletion parameters provided; total table deletion will not occur');
            }

            let dbQuery = db.deleteFrom(tableName);

            for (const key in query) {
                let whereValue = query[key];
                let whereOperator = '=';

                Object.keys(OPERATORS_WHERE).some(operator => {
                    if (query[key].includes(operator)) {
                        whereValue = whereValue.replace(operator, '');

                        if (operator === 'like.') {
                            whereValue = decodeURIComponent(whereValue);
                            whereValue = whereValue.replace(CHARACTER_REGEX.ASTERISK, `%`);
                            whereValue = whereValue.replace(CHARACTER_REGEX.DOUBLE_QUOTE, '');

                        } else if (operator === 'in.') {
                            whereValue = decodeURIComponent(whereValue);
                            whereValue = whereValue.substring(1, whereValue.length - 1); // Strip off the parentheses
                            whereValue = JSON.parse(`[${whereValue}]`);

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
                        whereOperator = OPERATORS_WHERE[operator];

                        return true;
                    }
                });

                dbQuery = dbQuery.where(key, whereOperator, whereValue);
            }

            await dbQuery.execute();

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

export default {
    createHandler,
    createDocumentation,
};