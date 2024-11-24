const { getDBInfo, responder } = require('./helpers');

const GET = require('./verbs/get');
const DELETE = require('./verbs/delete');
const POST = require('./verbs/post');
const PUT = require('./verbs/put');

async function getRESTFrom({
    filename,
    openapi_info, /* https://github.com/OAI/OpenAPI-Specification/blob/main/examples/v3.0/api-with-examples.json#L3 */
}) {
    const { 
        knex,
        tableColumnsUnique,
        tableColumns, 
        tableNames, 
        tablePrimaryKeys, 
    } = await getDBInfo(filename);

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
        'get': [],      // Read
        'post': [],     // Create / Upsert
        'patch': [],    // Update Single
        'put': [],      // Upsert Single
        'delete': []    // Delete
    };

    for (const tableName of tableNames) {
        API.get.push({
            tableName,
            matcher: `/${tableName}`,
            handler: await GET.createHandler(tableColumns, knex, tableName),
            responder,
        });
        GET.createDocumentation(DOCS, tableColumns, tableName);
        
        API.delete.push({
            tableName,
            matcher: `/${tableName}`,
            handler: await DELETE.createHandler(tableColumns, knex, tableName),
            responder,
        });
        DELETE.createDocumentation(DOCS, tableColumns, tableName);
        
        API.post.push({
            tableName,
            matcher: `/${tableName}`,
            handler: await POST.createHandler(tableColumns, knex, tableName, tableColumnsUnique),
            responder,
        });
        POST.createDocumentation(DOCS, tableColumns, tableName);
        
        API.put.push({
            tableName,
            matcher: `/${tableName}`,
            handler: await PUT.createHandler(tableColumns, knex, tableName, tableColumnsUnique, tablePrimaryKeys),
            responder,
        });
        PUT.createDocumentation(DOCS, tableColumns, tableName, tablePrimaryKeys);
    }

    return { API, knex, DOCS };
}

module.exports = getRESTFrom;
