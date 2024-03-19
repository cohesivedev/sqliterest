import { RESERVED_KEYWORDS_POST } from '../../constants.mjs';
import { capitalize } from '../helpers.mjs';

import DB from '../db.mjs';
const { sql } = DB;

function filterKeys(keepKeys, obj) {
    const resultObj = {};

    for (const k of keepKeys) {
        resultObj[k] = obj[k];
    }

    return resultObj;
}

function addClauseFromReservedKeywords(dbQuery, query, keyword, body) {
    switch (keyword) {
        case 'columns':
            const keepColumns = query.columns.split(',');

            if (Array.isArray(body)) {
                body = body.map(filterKeys.bind(null, keepColumns));
            } else {
                body = filterKeys(keepColumns, body);
            }

            return body;
    }
}

async function createHandler(tableColumns, db, tableName, tableColumnsUnique) {
    const csvParser = (await import('neat-csv')).default;

    return async (c, next) => {
        const { req } = c;
        const query = req.query();

        const isUpsert = req.header('Prefer') === 'resolution=merge-duplicates';
        const isCSV = req.header('Content-Type') === 'text/csv';

        let processedBody = isCSV ? await csvParser(await req.text()) : await req.json();

        req.preparedResponse = {};

        try {
            // Defaults
            let dbQuery = db.insertInto(tableName);

            for (const key in query) {
                if (RESERVED_KEYWORDS_POST.includes(key)) {
                    processedBody = addClauseFromReservedKeywords(dbQuery, query, key, processedBody);
                    continue;
                }
            }

            dbQuery = dbQuery.values(processedBody);

            if (isUpsert) {
                // In case we need to merge everything, we have to build this expression
                const mergeConflictExpression = {};
                for (const col in tableColumns[tableName]) {
                    mergeConflictExpression[col] = sql`excluded.${sql.raw(col)}`;
                }

                dbQuery = dbQuery.onConflict(oc => oc
                    .doUpdateSet(mergeConflictExpression)
                );
            }


            const resBody = (await dbQuery.execute()).map(insertResult => Number(insertResult.insertId));

            req.preparedResponse = {
                contentType: 'application/json',
                body: resBody,
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
    const PostResponseDefName = `${tableNameCapitalized}PostResponse`;
    const PostResponseItemDefName = `${tableNameCapitalized}PosttResponseItem`;

    const docPath = docs.paths[matcher];

    docPath.post = {
        tags: [tableNameCapitalized],
        summary: `Create or update item(s) for ${tableName}`,
        description: `Insert or upsert item(s) for ${tableName}`,
        parameters: [],
        responses: {
            "200": {
                description: 'OK',
                content: { 'application/json': { schema: { $ref: `#/definitions/${PostResponseDefName}` } } }
            },
            "400": {
                description: 'ERROR',
                content: { 'application/json': { schema: { $ref: '#/definitions/Error400Response' } } }
            },
        }
    };

    docs.definitions[PostResponseDefName] = {
        type: 'array',
        items: { $ref: `#/definitions/${PostResponseItemDefName}` },
    };

    docs.definitions[PostResponseItemDefName] = {
        type: 'number',
        description: 'Internal row ID',
        example: 5,
    };

    const PostRequestItemName = `${tableNameCapitalized}PostRequestItem`;
    const exampleJSONBody = {};
    const schemaJSON = {};
    for (const [colName, colDetail] of Object.entries(tableColumns[tableName])) {
        schemaJSON[colName] = colDetail;
        exampleJSONBody[colName] = colDetail.example;
    }

    docs.definitions[PostRequestItemName] = {
        type: 'object',
        properties: schemaJSON,
    }

    const PostRequestCollectionName = `${tableNameCapitalized}PostRequestCollection`;
    docs.definitions[PostRequestCollectionName] = {
        type: 'array',
        items: { $ref: `#/definitions/${PostRequestItemName}` },
    };


    docPath.post.requestBody = {
        required: true,
        description: 'Payload to insert / upsert; this can be a single item or array of items',
        content: {
            'application/json': {
                schema: {
                    oneOf: [
                        { $ref: `#/definitions/${PostRequestItemName}` },
                        { $ref: `#/definitions/${PostRequestCollectionName}` }
                    ]
                },
                example: exampleJSONBody,
            }
        }
    };

    docPath.post.parameters = docPath.post.parameters.concat([
        {
            name: 'columns',
            in: 'query',
            required: false,
            schema: {
                type: 'string',
                description: 'Specify the keys of the request body that will be inserted and ignore the rest',
                example: Object.keys(tableColumns[tableName]).join(','),
            },
        },
        {
            name: 'Content-Type',
            in: 'header',
            required: false,
            schema: {
                type: 'string',
                description: 'Specify the format of the request payload; use either<br>`application/json` OR `text/csv`',
                example: 'application/json',
            },
        },
        {
            name: 'Prefer',
            in: 'header',
            required: false,
            schema: {
                type: 'string',
                description: 'You can upsert items into the table by sending this header. Upserts always merge duplicates.',
                example: 'resolution=merge-duplicates',
            },
        },
    ]);


}

export default {
    createHandler,
    createDocumentation,
};