import { STAGE_POINTS, KNOCKOUT_STAGES } from "../constants";

// ── DATE / TIME ───────────────────────────────────────────────────────────

/** Format an ISO string to a human-readable SGT string. */
export function fmtSGT(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

/** Convert an ISO string to a local datetime-local input value (SGT). */
export function isoToLocal(iso) {
  if (!iso) return "";
  const sgt = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000);
  return sgt.toISOString().slice(0, 16);
}

// ── MATCH STATE ───────────────────────────────────────────────────────────

/** True if the prediction deadline for a match has passed. */
export function isLocked(match) {
  const d = match.deadline || match.kickoffTime;
  return d && new Date() >= new Date(d);
}

/** True if the match kicked off more than 24 hours ago. */
export function isOldMatch(match) {
  return (Date.now() - new Date(match.kickoffTime).getTime()) > 24 * 60 * 60 * 1000;
}

// ── SCORING ───────────────────────────────────────────────────────────────

/** Return "home" | "away" | "draw" based on scores. */
export function outcome(h, a) {
  return h > a ? "home" : a > h ? "away" : "draw";
}

/**
 * Calculate points for a prediction vs an actual result.
 * For group stage matches the legacy 3-2-1 system applies.
 * For knockout stages (R32 → Final) points scale up each round.
 *
 * Group:  exact=3, correctDiff=2, correctWinner=1
 * R32:    exact=4, correctDiff=3, correctWinner=2
 * R16:    exact=5, correctDiff=4, correctWinner=3
 * QF:     exact=6, correctDiff=5, correctWinner=4
 * SF:     exact=7, correctDiff=6, correctWinner=5
 * Final:  exact=8, correctDiff=7, correctWinner=6
 *
 * Knockout note: "outright winner" is determined by the score after 90 min
 * (no extra-time / penalty tiebreaker for prediction purposes).
 */
export function calcPts(predHome, predAway, actualHome, actualAway, stage = "group") {
  const ph = Number(predHome), pa = Number(predAway);
  const ah = Number(actualHome), aa = Number(actualAway);
  const pts = STAGE_POINTS[stage] ?? STAGE_POINTS.group;

  if (ph === ah && pa === aa) return pts.exactScore;
  if ((ph - pa) === (ah - aa)) return pts.correctDiff;
  if (outcome(ph, pa) === outcome(ah, aa)) return pts.correctWinner;
  return 0;
}

/** Return a human-readable label and colour for a points value. */
export function ptsReason(pts, stage = "group") {
  const p = STAGE_POINTS[stage] ?? STAGE_POINTS.group;
  if (pts === p.exactScore)    return { label: "Exact Score",     color: "var(--gold-bright)" };
  if (pts === p.correctDiff)   return { label: "Correct Goal Diff", color: "var(--malachite-l)" };
  if (pts >= p.correctWinner && pts > 0) return { label: "Correct Winner", color: "#7EB8FF" };
  return { label: "No Points", color: "var(--muted)" };
}

/** True if stage is a knockout round. */
export function isKnockout(stage) {
  return KNOCKOUT_STAGES.has(stage);
}

// ── SESSION ───────────────────────────────────────────────────────────────

export function loadSession() {
  try { return JSON.parse(localStorage.getItem("wc_session")); } catch { return null; }
}

export function saveSession(s) {
  localStorage.setItem("wc_session", JSON.stringify(s));
}

// ── TABLE CELL STYLES (shared across admin components) ────────────────────

export const thStyle = {
  padding: "7px 14px", fontSize: 10, color: "var(--gold)",
  textAlign: "left", fontFamily: "'Barlow Condensed',sans-serif",
  letterSpacing: 1, textTransform: "uppercase", fontWeight: 700,
};

export const tdStyle = {
  padding: "8px 14px", fontSize: 13,
  color: "var(--muted-l)", fontFamily: "'Barlow Condensed',sans-serif",
};