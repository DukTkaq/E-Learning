import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, RefreshCw, UserCheck, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import AdminFilterBar from '../../components/admin/AdminFilterBar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Pagination from '../../components/common/Pagination';
import { approveInstructor, fetchInstructorRequests, rejectInstructor } from '../../features/admin/adminApi';
import { clampPage } from '../../utils/pagination';

const PAGE_LIMIT = 8;
const EMPTY_PAGINATION = { page: 1, limit: PAGE_LIMIT, total_items: 0, total_pages: 0 };

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function InstructorApprovalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listRef = useRef(null);
  const searchFilter = searchParams.get('search') || '';
  const profileFilter = searchParams.get('profile') || '';
  const currentPage = parsePage(searchParams.get('page'));

  const [requests, setRequests] = useState([]);
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchInstructorRequests({
        search: searchFilter || undefined,
        profile: profileFilter || undefined,
        page: currentPage,
        limit: PAGE_LIMIT,
      });
      setRequests(response.data.requests || []);
      setPagination(response.data.pagination || EMPTY_PAGINATION);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load instructor requests.');
      setRequests([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [currentPage, profileFilter, searchFilter]);

  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => { setSearchInput(searchFilter); }, [searchFilter]);

  const validPage = clampPage(currentPage, pagination.total_pages);
  const correctingPage = !loading && currentPage !== validPage;

  useEffect(() => {
    if (!correctingPage) return;
    const next = new URLSearchParams(searchParams);
    if (validPage === 1) next.delete('page'); else next.set('page', String(validPage));
    setSearchParams(next, { replace: true });
  }, [correctingPage, searchParams, setSearchParams, validPage]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const changePage = (page) => {
    if (page < 1 || page > pagination.total_pages || page === currentPage) return;
    const next = new URLSearchParams(searchParams);
    if (page === 1) next.delete('page'); else next.set('page', String(page));
    setSearchParams(next);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReview = async (user, action) => {
    setSelectedRequest(null);
    const isApprove = action === 'approve';
    const result = await Swal.fire({
      title: `${isApprove ? 'Approve' : 'Reject'} this request?`,
      text: isApprove
        ? `${user.name} will be granted Instructor privileges.`
        : 'Their application will be denied and their role will remain Student.',
      icon: isApprove ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'Yes, Approve' : 'Yes, Reject',
      confirmButtonColor: isApprove ? '#22c55e' : '#ef4444',
    });
    if (!result.isConfirmed) return;

    setReviewingId(user.id);
    try {
      if (isApprove) await approveInstructor(user.id); else await rejectInstructor(user.id);
      toast.success(`Instructor request ${isApprove ? 'approved' : 'rejected'} for ${user.name}.`);
      await loadRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not process the request.');
    } finally {
      setReviewingId(null);
    }
  };

  const hasFilters = Boolean(searchFilter || profileFilter);

  return (
    <section>
      <AdminPageHeader
        icon={UserCheck}
        eyebrow="Instructor Approval"
        title="Review Instructor Applications"
        description="Approve students who applied to become instructors."
        summary={`${pagination.total_items} pending applications`}
        actions={(
          <button type="button" onClick={loadRequests} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:text-primary disabled:opacity-60">
            <RefreshCw size={18} /> Refresh
          </button>
        )}
      />

      <div ref={listRef} className="scroll-mt-24">
        <AdminFilterBar
          search={searchInput}
          searchPlaceholder="Search applicant, email or expertise..."
          disabled={loading}
          hasFilters={Boolean(searchInput.trim() || profileFilter)}
          onSearchChange={setSearchInput}
          onSearch={(event) => { event.preventDefault(); updateFilter('search', searchInput.trim()); }}
          onClear={() => { setSearchInput(''); setSearchParams({}); }}
        >
          <select value={profileFilter} onChange={(event) => updateFilter('profile', event.target.value)} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
            <option value="">All profiles</option>
            <option value="complete">Complete profile</option>
            <option value="incomplete">Missing information</option>
          </select>
        </AdminFilterBar>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm text-gray-600">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Applicant</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Expertise</th>
                <th className="px-6 py-4 font-semibold">Applied At</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading || correctingPage ? (
                <tr><td colSpan="5" className="p-12 text-center text-gray-500">Loading requests...</td></tr>
              ) : requests.length ? requests.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary">
                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.expertise || 'Not provided'}</td>
                  <td className="px-6 py-4">{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" onClick={() => setSelectedRequest(user)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-100"><Eye size={16} /> Details</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-12 text-center text-gray-500">{hasFilters ? 'No matching applications.' : 'No pending instructor applications.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6"><Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={changePage} disabled={loading} ariaLabel="Instructor application pagination" /></div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800"><UserCheck className="text-primary" size={24} /> Application Details</h3>
              <button type="button" onClick={() => setSelectedRequest(null)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-200"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              <div><h4 className="text-lg font-bold text-slate-800">{selectedRequest.name}</h4><p className="text-sm text-gray-500">{selectedRequest.email}</p></div>
              <div><p className="text-xs font-bold uppercase text-gray-400">Expertise</p><p className="mt-1 rounded-xl border bg-gray-50 p-3">{selectedRequest.expertise || 'Not provided'}</p></div>
              <div><p className="text-xs font-bold uppercase text-gray-400">Bio & Experience</p><div className="mt-1 min-h-24 whitespace-pre-wrap rounded-xl border bg-gray-50 p-3">{selectedRequest.bio || 'Not provided'}</div></div>
              <div><p className="text-xs font-bold uppercase text-gray-400">Portfolio / CV</p>{selectedRequest.portfolio_url ? <a href={selectedRequest.portfolio_url} target="_blank" rel="noreferrer" className="mt-1 block truncate rounded-xl border border-primary/10 bg-primary/5 p-3 font-medium text-primary hover:underline">{selectedRequest.portfolio_url}</a> : <p className="mt-1 rounded-xl border bg-gray-50 p-3 text-gray-500">Not provided</p>}</div>
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => handleReview(selectedRequest, 'reject')} disabled={reviewingId === selectedRequest.id} className="rounded-xl border border-red-200 px-5 py-2.5 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Reject Application</button>
                <button type="button" onClick={() => handleReview(selectedRequest, 'approve')} disabled={reviewingId === selectedRequest.id} className="rounded-xl bg-green-500 px-5 py-2.5 font-semibold text-white hover:bg-green-600 disabled:opacity-50">{reviewingId === selectedRequest.id ? 'Processing...' : 'Approve Application'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
