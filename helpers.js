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

module.exports = {
    getDBInfo,
    addClauseFromReservedKeywords,
    capitalize,
};