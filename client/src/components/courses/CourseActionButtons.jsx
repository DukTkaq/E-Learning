import {
  Edit3,
  Eye,
  EyeOff,
  List,
  LoaderCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import {
  canEditCourse,
  getCourseReadOnlyNotice,
} from "../../features/courses/courseStatus";

export default function CourseActionButtons({
  course,
  submitting,
  onView,
  onViewReviews,
  onEdit,
  onHide,
  onViewLessons,
  onSubmitForApproval,
}) {
  const canSubmit = ["Draft", "Rejected"].includes(course.status);
  const isHidden = course.status === "Hidden";
  const isPending = course.status === "Pending";
  const editable = canEditCourse(course.status);
  const readOnlyNotice = getCourseReadOnlyNotice(course.status);

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => onView(course)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <Eye size={16} /> View
      </button>
      <button
        type="button"
        onClick={() => onViewReviews(course)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <MessageSquare size={16} /> Reviews
      </button>
      {onViewLessons && (
        <button
          type="button"
          onClick={() => onViewLessons(course)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-secondary hover:bg-secondary/10"
        >
          <List size={16} /> Lessons
        </button>
      )}
      <button
        type="button"
        onClick={() => onEdit(course)}
        disabled={!editable}
        title={readOnlyNotice?.title || "Edit course"}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Edit3 size={16} /> Edit
      </button>
      {canSubmit && (
        <button
          type="button"
          onClick={() => onSubmitForApproval(course)}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <LoaderCircle className="animate-spin" size={16} />
          ) : (
            <Send size={16} />
          )}
          Submit
        </button>
      )}
      <button
        type="button"
        onClick={() => onHide(course)}
        disabled={isHidden || isPending}
        title={isPending ? "Course is under review" : "Hide course"}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <EyeOff size={16} /> Hide
      </button>
    </div>
  );
}
