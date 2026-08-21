import { useCallback, useEffect, useRef, useState } from 'react';
import { Edit2, FolderTree, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import AdminFilterBar from './admin/AdminFilterBar';
import AdminPageHeader from './admin/AdminPageHeader';
import Pagination from './common/Pagination';
import api from '../utils/api';
import { clampPage } from '../utils/pagination';

const PAGE_LIMIT = 8;
const EMPTY_FORM = { name: '', description: '' };
const EMPTY_PAGINATION = { page: 1, limit: PAGE_LIMIT, total_items: 0, total_pages: 0 };

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function validateCategoryName(name) {
  const value = String(name || '').trim();
  if (value.length < 2 || value.length > 100) return 'Category name must be between 2 and 100 characters.';
  if (!/^[\p{L}\p{N}\s_-]+$/u.test(value)) return 'Category name contains invalid characters.';
  return null;
}

function CategoryModal({ category, submitting, onClose, onSave }) {
  const [formData, setFormData] = useState(category
    ? { name: category.name, description: category.description || '' }
    : EMPTY_FORM);

  const submit = (event) => {
    event.preventDefault();
    const error = validateCategoryName(formData.name);
    if (error) return toast.error(error);
    onSave({ name: formData.name.trim(), description: formData.description.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-800">{category ? 'Edit Category' : 'Create New Category'}</h2>
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-full p-1 text-gray-400 hover:bg-gray-100"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category Name *</label>
            <input value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} maxLength={100} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="e.g. Web Development" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} rows="3" className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Brief description of this category..." />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{submitting ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoryManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listRef = useRef(null);
  const searchFilter = searchParams.get('search') || '';
  const usageFilter = searchParams.get('usage') || '';
  const currentPage = parsePage(searchParams.get('page'));

  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [totalCategories, setTotalCategories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories', {
        params: {
          paginate: true,
          search: searchFilter || undefined,
          usage: usageFilter || undefined,
          page: currentPage,
          limit: PAGE_LIMIT,
        },
      });
      setCategories(response.data.categories || []);
      setPagination(response.data.pagination || EMPTY_PAGINATION);
      setTotalCategories(response.data.summary?.total || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load categories.');
      setCategories([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchFilter, usageFilter]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
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

  const openCreate = () => {
    setEditingCategory(undefined);
    setModalOpen(true);
  };

  const saveCategory = async (payload) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        toast.success('Category updated successfully.');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created successfully.');
      }
      setModalOpen(false);
      await loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save the category.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (category) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: `Delete ${category.name}? Categories containing courses cannot be deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete category',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/categories/${category.id}`);
      toast.success('Category deleted successfully.');
      await loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete the category.');
    }
  };

  const hasFilters = Boolean(searchFilter || usageFilter);

  return (
    <section>
      <AdminPageHeader
        icon={FolderTree}
        eyebrow="Catalog Structure"
        title="Category Management"
        description="Manage course categories across the platform."
        summary={`${totalCategories} categories total${hasFilters ? ` · ${pagination.total_items} matching` : ''}`}
        actions={(
          <>
            <button type="button" onClick={loadCategories} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:text-primary disabled:opacity-60"><RefreshCw size={18} /> Refresh</button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white shadow-sm hover:opacity-90"><Plus size={18} /> Create Category</button>
          </>
        )}
      />

      <div ref={listRef} className="scroll-mt-24">
        <AdminFilterBar
          search={searchInput}
          searchPlaceholder="Search name or description..."
          disabled={loading}
          hasFilters={Boolean(searchInput.trim() || usageFilter)}
          onSearchChange={setSearchInput}
          onSearch={(event) => { event.preventDefault(); updateFilter('search', searchInput.trim()); }}
          onClear={() => { setSearchInput(''); setSearchParams({}); }}
        >
          <select value={usageFilter} onChange={(event) => updateFilter('usage', event.target.value)} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-primary disabled:opacity-60">
            <option value="">All categories</option>
            <option value="in_use">Contains courses</option>
            <option value="empty">No courses</option>
          </select>
        </AdminFilterBar>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm text-gray-600">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-6 py-4 font-semibold">ID</th><th className="px-6 py-4 font-semibold">Name</th><th className="px-6 py-4 font-semibold">Description</th><th className="px-6 py-4 text-right font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading || correctingPage ? (
                <tr><td colSpan="4" className="p-12 text-center text-gray-500">Loading categories...</td></tr>
              ) : categories.length ? categories.map((category) => (
                <tr key={category.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 text-gray-500">#{category.id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{category.name}</td>
                  <td className="max-w-md truncate px-6 py-4 text-gray-500">{category.description || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" onClick={() => { setEditingCategory(category); setModalOpen(true); }} className="inline-flex items-center gap-1 rounded-lg p-2 text-gray-400 hover:bg-primary/10 hover:text-primary"><Edit2 size={16} /> Edit</button>
                    <button type="button" onClick={() => deleteCategory(category)} className="ml-2 inline-flex items-center gap-1 rounded-lg p-2 text-gray-400 hover:bg-error/10 hover:text-error"><Trash2 size={16} /> Delete</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-12 text-center text-gray-500">No matching categories found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6"><Pagination page={pagination.page} totalPages={pagination.total_pages} onPageChange={changePage} disabled={loading} ariaLabel="Category pagination" /></div>
      </div>

      {modalOpen && <CategoryModal category={editingCategory} submitting={submitting} onClose={() => setModalOpen(false)} onSave={saveCategory} />}
    </section>
  );
}
