package domain

import "context"

type Repository interface {
	List(ctx context.Context) ([]Course, error)
	Create(ctx context.Context, course *Course) error
	GetByID(ctx context.Context, id string) (*Course, error)
	AddEnrollment(ctx context.Context, enrollment *Enrollment) error
}
