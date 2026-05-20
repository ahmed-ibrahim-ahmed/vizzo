/**
 * @vizzo/storefront — App Entry
 * Buyer Storefront SPA for vizzotrade.com/:slug
 * Will be assembled in P3-15 with all storefront routes.
 * Currently renders a placeholder.
 */

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Vizzo Storefront</h1>
        <p style={{ fontSize: '1rem', opacity: 0.8 }}>واجهة المتجر — قيد الإنشاء</p>
      </div>
    </div>
  );
}

export default App;
