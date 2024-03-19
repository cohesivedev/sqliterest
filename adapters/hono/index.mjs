
import { getDBInfo, responder } from './helpers.mjs';

import GET from './verbs/get.mjs';
import DELETE from './verbs/delete.mjs';
import POST from './verbs/post.mjs';
import PUT from './verbs/put.mjs';

export default async function getRESTFrom({
    filename,
    openapi_info, /* https://github.com/OAI/OpenAPI-Specification/blob/main/examples/v3.0/api-with-examples.json#L3 */
}) {
    const {
        db,
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
            matcher: `/${tableName}`,
            handler: await GET.createHandler(tableColumns, db, tableName),
            responder,
        });
        GET.createDocumentation(DOCS, tableColumns, tableName);

        API.delete.push({
            matcher: `/${tableName}`,
            handler: await DELETE.createHandler(tableColumns, db, tableName),
            responder,
        });
        DELETE.createDocumentation(DOCS, tableColumns, tableName);

        API.post.push({
            matcher: `/${tableName}`,
            handler: await POST.createHandler(tableColumns, db, tableName, tableColumnsUnique),
            responder,
        });
        POST.createDocumentation(DOCS, tableColumns, tableName);

        API.put.push({
            matcher: `/${tableName}`,
            handler: await PUT.createHandler(tableColumns, db, tableName, tableColumnsUnique, tablePrimaryKeys),
            responder,
        });
        PUT.createDocumentation(DOCS, tableColumns, tableName, tablePrimaryKeys);
    }

    return { API, db, DOCS };
}
