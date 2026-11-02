#!/usr/bin/env bash
# Run from Bash/WSL, never pipe SQL through Windows PowerShell 5 redirection.
set -Eeuo pipefail
umask 077
cd -- "$(dirname -- "$0")"
command -v gpg >/dev/null
command -v docker >/dev/null
recipient=${BACKUP_RECIPIENT:?Set BACKUP_RECIPIENT to a verified GPG public-key fingerprint}
[[ "$recipient" =~ ^[A-Fa-f0-9]{40,64}$ ]] || exit 1
directory=${BACKUP_DIR:-../backups}
mkdir -p -- "$directory"
output="$directory/academic-$(date -u +%Y%m%dT%H%M%SZ)-$$.sql.gpg"
partial="$output.partial"
trap 'rm -f -- "$partial"' EXIT
docker compose exec -T db bash /opt/db-admin.sh backup |
 gpg --batch --encrypt --recipient "$recipient" --output "$partial"
# Pipefail prevents publishing a truncated database dump as a successful backup.
mv -- "$partial" "$output"
(cd -- "$directory" && sha256sum -- "$(basename -- "$output")") > "$output.sha256"
printf 'Encrypted backup saved: %s\n' "$output"
