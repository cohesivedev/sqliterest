import { execSync } from 'child_process';
import path from 'path';
import { Hono } from 'hono'
import getRESTFrom from '../adapters/hono/index.mjs';
import { readFile } from 'fs/promises';


export default async function getCountriesApp() {
    const app = new Hono();

    // Ensure we keep a master copy free of changes from tests
    execSync('rm countries.copy.hono.sqlite3 ; cp countries.sqlite3 countries.copy.hono.sqlite3');

    const filename = path.resolve('./countries.copy.hono.sqlite3');

    const { DOCS, API, db } = await getRESTFrom({
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

    app.get('/openapi.json', async c => {
        const file = await readFile('openapi.json', { encoding: 'utf8' });
        return new Response(file, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
    });

    app.get('/', () => {
        const html = `
        <html>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        <body style="margin:0; padding:0">
        <div id="redoc"></div>
        <script>
            Redoc.init('/openapi.json', {}, document.getElementById('redoc'));
        </script>
        </body>
        </html>
        `

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html'
            }
        });
    });

    return { app, db, DOCS };
}