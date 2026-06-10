# FUTURE: Entity Builder (not in v1)

## Recommendation first
Re-evaluate need after 3 months of production use. With AI-assisted development, adding a real table + CRUD screens takes minutes and outperforms EAV in queryability, integrity, exports, and performance. Only build this if the owner needs to create entities *without any developer/AI session at all*.

## Architecture (if built)
- Keep spec §9.1 design: entity_types, entity_fields, entity_records, entity_field_values (typed value columns).
- Add: `value_relation_id BIGINT` column + soft FK validation in service layer (EAV cannot enforce real FKs).
- Service layer: EntityEngine — validates against field config, pivots EAV rows to flat objects, builds dynamic list queries with one JOIN per filtered field (cap filterable fields at ~5 to bound query cost).
- Frontend: DynamicEntityForm + DynamicEntityList components driven by /api/v1/entities/:slug/schema.
- Exports: pivot in SQL via GROUP_CONCAT or in Node; reuse existing ExcelJS pipeline.

## Migration strategy
- Ship as additive migrations (4 tables) — zero impact on existing tables.
- Optional later: "promote" a heavily-used custom entity to a real table via generated migration (script reads field config, emits CREATE TABLE + data copy).

## Scaling considerations
- EAV row count = records × fields; index (record_id), (field_id, value_text(64)), (field_id, value_number), (field_id, value_date).
- At this project's scale (single user, thousands of records) performance is a non-issue; the cost is complexity, not load.
