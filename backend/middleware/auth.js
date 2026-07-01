const https = require('https');
const jwt = require('jsonwebtoken');

const FIREBASE_PROJECT_ID = 'investrite-79bcf';
const KEYS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// Cache Google's public keys (they rotate every few hours)
let _keys = null;
let _keysExpiry = 0;

function fetchPublicKeys() {
  if (_keys && Date.now() < _keysExpiry) return Promise.resolve(_keys);

  return new Promise((resolve, reject) => {
    https.get(KEYS_URL, (res) => {
      const cc = res.headers['cache-control'] || '';
      const maxAge = parseInt((cc.match(/max-age=(\d+)/) || [])[1] || '3600');
      _keysExpiry = Date.now() + maxAge * 1000;

      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { _keys = JSON.parse(data); resolve(_keys); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function verifyFirebaseToken(token) {
  const keys = await fetchPublicKeys();
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.header?.kid) throw new Error('Missing key ID in token');

  const publicKey = keys[decoded.header.kid];
  if (!publicKey) throw new Error('Unknown key ID — token may be expired');

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    audience: FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
  });
}

async function authenticateToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Authorization token required' });

  try {
    const payload = await verifyFirebaseToken(token);
    req.user = { uid: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticateToken };
