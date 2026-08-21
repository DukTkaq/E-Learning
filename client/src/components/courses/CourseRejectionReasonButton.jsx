import { CircleHelp } from 'lucide-react';
import Swal from 'sweetalert2';

export default function CourseRejectionReasonButton({ reason }) {
  if (!reason) return null;

  const showReason = () => Swal.fire({
    title: 'Why this course was rejected',
    text: reason,
    icon: 'info',
    confirmButtonText: 'Got it',
    confirmButtonColor: '#4f46e5',
  });

  return (
    <button
      type="button"
      onClick={showReason}
      title="View rejection reason"
      aria-label="View course rejection reason"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-error/25 bg-error/10 text-error transition hover:bg-error/20"
    >
      <CircleHelp size={16} />
    </button>
  );
}
