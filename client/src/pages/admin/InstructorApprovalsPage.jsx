import { useCallback, useEffect, useState } from 'react';
import { UserCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { fetchInstructorRequests, approveInstructor, rejectInstructor } from '../../features/admin/adminApi';

export default function InstructorApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchInstructorRequests();
      setRequests(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load instructor requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (user, action) => {
    const isApprove = action === 'approve';
    const result = await Swal.fire({
      title: `${isApprove ? 'Approve' : 'Reject'} this request?`,
      text: isApprove 
        ? `${user.name} will be granted Instructor privileges.` 
        : `Their application will be denied and their role will remain Student.`,
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'Yes, Approve' : 'Yes, Reject',
      confirmButtonColor: isApprove ? '#22c55e' : '#ef4444',
    });

    if (!result.isConfirmed) return;

    setReviewingId(user.id);
    try {
      if (isApprove) {
        await approveInstructor(user.id);
        toast.success(`Instructor request approved for ${user.name}.`);
      } else {
        await rejectInstructor(user.id);
        toast.success(`Instructor request rejected.`);
      }
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not process the request.');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <UserCheck size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Instructor Approval</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Review Instructor Applications</h1>
          <p className="mt-2 text-gray-500">Approve students who applied to become instructors.</p>
        </div>
        <button 
          type="button" 
          onClick={load} 
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:text-primary"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-14 text-center text-gray-500">Loading requests...</div>
      ) : requests.length ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Applicant</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Applied At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-100 bg-gray-100">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-bold text-gray-400">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleReview(user, 'reject')}
                        disabled={reviewingId === user.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleReview(user, 'approve')}
                        disabled={reviewingId === user.id}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        {reviewingId === user.id ? 'Processing...' : 'Approve'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center">
          <UserCheck className="mx-auto text-primary" size={38} />
          <h2 className="mt-4 text-xl font-bold text-slate-800">No pending requests</h2>
          <p className="mt-1 text-gray-500">There are no students waiting to become instructors.</p>
        </div>
      )}
    </section>
  );
}
