import { Search } from 'lucide-react';

const STATUS_FILTERS = ['', 'Pending', 'Approved', 'Rejected', 'Hidden'];

export default function CourseApprovalToolbar({ status, search, onStatusChange, onSearchChange, onSearchSubmit }) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter || 'All'}
              type="button"
              onClick={() => onStatusChange(filter)}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${status === filter ? 'bg-primary text-white' : 'bg-slate-100 text-gray-600 hover:text-primary'}`}
            >
              {filter || 'All'}
            </button>
          ))}
        </div>

        <form onSubmit={onSearchSubmit} className="flex min-w-0 overflow-hidden rounded-xl border border-gray-200 lg:w-80">
          <Search className="ml-3 self-center text-gray-400" size={17} />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} className="min-w-0 flex-1 px-3 py-2.5 outline-none" placeholder="Search course title..." />
          <button type="submit" className="bg-slate-900 px-4 text-sm font-semibold text-white">Search</button>
        </form>
      </div>
    </div>
  );
}
