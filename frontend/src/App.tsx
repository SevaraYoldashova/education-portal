import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  createCourse,
  enrollStudent,
  listCourses,
  type Course,
  type CreateCourseInput,
  type EnrollStudentInput,
} from "./api";

type NoticeState = {
  type: "success" | "error";
  message: string;
};

type EnrollmentForms = Record<string, EnrollStudentInput>;

const emptyCourse: CreateCourseInput = {
  title: "",
  teacher_name: "",
  summary: "",
};

const emptyEnrollment: EnrollStudentInput = {
  student_name: "",
  student_email: "",
};

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseForm, setCourseForm] = useState<CreateCourseInput>(emptyCourse);
  const [enrollmentForms, setEnrollmentForms] = useState<EnrollmentForms>({});
  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingEnrollmentID, setSavingEnrollmentID] = useState("");
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const totalEnrollments = useMemo(
    () => courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0),
    [courses],
  );

  useEffect(() => {
    void loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    setNotice(null);

    try {
      setCourses(await listCourses());
    } catch (error) {
      setNotice({ type: "error", message: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCourse(true);
    setNotice(null);

    try {
      await createCourse(courseForm);
      setCourseForm(emptyCourse);
      setNotice({ type: "success", message: "Course created successfully." });
      await loadCourses();
    } catch (error) {
      setNotice({ type: "error", message: errorMessage(error) });
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleEnroll(event: FormEvent<HTMLFormElement>, courseID: string) {
    event.preventDefault();
    setSavingEnrollmentID(courseID);
    setNotice(null);

    try {
      await enrollStudent(courseID, enrollmentForms[courseID] || emptyEnrollment);
      setEnrollmentForms((current) => ({
        ...current,
        [courseID]: emptyEnrollment,
      }));
      setNotice({ type: "success", message: "Student enrolled successfully." });
      await loadCourses();
    } catch (error) {
      setNotice({ type: "error", message: errorMessage(error) });
    } finally {
      setSavingEnrollmentID("");
    }
  }

  function updateCourseField(field: keyof CreateCourseInput, value: string) {
    setCourseForm((current) => ({ ...current, [field]: value }));
  }

  function updateEnrollmentField(courseID: string, field: keyof EnrollStudentInput, value: string) {
    setEnrollmentForms((current) => ({
      ...current,
      [courseID]: {
        ...(current[courseID] || emptyEnrollment),
        [field]: value,
      },
    }));
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-7 text-neutral-900">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-black uppercase tracking-wider text-neutral-500">
            Learning operations
          </p>
          <h1 className="text-4xl font-black tracking-normal text-neutral-950 md:text-5xl">
            Education Portal
          </h1>
        </div>
        <button
          className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-extrabold text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft disabled:cursor-progress disabled:opacity-60"
          type="button"
          onClick={() => void loadCourses()}
          disabled={loading}
        >
          Refresh
        </button>
      </header>

      <section className="mb-4 grid gap-3 md:grid-cols-3" aria-label="Platform summary">
        <Metric label="Published courses" value={courses.length} />
        <Metric label="Active enrollments" value={totalEnrollments} />
        <Metric label="API status" value={notice?.type === "error" ? "Needs attention" : "Ready"} />
      </section>

      {notice ? <Notice notice={notice} /> : null}

      <section className="grid items-start gap-5 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <CourseForm
          form={courseForm}
          saving={savingCourse}
          onChange={updateCourseField}
          onSubmit={handleCreateCourse}
        />

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-neutral-500">
                Catalog
              </p>
              <h2 className="text-xl font-black text-neutral-950">Courses</h2>
            </div>
            <span className="text-sm font-extrabold text-neutral-500">
              {loading ? "Loading..." : `${courses.length} total`}
            </span>
          </div>

          {loading ? <LoadingCourses /> : null}
          {!loading && courses.length === 0 ? <EmptyState /> : null}
          {!loading && courses.length > 0 ? (
            <div className="grid gap-4">
              {courses.map((course) => (
                <CourseCard
                  course={course}
                  enrollment={enrollmentForms[course.id] || emptyEnrollment}
                  saving={savingEnrollmentID === course.id}
                  onEnroll={(event) => void handleEnroll(event, course.id)}
                  onEnrollmentChange={(field, value) =>
                    updateEnrollmentField(course.id, field, value)
                  }
                  key={course.id}
                />
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

type MetricProps = {
  label: string;
  value: number | string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <span className="mb-2 block text-sm text-neutral-500">{label}</span>
      <strong className="block text-3xl font-black text-emerald-700">{value}</strong>
    </article>
  );
}

type NoticeProps = {
  notice: NoticeState;
};

function Notice({ notice }: NoticeProps) {
  const tone =
    notice.type === "error"
      ? "bg-red-50 text-red-700"
      : "bg-emerald-50 text-emerald-700";

  return (
    <div className={`mb-4 rounded-lg px-4 py-3 font-bold ${tone}`} role="status">
      {notice.message}
    </div>
  );
}

type CourseFormProps = {
  form: CreateCourseInput;
  saving: boolean;
  onChange: (field: keyof CreateCourseInput, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CourseForm({ form, saving, onChange, onSubmit }: CourseFormProps) {
  return (
    <form
      className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm lg:sticky lg:top-5"
      onSubmit={onSubmit}
    >
      <div>
        <p className="mb-1 text-xs font-black uppercase tracking-wider text-neutral-500">
          New course
        </p>
        <h2 className="text-xl font-black text-neutral-950">Create learning path</h2>
      </div>

      <label className="grid gap-2 text-sm font-extrabold text-neutral-700">
        Course title
        <input
          className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
          required
          maxLength={160}
          placeholder="Backend fundamentals"
        />
      </label>

      <label className="grid gap-2 text-sm font-extrabold text-neutral-700">
        Teacher
        <input
          className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          value={form.teacher_name}
          onChange={(event) => onChange("teacher_name", event.target.value)}
          required
          maxLength={120}
          placeholder="Grace Hopper"
        />
      </label>

      <label className="grid gap-2 text-sm font-extrabold text-neutral-700">
        Summary
        <textarea
          className="min-h-32 resize-y rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          value={form.summary}
          onChange={(event) => onChange("summary", event.target.value)}
          rows={5}
          placeholder="Describe outcomes, format, and expectations."
        />
      </label>

      <button
        className="rounded-lg bg-emerald-700 px-4 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-soft disabled:cursor-progress disabled:opacity-60"
        type="submit"
        disabled={saving}
      >
        {saving ? "Creating..." : "Create course"}
      </button>
    </form>
  );
}

type CourseCardProps = {
  course: Course;
  enrollment: EnrollStudentInput;
  saving: boolean;
  onEnroll: (event: FormEvent<HTMLFormElement>) => void;
  onEnrollmentChange: (field: keyof EnrollStudentInput, value: string) => void;
};

function CourseCard({
  course,
  enrollment,
  saving,
  onEnroll,
  onEnrollmentChange,
}: CourseCardProps) {
  return (
    <article className="grid gap-5 rounded-lg border border-neutral-200 p-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
      <div className="grid gap-4 sm:grid-cols-[52px_minmax(0,1fr)]">
        <div
          className="flex h-[52px] w-[52px] items-center justify-center rounded-lg bg-emerald-50 text-base font-black text-emerald-700"
          aria-hidden="true"
        >
          {initials(course.title)}
        </div>
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-lg font-black leading-tight text-neutral-950">{course.title}</h3>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              {course.enrolled_count} enrolled
            </span>
          </div>
          <p className="mt-2 leading-7 text-neutral-600">
            {course.summary || "No summary has been added yet."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-500">
            <span>Teacher: {course.teacher_name}</span>
            <span>Created: {formatDate(course.created_at)}</span>
          </div>
        </div>
      </div>

      <form className="grid content-start gap-3" onSubmit={onEnroll}>
        <input
          className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          value={enrollment.student_name}
          onChange={(event) => onEnrollmentChange("student_name", event.target.value)}
          required
          placeholder="Student name"
        />
        <input
          className="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 font-medium outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          value={enrollment.student_email}
          onChange={(event) => onEnrollmentChange("student_email", event.target.value)}
          required
          type="email"
          placeholder="student@example.com"
        />
        <button
          className="rounded-lg bg-emerald-700 px-4 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-soft disabled:cursor-progress disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? "Enrolling..." : "Enroll"}
        </button>
      </form>
    </article>
  );
}

function LoadingCourses() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((item) => (
        <div
          className="grid animate-pulse gap-4 rounded-lg border border-neutral-200 p-4 sm:grid-cols-[52px_minmax(0,1fr)]"
          key={item}
        >
          <span className="h-[52px] w-[52px] rounded-lg bg-neutral-100" />
          <div>
            <strong className="mb-3 block h-5 w-2/5 rounded-lg bg-neutral-100" />
            <p className="mb-2 h-3 w-4/5 rounded-lg bg-neutral-100" />
            <p className="h-3 w-2/3 rounded-lg bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
      <strong className="mb-2 block text-neutral-950">No courses yet</strong>
      <p className="text-neutral-500">Create a course to start building your learning catalog.</p>
    </div>
  );
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  if (!value) {
    return "Today";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}
