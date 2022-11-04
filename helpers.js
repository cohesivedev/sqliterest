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

    // From https://stackoverflow.com/a/53629321/7216921
    const tableUniqueColumns = await knex.raw(`
    SELECT DISTINCT m.name as table_name, ii.name as column_name
    FROM sqlite_master AS m,
        pragma_index_list(m.name) AS il,
        pragma_index_info(il.name) AS ii
    WHERE m.type='table' AND il.[unique] = 1`);

    function getIsUnique(table_name, column_name) {
        return tableUniqueColumns.some(r => r.table_name === table_name && r.column_name === column_name);
    }

    const tableColumnsUnique = {};

    for (const tName of tableNames) {
        tableColumnsUnique[tName] = [];
        tableColumns[tName] = {};
        const firstRow = await knex(tName).first();
        const columns = await knex.table(tName).columnInfo();
        for (const c in columns) {
            let example = firstRow[c];

            if (Buffer.isBuffer(example)) {
                example = '<binary data>';
            }

            const isUnique = getIsUnique(tName, c);

            // todo: throw error if column is a reserved term (like "limit")
            tableColumns[tName][c] = {
                type: columns[c].type,
                isUnique,
                example,
            };

            if(isUnique) tableColumnsUnique[tName].push(c);
        }
    }

    return { tableColumns, tableNames, knex, tableColumnsUnique };
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