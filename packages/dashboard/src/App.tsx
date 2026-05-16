/**
 * @vizzo/dashboard — App Entry
 * Merchant Dashboard SPA for app.vizzotrade.com
 * Will be assembled in P2-17 with all dashboard routes.
 * Currently renders a placeholder with BrowserRouter.
 */

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Vizzo Dashboard</h1>
        <p style={{ fontSize: '1rem', opacity: 0.8 }}>لوحة التحكم — قيد الإنشاء</p>
      </div>
    </div>
  );
}

export default App;
