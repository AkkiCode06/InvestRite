// Curated small/micro-cap US equity universe for multi-bagger screening
// Mix of sectors — price and market cap filters applied dynamically
const MULTIBAGGER_UNIVERSE = [
  // Fintech / Financial
  'DAVE', 'LMND', 'OPEN', 'RELY', 'LPRO', 'ATLCL',
  // Biotech / Healthcare
  'RXRX', 'VERA', 'MIRM', 'PRAX', 'RCKT', 'IMTX', 'AVDX', 'SANA', 'ROIV', 'ATAI',
  // Software / AI
  'SOUN', 'CXAI', 'GFAI', 'MNDY', 'TASK', 'XMTR', 'PERI',
  // Semiconductors / Hardware
  'SMTC', 'AEHR', 'HEAR', 'ACMR', 'OUST',
  // Clean Energy / EV
  'SHLS', 'ARRY', 'ACHR', 'BLDE',
  // Consumer
  'XPOF', 'RRGB', 'PRPL', 'LOVE', 'SPWH', 'HLLY',
  // Mining / Materials
  'USAS', 'GATO', 'SILV',
  // Defense / Aerospace
  'PL', 'BKSY', 'RCAT',
  // Crypto / Digital Assets
  'MARA', 'RIOT', 'BTBT', 'CLSK',
  // Other small-caps
  'HIMS', 'NVTS', 'IRTC', 'CLBT', 'CELH', 'DKNG', 'JOBY',
  'MAPS', 'VTRS', 'AGIO', 'CDMO', 'IDEX',
];

module.exports = { MULTIBAGGER_UNIVERSE };
