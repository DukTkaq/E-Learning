import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, RefreshCw, Ticket } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import Pagination from '../../components/common/Pagination';
import CreateVoucherModal from '../../components/vouchers/CreateVoucherModal';
import VoucherFilters from '../../components/vouchers/VoucherFilters';
import VoucherTable from '../../components/vouchers/VoucherTable';
import { deleteVoucher, fetchVouchers } from '../../features/voucher/voucherApi';
import { clampPage } from '../../utils/pagination';

const PAGE_LIMIT = 8;
const EMPTY_PAGINATION = { page: 1, limit: PAGE_LIMIT, total_items: 0, total_pages: 0 };

function parsePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function VoucherManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listRef = useRef(null);

  const searchFilter = searchParams.get('search') || '';
  const scopeFilter = searchParams.get('scope') || '';
  const discountFilter = searchParams.get('discount') || '';
  const currentPage = parsePage(searchParams.get('page'));

  const [vouchers, setVouchers] = useState([]);
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [totalVouchers, setTotalVouchers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchVouchers({
        search: searchFilter || undefined,
        scope: scopeFilter || undefined,
        discount: discountFilter || undefined,
        page: currentPage,
        limit: PAGE_LIMIT,
      });
      setVouchers(response.data.vouchers || []);
      setPagination(response.data.pagination || EMPTY_PAGINATION);
      setTotalVouchers(response.data.summary?.total || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load vouchers.');
      setVouchers([]);
      setPagination(EMPTY_PAGINATION);
      setTotalVouchers(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, discountFilter, scopeFilter, searchFilter]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  useEffect(() => {
    setSearchInput(searchFilter);
  }, [searchFilter]);

  const validPage = clampPage(currentPage, pagination.total_pages);
  const correctingOutOfRangePage = !loading && currentPage !== validPage;

  useEffect(() => {
    if (!correctingOutOfRangePage) return;

    const nextParams = new URLSearchParams(searchParams);
    if (validPage === 1) nextParams.delete('page');
    else nextParams.set('page', String(validPage));
    setSearchParams(nextParams, { replace: true });
  }, [correctingOutOfRangePage, searchParams, setSearchParams, validPage]);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const applySearch = (event) => {
    event.preventDefault();
    updateFilter('search', searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const changePage = (page) => {
    if (page < 1 || page > pagination.total_pages || page === currentPage) return;

    const nextParams = new URLSearchParams(searchParams);
    if (page === 1) nextParams.delete('page');
    else nextParams.set('page', String(page));
    setSearchParams(nextParams);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (voucher) => {
    const result = await Swal.fire({
      title: 'Delete Voucher?',
      text: `Are you sure you want to delete ${voucher.code}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
    });
    if (!result.isConfirmed) return;

    setDeletingId(voucher.id);
    try {
      await deleteVoucher(voucher.id);
      toast.success('Voucher deleted successfully.');
      await loadVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete voucher.');
    } finally {
      setDeletingId('');
    }
  };

  const handleCreated = () => {
    const isFirstUnfilteredPage = currentPage === 1
      && !searchFilter
      && !scopeFilter
      && !discountFilter;

    if (isFirstUnfilteredPage) loadVouchers();
    else setSearchParams({});
  };

  const hasAppliedFilters = Boolean(searchFilter || scopeFilter || discountFilter);

  return (
    <section>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Ticket size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Marketing</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Voucher Management</h1>
          <p className="mt-2 text-gray-500">
            {totalVouchers} voucher{totalVouchers === 1 ? '' : 's'} total
            {hasAppliedFilters ? ` · ${pagination.total_items} matching` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadVouchers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm transition-colors hover:text-primary disabled:opacity-60"
          >
            <RefreshCw size={18} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus size={18} /> New Voucher
          </button>
        </div>
      </div>

      <div ref={listRef} className="scroll-mt-24">
        <VoucherFilters
          search={searchInput}
          scope={scopeFilter}
          discount={discountFilter}
          disabled={loading}
          onSearchChange={setSearchInput}
          onSearch={applySearch}
          onScopeChange={(value) => updateFilter('scope', value)}
          onDiscountChange={(value) => updateFilter('discount', value)}
          onClear={clearFilters}
        />

        <VoucherTable
          vouchers={vouchers}
          loading={loading || correctingOutOfRangePage}
          deletingId={deletingId}
          hasFilters={hasAppliedFilters}
          onDelete={handleDelete}
          onCreate={() => setIsModalOpen(true)}
        />

        <div className="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.total_pages}
            onPageChange={changePage}
            disabled={loading}
            ariaLabel="Voucher pagination"
          />
        </div>
      </div>

      <CreateVoucherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </section>
  );
}
