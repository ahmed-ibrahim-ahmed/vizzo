/**
 * @vizzo/landing — App Entry
 * Landing page SPA for vizzotrade.com
 * Will be assembled in P1-08 with all spatial funnel components.
 * Currently renders a placeholder.
 */

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>Vizzo</h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.8 }}>حول فوضى الواتساب إلى متجر احترافي في 10 ثوانٍ</p>
      </div>
    </div>
  );
}

export default App;
