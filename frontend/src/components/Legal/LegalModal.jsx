import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Shield } from 'lucide-react';
import { LegalDoc, DOCS, OWNER } from './legalContent.jsx';

/**
 * Legal modal with Terms / Privacy tabs.
 * @param {('terms'|'privacy'|null)} doc  which doc to show; null = closed
 * @param {function} onClose
 */
export default function LegalModal({ doc, onClose }) {
  const open = !!doc;
  const [tab, setTab] = useState(doc || 'terms');

  useEffect(() => { if (doc) setTab(doc); }, [doc]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const TABS = [
    { key: 'terms',   label: 'Terms & Conditions', icon: FileText },
    { key: 'privacy', label: 'Privacy & Data',     icon: Shield },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 640, maxHeight: '86vh', display: 'flex', flexDirection: 'column',
              background: 'rgba(12,10,24,0.98)',
              border: '1px solid rgba(123,57,252,0.25)', borderRadius: 18,
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
            }}
          >
            {/* Header + tabs */}
            <div style={{ padding: '18px 22px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, color: '#fff' }}>
                  {DOCS[tab].title}
                </h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {TABS.map(({ key, label, icon: Icon }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '9px 14px', border: 'none', cursor: 'pointer',
                        borderBottom: active ? '2px solid #7b39fc' : '2px solid transparent',
                        background: 'transparent', marginBottom: -1,
                        fontFamily: 'Manrope', fontSize: 12.5, fontWeight: active ? 700 : 500,
                        color: active ? '#c4b5fd' : 'rgba(255,255,255,0.4)', transition: 'all .15s',
                      }}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: '20px 22px', overflowY: 'auto' }}>
              <LegalDoc doc={tab} />
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'Manrope', fontSize: 10.5, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
                InvestRite is a free, non-commercial hobby project by {OWNER}. Educational use only · not investment advice.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
