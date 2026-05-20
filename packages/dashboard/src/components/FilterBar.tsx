/**
 * @vizzo/dashboard — Filter Bar
 * Search input + category chip toggles for product filtering.
 */

import { DASHBOARD_STRINGS, CATEGORIES } from '@vizzo/shared';
import type { Category } from '@vizzo/shared';
import '../styles/productlist.css';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: Category | null;
  setCategoryFilter: (category: Category | null) => void;
}

const CATEGORY_CHIPS: Array<{ key: Category | null; label: string }> = [
  { key: null, label: DASHBOARD_STRINGS.filterAll },
  { key: 'phones' as Category, label: DASHBOARD_STRINGS.filterPhones },
  { key: 'accessories' as Category, label: DASHBOARD_STRINGS.filterAccessories },
  { key: 'laptops' as Category, label: DASHBOARD_STRINGS.filterComputers },
];

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
}: FilterBarProps) {
  return (
    <div className="filter-bar" role="search">
      {/* Search Input */}
      <div className="search-input-wrapper">
        <svg
          className="search-input-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder={DASHBOARD_STRINGS.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={DASHBOARD_STRINGS.searchPlaceholder}
        />
      </div>

      {/* Category Chips */}
      <div className="filter-chips" role="tablist" aria-label="فلترة الفئة">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.key ?? 'all'}
            className={`filter-chip${categoryFilter === chip.key ? ' active' : ''}`}
            onClick={() => setCategoryFilter(chip.key)}
            role="tab"
            aria-selected={categoryFilter === chip.key}
            type="button"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
