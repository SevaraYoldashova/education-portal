package domain

import "errors"

var (
	ErrCourseNotFound    = errors.New("course not found")
	ErrInvalidCourse     = errors.New("invalid course")
	ErrInvalidEnrollment = errors.New("invalid enrollment")
	ErrAlreadyEnrolled   = errors.New("student already enrolled")
)
