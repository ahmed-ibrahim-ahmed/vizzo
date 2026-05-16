/**
 * @vizzo/landing — App Assembly (P1-08)
 * Renders all components in exact spatial funnel order:
 * Header → HeroSection → PainPoints → Features → ViralProof → Pricing → FinalCTA
 * No React Router — single page with anchor scroll only.
 * Supabase client initialized and passed via props to auth-triggering components.
 */

import { createSupabaseClient } from '@vizzo/shared/supabase';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import PainPoints from './components/PainPoints';
import Features from './components/Features';
import ViralProof from './components/ViralProof';
import Pricing from './components/Pricing';
import FinalCTA from './components/FinalCTA';

function App() {
  const supabase = createSupabaseClient();

  const handleLogin = async () => {
    if (!supabase) {
      console.warn('[Vizzo] Cannot login — Supabase is not configured. Set environment variables to enable Google OAuth.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://app.vizzotrade.com',
      },
    });
  };

  return (
    <>
      <Header onLogin={handleLogin} />
      <HeroSection onLogin={handleLogin} />
      <PainPoints />
      <Features />
      <ViralProof />
      <Pricing />
      <FinalCTA onLogin={handleLogin} />
    </>
  );
}

export default App;
