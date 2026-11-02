CREATE TABLE student_engagement_preferences (
 user_id BIGINT UNSIGNED PRIMARY KEY, timezone VARCHAR(64) CHARACTER SET ascii NOT NULL DEFAULT 'UTC',
 notification_tone ENUM('PROFESSIONAL','PLAYFUL') NOT NULL DEFAULT 'PROFESSIONAL', achievement_notifications BOOLEAN NOT NULL DEFAULT TRUE,
 ticker_visible BOOLEAN NOT NULL DEFAULT TRUE, ticker_categories JSON NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;
CREATE TABLE student_activity_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id BIGINT UNSIGNED NOT NULL,
 event_key VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 kind ENUM('TASK','FOCUS','PLAN','COURSE') NOT NULL, source_id VARCHAR(64) CHARACTER SET ascii NOT NULL,
 occurred_at DATETIME(3) NOT NULL,activity_date DATE NOT NULL,timezone VARCHAR(64) CHARACTER SET ascii NOT NULL,
 UNIQUE(user_id,event_key),INDEX(user_id,activity_date),INDEX(user_id,kind),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE student_avatar_preferences (
 user_id BIGINT UNSIGNED PRIMARY KEY,style ENUM('STUDENT','CAT','ROBOT') NOT NULL DEFAULT 'STUDENT',
 color VARCHAR(7) CHARACTER SET ascii NOT NULL DEFAULT '#239B91',background VARCHAR(7) CHARACTER SET ascii NOT NULL DEFAULT '#E4F3EE',
 eyes ENUM('ROUND','HAPPY') NOT NULL DEFAULT 'ROUND', accessory ENUM('NONE','GLASSES','CAP') NOT NULL DEFAULT 'NONE',
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE achievement_definitions (
 code VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,title VARCHAR(100) NOT NULL,description VARCHAR(255) NOT NULL,
 metric ENUM('TASK','FOCUS','PLAN','STREAK') NOT NULL,target SMALLINT UNSIGNED NOT NULL,sort_order SMALLINT UNSIGNED NOT NULL, CHECK(target>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;
INSERT INTO achievement_definitions VALUES
 ('FIRST_STEP','الخطوة الأولى','إكمال أول مهمة','TASK',1,1),('FOCUS_STARTER','بداية التركيز','إكمال أول جلسة تركيز','FOCUS',1,2),
 ('CONSISTENT_LEARNER','متعلّم مستمر','ثلاثة أيام متتالية من النشاط','STREAK',3,3),('WEEKLY_CHAMPION','بطل الأسبوع','سبعة أيام متتالية من النشاط','STREAK',7,4),
 ('PLANNING_PRO','صانع الخطة','حفظ أول تغيير ذي معنى في خطة تحتوي مساقًا','PLAN',1,5),('PRODUCTIVITY_STAR','نجم الإنتاجية','إكمال عشر مهام مختلفة','TASK',10,6),
 ('FOCUS_MASTER','خبير التركيز','إكمال عشر جلسات تركيز','FOCUS',10,7);
CREATE TABLE student_achievements (
 user_id BIGINT UNSIGNED NOT NULL,achievement_code VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,earned_at DATETIME(3) NOT NULL,
 celebrated_at DATETIME(3) NULL,PRIMARY KEY(user_id,achievement_code),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,FOREIGN KEY(achievement_code) REFERENCES achievement_definitions(code) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE student_message_history (
 user_id BIGINT UNSIGNED NOT NULL,context VARCHAR(40) CHARACTER SET ascii NOT NULL,variant SMALLINT UNSIGNED NOT NULL DEFAULT 0,
 PRIMARY KEY(user_id,context),FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE ticker_items (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,title VARCHAR(200) NOT NULL,description VARCHAR(1500) NOT NULL DEFAULT '',
 category ENUM('AI_TECH','LEARNING','SCHOLARSHIPS','UNIVERSITY','DEADLINES','LIGHTHEARTED') NOT NULL,source_url VARCHAR(2048) NULL,
 published_at DATETIME(3) NOT NULL,expires_at DATETIME(3) NULL,priority SMALLINT UNSIGNED NOT NULL DEFAULT 0,is_active BOOLEAN NOT NULL DEFAULT FALSE,
 revision INT UNSIGNED NOT NULL DEFAULT 1,created_by BIGINT UNSIGNED NOT NULL,created_at DATETIME(3) NOT NULL,updated_at DATETIME(3) NOT NULL,
 INDEX(is_active,published_at,expires_at,priority),CHECK(expires_at IS NULL OR expires_at>published_at),CHECK(priority<=100),
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;
ALTER TABLE student_notifications MODIFY type ENUM('TASK_UPCOMING','TASK_OVERDUE','EVENT_REMINDER','POMODORO_COMPLETED','GENERAL_REMINDER','ACHIEVEMENT','STREAK_MILESTONE') NOT NULL;
