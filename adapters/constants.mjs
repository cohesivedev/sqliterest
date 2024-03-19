function linesToArray(lines) {
    return lines.split('\n').filter(Boolean).map(line => line.toLowerCase().trim());
}

export const RESERVED_KEYWORDS = linesToArray(`
select
limit
offset
order
`);

export const RESERVED_KEYWORDS_POST = linesToArray(`
columns
`);

// TODO: logical operators
export const OPERATORS_WHERE = {
    'eq.': '=',
    'neq.': '!=',
    'gt.': '>',
    'gte.': '>=',
    'lt.': '<',
    'lte.': '<=',
    'like.': 'like',
    'in.': 'in',
    'is.': 'is',

    'or.': 'or',
};

export const CHARACTER_REGEX = {
    ASTERISK: new RegExp('\\*', 'g'),
    DOUBLE_QUOTE: new RegExp('"', 'g'),
}

export const SQLITE_TO_OPENAPI_FIELD_TYPE = {
    'varchar': 'string',
    'text': 'string',
    'integer': 'integer',
    'blob': 'binary'
};

export const SQLITE_FIELD_TO_OPENAPI_DESCRIPTION = {
    'varchar': 'short string',
    'text': 'long string',
    'integer': 'integer'
};
