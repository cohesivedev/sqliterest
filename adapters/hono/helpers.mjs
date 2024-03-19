
import DB from './db.mjs';

export const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

export async function getDBInfo(filename) {
    const db = DB.init(filename);

    // Used to generate documentation
    const tableColumns = {};
    const tableNames = (
        await db.selectFrom('sqlite_master')
            .select('name')
            .where('type', '=', 'table')
            // Skip the internal table created by SQLite
            // https://www.sqlite.org/autoinc.html#the_autoincrement_keyword
            .where('name', '!=', 'sqlite_sequence')
            .execute()
    ).map(t => t.name);

    // From https://stackoverflow.com/a/53629321/7216921
    const tableUniqueColumns = (await DB.sql`
    SELECT DISTINCT m.name as table_name, ii.name as column_name
    FROM sqlite_master AS m,
    pragma_index_list(m.name) AS il,
    pragma_index_info(il.name) AS ii
    WHERE m.type='table' AND il.[unique] = 1`.execute(db)).rows;


    function getIsUnique(table_name, column_name) {
        return tableUniqueColumns.some(r => r.table_name === table_name && r.column_name === column_name);
    }

    const tableColumnsUnique = {};
    const tablePrimaryKeys = {};

    for (const tName of tableNames) {
        const foundPKNames = await DB.sql`SELECT name FROM ${DB.sql.raw(`pragma_table_info('${tName}')`)} where pk`.execute(db);
        const primaryKey = foundPKNames.rows[0].name;
        tablePrimaryKeys[tName] = primaryKey;

        tableColumnsUnique[tName] = [];
        tableColumns[tName] = {};
        const firstRow = await db.selectFrom(tName).selectAll().executeTakeFirst();
        const columns = (await db.introspection.getTables()).find(t => t.name === tName).columns;

        for (const c of columns) {
            const { name, dataType } = c;
            let example = firstRow[name];

            if (Buffer.isBuffer(example)) {
                example = '<binary data>';
            }

            const isUnique = getIsUnique(tName, name);

            // todo: throw error if column is a reserved term (like "limit")
            tableColumns[tName][name] = {
                type: dataType,
                isUnique,
                isPrimaryKey: primaryKey === name,
                example,
            };

            if (isUnique) tableColumnsUnique[tName].push(name);
        }
    }

    return { tableColumns, tableNames, db, tableColumnsUnique, tablePrimaryKeys };
}

// Middleware that finally responds to the client request
// This is different to a handler which only prepares the response data (e.g. verbs)
export function responder(c) {
    const { req } = c;
    const { preparedResponse } = req;

    if (preparedResponse.statusCode) {
        c.status(preparedResponse.statusCode);
    }

    switch (preparedResponse.contentType) {
        case 'application/json':
            return c.json(req.preparedResponse.body);
        default:
            c.header('Content-Type', preparedResponse.contentType)
            return c.body(req.preparedResponse.body);
    }
}
