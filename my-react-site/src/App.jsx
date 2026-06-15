import { useState, useEffect, useCallback, useRef } from "react";


// ── CONSTANTS ────────────────────────────────────────────────────────────
const WC2026_GROUPS = {
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

const GROUP_NAMES = Object.keys(WC2026_GROUPS);
const ALL_COUNTRIES = Object.values(WC2026_GROUPS).flat().sort((a, b) => a.localeCompare(b));

const ADMIN_PASS = "admin2026";
const BONUS_DEADLINE = "2026-06-15T23:59:00+08:00";
// FIX 1: was Date(...) instead of new Date(...)
const isBonusLocked = () => new Date() >= new Date(BONUS_DEADLINE);
const DEFAULT_USERS = [
  { id: "user1", displayName: "Player 1" },
  { id: "user2", displayName: "Player 2" },
  { id: "user3", displayName: "Player 3" },
  { id: "user4", displayName: "Player 4" },
  { id: "user5", displayName: "Player 5" },
  { id: "user6", displayName: "Player 6" },
  { id: "user7", displayName: "Player 7" },
  { id: "user8", displayName: "Player 8" },
];

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

// ── HELPERS ───────────────────────────────────────────────────────────────
function fmtSGT(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function isoToLocal(iso) {
  if (!iso) return "";
  const sgt = new Date(new Date(iso).getTime() + 8 * 60 * 60 * 1000);
  return sgt.toISOString().slice(0, 16);
}

function isLocked(match) {
  const d = match.deadline || match.kickoffTime;
  return d && new Date() >= new Date(d);
}

function isOldMatch(match) {
  return (Date.now() - new Date(match.kickoffTime).getTime()) > 24 * 60 * 60 * 1000;
}

function outcome(h, a) { return h > a ? "home" : a > h ? "away" : "draw"; }

function calcPts(ph, pa, ah, aa) {
  if (ph === ah && pa === aa) return 3;
  if ((ph - pa) === (ah - aa)) return 2;
  if (outcome(ph, pa) === outcome(ah, aa)) return 1;
  return 0;
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem("wc_session")); } catch { return null; }
}
function saveSession(s) { localStorage.setItem("wc_session", JSON.stringify(s)); }

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

:root {
  --bg:         #0a0a0a;
  --surface:    #111111;
  --card:       #191919;
  --border:     #2a2a2a;
  --gold:       #C9A84C;
  --gold-bright:#E8C96B;
  --malachite:  #1A8C5A;
  --malachite-l:#22B572;
  --red:        #C0392B;
  --red-bright: #E74C3C;
  --white:      #F5F5F5;
  --muted:      #888888;
  --muted-l:    #AAAAAA;
  --text:       #E8E8E8;
  --heading:    #FFFFFF;
  --accent:     #C9A84C;
  --r:          10px;
}

*{box-sizing:border-box;margin:0;padding:0}

html{-webkit-text-size-adjust:100%;text-size-adjust:100%}

body{
  background:var(--bg);
  color:var(--text);
  font-family:'Barlow',sans-serif;
  font-size:14px;
  min-height:100vh;
  overflow-x:hidden;
}

img,svg{max-width:100%}

/* ── TOPBAR ── */
.topbar{
  background:#0a0a0a;
  border-bottom:3px solid var(--gold);
  position:relative;
  overflow:hidden;
}
.topbar::before{
  position:absolute;
  inset:0;
  font-family:'Barlow Condensed',sans-serif;
  font-weight:900;
  font-size:52px;
  color:rgba(201,168,76,0.055);
  letter-spacing:6px;
  line-height:1;
  pointer-events:none;
  white-space:nowrap;
  overflow:hidden;
  padding:0 8px;
}
.topbar-inner{
  max-width:1100px;margin:0 auto;
  padding:10px 16px;
  display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:nowrap;
  position:relative;z-index:1;
}

