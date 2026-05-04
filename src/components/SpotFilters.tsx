import type { FilterType } from '../types';

type SortType = 'default' | 'distance' | 'least-busy';

type SpotFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterType;
  onFilterChange: (value: FilterType) => void;
  sort?: SortType;
  onSortChange?: (value: SortType) => void;
};

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: '📋 All Spots' },
  { key: 'available', label: '🟢 Available' },
  { key: 'silent', label: '🤫 Silent' },
  { key: 'group', label: '👥 Group' },
  { key: 'open now', label: '🕐 Open Now' },
  { key: 'outlets', label: '🔌 Outlets' },
  { key: 'near me', label: '📍 Near Me' },
];

const sortOptions: { key: SortType; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'distance', label: 'Closest' },
  { key: 'least-busy', label: 'Least Busy' },
];

export default function SpotFilters({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sort = 'default',
  onSortChange,
}: SpotFiltersProps) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by building or spot name..."
        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-500 transition-colors"
      />

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => onFilterChange(option.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold border transition-all active:scale-95 ${activeFilter === option.key
                ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                : 'bg-white text-gray-700 border-gray-300 hover:border-violet-400 hover:bg-violet-50'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {onSortChange && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sort:</span>
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onSortChange(option.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all active:scale-95 ${sort === option.key
                  ? 'bg-violet-100 text-violet-700 border-violet-400'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-violet-300'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}