CREATE TABLE IF NOT EXISTS student_semester_plans (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 curriculum_plan_id BIGINT UNSIGNED NOT NULL,
 academic_term_id BIGINT UNSIGNED NULL,
 name VARCHAR(120) NOT NULL,
 study_mode ENUM('LIGHT','BALANCED','FAST_GRADUATION') NOT NULL,
 revision INT UNSIGNED NOT NULL DEFAULT 1,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE (id,curriculum_plan_id), INDEX(user_id,updated_at),
 CHECK (CHAR_LENGTH(TRIM(name)) > 0),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(curriculum_plan_id) REFERENCES curriculum_plans(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(academic_term_id) REFERENCES academic_terms(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS student_semester_plan_courses (
 semester_plan_id BIGINT UNSIGNED NOT NULL,
 curriculum_plan_id BIGINT UNSIGNED NOT NULL,
 course_id BIGINT UNSIGNED NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(semester_plan_id,course_id), INDEX(curriculum_plan_id,course_id),
 FOREIGN KEY(semester_plan_id,curriculum_plan_id) REFERENCES student_semester_plans(id,curriculum_plan_id) ON DELETE CASCADE ON UPDATE RESTRICT,
 FOREIGN KEY(curriculum_plan_id,course_id) REFERENCES curriculum_courses(curriculum_plan_id,course_id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;
