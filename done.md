## 2022-11-04
- Add POST verb to the set of handlers for Insertion / upsert
    - DB metadata helper functions updated to show whether a column is unique or not for upserts
    - Added documentation for upsert / insert
    - Tested with

```
# JSON payloads

curl -X POST -H 'Prefer: resolution=merge-duplicates' -H "Content-Type: application/json" -d '{"name":"Atreides","has_nuclear_weapons":1}' http://localhost:3000/sovereignties

curl -X POST -H 'Prefer: resolution=merge-duplicates' -H "Content-Type: application/json" -d '[{"name":"Atreides","has_nuclear_weapons":0},{"name":"Harkonnen","has_nuclear_weapons":1}]' http://localhost:3000/sovereignties

# CSV payload

curl -X POST -H 'Prefer: resolution=merge-duplicates' -H "Content-Type: text/csv" -d $'name,has_nuclear_weapons\nHarkonnen,0\nAtreides,1' http://localhost:3000/sovereignties

```

- Add in Redoc viewer for the sample Countries API app
    - View by going to the root path http://localhost:3000/

- Added PUT verb for single upsert
    - Test with

```
# JSON payload

curl -X PUT -H "Content-Type: application/json" -d '{"name":"Atreides","has_nuclear_weapons":1}' http://localhost:3000/sovereignties?name=eq.Atreides

curl -X PUT -H "Content-Type: application/json" -d '{"name":"AtreidesHouse","has_nuclear_weapons":1}' http://localhost:3000/sovereignties?name=eq.Atreides

curl -X PUT -H "Content-Type: application/json" -d '{"name":"AtreidesHouse","has_nuclear_weapons":1}' http://localhost:3000/sovereignties?name=eq.Atreides
```

- Added tags to all endpoint documentation so that Redoc can auto-group the verbs by tag

## 2024-03-18
- Move to Kysely as the query-builder rather than knex
- Move to adapters for different HTTP frameworks
    - Express (CommonJS only)
    - itty-router (TODO - ESM only)
    - Hono (TODO - ESM only)
    - Fastify (TODO)