#!/usr/bin/env bash
# Run inside the MySQL container only. Never pass passwords in argv.
set -Eeuo pipefail
umask 077
config=$(mktemp /tmp/academic-client.XXXXXX)
trap 'rm -f -- "$config"' EXIT
root_password=$(cat /run/secrets/root_password)
[[ "$root_password" =~ ^[a-f0-9]{96}$ ]] || { echo 'Expected generated 48-byte hex root secret' >&2; exit 1; }
printf '[client]\nuser=root\npassword=%s\nprotocol=socket\n' "$root_password" > "$config"
unset root_password
case "${1:-}" in
 provision)
  app_password=$(cat /run/secrets/app_password)
  [[ "$app_password" =~ ^[a-f0-9]{96}$ ]] || exit 1
  # Existing account passwords are preserved. Rotation needs a reviewed ALTER USER.
  {
   printf "CREATE USER IF NOT EXISTS 'academic_app'@'%%' IDENTIFIED BY '%s';\n" "$app_password"
   for table in academic_terms academic_years course_academic_metadata course_offerings course_prerequisites course_typical_semesters courses curriculum_courses curriculum_plans data_verification_issues elective_group_courses elective_groups majors prerequisite_groups requirement_categories seed_runs semester_definitions planner_offering_evidence achievement_definitions; do
    printf "GRANT SELECT ON academic_support.%s TO 'academic_app'@'%%';\n" "$table"
   done
   for table in push_subscriptions push_deliveries users student_profiles auth_sessions student_completed_courses student_semester_plans student_semester_plan_courses student_tasks student_calendar_events student_pomodoro_settings student_pomodoro_sessions student_notifications student_notification_preferences student_activity_events student_avatar_preferences student_achievements student_engagement_preferences student_message_history ticker_items ai_conversations ai_chat_requests ai_messages ai_usage_records moodle_connections moodle_courses moodle_items moodle_sync_runs; do
    printf "GRANT SELECT,INSERT,UPDATE,DELETE ON academic_support.%s TO 'academic_app'@'%%';\n" "$table"
   done
  } | mysql --defaults-extra-file="$config" --database=academic_support
  unset app_password
  ;;
 backup)
  # Consistent InnoDB snapshot. Freeze schema migrations while dumping.
  mysqldump --defaults-extra-file="$config" --single-transaction --quick --hex-blob --no-tablespaces --set-gtid-purged=OFF --skip-add-drop-table --skip-comments --skip-triggers academic_support
  ;;
 empty)
  mysql --defaults-extra-file="$config" --batch --skip-column-names -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='academic_support'"
  ;;
 restore-empty)
  count=$(mysql --defaults-extra-file="$config" --batch --skip-column-names -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='academic_support'")
  [[ "$count" == 0 ]] || { echo 'REFUSED: restore target contains tables. Use a separate fresh volume/server.' >&2; exit 1; }
  mysql --defaults-extra-file="$config" --database=academic_support
  ;;
 *) echo 'Expected provision | backup | empty | restore-empty' >&2; exit 2 ;;
esac
