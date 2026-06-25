// ── WORLD CUP 2026 GROUPS ─────────────────────────────────────────────────
export const WC2026_GROUPS = {
  "Group A": ["Mexico", "South Africa", "South Korea", "Czechia"],
  "Group B": ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  "Group C": ["Brazil", "Morocco", "Haiti", "Scotland"],
  "Group D": ["United States", "Paraguay", "Australia", "Türkiye"],
  "Group E": ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
  "Group F": ["Netherlands", "Japan", "Sweden", "Tunisia"],
  "Group G": ["Belgium", "Egypt", "Iran", "New Zealand"],
  "Group H": ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  "Group I": ["France", "Senegal", "Iraq", "Norway"],
  "Group J": ["Argentina", "Algeria", "Austria", "Jordan"],
  "Group K": ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  "Group L": ["England", "Croatia", "Ghana", "Panama"],
};

export const GROUP_NAMES = Object.keys(WC2026_GROUPS);
export const ALL_COUNTRIES = Object.values(WC2026_GROUPS).flat().sort((a, b) => a.localeCompare(b));

// ── STAGE CONFIG ──────────────────────────────────────────────────────────
// Knockout stages use a different scoring system than group stage.
// Points scale up with each round: [correct winner, correct goal diff, exact score]
export const STAGE_POINTS = {
  group:  { correctWinner: 1, correctDiff: 2, exactScore: 3 },
  R32:    { correctWinner: 2, correctDiff: 3, exactScore: 4 },
  R16:    { correctWinner: 3, correctDiff: 4, exactScore: 5 },
  QF:     { correctWinner: 4, correctDiff: 5, exactScore: 6 },
  SF:     { correctWinner: 5, correctDiff: 6, exactScore: 7 },
  Final:  { correctWinner: 6, correctDiff: 7, exactScore: 8 },
};

export const STAGE_LABELS = {
  group: "Group Stage",
  R32:   "Round of 32",
  R16:   "Round of 16",
  QF:    "Quarter-Final",
  SF:    "Semi-Final",
  Final: "Final",
};

// Stages where knockout scoring applies (predict winner + score after 90 min)
export const KNOCKOUT_STAGES = new Set(["R32", "R16", "QF", "SF", "Final"]);

// ── APP CONSTANTS ─────────────────────────────────────────────────────────
export const ADMIN_PASS = "admin2026";

export const BONUS_DEADLINE = "2026-06-15T23:59:00+08:00";
export const isBonusLocked = () => new Date() >= new Date(BONUS_DEADLINE);

export const DEFAULT_USERS = [
  { id: "user1", displayName: "Player 1" },
  { id: "user2", displayName: "Player 2" },
  { id: "user3", displayName: "Player 3" },
  { id: "user4", displayName: "Player 4" },
  { id: "user5", displayName: "Player 5" },
  { id: "user6", displayName: "Player 6" },
  { id: "user7", displayName: "Player 7" },
  { id: "user8", displayName: "Player 8" },
];

// ── FIREBASE CONFIG ───────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBO3YHKEkvodyB3YUE35JescB3e10ja0uA",
  authDomain: "worldcup-predictor-6fdb8.firebaseapp.com",
  databaseURL: "https://worldcup-predictor-6fdb8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "worldcup-predictor-6fdb8",
  storageBucket: "worldcup-predictor-6fdb8.firebasestorage.app",
  messagingSenderId: "255220213792",
  appId: "1:255220213792:web:4d628451b116a95d703445",
  measurementId: "G-6MGEQGYESZ",
};