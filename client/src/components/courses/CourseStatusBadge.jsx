const STYLES = {
  Draft: "bg-slate-100 text-slate-600",
  Approved: "bg-success/10 text-success",
  Pending: "bg-accent/15 text-accent",
  Rejected: "bg-error/10 text-error",
  Hidden: "bg-slate-200 text-slate-600",
};

export default function CourseStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status] || "bg-primary/10 text-primary"}`}
    >
      {status}
    </span>
  );
}
