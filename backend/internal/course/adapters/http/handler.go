package http

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"education-portal/internal/course/application"
	"education-portal/internal/course/domain"
)

type Handler struct {
	service *application.CourseService
	logger  *slog.Logger
}

func NewHandler(service *application.CourseService, logger *slog.Logger) *Handler {
	if logger == nil {
		logger = slog.Default()
	}
	return &Handler{service: service, logger: logger}
}

func (h *Handler) ListCourses(w http.ResponseWriter, r *http.Request) {
	courses, err := h.service.ListCourses(r.Context())
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, courses)
}

func (h *Handler) CreateCourse(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Title       string `json:"title"`
		Summary     string `json:"summary"`
		TeacherName string `json:"teacher_name"`
	}
	if err := decodeJSON(r, &request); err != nil {
		writeProblem(w, http.StatusBadRequest, "invalid json body")
		return
	}

	course, err := h.service.CreateCourse(r.Context(), application.CreateCourseInput{
		Title:       request.Title,
		Summary:     request.Summary,
		TeacherName: request.TeacherName,
	})
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, course)
}

func (h *Handler) GetCourse(w http.ResponseWriter, r *http.Request) {
	course, err := h.service.GetCourse(r.Context(), r.PathValue("id"))
	if err != nil {
		h.writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, course)
}

func (h *Handler) EnrollStudent(w http.ResponseWriter, r *http.Request) {
	var request struct {
		StudentName  string `json:"student_name"`
		StudentEmail string `json:"student_email"`
	}
	if err := decodeJSON(r, &request); err != nil {
		writeProblem(w, http.StatusBadRequest, "invalid json body")
		return
	}

	enrollment, err := h.service.EnrollStudent(r.Context(), application.EnrollStudentInput{
		CourseID:     r.PathValue("id"),
		StudentName:  request.StudentName,
		StudentEmail: request.StudentEmail,
	})
	if err != nil {
		h.writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, enrollment)
}

func (h *Handler) writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrInvalidCourse), errors.Is(err, domain.ErrInvalidEnrollment):
		writeProblem(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, domain.ErrCourseNotFound):
		writeProblem(w, http.StatusNotFound, "course not found")
	case errors.Is(err, domain.ErrAlreadyEnrolled):
		writeProblem(w, http.StatusConflict, "student already enrolled")
	default:
		h.logger.Error("request failed", "error", err)
		writeProblem(w, http.StatusInternalServerError, "internal server error")
	}
}

func decodeJSON(r *http.Request, target any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		slog.Default().Error("encoding response", "error", err)
	}
}

func writeProblem(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
