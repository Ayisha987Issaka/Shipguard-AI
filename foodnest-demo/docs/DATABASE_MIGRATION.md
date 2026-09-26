# Database Migration

## Status

FoodNest v2.0 does not yet include a database. A production database is planned
for the next release. This document records the migration and rollback procedure
that must be verified and completed before that release ships.

> **Note:** Specific migration commands and schema details must be added to this
> document once the database technology and ORM/migration tool are chosen.

## Schema Version

Current schema version: none (pre-database release)

## Migration Steps

Before running a migration against any production environment:

1. Confirm the database server is provisioned and the connection is verified.
2. Take a full backup of the production database.
3. Run the migration against the staging environment and confirm it completes
   without errors.
4. Apply the migration to production using the project's migration command
   (to be defined when the database integration is implemented).
5. Confirm the application starts successfully: `GET /health` must return
   `{ "status": "ok", "service": "foodnest" }`.
6. Run a smoke test on the payment flow to confirm end-to-end operation.

## Rollback Procedure

If the migration fails or the application does not behave correctly after
deployment:

1. Stop the application.
2. Restore the database from the backup taken before migration.
3. Redeploy the previous application version.
4. Confirm `GET /health` returns `{ "status": "ok", "service": "foodnest" }`.
5. Notify the team and open a defect ticket before retrying.
