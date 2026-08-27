import { BookOpenCheck, FilePenLine, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: FilePenLine,
    title: "1. Save draft",
    text: "Create the course information.",
  },
  {
    icon: BookOpenCheck,
    title: "2. Add content",
    text: "Add 3+ lessons, mark the last as final, then add one quiz and 3+ questions per lesson.",
  },
  {
    icon: ShieldCheck,
    title: "3. Submit",
    text: "Send the completed course to Admin.",
  },
];

export default function CourseWorkflowHint() {
  return (
    <div className="mb-6 grid gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4 md:grid-cols-3">
      {STEPS.map(({ icon: Icon, title, text }) => (
        <div
          key={title}
          className="flex items-start gap-3 rounded-xl bg-white/80 p-3"
        >
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{title}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
