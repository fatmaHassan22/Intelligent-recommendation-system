CREATE TABLE IF NOT EXISTS student_tasks (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(200) NOT NULL,
 description TEXT NULL,
 priority ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
 status ENUM('TODO','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'TODO',
 due_date DATE NULL,
 due_time TIME NULL,
 timezone VARCHAR(64) CHARACTER SET ascii NOT NULL,
 due_at DATETIME(3) NULL,
 completed_at DATETIME(3) NULL,
 curriculum_plan_id BIGINT UNSIGNED NULL,
 course_id BIGINT UNSIGNED NULL,
 revision INT UNSIGNED NOT NULL DEFAULT 1,
 created_at DATETIME(3) NOT NULL,
 updated_at DATETIME(3) NOT NULL,
 INDEX(user_id,status,due_at), INDEX(user_id,created_at),
 CHECK(CHAR_LENGTH(TRIM(title))>0),
 CHECK(due_time IS NULL OR due_date IS NOT NULL),
 CHECK((course_id IS NULL AND curriculum_plan_id IS NULL) OR (course_id IS NOT NULL AND curriculum_plan_id IS NOT NULL)),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
 FOREIGN KEY(curriculum_plan_id,course_id) REFERENCES curriculum_courses(curriculum_plan_id,course_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS student_calendar_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(200) NOT NULL,
 description TEXT NULL,
 start_at DATETIME(3) NOT NULL,
 end_at DATETIME(3) NOT NULL,
 all_day BOOLEAN NOT NULL DEFAULT FALSE,
 timezone VARCHAR(64) CHARACTER SET ascii NOT NULL,
 curriculum_plan_id BIGINT UNSIGNED NULL,
 course_id BIGINT UNSIGNED NULL,
 revision INT UNSIGNED NOT NULL DEFAULT 1,
 created_at DATETIME(3) NOT NULL,
 updated_at DATETIME(3) NOT NULL,
 INDEX(user_id,start_at,end_at),
 CHECK(end_at>start_at), CHECK(CHAR_LENGTH(TRIM(title))>0),
 CHECK((course_id IS NULL AND curriculum_plan_id IS NULL) OR (course_id IS NOT NULL AND curriculum_plan_id IS NOT NULL)),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
 FOREIGN KEY(curriculum_plan_id,course_id) REFERENCES curriculum_courses(curriculum_plan_id,course_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS student_pomodoro_settings (
 user_id BIGINT UNSIGNED PRIMARY KEY,
 focus_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 25,
 short_break_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 5,
 long_break_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 15,
 long_break_after TINYINT UNSIGNED NOT NULL DEFAULT 4,
 CHECK(focus_minutes BETWEEN 1 AND 180), CHECK(short_break_minutes BETWEEN 1 AND 60),
 CHECK(long_break_minutes BETWEEN 1 AND 120), CHECK(long_break_after BETWEEN 1 AND 12),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS student_pomodoro_sessions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 mode ENUM('FOCUS','SHORT_BREAK','LONG_BREAK') NOT NULL,
 state ENUM('RUNNING','PAUSED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'RUNNING',
 duration_ms INT UNSIGNED NOT NULL,
 remaining_ms INT UNSIGNED NOT NULL,
 started_at DATETIME(3) NOT NULL,
 ends_at DATETIME(3) NULL,
 completed_at DATETIME(3) NULL,
 cancelled_at DATETIME(3) NULL,
 task_id BIGINT UNSIGNED NULL,
 curriculum_plan_id BIGINT UNSIGNED NULL,
 course_id BIGINT UNSIGNED NULL,
 revision INT UNSIGNED NOT NULL DEFAULT 1,
 active_user_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN state IN ('RUNNING','PAUSED') THEN user_id ELSE NULL END) STORED,
 UNIQUE(active_user_id), INDEX(user_id,state,completed_at), INDEX(state,ends_at),
 CHECK(duration_ms>0 AND remaining_ms<=duration_ms),
 CHECK((course_id IS NULL AND curriculum_plan_id IS NULL) OR (course_id IS NOT NULL AND curriculum_plan_id IS NOT NULL)),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
 FOREIGN KEY(task_id) REFERENCES student_tasks(id) ON DELETE SET NULL,
 FOREIGN KEY(curriculum_plan_id,course_id) REFERENCES curriculum_courses(curriculum_plan_id,course_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS student_notification_preferences (
 user_id BIGINT UNSIGNED PRIMARY KEY,
 timezone VARCHAR(64) CHARACTER SET ascii NOT NULL DEFAULT 'UTC',
 task_upcoming BOOLEAN NOT NULL DEFAULT TRUE,
 task_overdue BOOLEAN NOT NULL DEFAULT TRUE,
 event_reminders BOOLEAN NOT NULL DEFAULT TRUE,
 pomodoro_completion BOOLEAN NOT NULL DEFAULT TRUE,
 general_reminders BOOLEAN NOT NULL DEFAULT TRUE,
 task_reminder_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
 event_reminder_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
 CHECK(task_reminder_minutes BETWEEN 1 AND 10080), CHECK(event_reminder_minutes BETWEEN 1 AND 10080),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS student_notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 type ENUM('TASK_UPCOMING','TASK_OVERDUE','EVENT_REMINDER','POMODORO_COMPLETED','GENERAL_REMINDER') NOT NULL,
 source_key VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 title VARCHAR(255) NOT NULL,
 message TEXT NOT NULL,
 task_id BIGINT UNSIGNED NULL,
 event_id BIGINT UNSIGNED NULL,
 session_id BIGINT UNSIGNED NULL,
 created_at DATETIME(3) NOT NULL,
 read_at DATETIME(3) NULL,
 dismissed_at DATETIME(3) NULL,
 UNIQUE(user_id,source_key), INDEX(user_id,dismissed_at,read_at,created_at),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
 FOREIGN KEY(task_id) REFERENCES student_tasks(id) ON DELETE SET NULL,
 FOREIGN KEY(event_id) REFERENCES student_calendar_events(id) ON DELETE SET NULL,
 FOREIGN KEY(session_id) REFERENCES student_pomodoro_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;
