import { Kysely, SqliteDialect, sql } from 'kysely';
import Database from 'better-sqlite3';

let db;

function init(filename) {
    if(db) return db;

    const dialect = new SqliteDialect({ database: new Database(filename) });
    db = new Kysely({ dialect });

    return db;
}

function get() {
    return db;
}

export default {
    init,
    get,
    sql,
};