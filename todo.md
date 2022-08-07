# TODO list

- [ ] All supported HTTP verbs
    - [ ] POST (Create)
    - [ ] GET (Read)
        - [ ] Supported operators
            - [x] `eq`
            - [ ] `neq`
            - [x] `lt` / `lte`
            - [x] `gt` / `gte`
            - [x] `gt` / `gte`
            - [x] `like`
            - [x] `in`
            - [x] `is` (with `null` and `true`/`false`)
        - [x] Slicing, sorting, and pagination
            - [x] `select` (slicing = column filtering)
            - [x] `order` (sorting with `desc` and `asc`)
            - [x] `offset` / `limit` (pagination)
        - [x] Returns raw binary with correct MIME type when plucking a BLOB column
        - [ ] API documentation in OpenAPI 
            - [x] Basic with examples
            - [ ] Detailed with operators
    - [ ] PUT (Upsert)
    - [ ] PATCH (Update existing)
    - [ ] DELETE (Delete)
    
- [ ] Samples
    - [ ] ExpressJS
        - [x] Basic server implementing Countries API
        - [ ] HTTP Basic auth example
        - [ ] Role-based auth example
        - [ ] 2FA example
    - [ ] Client generation example