const { execSync } = require('child_process');
const express = require('express');
const getRESTFrom = require('../adapters/express');
const path = require('path');

async function getCountriesApp() {
    const app = express();

    app.use(express.text({type:'text/csv'}));
    app.use(express.json());

    // Ensure we keep a master copy free of changes from tests
    execSync('rm countries.copy.express.sqlite3 ; cp countries.sqlite3 countries.copy.express.sqlite3');

    const filename = path.resolve('./countries.copy.express.sqlite3');

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

    // Redoc page to present corresponding OpenAPI spec

    app.get('/openapi.json', (req, res) => {
        res.sendFile('openapi.json', { root: '.' });
    });

    app.get('/', (req, res) => {
        res.type('html').send(`
        <html>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        <body style="margin:0; padding:0">
        <div id="redoc"></div>
        <script>
            Redoc.init('/openapi.json', {}, document.getElementById('redoc'));
        </script>
        </body>
        </html>
        `)
    });

    return { app, knex, DOCS };
}

module.exports = getCountriesApp;