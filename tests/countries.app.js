const {execSync} = require('child_process');
const express = require('express');
const getRESTFrom = require('../getRESTFrom');
const path = require('path');

async function getCountriesApp() {
    const app = express();

    // Ensure we keep a master copy free of changes from tests
    execSync('rm countries.copy.sqlite3 ; cp countries.sqlite3 countries.copy.sqlite3');

    const filename = path.resolve('./countries.copy.sqlite3');

    const { DOCS, API, knex } = await getRESTFrom({
        filename,
        openapi_info: {
            title: 'Countries API',
            version: '0.5.0',
        }
    });

    for (const method in API) {
        for (const { matcher, handler, responder } of API[method]) {
            app[method](matcher, handler, responder);
        }
    }

    return { app, knex, DOCS };
}

module.exports = getCountriesApp;