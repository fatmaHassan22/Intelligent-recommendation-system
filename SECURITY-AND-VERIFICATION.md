# Team package security and verification

## Export scope

The export was read only from the original LOCAL MySQL database on loopback port 3306. The host, port and database name were checked before connecting. No Aiven/cloud connection was attempted. Only session timezone/isolation settings, a READ ONLY consistent snapshot, SELECT, SHOW CREATE TABLE and rollback were used. No source database DDL, DML, migration, import, reset, lock-tables or deletion was performed.

The SQL contains exactly 17 allowlisted academic tables and 555 rows: 3 majors, 3 curriculum plans, 82 courses, 116 curriculum/course memberships, 66 prerequisite groups and 66 prerequisite relationships, plus elective, semester and verification metadata. database/manifest.json records every table's count and the complete SQL SHA-256. Foreign-key references were checked against the same in-memory snapshot.

No users, profiles, password hashes, authentication sessions, student plans, tasks, push subscriptions, Moodle accounts/items, notifications or AI histories were queried/exported as data. Backend migrations contain their schema definitions so that each teammate can create new, empty student tables. Public achievement definitions are seeded by backend migrations.

## Dataset limitations preserved

- academic_years, academic_terms, course_offerings and course_academic_metadata were EMPTY in the source academic dataset. No difficulty/device metadata or current-term offerings have been invented.
- Typical semester availability has 94 relationships. Typical semesters are not evidence of actual offerings in a particular academic term.
- There are 96 data_verification_issues records, including historical/resolved records; this is not a count of unresolved issues. Existing verification statuses and unknown fields are preserved. This package does not certify the academic source as complete or officially verified.
- Source timestamps were read and exported in UTC. Existing catalog IDs and relationships are preserved.

## Included and excluded

Complete frontend/backend source, source tests, lockfiles, TypeScript/Vite configuration, migrations, application scripts, Docker configuration and Windows team setup are included. The staging-only data/seed.sql contains the current academic rows for Docker's academic bootstrap; original source files were not rewritten.

Actual .env files, secret directories, TLS keys, browser profiles, Git history, local MySQL storage, dumps/backups, node_modules, build products, caches, raw attachments and historical operational reports are absent. Environment examples contain names and placeholders only. The original root's legacy portable-MySQL/Python importer tooling is unnecessary for this app startup and is not included.

Tests contain synthetic users/cookies, deliberately rejected example URLs, and published RFC cryptographic test vectors. These are test fixtures, not credentials or records exported from a real student account. One deliberately invalid example.org URL containing the words secret/password was reviewed as a negative test fixture, not an operational credential.

## Checks performed

- Original copied source/config/migration files checked against SHA-256 baselines: 174 unchanged.
- Required source trees, package.json, lockfiles and templates checked for presence.
- Academic SQL SHA-256, exact CREATE/INSERT table allowlist, row counts and strict hex-encoded value grammar verified. Hex values were decoded before checking for credentials and obvious email/contact identifiers.
- File scan compared contents against private environment secret values in memory and checked obvious API-key/private-key/token/credential-URL patterns. No real secret matches remained; synthetic negative test fixtures were reviewed separately.
- Forbidden directory/file paths, symbolic links and actual .env files excluded.
- New setup-local.mjs passed Node syntax checking; setup-local.ps1 passed PowerShell AST parsing.
- Archive member names, required contents and byte-level SHA-256 are checked against FILE-MANIFEST.json after ZIP creation. The file manifest intentionally excludes itself.

No integration test, application startup, production build or database import was run during packaging. Those could write database records or build artifacts. SQL verification was static and against the read-only source snapshot, not a round-trip import. The new teammate setup script is syntax-checked but has not been executed against a database here. Review it before running it on a teammate's machine.

The setup script will create a NEW database and scoped account only when a teammate explicitly runs it. Existing databases and .env files cause it to stop. On a failure after creation, a partial NEW database/account may remain; it does not attempt destructive rollback. Ask the maintainer before retrying.

## Sharing precautions

Share the original ZIP. Once a teammate runs setup, their extracted folder contains private generated .env files and eventually student records. Do not zip that working folder again without a new security review. Keep root passwords local and never paste .env, cookies, credentials or database backups into chat or Git.

The archive is offline-transferable; a first dependency/software installation still requires internet. No cloud deployment, account creation or paid API use was performed.
