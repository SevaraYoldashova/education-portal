package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"education-portal/internal/course/domain"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

var _ domain.Repository = (*Repository)(nil)

func (r *Repository) List(ctx context.Context) ([]domain.Course, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			c.id,
			c.title,
			c.summary,
			c.teacher_name,
			c.created_at,
			COUNT(e.id)::int AS enrolled_count
		FROM courses c
		LEFT JOIN enrollments e ON e.course_id = c.id
		GROUP BY c.id
		ORDER BY c.created_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("querying courses: %w", err)
	}
	defer rows.Close()

	courses := make([]domain.Course, 0)
	for rows.Next() {
		var course domain.Course
		if err := rows.Scan(
			&course.ID,
			&course.Title,
			&course.Summary,
			&course.TeacherName,
			&course.CreatedAt,
			&course.EnrolledCount,
		); err != nil {
			return nil, fmt.Errorf("scanning course: %w", err)
		}
		courses = append(courses, course)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating courses: %w", err)
	}

	return courses, nil
}

func (r *Repository) Create(ctx context.Context, course *domain.Course) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO courses (id, title, summary, teacher_name, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, course.ID, course.Title, course.Summary, course.TeacherName, course.CreatedAt)
	if err != nil {
		return fmt.Errorf("inserting course: %w", err)
	}
	return nil
}

func (r *Repository) GetByID(ctx context.Context, id string) (*domain.Course, error) {
	var course domain.Course
	err := r.db.QueryRow(ctx, `
		SELECT
			c.id,
			c.title,
			c.summary,
			c.teacher_name,
			c.created_at,
			COUNT(e.id)::int AS enrolled_count
		FROM courses c
		LEFT JOIN enrollments e ON e.course_id = c.id
		WHERE c.id = $1
		GROUP BY c.id
	`, id).Scan(
		&course.ID,
		&course.Title,
		&course.Summary,
		&course.TeacherName,
		&course.CreatedAt,
		&course.EnrolledCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrCourseNotFound
		}
		return nil, fmt.Errorf("querying course by id: %w", err)
	}

	return &course, nil
}

func (r *Repository) AddEnrollment(ctx context.Context, enrollment *domain.Enrollment) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO enrollments (id, course_id, student_name, student_email, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`, enrollment.ID, enrollment.CourseID, enrollment.StudentName, enrollment.StudentEmail, enrollment.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23503":
				return domain.ErrCourseNotFound
			case "23505":
				return domain.ErrAlreadyEnrolled
			}
		}
		return fmt.Errorf("inserting enrollment: %w", err)
	}
	return nil
}
