const PRESETS = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
  { key: 'all', label: 'All time' },
];

export default function RevenueFilters({ from, to, activePreset, disabled, onPreset, onDateChange }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Quick range</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                disabled={disabled}
                onClick={() => onPreset(preset.key)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${activePreset === preset.key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:text-primary'}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {['from', 'to'].map((field) => (
            <label key={field} className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {field}
              <input
                type="date"
                value={field === 'from' ? from : to}
                disabled={disabled}
                onChange={(event) => onDateChange(field, event.target.value)}
                className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal normal-case text-slate-700 outline-none focus:border-primary disabled:opacity-60"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
