const getCountriesApp = require('../tests/countries.app');
const { writeFileSync } = require('fs');

(async ({ PORT = 3000 }) => {
    const { app, DOCS } = await getCountriesApp();

    writeFileSync('./openapi.json', JSON.stringify(DOCS, null, 2));

    app.listen(PORT, () => console.log(`Generated Countries API listening on port ${PORT}!`));
})(process.env);