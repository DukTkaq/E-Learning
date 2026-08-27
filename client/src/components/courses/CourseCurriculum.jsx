import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Film,
  GraduationCap,
} from "lucide-react";

const OPTION_KEYS = ["A", "B", "C", "D"];

const getOptionText = (question, key) =>
  question[`option_${key.toLowerCase()}`];

function CurriculumSummary({ lessons }) {
  const quizzes = lessons.filter((lesson) => lesson.Quiz).length;
  const questions = lessons.reduce(
    (total, lesson) => total + (lesson.Quiz?.Questions?.length || 0),
    0,
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-700">
        <BookOpen size={20} />
        <p className="mt-2 text-2xl font-bold">{lessons.length}</p>
        <p className="text-sm font-medium">Lessons</p>
      </div>
      <div className="rounded-2xl bg-sky-50 p-4 text-sky-700">
        <GraduationCap size={20} />
        <p className="mt-2 text-2xl font-bold">{quizzes}</p>
        <p className="text-sm font-medium">Quizzes</p>
      </div>
      <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
        <CircleHelp size={20} />
        <p className="mt-2 text-2xl font-bold">{questions}</p>
        <p className="text-sm font-medium">Questions</p>
      </div>
    </div>
  );
}

function QuestionList({ questions = [] }) {
  if (questions.length === 0) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        No questions have been added to this quiz.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, questionIndex) => (
        <div
          key={question.id}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <p className="font-semibold text-slate-800">
            {questionIndex + 1}. {question.content}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {OPTION_KEYS.map((key) => {
              const correct = question.correct_answer === key;
              return (
                <div
                  key={key}
                  className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                    correct
                      ? "border-emerald-200 bg-emerald-50 font-medium text-emerald-800"
                      : "border-slate-100 bg-slate-50 text-slate-600"
                  }`}
                >
                  {correct ? (
                    <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
                  ) : (
                    <span className="font-bold">{key}.</span>
                  )}
                  <span>{getOptionText(question, key)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonCard({ lesson, index }) {
  const quiz = lesson.Quiz;
  const questionCount = quiz?.Questions?.length || 0;

  return (
    <details
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
      open={index === 0}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 hover:bg-slate-50">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-slate-900">
                {lesson.title}
              </h3>
              {lesson.is_final && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                  Final lesson
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {quiz
                ? `1 quiz · ${questionCount} question${questionCount === 1 ? "" : "s"}`
                : "Quiz not added"}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-primary group-open:hidden">
          Show
        </span>
        <span className="hidden shrink-0 text-sm font-semibold text-primary group-open:inline">
          Hide
        </span>
      </summary>

      <div className="border-t border-slate-100 bg-slate-50 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Film size={17} />
          <span className="truncate">
            {lesson.video_url || "No video added"}
          </span>
        </div>

        {!quiz ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            This lesson does not have a quiz yet.
          </p>
        ) : (
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Quiz
                </p>
                <h4 className="mt-1 text-lg font-bold text-slate-900">
                  {quiz.title}
                </h4>
              </div>
              <p className="text-sm text-slate-500">
                Passing score:{" "}
                <span className="font-semibold text-slate-700">
                  {quiz.passing_score}%
                </span>
                {" · "}Max failed attempts:{" "}
                <span className="font-semibold text-slate-700">
                  {quiz.max_attempts}
                </span>
              </p>
            </div>
            <QuestionList questions={quiz.Questions} />
          </section>
        )}
      </div>
    </details>
  );
}

export default function CourseCurriculum({ lessons = [] }) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">
          Course content
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Curriculum</h2>
        <p className="mt-2 text-slate-500">
          Review every lesson, quiz and answer before submitting the course.
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No lessons have been added to this course.
        </div>
      ) : (
        <>
          <CurriculumSummary lessons={lessons} />
          <div className="mt-6 space-y-3">
            {lessons.map((lesson, index) => (
              <LessonCard key={lesson.id} lesson={lesson} index={index} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
