package application

import (
	"context"
	"fmt"
	"time"

	"education-portal/internal/course/domain"
)

type CourseService struct {
	repository domain.Repository
	now        func() time.Time
}

func NewCourseService(repository domain.Repository) *CourseService {
	return &CourseService{
		repository: repository,
		now:        time.Now,
	}
}

type CreateCourseInput struct {
	Title       string
	Summary     string
	TeacherName string
}

type EnrollStudentInput struct {
	CourseID     string
	StudentName  string
	StudentEmail string
}

func (s *CourseService) ListCourses(ctx context.Context) ([]domain.Course, error) {
	courses, err := s.repository.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing courses: %w", err)
	}
	return courses, nil
}

func (s *CourseService) CreateCourse(ctx context.Context, input CreateCourseInput) (*domain.Course, error) {
	id, err := domain.NewID()
	if err != nil {
		return nil, fmt.Errorf("creating course id: %w", err)
	}

	course, err := domain.NewCourse(id, input.Title, input.Summary, input.TeacherName, s.now())
	if err != nil {
		return nil, err
	}

	if err := s.repository.Create(ctx, course); err != nil {
		return nil, fmt.Errorf("creating course: %w", err)
	}

	return course, nil
}

func (s *CourseService) GetCourse(ctx context.Context, id string) (*domain.Course, error) {
	course, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting course: %w", err)
	}
	return course, nil
}

func (s *CourseService) EnrollStudent(ctx context.Context, input EnrollStudentInput) (*domain.Enrollment, error) {
	id, err := domain.NewID()
	if err != nil {
		return nil, fmt.Errorf("creating enrollment id: %w", err)
	}

	enrollment, err := domain.NewEnrollment(id, input.CourseID, input.StudentName, input.StudentEmail, s.now())
	if err != nil {
		return nil, err
	}

	if err := s.repository.AddEnrollment(ctx, enrollment); err != nil {
		return nil, fmt.Errorf("adding enrollment: %w", err)
	}

	return enrollment, nil
}
