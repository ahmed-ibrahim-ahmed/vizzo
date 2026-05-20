/**
 * @vizzo/dashboard — Analytics Cards
 * Three large numerical indicator cards at top of inventory page.
 * Shows visitors, interest, and conversion counts.
 */

import { useAnalytics } from '../hooks/useAnalytics';
import '../styles/analytics.css';

function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return String(n);
}

export default function AnalyticsCards() {
  const { pageViews, interestCount, conversionCount, loading } = useAnalytics();

  return (
    <div className="analytics-row" role="region" aria-label="إحصائيات المتجر">
      {/* Visitors Card */}
      <div className="analytics-card card-visitors">
        <span className="analytics-card-value">
          {loading ? '—' : formatNumber(pageViews)}
        </span>
        <span className="analytics-card-label">الزوار</span>
      </div>

      {/* Interest Card */}
      <div className="analytics-card card-interest">
        <span className="analytics-card-value">
          {loading ? '—' : formatNumber(interestCount)}
        </span>
        <span className="analytics-card-label">الاهتمام</span>
      </div>

      {/* Conversion Card */}
      <div className="analytics-card card-conversion">
        <span className="analytics-card-value">
          {loading ? '—' : formatNumber(conversionCount)}
        </span>
        <span className="analytics-card-label">التحويل</span>
      </div>
    </div>
  );
}
