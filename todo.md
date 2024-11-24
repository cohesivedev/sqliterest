# TODO list

- [ ] All supported HTTP verbs
    - [x] POST (Create)
    - [p] GET (Read)
        - [ ] Supported operators
            - [x] `eq`
            - [x] `neq`
            - [x] `lt` / `lte`
            - [x] `gt` / `gte`
            - [x] `gt` / `gte`
            - [x] `like`
            - [x] `in`
            - [x] `is` (with `null` and `true`/`false`)
            - [ ] logical operators `not` / `and` / `or`
        - [x] Slicing, sorting, and pagination
            - [x] `select` (slicing = column filtering)
            - [x] `order` (sorting with `desc` and `asc`)
            - [x] `offset` / `limit` (pagination)
        - [x] Returns raw binary with correct MIME type when plucking a BLOB column
        - [ ] Resource embedding
    - [x] PUT (Upsert single)
    - [ ] PATCH (Update a selection)
    - [x] DELETE (Delete)
        - [ ] All supported operators as per GET
    - [x] Query overrides via request context
        - Available via `req.queryOverrides` field
- [ ] Samples
    - [x] HonoJS
    - [ ] ExpressJS
        - [x] Basic server implementing Countries API
        - [ ] HTTP Basic auth example
        - [ ] Role-based auth example
        - [ ] 2FA example
    - [ ] Client generation example
- [ ] Additional features
    - [ ] Create / upsert BLOB values via base64
    - [ ] Set logging levels via env vars
        - [ ] Silent flag
- [x] API documentation in OpenAPI 
    - [x] Basic documentation for all verbs (with field examples)

```
Legend:
[x] = Fully done
[p] = Partially done
[ ] = Not done
```
