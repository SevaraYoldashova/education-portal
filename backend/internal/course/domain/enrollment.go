package domain

import (
	"fmt"
	"net/mail"
	"strings"
	"time"
)

type Enrollment struct {
	ID           string    `json:"id"`
	CourseID     string    `json:"course_id"`
	StudentName  string    `json:"student_name"`
	StudentEmail string    `json:"student_email"`
	CreatedAt    time.Time `json:"created_at"`
}

func NewEnrollment(id, courseID, studentName, studentEmail string, now time.Time) (*Enrollment, error) {
	enrollment := &Enrollment{
		ID:           strings.TrimSpace(id),
		CourseID:     strings.TrimSpace(courseID),
		StudentName:  strings.TrimSpace(studentName),
		StudentEmail: strings.ToLower(strings.TrimSpace(studentEmail)),
		CreatedAt:    now.UTC(),
	}

	if err := enrollment.Validate(); err != nil {
		return nil, err
	}

	return enrollment, nil
}

func (e Enrollment) Validate() error {
	if e.ID == "" {
		return fmt.Errorf("%w: id is required", ErrInvalidEnrollment)
	}
	if e.CourseID == "" {
		return fmt.Errorf("%w: course id is required", ErrInvalidEnrollment)
	}
	if e.StudentName == "" {
		return fmt.Errorf("%w: student name is required", ErrInvalidEnrollment)
	}
	if _, err := mail.ParseAddress(e.StudentEmail); err != nil {
		return fmt.Errorf("%w: student email is invalid", ErrInvalidEnrollment)
	}
	return nil
}
