const { getDBInfo } = require('../helpers');

(async () => {
    const { knex } = await getDBInfo('countries.sqlite3');

    const countries = await knex('countries').pluck('iso3166alpha2');

    for (const country of countries) {
        const flag_gif = Buffer.from(
            await (await fetch(`https://www.translatorscafe.com/cafe/images/flags/${country}.gif`)).arrayBuffer()
        );

        await knex('countries').where('iso3166alpha2', country).update({
            flag_gif,
        });

        console.log(`Flag added for ${country}.`);
    }

    knex.destroy();
})();