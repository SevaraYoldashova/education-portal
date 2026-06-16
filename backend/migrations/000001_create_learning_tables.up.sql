CREATE TABLE courses (
    id UUID PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    teacher_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_name VARCHAR(120) NOT NULL,
    student_email VARCHAR(254) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, student_email)
);

CREATE INDEX enrollments_course_id_idx ON enrollments(course_id);
