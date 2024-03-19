const request = require('supertest');
const getCountriesApp = require('./_app.express');

describe('Countries API', () => {
    let app, knex;

    beforeAll(async () => {
        const createdREST = await getCountriesApp();
        app = createdREST.app;
        knex = createdREST.knex;

    });

    afterAll(() => knex.destroy());


    // Tests below should be the same across adapters! //

    it('returns an error message when an invalid column is queried', async () => {
        const res = await request(app).get('/countries').query({
            area51: 'aliengray',
        });

        expect(res.body.error).toMatch(/no such column: area51/);
        expect(res.statusCode).toBe(400);
        expect(res.body).toMatchSnapshot();
    });

    it('queries with EQ', async () => {
        const res = await request(app).get('/countries').query({
            iso3166alpha3: 'CAN',
            select: 'iso3166alpha3,name,tld',
        });

        expect(res.body).toMatchSnapshot();
    });

    it('queries with EQ is unchanged when trying to query through blob column', async () => {
        const res = await request(app).get('/countries').query({
            iso3166alpha3: 'CAN',
            flag_gif: 'weeds',
            select: 'name,tld',
        });

        expect(res.body).toMatchSnapshot();
    });

    it('queries with LIKE', async () => {
        const res = await request(app).get('/countries').query({
            name: `like.${encodeURIComponent('"united*"')}`,
            select: 'iso3166alpha3,name,tld',
        });

        expect(res.body).toMatchSnapshot();
    });

    it('queries with LT (Less Than)', async () => {
        const res = await request(app).get('/countries').query({
            numeric: `lt.20`,
            select: 'iso3166alpha3,name,numeric',
            order: 'numeric.asc',
            limit: 10,
        });

        expect(res.body).toMatchSnapshot();
    });

    it('queries with IN', async () => {
        const res = await request(app).get('/countries').query({
            tld: `in.(".ca!@,,,,,^",".us",".uk",".au")`,
            select: 'iso3166alpha3,name,tld',
            limit: 10,
        });

        expect(res.body).toMatchSnapshot();
    });

    it('queries with IS', async () => {
        const resIsTrue = await request(app).get('/sovereignties').query({
            has_nuclear_weapons: `is.true`,
            select: 'name',
        });

        const resIsFalse = await request(app).get('/sovereignties').query({
            has_nuclear_weapons: `is.false`,
            select: 'name',
        });

        const resIsNull = await request(app).get('/sovereignties').query({
            has_nuclear_weapons: `is.null`,
            select: 'name',
        });

        const resIsValue = await request(app).get('/countries').query({
            iso3166alpha2: `is.AF`,
            select: 'name',
        });

        expect(resIsTrue.body).toMatchSnapshot();
        expect(resIsFalse.body).toMatchSnapshot();
        expect(resIsNull.body).toMatchSnapshot();
        expect(resIsValue.body).toMatchSnapshot();
    });

    it('queries with LIMIT, OFFSET, and ORDER', async () => {
        const res = await request(app).get('/countries').query({
            name: 'like."a*"',
            select: 'iso3166alpha3,name,tld',
            order: 'name.asc',
            offset: 2,
            limit: 6,
        });

        expect(res.body).toMatchSnapshot();
    });

    it('returns with the raw binary if choosing a single BLOB column with a single row', async () => {
        const res = await request(app).get('/countries').query({
            iso3166alpha2: 'AD',
            select: 'flag_gif',
        });

        expect(res.body).toMatchSnapshot();
        expect(res.headers['content-type']).toBe('image/gif');
    });

    it('returns with the raw binary if choosing a single BLOB column with a single row (unrecognized binary content)', async () => {
        const res = await request(app).get('/countries').query({
            iso3166alpha2: 'YT',
            select: 'flag_gif',
        });

        expect(res.body).toMatchSnapshot();
        expect(res.headers['content-type']).toBe('application/octet-stream');
    });

    it('deletes based on queries with EQ', async () => {
        const resGetBefore = await request(app).get('/countries').query({
            iso3166alpha2: 'AD',
            select: 'iso3166alpha2,name',
        });
        expect(resGetBefore.body).toMatchSnapshot();

        const resDelete = await request(app).del('/countries').query({
            iso3166alpha2: 'AD',
        });
        expect(resDelete.body).toMatchSnapshot();

        const resGetAfter = await request(app).get('/countries').query({
            iso3166alpha2: 'AD',
            select: 'iso3166alpha2,name',
        });
        expect(resGetAfter.body).toMatchSnapshot();
    });

    it('deletes based on queries with IS', async () => {
        const resGetBefore = await request(app).get('/governments');
        expect(resGetBefore.body).toMatchSnapshot();

        const resDelete1 = await request(app).del('/governments').query({
            is_monarchy: `is.true`,
        });
        expect(resDelete1.body).toMatchSnapshot();

        const resDelete2 = await request(app).del('/governments').query({
            is_monarchy: `is.false`,
        });
        expect(resDelete2.body).toMatchSnapshot();

        const resDelete3 = await request(app).del('/governments').query({
            is_monarchy: `is.null`,
        });
        expect(resDelete3.body).toMatchSnapshot();

        const resGetAfter = await request(app).get('/governments');
        expect(resGetAfter.body).toMatchSnapshot();
    });

    it('deletes based on queries with LIKE', async () => {
        const resGetBefore = await request(app).get('/countries').query({
            name: 'like."united *"',
            select: 'iso3166alpha3,name',
        });
        expect(resGetBefore.body).toMatchSnapshot();

        const resDelete = await request(app).del('/countries').query({
            name: `like."united *"`,
        });
        expect(resDelete.body).toMatchSnapshot();

        const resGetAfter = await request(app).get('/countries').query({
            name: 'like."united *"',
            select: 'iso3166alpha3,name',
        });
        expect(resGetAfter.body).toMatchSnapshot();
    });

    it('deletes based on queries with IN', async () => {
        const resGetBefore = await request(app).get('/countries').query({
            tld: `in.(".ca!@,,,,,^",".us",".uk",".au")`,
            select: 'iso3166alpha3,name,tld',
        });
        expect(resGetBefore.body).toMatchSnapshot();

        const resDelete = await request(app).del('/countries').query({
            tld: `in.(".ca!@,,,,,^",".us",".uk",".au")`,
        });
        expect(resDelete.body).toMatchSnapshot();

        const resGetAfter = await request(app).get('/countries').query({
            tld: `in.(".ca!@,,,,,^",".us",".uk",".au")`,
            select: 'iso3166alpha3,name,tld',
        });
        expect(resGetAfter.body).toMatchSnapshot();
    });

    it('does not delete if no parameters given', async () => {
        const resDelete = await request(app).del('/countries');
        expect(resDelete.body).toMatchSnapshot();
    });

    it('posts throws an error if trying to insert with invalid columns', async () => {
        let res;

        res = await request(app).post('/sovereignties').send({
            name: 'Atlantis',
            will_always_be_submerged: 1,
            has_nuclear_weapons: 1,
        });
        expect(res.body).toMatchSnapshot();
        expect(res.body.error).toMatch(/has no column named/);
        expect(res.statusCode).toBe(400);
    });


    it('posts inserts a new row and can cherry-pick columns', async () => {
        let res;

        res = await request(app).post('/sovereignties').send({
            name: 'Atlantis',
            has_nuclear_weapons: 1,
        });
        expect(res.body).toMatchSnapshot();

        res = await request(app).get('/sovereignties').query({
            name: 'Atlantis',
        });
        expect(res.body).toMatchSnapshot();

        res = await request(app).post('/sovereignties?columns=name,has_nuclear_weapons').send({
            name: 'Narnia',
            food_units: 34,
            has_nuclear_weapons: 1,
        });
        expect(res.body).toMatchSnapshot();

        res = await request(app).get('/sovereignties').query({
            name: 'Narnia',
        });
        expect(res.body).toMatchSnapshot();
    });

    it('posts inserts multiple new rows and can cherry-pick columns from the payloads', async () => {
        let res;

        res = await request(app).post('/sovereignties?columns=name,has_nuclear_weapons').send([
            {
                name: 'Pangea',
                area_code: 905,
                populationMillions: 32,
                has_nuclear_weapons: 0,
            },
            {
                name: 'Eurasia',
                area_code: 906,
                populationMillions: 12,
                has_nuclear_weapons: 1,
            }
        ]);
        expect(res.body).toMatchSnapshot();

        res = await request(app).get('/sovereignties').query({
            name: 'in.("Pangea","Eurasia")',
        });
        expect(res.body).toMatchSnapshot();
    });

    it('posts updates a new row when upsert header is sent', async () => {
        let res;

        res = await request(app).post('/sovereignties').set('Prefer', 'resolution=merge-duplicates').send({
            name: 'Atlantis',
            has_nuclear_weapons: 0,
        });

        res = await request(app).get('/sovereignties').query({
            name: 'Atlantis',
        });
        expect(res.body).toMatchSnapshot();
        expect(res.body[0].has_nuclear_weapons).toBe(0);
    });

    it('posts inserts rows when sent a CSV', async () => {
        let res;

        res = await request(app).post('/sovereignties').set('Content-Type', 'text/csv').send([
            'name,has_nuclear_weapons',
            'DinoLand,0',
            'BirdFort,1'
        ].join('\n'));
        expect(res.body).toMatchSnapshot();

        res = await request(app).get('/sovereignties').query({
            name: 'in.("DinoLand","BirdFort")',
        });
        expect(res.body).toMatchSnapshot();
    });

    it('puts upsert only a single row', async () => {
        let res;

        res = await request(app).put('/sovereignties')
            .send({ name: 'Fortre55', has_nuclear_weapons: 0 });
        expect(res.body).toMatchSnapshot(); // 1
        expect(res.body.error).toBeTruthy();
        expect(res.statusCode).toBe(400);

        res = await request(app).put('/sovereignties?has_nuclear_weapons=eq.0')
            .send({ name: 'Fortre55', has_nuclear_weapons: 0 });
        expect(res.body).toMatchSnapshot(); // 2
        expect(res.body.error).toBeTruthy();
        expect(res.statusCode).toBe(400);

        res = await request(app).put('/sovereignties?name=Fortres55')
            .send([
                { name: 'Fortre55', has_nuclear_weapons: 0 },
                { name: 'Fortre56', has_nuclear_weapons: 0 }
            ]);
        expect(res.body).toMatchSnapshot(); // 3
        expect(res.body.error).toBeTruthy();
        expect(res.statusCode).toBe(400);

        res = await request(app).put('/sovereignties?name=Fortres56')
            .send({ name: 'Fortre55', has_nuclear_weapons: 0 });
        expect(res.body).toMatchSnapshot(); // 4
        expect(res.statusCode).toBe(200);

        res = await request(app).get('/sovereignties').query({
            name: 'Fortre55',
        });
        expect(res.body).toMatchSnapshot(); // 5

        res = await request(app).put('/sovereignties?name=Fortres55')
            .send({ name: 'Fortre55', has_nuclear_weapons: 1 });
        expect(res.body).toMatchSnapshot(); // 6
        expect(res.statusCode).toBe(200);

        res = await request(app).get('/sovereignties').query({
            name: 'Fortre55',
        });
        expect(res.body).toMatchSnapshot(); // 7
    });

});