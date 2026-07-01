import { useState } from 'react';
import BackgroundVideo from '../Landing/BackgroundVideo.jsx';
import LandingNavbar  from '../Landing/LandingNavbar.jsx';
import LandingHero    from '../Landing/LandingHero.jsx';
import LoginForm      from '../Auth/LoginForm.jsx';
import RegisterForm   from '../Auth/RegisterForm.jsx';
import LegalModal     from '../Legal/LegalModal.jsx';
import FeaturePage    from '../Landing/FeaturePage.jsx';

const footerLink = { background: 'none', border: 'none', padding: 0, color: 'rgba(196,181,253,0.85)', fontFamily: 'Manrope', fontSize: 11, fontWeight: 600, cursor: 'pointer' };

export default function WelcomePage({ onAuth }) {
  const [mode, setMode] = useState('landing'); // 'landing' | 'login' | 'register' | 'feature'
  const [feature, setFeature] = useState(null);
  const [legal, setLegal] = useState(null);

  const goLanding = () => { setFeature(null); setMode('landing'); };
  const goFeature = (k) => { setFeature(k); setMode('feature'); };

  if (mode === 'login')
    return <LoginForm onSuccess={onAuth} onBack={goLanding} onSwitchToRegister={() => setMode('register')} />;
  if (mode === 'register')
    return <RegisterForm onSuccess={onAuth} onBack={goLanding} onSwitchToLogin={() => setMode('login')} />;
  if (mode === 'feature')
    return (
      <FeaturePage
        feature={feature}
        onSignIn={() => setMode('login')}
        onGetStarted={() => setMode('register')}
        onHome={goLanding}
        onNavFeature={goFeature}
      />
    );

  return (
    <main className="relative bg-black h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black shrink-0">
      <BackgroundVideo />
      <LandingNavbar
        onSignIn={() => setMode('login')}
        onGetStarted={() => setMode('register')}
        onHome={goLanding}
        onNavFeature={goFeature}
        activeFeature={null}
      />
      <LandingHero   onSignIn={() => setMode('login')} onGetStarted={() => setMode('register')} />

      {/* Landing footer — hobby-project notice + legal links */}
      <footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '12px 20px', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          <span>© 2026 InvestRite — a free hobby project by Akshat Barjatya · not financial advice</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <button onClick={() => setLegal('terms')} style={footerLink}>Terms</button>
          <span style={{ opacity: 0.4 }}>·</span>
          <button onClick={() => setLegal('privacy')} style={footerLink}>Privacy</button>
        </div>
      </footer>

      <LegalModal doc={legal} onClose={() => setLegal(null)} />
    </main>
  );
}
