import { useCallback, useEffect, useState } from 'react';
import { Ticket, Plus, RefreshCw, X, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { fetchVouchers, createVoucher, deleteVoucher } from '../../features/voucher/voucherApi';
import { fetchInstructorCourses } from '../../features/courses/courseApi';

function CreateVoucherModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    course_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ code: '', discount_percent: '', course_id: '' });
      fetchInstructorCourses().then(res => setCourses(res.data?.courses || [])).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.discount_percent < 1 || formData.discount_percent > 100) {
      return toast.error('Discount must be between 1 and 100');
    }
    
    setLoading(true);
    try {
      await createVoucher(formData);
      toast.success('Voucher created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create voucher.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Ticket className="text-primary w-6 h-6" /> Create New Voucher
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Voucher Code *</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all uppercase"
              placeholder="e.g. SUMMER50"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Discount Percentage (%) *</label>
            <input
              type="number"
              required
              min="1"
              max="100"
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="e.g. 20"
              value={formData.discount_percent}
              onChange={e => setFormData({ ...formData, discount_percent: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Specific Course (Optional)</label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              value={formData.course_id}
              onChange={e => setFormData({ ...formData, course_id: e.target.value })}
            >
              <option value="">-- Apply to all my courses --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50 transition-colors">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Creating...' : 'Create Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VoucherManagementPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchVouchers();
      setVouchers(response.data || []);
    } catch (error) {
      toast.error('Could not load vouchers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (voucherId, code) => {
    const result = await Swal.fire({
      title: 'Delete Voucher?',
      text: `Are you sure you want to delete the voucher ${code}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deleteVoucher(voucherId);
        toast.success('Voucher deleted successfully.');
        load();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete voucher.');
      }
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Ticket size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Marketing</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Voucher Management</h1>
          <p className="mt-2 text-gray-500">Create discount coupons for your courses to boost sales.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:text-primary transition-colors">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
            <Plus size={18} /> New Voucher
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-14 text-center text-gray-500 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
          <p>Loading vouchers...</p>
        </div>
      ) : vouchers.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Discount</th>
                <th className="px-6 py-4 font-semibold">Target Course</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">{v.code}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {v.discount_percent}% OFF
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {v.Course ? v.Course.title : <span className="text-gray-400 italic">All Courses</span>}
                  </td>
                  <td className="px-6 py-4">{new Date(v.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(v.id, v.code)}
                      className="p-2 text-slate-400 hover:bg-error/10 hover:text-error rounded-lg transition-colors"
                      title="Delete Voucher"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center">
          <Ticket className="mx-auto text-primary" size={38} />
          <h2 className="mt-4 text-xl font-bold text-slate-800">No vouchers yet</h2>
          <p className="mt-1 text-gray-500 mb-6">Create your first voucher to attract more students.</p>
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
            <Plus size={18} /> Create Voucher
          </button>
        </div>
      )}

      <CreateVoucherModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={load}
      />
    </section>
  );
}
