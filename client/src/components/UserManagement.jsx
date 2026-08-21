import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Users, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminFilterBar from './admin/AdminFilterBar';
import AdminPageHeader from './admin/AdminPageHeader';
import Pagination from './common/Pagination';
import { banUser, fetchUsers, unbanUser } from '../features/admin/adminApi';
import { clampPage } from '../utils/pagination';

const PAGE_LIMIT = 8;
const EMPTY_PAGINATION = { page: 1, limit: PAGE_LIMIT, total_items: 0, total_pages: 0 };

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function UserManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listRef = useRef(null);
  const searchFilter = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || '';
  const statusFilter = searchParams.get('status') || '';
  const currentPage = parsePage(searchParams.get('page'));

  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [processing, setProcessing] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchUsers({
        search: searchFilter || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit: PAGE_LIMIT,
      });
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || EMPTY_PAGINATION);
      setTotalUsers(response.data.summary?.total || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load users.');
      setUsers([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter, searchFilter, statusFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
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

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    const isBanning = selectedUser.status === 'Active';
    setProcessing(true);
    try {
      if (isBanning) await banUser(selectedUser.id); else await unbanUser(selectedUser.id);
      toast.success(`User ${isBanning ? 'banned' : 'unbanned'} successfully.`);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update this user.');
    } finally {
      setProcessing(false);
    }
  };

  const hasFilters = Boolean(searchFilter || roleFilter || statusFilter);

  return (
    <section>
      <AdminPageHeader
        icon={Users}
        eyebrow="Administration"
        title="User Management"
        description="Manage accounts, roles and platform access."
        summary={`${totalUsers} users total${hasFilters ? ` · ${pagination.total_items} matching` : ''}`}
        actions={(
          <button type="button" onClick={loadUsers} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:text-primary disabled:opacity-60">
            <RefreshCw size={18} /> Refresh
          </button>
        )}
      />

      <div ref={listRef} className="scroll-mt-24">
        <AdminFilterBar
          search={searchInput}
          searchPlaceholder="Search name or email..."
          disabled={loading}
          hasFilters={Boolean(searchInput.trim() || roleFilter || statusFilter)}
          onSearchChange={setSearchInput}
          onSearch={(event) => { event.preventDefault(); updateFilter('search', searchInput.trim()); }}
          onClear={() => { setSearchInput(''); setSearchParams({}); }}
        >
          <select value={roleFilter} onChange={(event) => updateFilter('role', event.target.value)} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
            <option value="">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Instructor">Instructor</option>
            <option value="Student">Student</option>
          </select>
          <select value={statusFilter} onChange={(event) => updateFilter('status', event.target.value)} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Banned">Banned</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </AdminFilterBar>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm text-gray-600">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading || correctingPage ? (
                <tr><td colSpan="5" className="p-12 text-center text-gray-500">Loading users...</td></tr>
              ) : users.length ? users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{user.name.charAt(0).toUpperCase()}</div>
                      <div><p className="font-semibold text-gray-900">{user.name}</p><p className="text-gray-500">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">{user.Role?.role_name || 'N/A'}</span></td>
                  <td className="px-6 py-4">{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    {user.Role?.role_name !== 'Admin' && ['Active', 'Banned'].includes(user.status) && (
                      <button type="button" onClick={() => setSelectedUser(user)} className={`rounded-lg px-4 py-2 font-medium ${user.status === 'Active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>{user.status === 'Active' ? 'Ban' : 'Unban'}</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-12 text-center text-gray-500">No matching users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6"><Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={changePage} disabled={loading} ariaLabel="User pagination" /></div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${selectedUser.status === 'Active' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}><AlertTriangle size={24} /></div>
              <button type="button" onClick={() => setSelectedUser(null)} disabled={processing} className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Confirm {selectedUser.status === 'Active' ? 'Ban' : 'Unban'} User</h3>
            <p className="my-5 text-gray-500">Update access for <strong className="text-gray-800">{selectedUser.email}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setSelectedUser(null)} disabled={processing} className="rounded-xl bg-gray-100 px-5 py-2.5 font-medium text-gray-700">Cancel</button>
              <button type="button" onClick={handleToggleStatus} disabled={processing} className={`rounded-xl px-5 py-2.5 font-medium text-white ${selectedUser.status === 'Active' ? 'bg-red-600' : 'bg-green-600'} disabled:opacity-60`}>{processing ? 'Processing...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
