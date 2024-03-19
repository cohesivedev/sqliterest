function linesToArray(lines) {
    return lines.split('\n').filter(Boolean).map(line => line.toLowerCase().trim());
}

const RESERVED_KEYWORDS = linesToArray(`
select
limit
offset
order
`);

// https://postgrest.org/en/v12/references/api/tables_views.html#specifying-columns
// By using the columns query parameter it’s possible to specify the payload keys that will be inserted and ignore the rest of the payload.
const RESERVED_KEYWORDS_POST = linesToArray(`
columns
`);

// TODO: logical operators
const OPERATORS_WHERE = {
    'eq.': '=',
    'neq.': '!=',
    'gt.': '>',
    'gte.': '>=',
    'lt.': '<',
    'lte.': '<=',
    'like.': 'LIKE',
    'in.': 'IN',
    'is.': 'IS',
    'or.': 'OR',
};

const CHARACTER_REGEX = {
    ASTERISK: new RegExp('\\*', 'g'),
    DOUBLE_QUOTE: new RegExp('"', 'g'),
}

const SQLITE_TO_OPENAPI_FIELD_TYPE = {
    'varchar': 'string',
    'text': 'string',
    'integer': 'integer',
    'blob': 'binary'
};

const SQLITE_FIELD_TO_OPENAPI_DESCRIPTION = {
    'varchar': 'short string',
    'text': 'long string',
    'integer': 'integer'
};


module.exports = {
    RESERVED_KEYWORDS,
    RESERVED_KEYWORDS_POST,
    OPERATORS_WHERE,
    CHARACTER_REGEX,
    SQLITE_TO_OPENAPI_FIELD_TYPE,
    SQLITE_FIELD_TO_OPENAPI_DESCRIPTION,
};