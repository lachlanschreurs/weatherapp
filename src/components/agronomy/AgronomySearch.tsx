import { Search, X } from 'lucide-react';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  cropFilter: string;
  onCropChange: (c: string) => void;
  categoryFilter: string;
  onCategoryChange: (c: string) => void;
  activeTab: string;
  allCrops: string[];
}

const CHEMICAL_CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'fungicide', label: 'Fungicide' },
  { value: 'insecticide', label: 'Insecticide' },
  { value: 'herbicide', label: 'Herbicide' },
  { value: 'miticide', label: 'Miticide' },
  { value: 'other', label: 'Other' },
];

export function AgronomySearch({ query, onQueryChange, cropFilter, onCropChange, categoryFilter, onCategoryChange, activeTab, allCrops }: Props) {
  const hasFilters = query || cropFilter || categoryFilter;

  const clearAll = () => {
    onQueryChange('');
    onCropChange('');
    onCategoryChange('');
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={
            activeTab === 'chemicals' ? 'Search by product name or active ingredient...' :
            activeTab === 'diseases' ? 'Search by disease name or pathogen...' :
            activeTab === 'pests' ? 'Search by pest name or type...' :
            'Search by weed name or family...'
          }
          className="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-green-500/60 focus:bg-slate-800 transition-all text-sm"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={cropFilter}
          onChange={e => onCropChange(e.target.value)}
          className="flex-1 min-w-40 px-3 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-green-500/60 transition-colors appearance-none cursor-pointer"
        >
          <option value="">All crops</option>
          {allCrops.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {activeTab === 'chemicals' && (
          <select
            value={categoryFilter}
            onChange={e => onCategoryChange(e.target.value)}
            className="flex-1 min-w-40 px-3 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-green-500/60 transition-colors appearance-none cursor-pointer"
          >
            {CHEMICAL_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-400 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
