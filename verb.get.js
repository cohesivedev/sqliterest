const { RESERVED_KEYWORDS, OPERATORS_WHERE, CHARACTER_REGEX } = require('./constants');

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

async function createHandler(tableColumns, knex, tableName) {
    const { fileTypeFromBuffer } = await import('file-type');

    return async (req, res, next) => {
        const { query } = req;

        req.preparedResponse = {};

        try {
            // Defaults
            let dbQuery = knex.table(tableName)
                .limit(10);

            for (const key in query) {
                if (RESERVED_KEYWORDS.includes(key)) {
                    addClauseFromReservedKeywords(dbQuery, query, key);
                } else {
                    const columnInfo = tableColumns[tableName][key];

                    // Don't allow queries on blobs
                    if (columnInfo && columnInfo.type === 'blob') continue;

                    let whereQueryTemplate = `${key} = ?`;
                    let whereValue = query[key];

                    Object.keys(OPERATORS_WHERE).forEach(operator => {
                        if (query[key].includes(operator)) {
                            whereQueryTemplate = `${key} ${OPERATORS_WHERE[operator]} ?`;
                            whereValue = whereValue.replace(operator, '');

                            if (operator === 'like.') {
                                whereValue = decodeURIComponent(whereValue);
                                whereValue = whereValue.replace(CHARACTER_REGEX.ASTERISK, `%`);
                                whereValue = whereValue.replace(CHARACTER_REGEX.DOUBLE_QUOTE, '');

                            } else if (operator === 'in.') {
                                whereValue = decodeURIComponent(whereValue);
                                whereValue = whereValue.substring(1, whereValue.length - 1); // Strip off the parentheses
                                whereValue = JSON.parse(`[${whereValue}]`);
                                whereQueryTemplate = `${key} IN (${whereValue.map(() => '?').join(',')})`;
                            } else if (operator === 'is.') {
                                const whereValueLowerCase = whereValue.toLowerCase();

                                if (whereValueLowerCase === 'null') {
                                    whereValue = null;
                                } else if (whereValueLowerCase === 'false') {
                                    whereValue = false;
                                } else if (whereValueLowerCase === 'true') {
                                    whereValue = true;
                                }
                            }
                        }
                    });
                    dbQuery = dbQuery.whereRaw(whereQueryTemplate, whereValue);
                }
            }

            // console.log(dbQuery.toString());

            const resBody = await dbQuery;

            // Return the raw blob if there's only one result
            if (resBody.length === 1 && Object.keys(resBody[0]).length === 1 && Buffer.isBuffer(Object.values(resBody[0])[0])) {
                const foundContentType = await fileTypeFromBuffer(Object.values(resBody[0])[0].slice(0, 64));

                req.preparedResponse = {
                    contentType: foundContentType ? foundContentType.mime : 'application/octet-stream',
                    body: Object.values(resBody[0])[0]
                };
            } else {
                req.preparedResponse = {
                    contentType: 'application/json',
                    body: resBody,
                };
            }
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
    // Executes the query
    createHandler,
    // Default responder using query result
    responder,
};