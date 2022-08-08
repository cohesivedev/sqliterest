const { getDBInfo } = require('./helpers');

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

    for (const tableName of tableNames) {

        GET.createDocumentation(DOCS, tableColumns, tableName);

        API.get.push({
            matcher  : `/${tableName}`,
            handler  : await GET.createHandler(tableColumns, knex, tableName),
            responder: GET.responder,
        });            
    }

    return { API, knex, DOCS };
}

module.exports = getRESTFrom;