/* LOGO */
.logo{line-height:1;user-select:none;min-width:0;flex-shrink:1}
.logo-eyebrow{
  font-family:'Barlow Condensed',sans-serif;
  font-size:10px;font-weight:600;
  letter-spacing:4px;text-transform:uppercase;
  color:var(--muted);margin-bottom:2px;
}
.logo-main{
  font-family:'Barlow Condensed',sans-serif;
  font-size:22px;font-weight:900;
  letter-spacing:2px;text-transform:uppercase;
  color:var(--heading);line-height:1;
}
.logo-main .we-are{color:var(--gold)}
.logo-main .year{
  color:var(--heading);
  margin-left:4px;
}
@media(min-width:500px){
  .logo-main{font-size:28px}
}
.logo-sub{
  font-family:'Barlow Condensed',sans-serif;
  font-size:11px;font-weight:600;letter-spacing:3px;
  text-transform:uppercase;color:var(--muted);margin-top:2px;
}
.logo-flag-strip{
  display:flex;gap:0;margin-top:5px;border-radius:2px;overflow:hidden;height:3px;width:100%;
}
.logo-flag-strip span{flex:1;display:block}
.flag-mx-g{background:#006847}
.flag-mx-w{background:#fff}
.flag-mx-r{background:#CE1126}
.flag-us-r{background:#B22234}
.flag-us-w{background:#fff}
.flag-us-b{background:#3C3B6E}
.flag-ca-r{background:#FF0000}
.flag-ca-w{background:#fff}

.topbar-right{display:flex;align-items:center;gap:6px;flex-wrap:nowrap;justify-content:flex-end;flex-shrink:0}

.conn-indicator{display:none} /* hidden on mobile by default, shown on wider screens */

.user-badge{
  display:flex;align-items:center;gap:6px;
  background:rgba(201,168,76,0.08);
  border:1px solid rgba(201,168,76,0.3);
  border-radius:4px;padding:5px 10px;
  font-family:'Barlow Condensed',sans-serif;
  font-size:13px;font-weight:700;letter-spacing:1px;
  text-transform:uppercase;color:var(--gold);
  cursor:pointer;transition:all .2s;
  max-width:120px;flex-shrink:1;min-width:0;
}
.user-badge span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.user-badge:hover{background:rgba(201,168,76,0.14);border-color:var(--gold)}

.badge-dot{width:7px;height:7px;border-radius:50%;background:var(--malachite);flex-shrink:0}
.badge-dot.admin{background:var(--gold)}

.btn-logout{
  display:flex;align-items:center;gap:6px;
  background:transparent;border:1px solid var(--border);
  border-radius:4px;padding:5px 10px;
  font-family:'Barlow Condensed',sans-serif;
  font-size:12px;font-weight:600;letter-spacing:1px;
  text-transform:uppercase;color:var(--muted-l);
  cursor:pointer;transition:.2s;white-space:nowrap;flex-shrink:0;
}
.btn-logout:hover{border-color:var(--red-bright);color:var(--red-bright)}

@media(min-width:500px){
  .conn-indicator{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);font-family:'Barlow',sans-serif}
  .topbar-right{gap:8px}
  .user-badge{max-width:160px;padding:6px 14px;font-size:14px}
  .btn-logout{padding:6px 14px;font-size:13px}
}

/* ── TABS ── */
.tabs{
  max-width:1100px;margin:0 auto;
  padding:0 20px;
  display:flex;gap:0;flex-wrap:nowrap;
  border-bottom:1px solid var(--border);
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
}
.tabs::-webkit-scrollbar{display:none}
.tab{
  padding:12px 22px;
  border:none;border-bottom:3px solid transparent;
  background:transparent;
  color:var(--muted);
  font-family:'Barlow Condensed',sans-serif;
  font-weight:700;font-size:14px;
  letter-spacing:1.5px;text-transform:uppercase;
  cursor:pointer;transition:.15s;
  margin-bottom:-1px;
  flex-shrink:0;
  white-space:nowrap;
}
.tab.active{color:var(--gold);border-bottom-color:var(--gold)}
.tab:hover:not(.active){color:var(--white)}

/* ── LAYOUT ── */
.main{max-width:1100px;margin:0 auto;padding:20px}

.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:var(--r);
  padding:20px;margin-bottom:16px;
  min-width:0;
}
.card-accent{border-top:3px solid var(--gold)}

.card h2{
  font-family:'Barlow Condensed',sans-serif;
  font-size:22px;font-weight:800;
  letter-spacing:1.5px;text-transform:uppercase;
  color:var(--heading);margin-bottom:14px;
}

.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:700px){.grid2{grid-template-columns:1fr}}

/* ── FORMS ── */
input,select,textarea{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:6px;color:var(--text);
  padding:9px 12px;font-size:14px;
  font-family:'Barlow',sans-serif;width:100%;
  transition:border-color .15s;
  min-width:0;
}
input:focus,select:focus{
  outline:none;
  border-color:var(--gold);
  box-shadow:0 0 0 3px rgba(201,168,76,0.15);
}
input[type=number]{width:70px;text-align:center}
select option{background:var(--surface)}
label{
  display:block;color:var(--muted-l);
  font-size:11px;font-weight:600;
  margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;
  font-family:'Barlow Condensed',sans-serif;
}
.form-group{display:flex;flex-direction:column;gap:5px;min-width:0}
.hint{font-size:12px;color:var(--muted);margin-top:4px;font-family:'Barlow',sans-serif}
.section-label{
  font-size:11px;font-weight:700;text-transform:uppercase;
  letter-spacing:1.5px;color:var(--gold);
  margin-bottom:10px;padding-bottom:8px;
  border-bottom:1px solid var(--border);
  font-family:'Barlow Condensed',sans-serif;
}

/* ── BUTTONS ── */
button{
  font-family:'Barlow Condensed',sans-serif;
  font-weight:700;font-size:14px;
  letter-spacing:1px;text-transform:uppercase;
  border:none;border-radius:6px;padding:9px 20px;
  cursor:pointer;transition:.15s;white-space:nowrap;
}
.btn-gold{background:var(--gold);color:#0a0a0a}
.btn-green{background:var(--malachite);color:#fff}
.btn-blue{background:#1A4D8F;color:#fff}
.btn-red{background:var(--red);color:#fff}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-warn{background:transparent;border:1px solid var(--red);color:var(--red-bright)}
button:hover{opacity:.9;transform:translateY(-1px)}
button:disabled{opacity:.35;cursor:not-allowed;transform:none}

/* ── MATCH CARD ── */
.match-item{
  background:var(--surface);
  border:1px solid var(--border);
  border-left:3px solid var(--border);
  border-radius:var(--r);
  padding:16px;margin-bottom:10px;
  transition:border-color .2s,transform .15s;
  min-width:0;
}
.match-item:hover{
  border-left-color:var(--gold);
  transform:translateX(2px);
}
.match-item.completed{border-left-color:var(--malachite)}
.match-item.locked{border-left-color:var(--red)}

.match-header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.match-teams{
  font-family:'Barlow Condensed',sans-serif;
  font-size:20px;font-weight:800;
  letter-spacing:1px;text-transform:uppercase;
  color:var(--heading);
  overflow-wrap:break-word;
}
.match-meta{font-size:12px;color:var(--muted);margin-top:4px;font-family:'Barlow',sans-serif;line-height:1.6}

/* ── PILLS ── */
.pill{
  padding:3px 10px;border-radius:3px;
  font-family:'Barlow Condensed',sans-serif;
  font-size:11px;font-weight:700;
  text-transform:uppercase;letter-spacing:1px;
  white-space:nowrap;
}
.pill-open{background:rgba(26,140,90,0.2);color:var(--malachite-l);border:1px solid rgba(26,140,90,0.3)}
.pill-locked{background:rgba(192,57,43,0.18);color:#E88080;border:1px solid rgba(192,57,43,0.3)}
.pill-done{background:rgba(201,168,76,0.15);color:var(--gold-bright);border:1px solid rgba(201,168,76,0.3)}

.score-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.vs{
  color:var(--muted);font-weight:800;font-size:14px;
  font-family:'Barlow Condensed',sans-serif;
  letter-spacing:2px;
}

.result-notice{
  margin-top:10px;padding:10px 14px;
  background:rgba(201,168,76,0.08);
  border:1px solid rgba(201,168,76,0.2);
  border-left:3px solid var(--gold);
  border-radius:6px;font-size:13px;color:var(--gold-bright);
  font-family:'Barlow',sans-serif;
  overflow-wrap:break-word;
}
.pts-badge{
  display:inline-block;padding:2px 10px;
  border-radius:3px;font-weight:700;font-size:12px;
  background:var(--malachite);color:#fff;
  font-family:'Barlow Condensed',sans-serif;letter-spacing:.5px;
}
.pts-badge.zero{background:#2a2a2a;color:var(--muted)}

.match-edit-row{
  margin-top:10px;padding:10px 12px;
  background:rgba(26,77,143,0.12);
  border:1px solid rgba(26,77,143,0.3);
  border-radius:6px;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
}

/* ── TABLE ── */
.table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:8px;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse;min-width:500px}
th,td{padding:11px 14px;text-align:left;border-bottom:1px solid var(--border);font-size:14px}
th{
  color:var(--muted);font-size:11px;text-transform:uppercase;
  letter-spacing:1.5px;background:var(--surface);
  font-family:'Barlow Condensed',sans-serif;font-weight:700;
}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,0.02)}
.rank-1{color:var(--gold-bright);font-weight:700}
.rank-2{color:#C8C8C8;font-weight:600}
.rank-3{color:#CD8C4A;font-weight:600}

/* ── LOGIN OVERLAY ── */
.overlay{
  position:fixed;inset:0;z-index:999;
  background:#0a0a0a;
  display:flex;align-items:center;justify-content:center;padding:20px;
  overflow-y:auto;
}
.login-box{
  background:var(--card);
  border:1px solid var(--border);
  border-top:3px solid var(--gold);
  border-radius:12px;padding:36px;
  width:100%;max-width:480px;text-align:center;
  position:relative;overflow:hidden;
}
.login-box::before{
  position:absolute;bottom:-10px;right:-4px;
  font-family:'Barlow Condensed',sans-serif;
  font-weight:900;font-size:72px;color:rgba(201,168,76,0.05);
  pointer-events:none;letter-spacing:-2px;white-space:nowrap;
}
.login-trophy{
  font-size:44px;margin-bottom:8px;display:block;
}
.login-title{
  font-family:'Barlow Condensed',sans-serif;
  font-size:30px;font-weight:900;
  letter-spacing:2px;text-transform:uppercase;
  color:var(--heading);margin-bottom:2px;
}
.login-title .we{color:var(--gold)}
.login-slogan{
  font-family:'Barlow Condensed',sans-serif;
  font-size:11px;font-weight:600;letter-spacing:4px;
  text-transform:uppercase;color:var(--muted);
  margin-bottom:28px;
}
.user-grid{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));
  gap:8px;margin-bottom:20px;
}
.user-select-btn{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:6px;padding:12px 8px;
  color:var(--text);font-weight:700;
  font-size:clamp(12px,2.5vw,13px);
  font-family:'Barlow Condensed',sans-serif;
  letter-spacing:.5px;text-transform:uppercase;
  cursor:pointer;transition:.15s;
  display:flex;align-items:center;justify-content:center;
  min-height:48px;text-align:center;
}
.user-select-btn:hover{
  border-color:var(--gold);color:var(--gold);
  background:rgba(201,168,76,0.07);
}
.divider{
  display:flex;align-items:center;gap:10px;
  margin:16px 0;color:var(--muted);font-size:12px;
  font-family:'Barlow Condensed',sans-serif;letter-spacing:1px;
}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border)}

/* ── MODALS ── */
.modal-overlay{
  position:fixed;inset:0;z-index:500;
  background:rgba(0,0,0,.88);
  display:flex;align-items:center;justify-content:center;
  padding:20px;overflow-y:auto;
}
.modal-box{
  background:var(--card);
  border:1px solid var(--border);border-top:3px solid var(--gold);
  border-radius:12px;padding:28px;
  width:100%;max-width:420px;
  max-height:calc(100vh - 40px);overflow-y:auto;
}
.modal-box h3{
  font-family:'Barlow Condensed',sans-serif;
  font-size:22px;font-weight:800;letter-spacing:1px;
  text-transform:uppercase;color:var(--gold);margin-bottom:16px;
}
.edit-modal-inner{display:flex;flex-direction:column;gap:12px}

/* ── TOAST ── */
.toast{
  position:fixed;bottom:24px;right:24px;left:24px;z-index:9999;
  background:var(--card);border:1px solid var(--border);
  border-left:4px solid var(--border);
  border-radius:6px;padding:12px 18px;
  font-family:'Barlow Condensed',sans-serif;
  font-size:14px;font-weight:700;letter-spacing:.5px;
  text-transform:uppercase;color:var(--text);
  transform:translateY(80px);opacity:0;
  transition:.3s;pointer-events:none;
  max-width:320px;margin:0 auto;
}
.toast.show{transform:translateY(0);opacity:1}
.toast.success{border-left-color:var(--malachite);color:var(--malachite-l)}
.toast.error{border-left-color:var(--red-bright);color:#FF8080}
.toast.info{border-left-color:var(--gold);color:var(--gold-bright)}

/* ── BONUS CARDS ── */
.bonus-group-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:8px;padding:14px;margin-bottom:10px;
}
.bonus-group-header{
  font-family:'Barlow Condensed',sans-serif;
  font-size:13px;font-weight:700;color:var(--gold);
  text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;
}
.bonus-group-teams{font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.7}

/* ── STATUS / ADMIN ── */
.dot-live{width:7px;height:7px;border-radius:50%;background:var(--muted);flex-shrink:0}
.dot-live.live{background:var(--malachite-l)}
.show-past-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.past-count{font-size:12px;color:var(--muted)}
.admin-match-row{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:10px 12px;background:var(--surface);
  border:1px solid var(--border);border-radius:8px;margin-bottom:8px;
}
.admin-match-row:hover{border-color:rgba(201,168,76,0.3)}

/* ── CONFIRM DIALOG ── */
.confirm-overlay{
  position:fixed;inset:0;z-index:2000;
  background:rgba(0,0,0,.94);
  display:flex;align-items:center;justify-content:center;padding:20px;
}
.confirm-box{
  background:var(--card);border:1px solid var(--border);
  border-top:3px solid var(--red-bright);
  border-radius:12px;padding:28px;width:100%;max-width:380px;text-align:center;
}
.confirm-box h3{
  font-family:'Barlow Condensed',sans-serif;
  font-size:24px;font-weight:800;letter-spacing:1px;
  text-transform:uppercase;color:var(--red-bright);margin-bottom:10px;
}
.confirm-box p{color:var(--muted-l);font-size:13px;margin-bottom:20px;line-height:1.6}
.confirm-actions{display:flex;gap:10px}

/* ── MOBILE ── */
@media(max-width:640px){
  body{font-size:13px}

  .tabs{padding:0 8px}
  .tab{padding:10px 14px;font-size:12px;letter-spacing:1px}

  .main{padding:12px}
  .card{padding:14px;border-radius:8px}
  .card h2{font-size:18px}

  .match-item{padding:12px}
  .match-teams{font-size:16px}
  .match-meta{font-size:11px}

  .score-row{gap:6px}
  input[type=number]{width:54px;padding:8px 6px}
  .vs{font-size:12px}

  .match-edit-row{padding:8px 10px;gap:6px}
  .match-edit-row input[type=number]{width:50px}

  button{padding:9px 14px;font-size:12px}

  .grid2{gap:12px}

  .login-box{padding:22px}
  .login-title{font-size:24px}
  .user-grid{grid-template-columns:repeat(2,1fr)}

  .modal-box{padding:18px}
  .modal-box h3{font-size:18px}

  .admin-match-row{padding:8px 10px}
  .admin-match-row > div:first-child{flex-basis:100%}
  .admin-match-row input[type=number]{width:48px;padding:8px 4px}

  .toast{left:12px;right:12px;bottom:12px;max-width:none;font-size:12px}

  table{min-width:0}
  th,td{padding:8px 8px;font-size:12px}
}

@media(max-width:380px){
  .user-grid{grid-template-columns:1fr}
  .match-teams{font-size:15px}
  input[type=number]{width:48px}
}
`;

// ── TOAST HOOK ────────────────────────────────────────────────────────────
function useToast() {
  const [state, setState] = useState({ msg: "", type: "success", visible: false });
  const timerRef = useRef(null);

  const show = useCallback((msg, type = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ msg, type, visible: true });
    timerRef.current = setTimeout(() => setState(s => ({ ...s, visible: false })), 3500);
  }, []);

  return { ...state, show };
}

// ── FIREBASE HOOK ─────────────────────────────────────────────────────────
function useFirebase(toast) {
  const [db, setDb] = useState(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState({});
  const [matches, setMatches] = useState([]);
  const [preds, setPreds] = useState({});
  const [bonus, setBonus] = useState({});
  const [settings, setSettings] = useState({ actualGroupWinners: {}, actualOverallWinner: "" });
  const unsubs = useRef([]);

  // FIX 2: Keep live refs so recalcAll always uses freshest data
  const usersRef = useRef({});
  const matchesRef = useRef([]);
  const predsRef = useRef({});
  const bonusRef = useRef({});
  const settingsRef = useRef({ actualGroupWinners: {}, actualOverallWinner: "" });

  const loadFirebase = useCallback(async () => {
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const {
        getFirestore, doc, collection, setDoc, updateDoc, deleteDoc,
        getDoc, getDocs, onSnapshot, query, orderBy, writeBatch, serverTimestamp
      } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

      const app = initializeApp(FIREBASE_CONFIG);
      const firestore = getFirestore(app);

      // Seed users
      const snap = await getDoc(doc(firestore, "users", "user1"));
      if (!snap.exists()) {
        const batch = writeBatch(firestore);
        DEFAULT_USERS.forEach(u => {
          batch.set(doc(firestore, "users", u.id), {
            id: u.id, displayName: u.displayName,
            manualPts: 0, matchPts: 0, bonusPts: 0, totalPts: 0,
          });
        });
        await batch.commit();
      }

      // Listeners — keep refs in sync
      unsubs.current.push(
        onSnapshot(collection(firestore, "users"), snap => {
          const u = {};
          snap.forEach(d => { u[d.id] = { id: d.id, ...d.data() }; });
          usersRef.current = u;
          setUsers(u);
        })
      );
      unsubs.current.push(
        onSnapshot(query(collection(firestore, "matches"), orderBy("kickoffTime")), snap => {
          const m = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          matchesRef.current = m;
          setMatches(m);
        })
      );
      unsubs.current.push(
        onSnapshot(collection(firestore, "predictions"), snap => {
          const p = {};
          snap.forEach(d => { p[d.id] = d.data(); });
          predsRef.current = p;
          setPreds(p);
        })
      );
      unsubs.current.push(
        onSnapshot(collection(firestore, "bonus"), snap => {
          const b = {};
          snap.forEach(d => { b[d.id] = d.data(); });
          bonusRef.current = b;
          setBonus(b);
        })
      );
      unsubs.current.push(
        onSnapshot(doc(firestore, "settings", "app"), snap => {
          const s = snap.exists()
            ? { actualGroupWinners: snap.data().actualGroupWinners || {}, actualOverallWinner: snap.data().actualOverallWinner || "" }
            : { actualGroupWinners: {}, actualOverallWinner: "" };
          settingsRef.current = s;
          setSettings(s);
        })
      );

      setDb({ firestore, doc, collection, setDoc, updateDoc, deleteDoc, getDoc, getDocs, writeBatch, serverTimestamp });
      setConnected(true);
    } catch (err) {
      console.error("Firebase init:", err);
      setConnected(false);
      toast("Firebase connection failed.", "error");
    }
  }, [toast]);

  useEffect(() => {
    loadFirebase();
    return () => unsubs.current.forEach(u => u());
  }, [loadFirebase]);

  // FIX 3: recalcAll uses ref data by default (always fresh), but accepts
  // override params for cases where we've just written and refs aren't updated yet.
  const recalcAll = useCallback(async (overrideUsers, overrideMatches, overridePreds, overrideBonus, overrideSettings) => {
    if (!db) return;
    const { firestore, doc, writeBatch, setDoc } = db;

    const curUsers    = overrideUsers    ?? usersRef.current;
    const curMatches  = overrideMatches  ?? matchesRef.current;
    const curPreds    = overridePreds    ?? predsRef.current;
    const curBonus    = overrideBonus    ?? bonusRef.current;
    const curSettings = overrideSettings ?? settingsRef.current;

    const batch = writeBatch(firestore);

    // FIX 4: Also write pts back to each prediction document so match cards show correct pts
    const predUpdates = {}; // uid -> { matchId -> pts }

    for (const uid of Object.keys(curUsers)) {
      let matchPts = 0, bonusPts = 0;
      const userPreds = curPreds[uid] || {};
      predUpdates[uid] = { ...userPreds };

      for (const match of curMatches) {
        if (!match.completed) continue;
        const pred = userPreds[match.id];
        if (!pred) continue;
        const pts = calcPts(Number(pred.home), Number(pred.away), Number(match.resultHome), Number(match.resultAway));
        matchPts += pts;
        // Write pts back into prediction entry
        predUpdates[uid][match.id] = { ...pred, pts };
      }

      const bp = curBonus[uid] || {};
      const agw = curSettings.actualGroupWinners || {};
      GROUP_NAMES.forEach(g => {
        if (agw[g] && bp.groupWinners?.[g] &&
          agw[g].trim().toLowerCase() === bp.groupWinners[g].trim().toLowerCase()) bonusPts += 5;
      });
      if (curSettings.actualOverallWinner && bp.overallWinner &&
        curSettings.actualOverallWinner.trim().toLowerCase() === bp.overallWinner.trim().toLowerCase()) bonusPts += 20;

      const manualPts = Number(curUsers[uid].manualPts || 0);
      batch.set(doc(firestore, "users", uid), {
        matchPts, bonusPts, manualPts, totalPts: matchPts + bonusPts + manualPts,
      }, { merge: true });

      // Write updated prediction pts back
      batch.set(doc(firestore, "predictions", uid), predUpdates[uid]);
    }

    await batch.commit();
  }, [db]);

  return { db, connected, users, matches, preds, bonus, settings, recalcAll };
}

// ── MATCH ITEM ────────────────────────────────────────────────────────────
function MatchItem({ match, user, preds, onSavePred, onSetScore, onClearScore }) {
  const [predH, setPredH] = useState(preds?.[match.id]?.home ?? "");
  const [predA, setPredA] = useState(preds?.[match.id]?.away ?? "");
  const [scoreH, setScoreH] = useState(match.resultHome ?? "");
  const [scoreA, setScoreA] = useState(match.resultAway ?? "");

  useEffect(() => {
    setPredH(preds?.[match.id]?.home ?? "");
    setPredA(preds?.[match.id]?.away ?? "");
  }, [preds, match.id]);

  useEffect(() => {
    setScoreH(match.resultHome ?? "");
    setScoreA(match.resultAway ?? "");
  }, [match.resultHome, match.resultAway]);

  const locked = isLocked(match);
  const old = isOldMatch(match);
  const userPred = preds?.[match.id] || null;

  const stageLabel = match.stage === "group"
    ? `GROUP STAGE${match.groupName ? " · " + match.groupName : ""}`
    : match.stage;

  const pill = match.completed
    ? <span className="pill pill-done">Result In</span>
    : locked ? <span className="pill pill-locked">Locked</span>
      : <span className="pill pill-open">Open</span>;

  return (
    <div className={`match-item${match.completed ? " completed" : locked ? " locked" : ""}`} style={old ? { opacity: 0.55 } : {}}>
      <div className="match-header">
        <div style={{ minWidth: 0 }}>
          <div className="match-teams">
            {match.homeTeam} <span style={{ color: "var(--muted)" }}>vs</span> {match.awayTeam}
          </div>
          <div className="match-meta">
            ⏰ Kickoff: {fmtSGT(match.kickoffTime)} &nbsp;·&nbsp;
            🔒 Deadline: {fmtSGT(match.deadline || match.kickoffTime)} &nbsp;·&nbsp; {stageLabel}
          </div>
        </div>
        <div>{pill}</div>
      </div>

      {!user && <div className="hint" style={{ marginTop: 10 }}>Log in to predict.</div>}

      {user?.isAdmin && (
        <div>
          <div className="hint" style={{ marginTop: 10, color: "var(--gold)" }}>Admin view</div>
          <div className="match-edit-row">
            <span style={{ fontSize: 11, color: "var(--blue)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>Score:</span>
            <input type="number" min="0" value={scoreH} onChange={e => setScoreH(e.target.value)} placeholder="H" style={{ width: 60 }} />
            <span className="vs" style={{ fontSize: 13 }}>–</span>
            <input type="number" min="0" value={scoreA} onChange={e => setScoreA(e.target.value)} placeholder="A" style={{ width: 60 }} />
            <button className="btn-blue" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => onSetScore(match.id, scoreH, scoreA)}>
              {match.completed ? "Update" : "Set"} Score
            </button>
            {match.completed && (
              <button className="btn-red" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => onClearScore(match.id)}>Clear</button>
            )}
          </div>
        </div>
      )}

      {user && !user.isAdmin && (
        locked ? (
          <div className="hint" style={{ marginTop: 10 }}>
            {userPred
              ? <>Your pick: <strong style={{ color: "var(--text)" }}>{userPred.home} – {userPred.away}</strong></>
              : "No prediction submitted before deadline."}
          </div>
        ) : (
          <div className="score-row" style={{ marginTop: 12 }}>
            <input type="number" min="0" value={predH} onChange={e => setPredH(e.target.value)} placeholder="0" />
            <span className="vs">–</span>
            <input type="number" min="0" value={predA} onChange={e => setPredA(e.target.value)} placeholder="0" />
            <button className="btn-green" onClick={() => onSavePred(match.id, predH, predA)}>Save Pick</button>
          </div>
        )
      )}

      {match.completed && (
        <div className="result-notice">
          ⚽ Final: <strong>{match.homeTeam} {match.resultHome} – {match.resultAway} {match.awayTeam}</strong>
          {userPred && !user?.isAdmin && (() => {
            const pts = userPred.pts ?? 0;
            const reason = ptsReason(pts);
            return (
              <> · Your pick: <strong style={{ color: "var(--text)" }}>{userPred.home}–{userPred.away}</strong>
              {" "}· <span style={{ color: reason.color, fontWeight: 700, fontSize: 12 }}>{reason.label}</span>
              {" "}· <span className={`pts-badge${pts === 0 ? " zero" : ""}`}>{pts}pt{pts !== 1 ? "s" : ""}</span></>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ── PTS REASON LABEL ─────────────────────────────────────────────────────
function ptsReason(pts) {
  if (pts === 3) return { label: "Exact Score", color: "var(--gold-bright)" };
  if (pts === 2) return { label: "Correct Diff", color: "var(--malachite-l)" };
  if (pts === 1) return { label: "Correct Winner", color: "#7EB8FF" };
  return { label: "No Points", color: "var(--muted)" };
}

// ── MATCHES TAB ───────────────────────────────────────────────────────────
function MatchesTab({ user, matches, preds, users, onSavePred, onSetScore, onClearScore }) {
  const [showAll, setShowAll] = useState(false);

  const visible = [], old = [];
  matches.forEach(m => (showAll || !isOldMatch(m) ? visible : old).push(m));

  const userPreds = user && !user.isAdmin ? (preds[user.id] || {}) : null;

  return (
    <div className="card">
      <div className="show-past-row">
        <h2 style={{ marginBottom: 0 }}>Match Predictions</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {old.length > 0 && (
            <span className="past-count">
              {showAll ? "" : `${old.length} older match${old.length > 1 ? "es" : ""} hidden`}
            </span>
          )}
          {old.length > 0 && (
            <button className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setShowAll(s => !s)}>
              {showAll ? "Hide Past Matches" : "Show Past Matches"}
            </button>
          )}
        </div>
      </div>

      {!matches.length && <div style={{ color: "var(--muted)", padding: "20px 0" }}>No matches yet. Admin will add them soon.</div>}
      {matches.length > 0 && !visible.length && <div style={{ color: "var(--muted)", padding: "20px 0" }}>No upcoming matches yet. Check back soon!</div>}

      {visible.map(match => (
        <div key={match.id}>
          <MatchItem
            match={match}
            user={user}
            preds={userPreds}
            onSavePred={onSavePred}
            onSetScore={onSetScore}
            onClearScore={onClearScore}
          />
          {/* Admin: per-player picks table under each match */}
          {user?.isAdmin && match.completed && (() => {
            const rows = Object.entries(preds)
              .filter(([, mp]) => mp[match.id])
              .map(([uid, mp]) => ({ uid, u: users[uid], p: mp[match.id] }))
              .sort((a, b) => (b.p.pts ?? 0) - (a.p.pts ?? 0));
            if (!rows.length) return null;
            return (
              <div style={{ marginTop: -6, marginBottom: 12, background: "rgba(201,168,76,0.04)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 0 }}>
                  <thead>
                    <tr style={{ background: "var(--surface)" }}>
                      <th style={{ padding: "7px 12px", fontSize: 10, color: "var(--muted)", textAlign: "left", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif" }}>Player</th>
                      <th style={{ padding: "7px 12px", fontSize: 10, color: "var(--muted)", textAlign: "center", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif" }}>Prediction</th>
                      <th style={{ padding: "7px 12px", fontSize: 10, color: "var(--muted)", textAlign: "center", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif" }}>Result</th>
                      <th style={{ padding: "7px 12px", fontSize: 10, color: "var(--muted)", textAlign: "center", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Barlow Condensed',sans-serif" }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ uid, u, p }) => {
                      const reason = ptsReason(p.pts ?? 0);
                      return (
                        <tr key={uid} style={{ borderTop: "1px solid var(--border)" }}>
                          <td style={{ padding: "7px 12px", fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "'Barlow Condensed',sans-serif" }}>{u?.displayName || uid}</td>
                          <td style={{ padding: "7px 12px", fontSize: 13, textAlign: "center", fontWeight: 700, color: "var(--text)", fontFamily: "'Barlow Condensed',sans-serif" }}>{p.home} – {p.away}</td>
                          <td style={{ padding: "7px 12px", fontSize: 11, textAlign: "center", color: reason.color, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, letterSpacing: 0.5 }}>{reason.label}</td>
                          <td style={{ padding: "7px 12px", textAlign: "center" }}>
                            <span className={`pts-badge${(p.pts ?? 0) === 0 ? " zero" : ""}`}>{p.pts ?? 0}pt{p.pts !== 1 ? "s" : ""}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
          {/* Admin: show picks even for incomplete/upcoming matches */}
          {user?.isAdmin && !match.completed && (() => {
            const rows = Object.entries(preds)
              .filter(([, mp]) => mp[match.id])
              .map(([uid, mp]) => ({ uid, u: users[uid], p: mp[match.id] }));
            if (!rows.length) return null;
            return (
              <div style={{ marginTop: -6, marginBottom: 12, background: "rgba(26,77,143,0.06)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {rows.map(({ uid, u, p }) => (
                  <span key={uid} style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'Barlow Condensed',sans-serif" }}>
                    {u?.displayName || uid}: <strong style={{ color: "var(--text)" }}>{p.home}–{p.away}</strong>
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}

// ── LEADERBOARD TAB ───────────────────────────────────────────────────────
function LeaderboardTab({ users, matches, preds }) {
  const [expanded, setExpanded] = useState(null);

  const rows = Object.values(users).sort((a, b) => (b.totalPts || 0) - (a.totalPts || 0) || a.displayName.localeCompare(b.displayName));
  const cls = i => i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
  const medal = i => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";

  const completedMatches = matches.filter(m => m.completed);

  return (
    <div className="card" style={{ maxWidth: "100%" }}>
      <h2>Leaderboard</h2>
      <div className="hint" style={{ marginBottom: 14 }}>Click a player row to see their per-game points breakdown.</div>
      {!rows.length ? <div style={{ color: "var(--muted)" }}>No data yet.</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Match Pts</th>
                <th>Bonus Pts</th>
                <th>Carried Over</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => {
                const isOpen = expanded === u.id;
                const userPreds = preds[u.id] || {};
                return (
                  <>
                    <tr
                      key={u.id}
                      onClick={() => setExpanded(isOpen ? null : u.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className={cls(i)}>{medal(i) || i + 1}</td>
                      <td className={cls(i)} style={{ fontWeight: 700 }}>{u.displayName}</td>
                      <td>{u.matchPts || 0}</td>
                      <td>{u.bonusPts || 0}</td>
                      <td>{u.manualPts || 0}</td>
                      <td><strong style={{ color: "var(--gold)" }}>{u.totalPts || 0}</strong></td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</td>
                    </tr>
                    {isOpen && (
                      <tr key={`${u.id}-breakdown`}>
                        <td colSpan={7} style={{ padding: 0, background: "var(--bg)" }}>
                          {completedMatches.length === 0 ? (
                            <div style={{ padding: "10px 16px", color: "var(--muted)", fontSize: 13 }}>No completed matches yet.</div>
                          ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ background: "rgba(201,168,76,0.07)" }}>
                                  <th style={{ padding: "6px 14px", fontSize: 10, color: "var(--gold)", textAlign: "left", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Match</th>
                                  <th style={{ padding: "6px 14px", fontSize: 10, color: "var(--gold)", textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Result</th>
                                  <th style={{ padding: "6px 14px", fontSize: 10, color: "var(--gold)", textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Prediction</th>
                                  <th style={{ padding: "6px 14px", fontSize: 10, color: "var(--gold)", textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Result</th>
                                  <th style={{ padding: "6px 14px", fontSize: 10, color: "var(--gold)", textAlign: "center", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>Pts</th>
                                </tr>
                              </thead>
                              <tbody>
                                {completedMatches.map(m => {
                                  const pred = userPreds[m.id];
                                  const pts = pred ? (pred.pts ?? calcPts(Number(pred.home), Number(pred.away), Number(m.resultHome), Number(m.resultAway))) : null;
                                  const reason = pred ? ptsReason(pts) : null;
                                  return (
                                    <tr key={m.id} style={{ borderTop: "1px solid var(--border)" }}>
                                      <td style={{ padding: "7px 14px", fontSize: 12, color: "var(--text)", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600 }}>
                                        {m.homeTeam} vs {m.awayTeam}
                                      </td>
                                      <td style={{ padding: "7px 14px", fontSize: 12, textAlign: "center", color: "var(--gold-bright)", fontWeight: 700, fontFamily: "'Barlow Condensed',sans-serif" }}>
                                        {m.resultHome} – {m.resultAway}
                                      </td>
                                      <td style={{ padding: "7px 14px", fontSize: 12, textAlign: "center", color: pred ? "var(--text)" : "var(--muted)", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: pred ? 700 : 400 }}>
                                        {pred ? `${pred.home} – ${pred.away}` : "No pick"}
                                      </td>
                                      <td style={{ padding: "7px 14px", fontSize: 11, textAlign: "center", color: reason ? reason.color : "var(--muted)", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>
                                        {reason ? reason.label : "—"}
                                      </td>
                                      <td style={{ padding: "7px 14px", textAlign: "center" }}>
                                        {pred
                                          ? <span className={`pts-badge${pts === 0 ? " zero" : ""}`}>{pts}pt{pts !== 1 ? "s" : ""}</span>
                                          : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                                        }
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── BONUS TAB ─────────────────────────────────────────────────────────────
function BonusTab({ user, bonus, onSaveGroups, onSaveOverall }) {
  const bp = (user && !user.isAdmin && bonus[user.id]) || { groupWinners: {}, overallWinner: "" };
  const [groupPicks, setGroupPicks] = useState({});
  const [overallPick, setOverallPick] = useState("");

  useEffect(() => {
    setGroupPicks(bp.groupWinners || {});
    setOverallPick(bp.overallWinner || "");
  }, [user?.id, bonus]);

  if (!user || user.isAdmin) {
    return (
      <div className="card">
        <h2>Bonus Picks</h2>
        <div className="hint">Log in as a player to submit bonus picks.</div>
      </div>
    );
  }

  const bonusLocked = isBonusLocked();

  return (
    <div className="card">
      <h2>Bonus Picks</h2>
      {bonusLocked ? (
        <div className="result-notice" style={{ marginBottom: 18 }}>
          🔒 Bonus picks are locked (deadline: 15 Jun 2026, 23:59 SGT).
        </div>
      ) : (
        <div className="hint" style={{ marginBottom: 18 }}>
          Pick the winner of each group (+5 pts each) and the overall World Cup winner (+20 pts).{" "}
          <strong style={{ color: "var(--red-bright)" }}>Deadline: 15 Jun 2026, 23:59 SGT.</strong>
        </div>
      )}

      {GROUP_NAMES.map(g => (
        <div key={g} className="bonus-group-card">
          <div className="bonus-group-header">{g} — pick the winner <span style={{ color: "var(--gold)", fontWeight: 700 }}>+5 pts</span></div>
          <div className="bonus-group-teams">{WC2026_GROUPS[g].join(" · ")}</div>
          {bonusLocked
            ? <div className="hint">Your pick: <strong style={{ color: "var(--text)" }}>{groupPicks[g] || "None"}</strong></div>
            : <select value={groupPicks[g] || ""} onChange={e => setGroupPicks(p => ({ ...p, [g]: e.target.value }))}>
                <option value="">— select winner —</option>
                {WC2026_GROUPS[g].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          }
        </div>
      ))}

      {!bonusLocked && (
        <button className="btn-gold" style={{ marginTop: 16, width: "100%" }} onClick={() => onSaveGroups(groupPicks)}>
          Save All Group Picks
        </button>
      )}

      <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: "var(--heading)", marginBottom: 6 }}>
          Overall World Cup Winner <span style={{ color: "var(--gold)", fontSize: 14 }}>+20 pts</span>
        </div>
        <div className="hint" style={{ marginBottom: 12 }}>Who will lift the trophy on 19 Jul 2026?</div>
        {bonusLocked
          ? <div className="hint">Your pick: <strong style={{ color: "var(--text)" }}>{overallPick || "None"}</strong></div>
          : <>
              <select value={overallPick} onChange={e => setOverallPick(e.target.value)} style={{ marginBottom: 12 }}>
                <option value="">— select country —</option>
                {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn-gold" style={{ width: "100%" }} onClick={() => onSaveOverall(overallPick)}>
                Save Overall Pick
              </button>
            </>
        }
      </div>
    </div>
  );
}

// ── EDIT MATCH MODAL ──────────────────────────────────────────────────────
function EditMatchModal({ match, onSave, onClose, onDelete }) {
  const [home, setHome] = useState(match.homeTeam);
  const [away, setAway] = useState(match.awayTeam);
  const [kickoff, setKickoff] = useState(isoToLocal(match.kickoffTime));
  const [deadline, setDeadline] = useState(match.deadline && match.deadline !== match.kickoffTime ? isoToLocal(match.deadline) : "");
  const [stage, setStage] = useState(match.stage);
  const [group, setGroup] = useState(match.groupName || "");

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <h3>Edit Match</h3>
        <div className="edit-modal-inner">
          <div className="grid2">
            <div className="form-group"><label>Home Team</label><input value={home} onChange={e => setHome(e.target.value)} /></div>
            <div className="form-group"><label>Away Team</label><input value={away} onChange={e => setAway(e.target.value)} /></div>
          </div>
          <div className="grid2">
            <div className="form-group"><label>Kickoff Time (SGT)</label><input type="datetime-local" value={kickoff} onChange={e => setKickoff(e.target.value)} /></div>
            <div className="form-group">
              <label>Prediction Deadline (SGT)</label>
              <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
              <div className="hint">Leave blank = same as kickoff</div>
            </div>
          </div>
          <div className="grid2">
            <div className="form-group">
              <label>Stage</label>
              <select value={stage} onChange={e => setStage(e.target.value)}>
                <option value="group">Group Stage</option>
                <option value="R16">Round of 16</option>
                <option value="QF">Quarter-Final</option>
                <option value="SF">Semi-Final</option>
                <option value="Final">Final</option>
              </select>
            </div>
            <div className="form-group"><label>Group (if Group Stage)</label><input value={group} onChange={e => setGroup(e.target.value)} placeholder="e.g. Group A" /></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button className="btn-gold" style={{ flex: 1 }} onClick={() => onSave({ home, away, kickoff, deadline, stage, group })}>Save Changes</button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
            <button className="btn-warn" style={{ width: "100%", fontSize: 12 }} onClick={onDelete}>🗑 Delete This Match</button>
            <div className="hint" style={{ marginTop: 6, textAlign: "center" }}>Removes the match and all predictions for it.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CONFIRM DELETE ────────────────────────────────────────────────────────
function ConfirmDelete({ msg, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <h3>Delete Match?</h3>
        <p>{msg}</p>
        <div className="confirm-actions">
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn-red" style={{ flex: 1 }} onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN TAB ─────────────────────────────────────────────────────────────
function AdminTab({ db, users, matches, preds, bonus, settings, recalcAll, toast }) {
  const [newMatch, setNewMatch] = useState({ home: "", away: "", kickoff: "", deadline: "", stage: "group", group: "" });
  const [resultSel, setResultSel] = useState("");
  const [resultH, setResultH] = useState("");
  const [resultA, setResultA] = useState("");
  const [editMatch, setEditMatch] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [adminUsers, setAdminUsers] = useState({});
  const [groupWinners, setGroupWinners] = useState({});
  const [overallWinner, setOverallWinner] = useState("");

  useEffect(() => {
    const u = {};
    Object.values(users).forEach(user => {
      u[user.id] = { name: user.displayName, manual: user.manualPts || 0 };
    });
    setAdminUsers(u);
  }, [users]);

  useEffect(() => {
    setGroupWinners(settings.actualGroupWinners || {});
    setOverallWinner(settings.actualOverallWinner || "");
  }, [settings]);

  useEffect(() => {
    if (resultSel) {
      const m = matches.find(x => x.id === resultSel);
      if (m?.completed) {
        setResultH(m.resultHome ?? "");
        setResultA(m.resultAway ?? "");
      } else {
        setResultH(""); setResultA("");
      }
    }
  }, [resultSel, matches]);

  const addMatch = async () => {
    if (!db || !newMatch.home || !newMatch.away || !newMatch.kickoff) { toast("Fill in home team, away team and kickoff time.", "error"); return; }
    const { firestore, doc, setDoc } = db;
    const id = `m${Date.now()}`;
    await setDoc(doc(firestore, "matches", id), {
      id, homeTeam: newMatch.home, awayTeam: newMatch.away,
      kickoffTime: new Date(newMatch.kickoff).toISOString(),
      deadline: newMatch.deadline ? new Date(newMatch.deadline).toISOString() : new Date(newMatch.kickoff).toISOString(),
      stage: newMatch.stage, groupName: newMatch.stage === "group" ? newMatch.group : "",
      completed: false, resultHome: null, resultAway: null,
    });
    toast("Match added! ✅", "success");
    setNewMatch({ home: "", away: "", kickoff: "", deadline: "", stage: "group", group: "" });
  };

  const saveResult = async (mid, h, a) => {
    if (!db || !mid || h === "" || a === "") { toast("Select a match and enter scores.", "error"); return; }
    const { firestore, doc, updateDoc } = db;
    await updateDoc(doc(firestore, "matches", mid), {
      resultHome: Math.max(0, Number(h)), resultAway: Math.max(0, Number(a)),
      completed: true,
    });
    // Pass null so recalcAll uses the freshest ref data (listener will have updated by now)
    await recalcAll(null, null, null, null, null);
    toast("Score saved & points recalculated! 🏆", "success");
  };

  const clearResult = async (mid) => {
    if (!db || !mid) return;
    const { firestore, doc, updateDoc } = db;
    await updateDoc(doc(firestore, "matches", mid), { resultHome: null, resultAway: null, completed: false });
    await recalcAll(null, null, null, null, null);
    toast("Result cleared.", "success");
  };

  const saveUser = async (uid) => {
    if (!db) return;
    const { firestore, doc, updateDoc } = db;
    await updateDoc(doc(firestore, "users", uid), {
      displayName: adminUsers[uid]?.name || users[uid].displayName,
      manualPts: Number(adminUsers[uid]?.manual || 0),
    });
    await recalcAll(null, null, null, null, null);
    toast("User updated.", "success");
  };

  const saveEditMatch = async ({ home, away, kickoff, deadline, stage, group }) => {
    if (!db || !home || !away || !kickoff) { toast("Home, away team and kickoff are required.", "error"); return; }
    const { firestore, doc, updateDoc } = db;
    await updateDoc(doc(firestore, "matches", editMatch.id), {
      homeTeam: home, awayTeam: away,
      kickoffTime: new Date(kickoff).toISOString(),
      deadline: deadline ? new Date(deadline).toISOString() : new Date(kickoff).toISOString(),
      stage, groupName: stage === "group" ? group : "",
    });
    toast("Match updated! ✅", "success");
    setEditMatch(null);
  };

  const deleteMatch = async () => {
    if (!db || !confirmDelete) return;
    const { firestore, doc, deleteDoc, writeBatch } = db;
    await deleteDoc(doc(firestore, "matches", confirmDelete));
    const batch = writeBatch(firestore);
    Object.keys(preds).forEach(uid => {
      if (preds[uid]?.[confirmDelete]) {
        const updated = { ...preds[uid] };
        delete updated[confirmDelete];
        batch.set(doc(firestore, "predictions", uid), updated);
      }
    });
    await batch.commit();
    await recalcAll(null, null, null, null, null);
    toast("Match deleted.", "info");
    setConfirmDelete(null);
    setEditMatch(null);
  };

  const saveActualGroups = async () => {
    if (!db) return;
    const { firestore, doc, setDoc } = db;
    await setDoc(doc(firestore, "settings", "app"), { actualGroupWinners: groupWinners }, { merge: true });
    await recalcAll(null, null, null, null, null);
    toast("Actual group winners saved.", "success");
  };

  const saveActualOverall = async () => {
    if (!db) return;
    const { firestore, doc, setDoc } = db;
    await setDoc(doc(firestore, "settings", "app"), { actualOverallWinner: overallWinner }, { merge: true });
    await recalcAll(null, null, null, null, null);
    toast("Actual overall winner saved.", "success");
  };

  const selectedMatch = matches.find(m => m.id === resultSel);

  return (
    <>
      {editMatch && (
        <EditMatchModal
          match={editMatch}
          onSave={saveEditMatch}
          onClose={() => setEditMatch(null)}
          onDelete={() => { setConfirmDelete(editMatch.id); setEditMatch(null); }}
        />
      )}
      {confirmDelete && (
        <ConfirmDelete
          msg={`Delete "${matches.find(m => m.id === confirmDelete)?.homeTeam} vs ${matches.find(m => m.id === confirmDelete)?.awayTeam}"? All player predictions will also be removed. This cannot be undone.`}
          onConfirm={deleteMatch}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="grid2">
        <div className="card">
          <h2>Add Match</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="form-group"><label>Home Team</label><input value={newMatch.home} onChange={e => setNewMatch(p => ({ ...p, home: e.target.value }))} placeholder="e.g. Brazil" /></div>
            <div className="form-group"><label>Away Team</label><input value={newMatch.away} onChange={e => setNewMatch(p => ({ ...p, away: e.target.value }))} placeholder="e.g. Argentina" /></div>
            <div className="form-group"><label>Kickoff Time (SGT)</label><input type="datetime-local" value={newMatch.kickoff} onChange={e => setNewMatch(p => ({ ...p, kickoff: e.target.value }))} /></div>
            <div className="form-group">
              <label>Prediction Deadline (SGT)</label>
              <input type="datetime-local" value={newMatch.deadline} onChange={e => setNewMatch(p => ({ ...p, deadline: e.target.value }))} />
              <div className="hint">Leave blank = same as kickoff</div>
            </div>
            <div className="form-group">
              <label>Stage</label>
              <select value={newMatch.stage} onChange={e => setNewMatch(p => ({ ...p, stage: e.target.value }))}>
                <option value="group">Group Stage</option>
                <option value="R16">Round of 16</option>
                <option value="QF">Quarter-Final</option>
                <option value="SF">Semi-Final</option>
                <option value="Final">Final</option>
              </select>
            </div>
            <div className="form-group"><label>Group (if Group Stage)</label><input value={newMatch.group} onChange={e => setNewMatch(p => ({ ...p, group: e.target.value }))} placeholder="e.g. Group A" /></div>
            <button className="btn-gold" onClick={addMatch}>Add Match</button>
          </div>
        </div>

        <div className="card">
          <h2>Set / Edit Score</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="form-group">
              <label>Select Match</label>
              <select value={resultSel} onChange={e => setResultSel(e.target.value)}>
                <option value="">— select —</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.homeTeam} vs {m.awayTeam}{m.completed ? ` [${m.resultHome}–${m.resultAway}]` : ""} — {fmtSGT(m.kickoffTime)}
                  </option>
                ))}
              </select>
            </div>
            {selectedMatch?.completed && (
              <div className="hint">Current: <strong style={{ color: "var(--gold)" }}>{selectedMatch.resultHome} – {selectedMatch.resultAway}</strong></div>
            )}
            <div className="form-group">
              <label>Score</label>
              <div className="score-row">
                <input type="number" min="0" value={resultH} onChange={e => setResultH(e.target.value)} placeholder="0" />
                <span className="vs">–</span>
                <input type="number" min="0" value={resultA} onChange={e => setResultA(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-blue" onClick={() => saveResult(resultSel, resultH, resultA)}>Save Score &amp; Recalculate</button>
              {selectedMatch?.completed && <button className="btn-red" onClick={() => clearResult(resultSel)}>Clear Result</button>}
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Manage Users</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.values(users).map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "var(--surface)", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.displayName}</div>
                  <div className="hint">{u.id} · Match: {u.matchPts || 0} · Bonus: {u.bonusPts || 0} · Manual: {u.manualPts || 0} · Total: {u.totalPts || 0}</div>
                </div>
                <input style={{ width: 160 }} value={adminUsers[u.id]?.name ?? u.displayName} onChange={e => setAdminUsers(p => ({ ...p, [u.id]: { ...p[u.id], name: e.target.value } }))} />
                <input type="number" style={{ width: 90 }} value={adminUsers[u.id]?.manual ?? u.manualPts ?? 0} onChange={e => setAdminUsers(p => ({ ...p, [u.id]: { ...p[u.id], manual: e.target.value } }))} />
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => saveUser(u.id)}>Save</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Bonus Actuals</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="section-label">Actual Group Winners</div>
            {GROUP_NAMES.map(g => (
              <div key={g} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ minWidth: 76, fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>{g}</div>
                <select style={{ flex: 1 }} value={groupWinners[g] || ""} onChange={e => setGroupWinners(p => ({ ...p, [g]: e.target.value }))}>
                  <option value="">— winner —</option>
                  {WC2026_GROUPS[g].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ))}
            <button className="btn-blue" onClick={saveActualGroups}>Save Group Winners</button>
            <div className="section-label" style={{ marginTop: 8 }}>Actual Overall Winner</div>
            <select value={overallWinner} onChange={e => setOverallWinner(e.target.value)}>
              <option value="">— select country —</option>
              {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn-blue" onClick={saveActualOverall}>Save Overall Winner</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <h2>All Matches <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "'Audiowide',sans-serif", fontWeight: 400 }}>— click ✏️ to edit · 🗑 to delete</span></h2>
        {!matches.length ? <div className="hint">No matches added yet.</div> : (
          matches.map(m => {
            const [mH, setMH] = useState(m.resultHome ?? "");
            const [mA, setMA] = useState(m.resultAway ?? "");
            return (
              <div className="card" style={{ marginTop: 0 }}>
        <h2>All Matches <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "'Audiowide',sans-serif", fontWeight: 400 }}>— click ✏️ to edit · 🗑 to delete</span></h2>
        {!matches.length ? <div className="hint">No matches added yet.</div> : (
          matches.map(m => {
            const [mH, setMH] = useState(m.resultHome ?? "");
            const [mA, setMA] = useState(m.resultAway ?? "");
            const pickRows = Object.entries(preds)
              .filter(([, mp]) => mp[m.id])
              .map(([uid, mp]) => ({ uid, u: users[uid], p: mp[m.id] }))
              .sort((a, b) => (b.p.pts ?? 0) - (a.p.pts ?? 0));
            return (
              <div key={m.id} style={{ marginBottom: 8 }}>
                <div className="admin-match-row" style={pickRows.length ? { marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: "none" } : {}}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--heading)" }}>{m.homeTeam} vs {m.awayTeam}</div>
                    <div className="hint">{fmtSGT(m.kickoffTime)} · {m.stage}{m.groupName ? " · " + m.groupName : ""}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <input type="number" min="0" value={mH} onChange={e => setMH(e.target.value)} placeholder="H" style={{ width: 56 }} />
                    <span className="vs" style={{ fontSize: 13 }}>–</span>
                    <input type="number" min="0" value={mA} onChange={e => setMA(e.target.value)} placeholder="A" style={{ width: 56 }} />
                    <button className="btn-blue" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => saveResult(m.id, mH, mA)}>{m.completed ? "Update" : "Set"}</button>
                    {m.completed && <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, color: "var(--red)", borderColor: "var(--red)" }} onClick={() => clearResult(m.id)}>Clear</button>}
                  </div>
                  <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setEditMatch(m)} title="Edit match">✏️</button>
                  <button className="btn-warn" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setConfirmDelete(m.id)} title="Delete match">🗑</button>
                  <span className={`pill ${m.completed ? "pill-done" : isLocked(m) ? "pill-locked" : "pill-open"}`}>
                    {m.completed ? "Done" : isLocked(m) ? "Locked" : "Open"}
                  </span>
                </div>
                {pickRows.length > 0 && (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "none", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {pickRows.map(({ uid, u, p }) => {
                      const reason = m.completed ? ptsReason(p.pts ?? 0) : null;
                      return (
                        <span key={uid} style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'Barlow Condensed',sans-serif" }}>
                          {u?.displayName || uid}: <strong style={{ color: "var(--text)" }}>{p.home}–{p.away}</strong>
                          {m.completed && (
                            <> · <span style={{ color: reason.color, fontWeight: 700 }}>{reason.label}</span> · <span className={`pts-badge${(p.pts ?? 0) === 0 ? " zero" : ""}`} style={{ fontSize: 10, padding: "1px 6px" }}>{p.pts ?? 0}pt{p.pts !== 1 ? "s" : ""}</span></>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
            );
          })
        )}
      </div>
    </>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────
function LoginOverlay({ users, onLogin, onAdminLogin }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const displayUsers = Object.values(users).length > 0 ? Object.values(users) : DEFAULT_USERS;

  return (
    <div className="overlay">
      <div className="login-box">
        <div className="login-title"><span className="we">World Cup</span> 2026</div>
        <div className="logo-sub">Mini League</div>
        <br />
        <div className="user-grid">
          {displayUsers.map(u => (
            <button key={u.id} className="user-select-btn" onClick={() => onLogin(u)}>{u.displayName}</button>
          ))}
        </div>
        <div className="divider">or</div>
        <button className="btn-ghost" style={{ width: "100%", fontSize: 12 }} onClick={() => setShowAdmin(s => !s)}>Admin Login</button>
        {showAdmin && (
          <div style={{ marginTop: 12 }}>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Admin Password</label>
              <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Enter admin password"
                onKeyDown={e => e.key === "Enter" && onAdminLogin(adminPass)} />
            </div>
            <button className="btn-gold" style={{ width: "100%" }} onClick={() => onAdminLogin(adminPass)}>Login as Admin</button>
            <div className="hint" style={{ marginTop: 8, textAlign: "center" }}>Default Password: <code style={{ color: "var(--gold)" }}>admin2026</code></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PROFILE MODAL ─────────────────────────────────────────────────────────
function ProfileModal({ user, onSave, onClose }) {
  const [name, setName] = useState(user?.displayName || "");
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Edit Your Name</h3>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-gold" style={{ flex: 1 }} onClick={() => onSave(name)}>Save</button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function Toast({ msg, type, visible }) {
  return (
    <div className={`toast ${type}${visible ? " show" : ""}`}>{msg}</div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("matches");
  const [session, setSession] = useState(loadSession);
  const [showProfile, setShowProfile] = useState(false);
  const toast = useToast();

  const { db, connected, users, matches, preds, bonus, settings, recalcAll } = useFirebase(toast.show);

  const currentUser = () => {
    if (!session) return null;
    if (session.isAdmin) return { id: "admin", displayName: "Admin", isAdmin: true };
    return users[session.userId] || null;
  };

  const user = currentUser();

  const login = (u) => {
    const s = { userId: u.id, isAdmin: false };
    setSession(s); saveSession(s);
    toast.show(`Welcome, ${u.displayName}! 🎉`, "success");
  };

  const adminLogin = (pass) => {
    if (pass === ADMIN_PASS) {
      const s = { isAdmin: true };
      setSession(s); saveSession(s);
      toast.show("Welcome, Admin! ⚙️", "success");
    } else {
      toast.show("Wrong password.", "error");
    }
  };

  const logout = () => {
    setSession(null); saveSession(null);
    setActiveTab("matches");
  };

  const savePrediction = async (matchId, home, away) => {
    if (!user || user.isAdmin || !db) return;
    const match = matches.find(m => m.id === matchId);
    if (!match || isLocked(match)) { toast.show("Deadline passed!", "error"); return; }
    if (home === "" || away === "") { toast.show("Enter both scores.", "error"); return; }
    const { firestore, doc, setDoc } = db;
    const predData = { home: Math.max(0, Number(home)), away: Math.max(0, Number(away)), pts: 0 };
    if (match.completed) {
      predData.pts = calcPts(predData.home, predData.away, Number(match.resultHome), Number(match.resultAway));
    }
    await setDoc(doc(firestore, "predictions", user.id), { [matchId]: predData }, { merge: true });
    // FIX 5: pass null so recalcAll reads fresh ref data after the write above
    await recalcAll(null, null, null, null, null);
    toast.show("Prediction saved! ⚽", "success");
  };

  const adminSetScore = async (matchId, h, a) => {
    if (!db) return;
    const { firestore, doc, updateDoc } = db;
    await updateDoc(doc(firestore, "matches", matchId), {
      resultHome: Math.max(0, Number(h)), resultAway: Math.max(0, Number(a)), completed: true,
    });
    await recalcAll(null, null, null, null, null);
    toast.show("Score saved & points recalculated! 🏆", "success");
  };

  const adminClearScore = async (matchId) => {
    if (!db) return;
    const { firestore, doc, updateDoc } = db;
    await updateDoc(doc(firestore, "matches", matchId), { resultHome: null, resultAway: null, completed: false });
    await recalcAll(null, null, null, null, null);
    toast.show("Result cleared.", "success");
  };

  const saveProfile = async (name) => {
    if (!user || !name.trim() || !db) return;
    const { firestore, doc, updateDoc } = db;
    await updateDoc(doc(firestore, "users", user.id), { displayName: name.trim() });
    toast.show("Name updated!", "success");
    setShowProfile(false);
  };

  const saveBonusGroups = async (groupPicks) => {
    if (isBonusLocked()) { toast.show("Bonus picks are locked!", "error"); return; }
    if (!db) return;
    const { firestore, doc, setDoc } = db;
    const bp = bonus[user.id] || { groupWinners: {}, overallWinner: "" };
    await setDoc(doc(firestore, "bonus", user.id), { groupWinners: groupPicks, overallWinner: bp.overallWinner || "" }, { merge: true });
    await recalcAll(null, null, null, null, null);
    toast.show("Group picks saved! ✅", "success");
  };

  const saveBonusOverall = async (pick) => {
    if (isBonusLocked()) { toast.show("Bonus picks are locked!", "error"); return; }
    if (!db || !pick) { toast.show("Please select a country.", "error"); return; }
    const { firestore, doc, setDoc } = db;
    const bp = bonus[user.id] || { groupWinners: {}, overallWinner: "" };
    await setDoc(doc(firestore, "bonus", user.id), { overallWinner: pick, groupWinners: bp.groupWinners || {} }, { merge: true });
    await recalcAll(null, null, null, null, null);
    toast.show(`Overall winner pick saved: ${pick} 🏆`, "success");
  };

  const tabs = ["matches", "leaderboard", "bonus", ...(user?.isAdmin ? ["admin"] : []), "rules"];
  const tabLabels = { matches: "Matches", leaderboard: "Leaderboard", bonus: "Bonus Picks", admin: "⚙ Admin", rules: "Rules" };

  return (
    <>
      <style>{CSS}</style>

      {!session && (
        <LoginOverlay users={users} onLogin={login} onAdminLogin={adminLogin} />
      )}

      {showProfile && user && !user.isAdmin && (
        <ProfileModal user={user} onSave={saveProfile} onClose={() => setShowProfile(false)} />
      )}

      <div className="topbar">
        <div className="topbar-inner">
          <div className="logo">
            <div className="logo-main">
              <span className="we-are">World Cup</span><span className="year">26</span>
            </div>
            <div className="logo-sub">Prediction Mini League</div>
            <div className="logo-flag-strip">
              <span className="flag-mx-g"/><span className="flag-mx-w"/><span className="flag-mx-r"/>
              <span className="flag-us-r"/><span className="flag-us-w"/><span className="flag-us-b"/>
              <span className="flag-ca-r"/><span className="flag-ca-w"/><span className="flag-ca-r"/>
            </div>
          </div>
          <div className="topbar-right">
            <span className="conn-indicator">
              <span className={`dot-live${connected ? " live" : ""}`} />
              <span>{connected ? "Live" : "Connecting…"}</span>
            </span>
            <div className="user-badge" onClick={() => !user?.isAdmin && setShowProfile(true)}>
              <div className={`badge-dot${user?.isAdmin ? " admin" : ""}`} />
              <span>{user?.displayName || "–"}</span>
            </div>
            <button className="btn-logout" onClick={logout}>Log Out</button>
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t} className={`tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      <div className="main">
        {activeTab === "matches" && (
          <MatchesTab
            user={user} matches={matches} preds={preds} users={users}
            onSavePred={savePrediction} onSetScore={adminSetScore} onClearScore={adminClearScore}
          />
        )}
        {activeTab === "leaderboard" && <LeaderboardTab users={users} matches={matches} preds={preds} />}
        {activeTab === "bonus" && (
          <BonusTab user={user} bonus={bonus} onSaveGroups={saveBonusGroups} onSaveOverall={saveBonusOverall} />
        )}
        {activeTab === "admin" && user?.isAdmin && (
          <AdminTab
            db={db} users={users} matches={matches} preds={preds}
            bonus={bonus} settings={settings} recalcAll={recalcAll} toast={toast.show}
          />
        )}
        {activeTab === "rules" && (
          <div className="card card-accent">
            <h2>How to Play</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, lineHeight: 1.8 }}>
              <div>⚽ <strong>Correct exact score</strong> → <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>3 pts</span></div>
              <div>🎯 <strong>Correct goal difference</strong>→ <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>2 pts</span></div>
              <div>✅ <strong>Correct winner / draw</strong> → <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>1 pt</span></div>
              <div>🏆 <strong>Correct group stage winner</strong> → <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>5 pts</span> per group</div>
              <div>🥇 <strong>Correct overall World Cup winner</strong> → <span style={{ color: "var(--gold-bright)", fontWeight: 700 }}>20 pts</span></div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 10 }}>Predictions lock at the deadline set by admin. All times shown in Singapore Time (GMT+8).</div>
            </div>
          </div>
        )}
      </div>

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </>
  );
}