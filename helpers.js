const KNEX = require('knex');

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

async function getDBInfo(filename) {
    const knex = KNEX({
        client: 'better-sqlite3',
        useNullAsDefault: true,
        connection: { filename }
    });

    // Used to generate documentation
    const tableColumns = {};
    const tableNames = await knex.table('sqlite_master').pluck('name').where('type', 'table');

    for (const tName of tableNames) {
        tableColumns[tName] = {};
        const firstRow = await knex(tName).first();
        const columns = await knex.table(tName).columnInfo();
        for (const c in columns) {
            let example = firstRow[c];

            if(Buffer.isBuffer(example)) {
                example = '<binary data>';
            }

            // todo: throw error if column is a reserved term (like "limit")
            tableColumns[tName][c] = {
                type: columns[c].type,
                example,
            };
        }
    }

    return { tableColumns, tableNames, knex };
}

function responder(req, res) {
    const { preparedResponse } = req;

    if (preparedResponse.statusCode) {
        res.status(preparedResponse.statusCode);
    }

    switch (preparedResponse.contentType) {
        case 'application/json':
            res.json(req.preparedResponse.body);
            break;
        default:
            res.contentType(preparedResponse.contentType);
            res.send(req.preparedResponse.body);
    }
}

module.exports = {
    responder,
    getDBInfo,
    capitalize,
};