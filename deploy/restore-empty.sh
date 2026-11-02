#!/usr/bin/env bash
# Only accepts backups made by backup.sh. No overwrite/reset path is provided.
set -Eeuo pipefail
umask 077
cd -- "$(dirname -- "$0")"
file=${1:?Usage: bash restore-empty.sh /absolute/backup.sql.gpg}
[[ "$file" = /* && "$file" == *.sql.gpg && -f "$file" && -f "$file.sha256" ]] || exit 1
[[ "${RESTORE_EMPTY_TARGET:-}" == YES ]] || { echo 'Set RESTORE_EMPTY_TARGET=YES after verifying the isolated fresh target.' >&2; exit 1; }
if [[ -n "$(docker compose ps --status running -q backend worker)" ]]; then echo 'Stop backend and worker before restore.' >&2; exit 1; fi
[[ "$(docker compose exec -T db bash /opt/db-admin.sh empty)" == 0 ]] || { echo 'Refused: target is not empty.' >&2; exit 1; }
(cd -- "$(dirname -- "$file")" && sha256sum --check -- "$(basename -- "$file").sha256")
# Authenticate/decrypt the entire archive before the first database write.
# Avoid streaming unauthenticated/truncated plaintext into MySQL.
gpg --batch --decrypt "$file" >/dev/null
gpg --decrypt "$file" | docker compose exec -T db bash /opt/db-admin.sh restore-empty
echo 'Restored into empty target. Verify schema/counts; run migration checks and provision before starting backend.'
