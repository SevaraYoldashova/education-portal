const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export type Course = {
  id: string;
  title: string;
  summary: string;
  teacher_name: string;
  enrolled_count: number;
  created_at: string;
};

export type CreateCourseInput = {
  title: string;
  summary: string;
  teacher_name: string;
};

export type Enrollment = {
  id: string;
  course_id: string;
  student_name: string;
  student_email: string;
  created_at: string;
};

export type EnrollStudentInput = {
  student_name: string;
  student_email: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Request failed";

    throw new Error(message);
  }

  return payload as T;
}

export function listCourses(): Promise<Course[]> {
  return request<Course[] | null>("/courses").then((courses) => courses ?? []);
}

export function createCourse(input: CreateCourseInput): Promise<Course> {
  return request<Course>("/courses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function enrollStudent(
  courseID: string,
  input: EnrollStudentInput,
): Promise<Enrollment> {
  return request<Enrollment>(`/courses/${courseID}/enrollments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
