package domain

import (
	"fmt"
	"strings"
	"time"
)

type Course struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	Summary       string    `json:"summary"`
	TeacherName   string    `json:"teacher_name"`
	EnrolledCount int       `json:"enrolled_count"`
	CreatedAt     time.Time `json:"created_at"`
}

func NewCourse(id, title, summary, teacherName string, now time.Time) (*Course, error) {
	course := &Course{
		ID:          strings.TrimSpace(id),
		Title:       strings.TrimSpace(title),
		Summary:     strings.TrimSpace(summary),
		TeacherName: strings.TrimSpace(teacherName),
		CreatedAt:   now.UTC(),
	}

	if err := course.Validate(); err != nil {
		return nil, err
	}

	return course, nil
}

func (c Course) Validate() error {
	if c.ID == "" {
		return fmt.Errorf("%w: id is required", ErrInvalidCourse)
	}
	if c.Title == "" {
		return fmt.Errorf("%w: title is required", ErrInvalidCourse)
	}
	if c.TeacherName == "" {
		return fmt.Errorf("%w: teacher name is required", ErrInvalidCourse)
	}
	if len(c.Title) > 160 {
		return fmt.Errorf("%w: title is too long", ErrInvalidCourse)
	}
	return nil
}
