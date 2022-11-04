const { capitalize } = require('../helpers');

async function createHandler(tableColumns, knex, tableName, tableColumnsUnique, tablePrimaryKeys) {
    return async (req, res, next) => {
        const { query, body } = req;

        req.preparedResponse = {};

        try {
            if (Array.isArray(body)) {
                throw `PUT is only available for singular upserts!`;
            }

            if (Object.keys(query).length === 0) {
                throw `Cannot update "${tableName}" item without specifying primary key!`;
            }

            const primaryKey = tablePrimaryKeys[tableName];

            if (typeof query[primaryKey] === 'undefined') {
                throw 'PUT requires the primary key value to use for upsert operation';
            }

            let dbQuery = knex.table(tableName);

            dbQuery = dbQuery
                .update(body)
                .where(
                    primaryKey,
                    decodeURIComponent(query[primaryKey].replace('eq.', ''))
                );

            // console.log(dbQuery.toString());

            let resBody = await dbQuery;

            // If it was meant to be an insert then do this instead
            if (resBody === 0) {
                resBody = (await knex.table(tableName)
                    .insert(body)
                    .onConflict(tableColumnsUnique[tableName])
                    .merge())[0];
            }

            req.preparedResponse = {
                contentType: 'application/json',
                body: resBody,
            };

        } catch (e) {
            console.trace(e);

            req.preparedResponse = {
                contentType: 'application/json',
                statusCode: 400,
                body: { error: e.message || e }
            };
        }

        next();
    }
}

function createDocumentation(docs, tableColumns, tableName, tablePrimaryKeys) {
    const matcher = `/${tableName}`;
    docs.paths[matcher] = docs.paths[matcher] || {};

    const tableNameCapitalized = capitalize(tableName);
    const PutResponseDefName = `${tableNameCapitalized}PutResponse`;

    const docPath = docs.paths[matcher];

    docPath.put = {
        tags: [tableNameCapitalized],
        summary: `Upsert item for ${tableName}`,
        description: `Update or insert an individual item for ${tableName}`,
        parameters: [],
        responses: {
            "200": {
                description: 'OK',
                content: { 'application/json': { schema: { $ref: `#/definitions/${PutResponseDefName}` } } }
            },
            "400": {
                description: 'ERROR',
                content: { 'application/json': { schema: { $ref: '#/definitions/Error400Response' } } }
            },
        }
    };

    docs.definitions[PutResponseDefName] = {
        type: 'number',
        description: 'Internal row ID',
        example: 5,
    };

    const PutRequestName = `${tableNameCapitalized}PutRequest`;
    const exampleJSONBody = {};
    const schemaJSON = {};
    for (const [colName, colDetail] of Object.entries(tableColumns[tableName])) {
        schemaJSON[colName] = colDetail;
        exampleJSONBody[colName] = colDetail.example;
    }

    docs.definitions[PutRequestName] = {
        type: 'object',
        properties: schemaJSON,
    }

    docPath.put.requestBody = {
        required: true,
        description: 'Payload for an individual item to insert / upsert',
        content: {
            'application/json': {
                schema: { $ref: `#/definitions/${PutRequestName}` },
                example: exampleJSONBody,
            }
        }
    };

    docPath.put.parameters = docPath.put.parameters.concat([
        {
            name: tablePrimaryKeys[tableName],
            in: 'query',
            required: true,
            schema: {
                type: 'string',
                description: 'Primary key value used to find and upsert the item',
                example: 'eq.' + tableColumns[tableName][tablePrimaryKeys[tableName]].example,
            },
        },
    ]);

}

module.exports = {
    createHandler,
    createDocumentation,
};