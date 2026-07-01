import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, BarChart2, Rocket, Briefcase,
  Target, BookOpen, UserCircle, LayoutDashboard, LogOut, Menu, X, Bell, Search,
} from 'lucide-react';
import RegionSwitch from './RegionSwitch.jsx';
import SearchBox from './SearchBox.jsx';

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'screener',    label: 'Flow',         icon: BarChart2 },
  { key: 'multibagger', label: 'Multi-Bagger', icon: Rocket },
  { key: 'portfolio',   label: 'Portfolio',    icon: Briefcase },
  { key: 'alerts',      label: 'Alerts',       icon: Bell },
  { key: 'tradeplan',   label: 'Trade Plan',   icon: Target },
  { key: 'wiki',        label: 'Wiki',         icon: BookOpen },
];

const navGlass = {
  background: 'rgba(10,8,20,0.75)',
  backdropFilter: 'blur(28px) saturate(160%)',
  WebkitBackdropFilter: 'blur(28px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.45)',
};

export default function Navbar({ activeTab, onTabChange, user, onLogout, onSearch }) {
  const [mobile, setMobile]   = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  function handleSearch(sym) { setSearchOpen(false); onSearch?.(sym); }

  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close menu when tab changes
  function handleTabChange(key) {
    setMenuOpen(false);
    onTabChange(key);
  }

  /* ── Mobile layout ──────────────────────────────────────────────────────── */
  if (mobile) {
    return (
      <>
        {/* ── Compact top bar ─────────────────────────────────────────── */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', zIndex: 30, padding: '10px 14px', width: '100%', flexShrink: 0 }}
        >
          <div style={{ ...navGlass, borderRadius: 14, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <TrendingUp size={16} color="rgba(255,255,255,0.7)" />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em', color: '#fff' }}>
                Invest<span style={{ color: '#7b39fc' }}>Rite</span>
              </span>
            </div>

            {/* Right: search + active tab pill + hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Search */}
              <button onClick={() => setSearchOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: searchOpen ? '#c4b5fd' : 'rgba(255,255,255,0.7)', padding: 4, display: 'flex', alignItems: 'center' }}>
                {searchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
              {/* Current page indicator */}
              <span style={{
                fontFamily: 'Manrope', fontSize: 11, fontWeight: 600,
                color: '#c4b5fd', background: 'rgba(123,57,252,0.15)',
                border: '1px solid rgba(123,57,252,0.3)',
                borderRadius: 6, padding: '3px 9px',
              }}>
                {NAV_ITEMS.find(n => n.key === activeTab)?.label || ''}
              </span>
              {/* Hamburger */}
              <button
                data-tour="nav-menu"
                onClick={() => setMenuOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 4, display: 'flex', alignItems: 'center' }}
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </motion.nav>

        <AnimatePresence>
          {searchOpen && (
            <motion.div key="msearch" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              style={{ position: 'relative', zIndex: 29, padding: '0 14px 8px' }}>
              <SearchBox onSelect={handleSearch} onClose={() => setSearchOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Full-screen menu overlay ─────────────────────────────────── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              onClick={() => setMenuOpen(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 0, right: 0, bottom: 0,
                  width: '80%', maxWidth: 320,
                  background: 'rgba(8,6,18,0.98)',
                  borderLeft: '1px solid rgba(123,57,252,0.2)',
                  display: 'flex', flexDirection: 'column',
                  padding: '20px 0',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} color="rgba(255,255,255,0.7)" />
                    <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 16, color: '#fff' }}>
                      Invest<span style={{ color: '#7b39fc' }}>Rite</span>
                    </span>
                  </div>
                  <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Market region */}
                <div style={{ padding: '14px 16px 4px' }}>
                  <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Market</div>
                  <RegionSwitch segmented />
                </div>

                {/* Nav items */}
                <div style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
                  {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                    const active = activeTab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleTabChange(key)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                          marginBottom: 4, transition: 'all .15s', textAlign: 'left',
                          background: active ? 'rgba(123,57,252,0.18)' : 'transparent',
                          outline: active ? '1px solid rgba(123,57,252,0.3)' : '1px solid transparent',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: active ? 'rgba(123,57,252,0.25)' : 'rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={17} color={active ? '#c4b5fd' : 'rgba(255,255,255,0.5)'} strokeWidth={active ? 2.2 : 1.8} />
                        </div>
                        <span style={{
                          fontFamily: 'Manrope', fontSize: 15, fontWeight: active ? 700 : 500,
                          color: active ? '#c4b5fd' : 'rgba(255,255,255,0.65)',
                        }}>
                          {label}
                        </span>
                        {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#7b39fc', boxShadow: '0 0 8px #7b39fc' }} />}
                      </button>
                    );
                  })}
                </div>

                {/* Profile + sign out footer */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Profile row */}
                  <button
                    onClick={() => handleTabChange('profile')}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: activeTab === 'profile' ? 'rgba(123,57,252,0.18)' : 'rgba(255,255,255,0.04)',
                      marginBottom: 8, transition: 'all .15s',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7b39fc,#5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontFamily: 'Cabin', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <div style={{ fontFamily: 'Manrope', fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Account'}</div>
                      <div style={{ fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                    </div>
                    <UserCircle size={16} color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </button>

                  {/* Sign out */}
                  <button
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,77,109,0.2)',
                      cursor: 'pointer', background: 'rgba(255,77,109,0.07)', transition: 'all .15s',
                    }}
                  >
                    <LogOut size={16} color="#ff4d6d" />
                    <span style={{ fontFamily: 'Manrope', fontSize: 13, fontWeight: 600, color: '#ff4d6d' }}>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  /* ── Desktop layout ─────────────────────────────────────────────────────── */
  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', zIndex: 20, padding: '14px 20px', width: '100%', flexShrink: 0 }}
    >
      <div style={{
        ...navGlass, borderRadius: 14,
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1280, margin: '0 auto', gap: 12,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <TrendingUp size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: '-0.03em', color: '#fff' }}>
            Invest<span style={{ color: '#7b39fc' }}>Rite</span>
          </span>
          <span style={{ fontFamily: 'Manrope', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginLeft: 2 }}>DEMO</span>
        </div>

        {/* Center: feature tabs, or the search bar when search is open */}
        <AnimatePresence mode="wait" initial={false}>
        {searchOpen ? (
          <motion.div key="search" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, maxWidth: 560, margin: '0 14px' }}>
            <SearchBox onSelect={handleSearch} onClose={() => setSearchOpen(false)} />
          </motion.div>
        ) : (
        <motion.nav key="tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
          style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                data-tour={`nav-${key}`}
                onClick={() => onTabChange(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 9,
                  fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: active ? 600 : 500,
                  cursor: 'pointer', border: 'none', transition: 'all .18s',
                  background: active ? 'rgba(123,57,252,0.20)' : 'transparent',
                  color: active ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
                  outline: active ? '1px solid rgba(123,57,252,0.32)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}}
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </motion.nav>
        )}
        </AnimatePresence>

        {/* Search + Region + User + Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setSearchOpen(o => !o)} data-tour="search" title="Search stocks"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: searchOpen ? 'rgba(123,57,252,0.18)' : 'transparent', color: searchOpen ? '#c4b5fd' : 'rgba(255,255,255,0.5)', transition: 'all .18s' }}
            onMouseEnter={e => { if (!searchOpen) { e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.background = 'rgba(123,57,252,0.1)'; } }}
            onMouseLeave={e => { if (!searchOpen) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; } }}>
            {searchOpen ? <X size={16} /> : <Search size={16} />}
          </button>
          <div data-tour="region" style={{ display: 'flex' }}><RegionSwitch /></div>
          <button
            data-tour="profile"
            onClick={() => onTabChange('profile')}
            title="Profile & Settings"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Manrope, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '6px 10px', borderRadius: 8, transition: 'all .18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.background = 'rgba(123,57,252,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <UserCircle size={16} />
            <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || user?.email}
            </span>
          </button>
          <button
            onClick={onLogout}
            style={{
              fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 500,
              color: 'rgba(255,255,255,0.40)', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
              padding: '6px 14px', cursor: 'pointer', transition: 'all .18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.background = 'transparent'; }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
