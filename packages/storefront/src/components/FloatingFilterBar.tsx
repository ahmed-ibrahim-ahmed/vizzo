import '../styles/filterbar.css';

interface FloatingFilterBarProps {
  activeCategory: string; // 'all', 'phones', 'laptops', 'accessories'
  onCategoryChange: (category: string) => void;
  sortBy: string; // 'newest', 'lowest_price', 'highest_price'
  onSortChange: (sortBy: string) => void;
}

export function FloatingFilterBar({
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: FloatingFilterBarProps) {
  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'phones', label: 'هواتف' },
    { id: 'laptops', label: 'أجهزة لابتوب' },
    { id: 'accessories', label: 'ملحقات' },
  ];

  return (
    <div className="filter-bar-sticky-wrapper">
      <div className="filter-bar">
        {/* Category chips */}
        <div className="category-chips-container">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="sort-dropdown-container">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="ترتيب المنتجات"
          >
            <option value="newest">الأحدث</option>
            <option value="lowest_price">أقل سعر</option>
            <option value="highest_price">أعلى سعر</option>
          </select>
        </div>
      </div>
    </div>
  );
}
