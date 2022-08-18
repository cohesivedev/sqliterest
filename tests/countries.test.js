const request = require('supertest');
const getCountriesApp = require('./countries.app');

describe('Countries REST API', () => {
    let app, knex;

    beforeAll(async () => {
        const createdREST = await getCountriesApp();
        app = createdREST.app;
        knex = createdREST.knex;
    });

    afterAll(() => {
        knex.destroy();
    });

    it('returns an error message when an invalid column is queried', async () => {
        const res = await request(app).get('/countries').query({
            area51: 'aliengray',
        });

        expect(res.body).toMatchSnapshot();
        expect(res.statusCode).toBe(400);
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

        expect(res.headers['content-type']).toBe('image/gif');
        expect(res.body).toMatchSnapshot();
    });

    it('returns with the raw binary if choosing a single BLOB column with a single row (unrecognized binary content)', async () => {
        const res = await request(app).get('/countries').query({
            iso3166alpha2: 'YT',
            select: 'flag_gif',
        });

        expect(res.headers['content-type']).toBe('application/octet-stream');
        expect(res.body).toMatchSnapshot();
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

});