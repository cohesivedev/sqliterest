## 2022-11-04
- Add POST verb to the set of handlers for Insertion / upsert
    - DB metadata helper functions updated to show whether a column is unique or not for upserts
    - Added documentation for upsert / insert
    - Tested with

```
# JSON payload s

curl -X POST -H 'Prefer: resolution=merge-duplicates' -H "Content-Type: application/json" -d '{"name":"Atreides","has_nuclear_weapons":1}' http://localhost:3000/sovereignties

curl -X POST -H 'Prefer: resolution=merge-duplicates' -H "Content-Type: application/json" -d '[{"name":"Atreides","has_nuclear_weapons":0},{"name":"Harkonnen","has_nuclear_weapons":1}]' http://localhost:3000/sovereignties

# CSV payload

curl -X POST -H 'Prefer: resolution=merge-duplicates' -H "Content-Type: text/csv" -d $'name,has_nuclear_weapons\nHarkonnen,0\nAtreides,1' http://localhost:3000/sovereignties

```

- Add in Redoc viewer for the sample Countries API app
    - View by going to the root path http://localhost:3000/

