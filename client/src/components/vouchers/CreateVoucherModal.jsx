import { useEffect, useState } from 'react';
import { Loader2, Ticket, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchInstructorCourses } from '../../features/courses/courseApi';
import { createVoucher } from '../../features/voucher/voucherApi';

const EMPTY_FORM = { code: '', discount_percent: '', course_id: '' };

export default function CreateVoucherModal({ isOpen, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;

    setFormData(EMPTY_FORM);
    fetchInstructorCourses({ limit: 50 })
      .then((response) => setCourses(response.data?.courses || []))
      .catch((error) => {
        setCourses([]);
        toast.error(error.response?.data?.message || 'Could not load your courses.');
      });
  }, [isOpen]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const discount = Number(formData.discount_percent);
    if (!Number.isInteger(discount) || discount < 1 || discount > 100) {
      toast.error('Discount must be a whole number between 1 and 100.');
      return;
    }

    setSubmitting(true);
    try {
      await createVoucher(formData);
      toast.success('Voucher created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create voucher.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Ticket className="h-6 w-6 text-primary" /> Create New Voucher
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Voucher Code *</label>
            <input
              type="text"
              required
              maxLength={50}
              value={formData.code}
              onChange={(event) => updateField('code', event.target.value.toUpperCase())}
              placeholder="e.g. SUMMER50"
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 uppercase outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Discount Percentage (%) *</label>
            <input
              type="number"
              required
              min="1"
              max="100"
              step="1"
              value={formData.discount_percent}
              onChange={(event) => updateField('discount_percent', event.target.value)}
              placeholder="e.g. 20"
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Specific Course (Optional)</label>
            <select
              value={formData.course_id}
              onChange={(event) => updateField('course_id', event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="">-- Apply to all my courses --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50">
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {submitting ? 'Creating...' : 'Create Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
