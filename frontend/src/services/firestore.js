import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

/* ──────────────────────────────────────────────────────────────────────────
 * Portfolio
 * ────────────────────────────────────────────────────────────────────────── */

function portfolioRef(uid) {
  return collection(db, 'users', uid, 'portfolio');
}

export async function getPortfolio(uid) {
  const q = query(portfolioRef(uid), orderBy('addedAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// A holding is an Indian (NSE/BSE) stock if its ticker carries the .NS/.BO suffix.
export function inferMarket(ticker) {
  return /\.(NS|BO)$/i.test((ticker || '').toString().trim()) ? 'IN' : 'US';
}

export async function addPosition(uid, position) {
  const market = position.market === 'IN' || position.market === 'US'
    ? position.market
    : inferMarket(position.ticker);
  const data = { ...position, market };
  const ref = await addDoc(portfolioRef(uid), { ...data, addedAt: serverTimestamp() });
  return { id: ref.id, ...data };
}

export async function removePosition(uid, positionId) {
  await deleteDoc(doc(db, 'users', uid, 'portfolio', positionId));
}

export async function updatePosition(uid, positionId, patch) {
  await updateDoc(doc(db, 'users', uid, 'portfolio', positionId), patch);
}

export async function removePositions(uid, ids) {
  await Promise.all(ids.map((id) => deleteDoc(doc(db, 'users', uid, 'portfolio', id))));
}

/* ── Flexible CSV column matching ───────────────────────────────────────────
 * Headers are normalised upstream (lowercased, spaces→_, symbols stripped) so
 * `Avg Cost (USD)` arrives as `avg_cost_usd`. We match by intent, not by an
 * exact alias list, so brokerage exports with varied column names still import.
 */
function pickField(row, patterns) {
  const keys = Object.keys(row);
  for (const re of patterns) {
    const k = keys.find((key) => re.test(key));
    if (k != null) {
      const v = row[k];
      if (v !== '' && v != null) return v;
    }
  }
  return undefined;
}

export async function importPositions(uid, rows) {
  const imported = [];
  const updated = [];
  const errors = [];

  // Map existing holdings by ticker so re-imports update in place (no duplicates).
  const existing = await getPortfolio(uid).catch(() => []);
  const byTicker = new Map();
  for (const p of existing) {
    if (p.ticker) byTicker.set(p.ticker.toString().trim().toUpperCase(), p.id);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const ticker = (pickField(row, [/^ticker$/i, /^symbol$/i, /ticker/i, /symbol/i]) || '')
      .toString().trim().toUpperCase();

    const shares = parseFloat(
      pickField(row, [/^shares$/i, /^quantity$/i, /^qty$/i, /^units$/i, /share/i, /quantity/i, /qty/i, /units/i]) || 0
    );

    // Match avg cost / cost basis / price — `avg_cost_usd`, `Avg Cost`, `price`, etc.
    const avgCost = parseFloat(
      pickField(row, [/avg.*cost/i, /average.*cost/i, /cost.*basis/i, /avg.*price/i, /average.*price/i, /^cost$/i, /^price$/i, /cost/i, /price/i]) || 0
    );

    if (!ticker || isNaN(shares) || isNaN(avgCost) || shares <= 0 || avgCost <= 0) {
      errors.push({ row: i + 1, reason: 'Missing or invalid ticker/shares/cost' });
      continue;
    }

    const notes = (pickField(row, [/^notes?$/i, /note/i, /comment/i, /reason/i]) || '').toString();
    const existingId = byTicker.get(ticker);

    if (existingId) {
      // Override the existing holding's shares/cost (keep its notes unless the CSV provides new ones).
      const patch = { shares, avgCost };
      if (notes) patch.notes = notes;
      await updateDoc(doc(db, 'users', uid, 'portfolio', existingId), patch);
      updated.push({ id: existingId, ticker, shares, avgCost });
    } else {
      const saved = await addPosition(uid, { ticker, shares, avgCost, notes });
      imported.push(saved);
      // A duplicate ticker later in the same file now updates this newly-added row too.
      byTicker.set(ticker, saved.id);
    }
  }

  return { imported: imported.length, updated: updated.length, errors };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Price alerts  →  users/{uid}/alerts/{id}
 * ────────────────────────────────────────────────────────────────────────── */

function alertsRef(uid) {
  return collection(db, 'users', uid, 'alerts');
}

export async function getAlerts(uid) {
  const q = query(alertsRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addAlert(uid, alert) {
  const ref = await addDoc(alertsRef(uid), {
    ...alert,
    enabled: true,
    triggeredAt: null,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...alert, enabled: true, triggeredAt: null };
}

export async function updateAlert(uid, id, patch) {
  await updateDoc(doc(db, 'users', uid, 'alerts', id), patch);
}

export async function removeAlert(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'alerts', id));
}
