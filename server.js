'use strict';
/* 맨 인 블랙: 수상한 지구 생활 — 서버 */
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Server } = require('socket.io');
const { UNITS, DIMS, DIM, ALIENS, SCENARIOS, FINALS, PARTS } = require('./data');
const G = require('./gen');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
// 교사 비밀번호: 기본 finel9932! (Render 환경 변수 TEACHER_PASSWORD로 바꿀 수 있음)
const PW_HASH = sha(process.env.TEACHER_PASSWORD || 'finel9932!');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/teacher', (q, r) => r.sendFile(path.join(__dirname, 'public', 'teacher.html')));
app.get('/healthz', (q, r) => r.send('ok'));
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });

/* ---------------- 반 / 설정 ---------------- */
const DEFAULT_SET = { units: [12], mode: 'unit', cases: 3, teamSize: 3, final: true, bots: true };
const CLASS_LIST = [['8', '8반', '0608'], ['9', '9반', '0609'], ['10', '10반', '0610']];
let saved = {};
try { saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (e) { /* 처음 */ }
const CLASSES = {};
for (const [id, name, code] of CLASS_LIST) CLASSES[id] = { id, name, code, settings: { ...DEFAULT_SET, ...(saved[id] || {}) }, players: {}, teams: [], status: 'lobby', missionNo: 0 };
CLASSES.P = { id: 'P', name: '연습 작전', code: null, settings: { ...DEFAULT_SET, bots: true }, players: {}, teams: [], status: 'running', missionNo: 0 };
const saveSettings = () => { const o = {}; for (const c of Object.values(CLASSES)) if (c.code) o[c.id] = c.settings; fs.writeFile(SETTINGS_FILE, JSON.stringify(o), () => {}); };

let RESULTS = [];
try { RESULTS = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch (e) { RESULTS = []; }
const saveResults = () => fs.writeFile(RESULTS_FILE, JSON.stringify(RESULTS), () => {});

const TOKENS = {}; // token -> player
const TEAM_NAMES = ['알파', '브라보', '찰리', '델타', '에코', '폭스트롯', '골프', '호텔', '인디고', '줄리엣', '킬로', '리마'];
const BOT_NAMES = ['AI 요원 R-1', 'AI 요원 R-2', 'AI 요원 R-3', 'AI 요원 R-4'];
let teamSeq = 1;
const now = () => Date.now();

/* ---------------- 팀 ---------------- */
function newTeam(cls, humans) {
  const c = CLASSES[cls];
  const used = c.teams.map(t => t.name);
  const name = (TEAM_NAMES.find(n => !used.includes(n + '팀')) || ('팀' + (c.teams.length + 1))) + '팀';
  const t = { id: 'T' + (teamSeq++), cls, name, members: [], m: null };
  for (const p of humans) addHuman(t, p);
  c.teams.push(t);
  return t;
}
function addHuman(t, p) {
  t.members.push({ token: p.token, name: p.name, bot: false });
  p.teamId = t.id;
}
function fillBots(t, min) {
  let k = 0;
  while (t.members.length < min) {
    const used = t.members.map(m => m.name);
    const name = BOT_NAMES.find(n => !used.includes(n)) || ('AI 요원 R-' + (++k + 4));
    t.members.push({ token: null, name, bot: true });
  }
}
const teamOf = p => p && p.teamId ? CLASSES[p.cls].teams.find(t => t.id === p.teamId) : null;
const memberIdx = (t, p) => t.members.findIndex(m => m.token === p.token);
const isOnline = (m) => m.bot || (TOKENS[m.token] && TOKENS[m.token].online);

function autoAssign(c) {
  // 기존 팀 해체 후 다시 배정 (온라인 학생)
  for (const t of c.teams) t.m = null;
  c.teams = [];
  const ps = shuffle(Object.values(c.players).filter(p => p.online));
  for (const p of Object.values(c.players)) p.teamId = null;
  if (!ps.length) return;
  const size = c.settings.teamSize === 4 ? 4 : 3;
  let g = Math.max(1, Math.round(ps.length / size));
  while (Math.ceil(ps.length / g) > 4) g++;
  const groups = Array.from({ length: g }, () => []);
  ps.forEach((p, i) => groups[i % g].push(p));
  for (const grp of groups) { const t = newTeam(c.id, grp); if (c.settings.bots) fillBots(t, 3); }
}
function shuffle(a) { return G.R.shuffle(a); }

/* 진행 중에 들어온 학생 자리 찾기: 봇 자리 → 빈자리(4명 미만) → 새 팀 */
function placeLate(c, p) {
  const withBot = c.teams.filter(t => t.members.some(m => m.bot));
  if (withBot.length) {
    const t = withBot.sort((a, b) => a.members.filter(m => !m.bot).length - b.members.filter(m => !m.bot).length)[0];
    const i = t.members.findIndex(m => m.bot);
    feed(t, `${t.members[i].name} 자리에 ${p.name} 요원이 합류했어요.`);
    t.members[i] = { token: p.token, name: p.name, bot: false };
    p.teamId = t.id;
    return t;
  }
  const open = c.teams.filter(t => t.members.length < 4).sort((a, b) => a.members.length - b.members.length)[0];
  if (open) { addHuman(open, p); feed(open, `${p.name} 요원이 합류했어요. 다음 사건부터 단서를 받아요.`); return open; }
  const t = newTeam(c.id, [p]);
  if (c.settings.bots) fillBots(t, 3);
  if (c.status === 'running') startMission(t);
  return t;
}

/* ---------------- 작전(미션) ---------------- */
function startMission(t, opt = {}) {
  const c = CLASSES[t.cls];
  const s = opt.settings || c.settings;
  const total = Math.max(1, Math.min(8, Number(s.cases) || 3));
  t.m = { total, no: 0, score: 0, parts: [], results: [], used: [], set: s, startedAt: now(), done: false, saved: false };
  nextCase(t);
}
function nextCase(t) {
  const m = t.m;
  m.no++;
  const s = m.set;
  const units = (s.units && s.units.length ? s.units : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map(Number);
  const isFinal = s.final && m.total >= 2 && m.no === m.total;
  const mixed = s.mode === 'mix' || isFinal;
  const n = Math.max(3, Math.min(4, t.members.length));
  const built = G.buildCase({ units, n, mixed: mixed && units.length > 1, final: isFinal && units.length > 1 });
  const scen = G.pickScenario(isFinal ? units : built.units, isFinal, m.used);
  m.used.push(scen.id);
  const cs = Object.assign(built, {
    no: m.no, scenario: scen, final: isFinal, phase: 'brief', t0: now(), tInv: 0,
    ready: {}, owner: built.clues.map((_, i) => i), posted: built.clues.map(() => 0), decoded: built.clues.map(() => null),
    revealed: {}, marks: {}, cleared: [], wrong: 0, hints: {}, hq: 0, vote: null, scan: null,
    report: {}, feed: [], botPlan: {}, solvedAt: 0, basisBonus: 0,
  });
  for (const cd of cs.candidates) cs.revealed[cd.id] = {};
  t.m.cs = cs;
  cs.feed.push({ t: now(), x: `사건 ${m.no} 출동! ${scen.place}` });
  push(t);
}
function feed(t, x) { if (t.m && t.m.cs) { t.m.cs.feed.push({ t: now(), x }); if (t.m.cs.feed.length > 30) t.m.cs.feed.shift(); } }

function chapter(m) {
  const cs = m.cs;
  if (cs.final) return '최종 · 번역기 회수 작전';
  if (m.no === 1) return '도입 · 신입 요원 출동';
  if (m.no >= m.total - (m.set.final ? 1 : 0) && m.total > 2) return '후반 · 뒤섞인 기록';
  return '중반 · 도시 곳곳의 이상 신호';
}

function goInvestigate(t) {
  const cs = t.m.cs;
  if (cs.phase !== 'brief') return;
  cs.phase = 'inv'; cs.tInv = now();
  t.members.forEach((mm, i) => { if (mm.bot) cs.botPlan[i] = now() + 9000 + Math.random() * 9000; });
  feed(t, '수사 시작! 각자의 기밀 정보를 확인하세요.');
}

function startReport(t) {
  const cs = t.m.cs;
  if (cs.phase !== 'reveal') return;
  cs.phase = 'report';
  cs.reportAt = now();
  cs.clues.forEach((cl, i) => { cs.report[i] = { done: false, tries: 0 }; });
}
function finishCase(t) {
  const m = t.m, cs = m.cs;
  const sec = Math.round(((cs.solvedAt || now()) - cs.tInv) / 1000);
  const timeBonus = Math.max(0, Math.min(30, Math.round(30 - (sec - 120) / 10)));
  const hintN = Object.keys(cs.hints).length;
  const score = Math.max(20, 100 - cs.wrong * 15 - hintN * 5 - cs.hq * 10 + timeBonus + cs.basisBonus);
  m.score += score;
  m.askN = (m.askN || 0) + (cs.askN || 0); m.repFail = (m.repFail || 0) + (cs.repFail || 0); m.wrongN = (m.wrongN || 0) + cs.wrong;
  m.parts.push(PARTS[(m.parts.length) % PARTS.length]);
  m.results.push({ no: cs.no, title: cs.scenario.title, units: cs.units, final: cs.final, sec, wrong: cs.wrong, hints: hintN, hq: cs.hq, score,
    species: cs.species, expressions: cs.clues.map(c => c.text) });
  if (m.no >= m.total) {
    m.done = true; cs.phase = 'missionDone';
    saveMission(t);
  } else nextCase(t);
  push(t);
}
function saveMission(t, partial) {
  const m = t.m; if (!m || m.saved || !m.results.length) return;
  m.saved = true;
  RESULTS.push({ id: crypto.randomUUID(), date: new Date().toISOString(), cls: t.cls, clsName: CLASSES[t.cls].name, team: t.name,
    members: t.members.map(x => x.name + (x.bot ? '(AI)' : '')), units: m.set.units, mode: m.set.mode,
    cases: m.results, total: m.score, parts: m.parts.length, done: !partial });
  if (RESULTS.length > 3000) RESULTS = RESULTS.slice(-3000);
  saveResults();
}

/* ---------------- 수사 동작 ---------------- */
function norm(s) { return String(s || '').toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function answerOk(input, key) {
  const a = norm(input), k = norm(key);
  if (a === k) return true;
  if (a === k.replace(/(\d+)(st|nd|rd|th)\b/, '$1')) return true; // July 22 = July 22nd
  if (a.replace(/^(a|an|the) /, '') === k.replace(/^(a|an|the) /, '')) return true;
  return false;
}

function act(p, type, d, ack) {
  const t = teamOf(p); if (!t || !t.m || !t.m.cs) return ack({ ok: false, msg: '아직 작전이 시작되지 않았어요.' });
  const cs = t.m.cs, me = memberIdx(t, p);
  if (me < 0) return ack({ ok: false });
  const res = A[type] ? A[type](t, cs, me, d || {}) : { ok: false };
  push(t);
  ack(res || { ok: true });
}
const A = {
  ready(t, cs, me) { if (cs.phase !== 'brief') return; cs.ready[me] = true; if (t.members.every((mm, i) => mm.bot || !isOnline(mm) || cs.ready[i])) goInvestigate(t); },
  post(t, cs, me) {
    if (cs.phase !== 'inv') return { ok: false };
    const i = cs.owner.indexOf(me); if (i < 0 || cs.posted[i]) return { ok: false };
    cs.posted[i] = now();
    feed(t, `${t.members[me].name} 요원이 단서를 전송했어요. 듣고 해독하세요!`);
    ttsTeam(t, cs.clues[i].text, me);
    if (!t.members.some((mm, k) => k !== me && !mm.bot && isOnline(mm))) cs.decoded[i] = cs.decoded[i] || 'auto';
    return { ok: true };
  },
  decode(t, cs, me, d) {
    const i = Number(d.i), cl = cs.clues[i];
    if (cs.phase !== 'inv' || !cl || !cs.posted[i] || cs.decoded[i] || cs.owner[i] === me) return { ok: false };
    if (String(d.choice).toLowerCase() === cl.key.toLowerCase()) { cs.decoded[i] = t.members[me].name; feed(t, `${t.members[me].name} 요원이 단서 해독 성공!`); return { ok: true }; }
    return { ok: false, wrong: true };
  },
  ask(t, cs, me, d) {
    if (cs.phase !== 'inv') return { ok: false };
    const cd = cs.candidates.find(x => x.id === d.cand); if (!cd) return { ok: false };
    const q = cs.questions.find(x => x.qid === d.qid); if (!q) return { ok: false };
    if (q.qid.startsWith('x')) return { ok: true, q: q.q, a: "Sorry? That's not about this case." };
    const a = G.answer(cd, q.qid);
    if (!cs.revealed[cd.id][q.qid]) { cs.revealed[cd.id][q.qid] = 1; cs.askN = (cs.askN || 0) + 1; feed(t, `${t.members[me].name} 요원이 ${cd.name}에게 질문: "${q.q}"`); }
    return { ok: true, q: q.q, a };
  },
  mark(t, cs, me, d) { if (cs.phase !== 'inv') return; const id = d.cand; if (!cs.revealed[id]) return; cs.marks[id] = !cs.marks[id]; },
  hint(t, cs, me) { const i = cs.owner.indexOf(me); if (i < 0) return { ok: false }; cs.hints[me] = true; return { ok: true }; },
  hq(t, cs) {
    if (cs.phase !== 'inv' || now() - cs.tInv < 90000) return { ok: false, msg: '수사 시작 1분 30초 뒤부터 쓸 수 있어요.' };
    const i = cs.posted.findIndex(x => !x); if (i < 0) return { ok: false, msg: '모든 단서가 이미 전송됐어요.' };
    cs.posted[i] = now(); cs.hq++;
    feed(t, `본부가 ${t.members[cs.owner[i]].name} 요원의 단서를 대신 전송했어요. (-10점)`);
    ttsTeam(t, cs.clues[i].text, -1);
    return { ok: true };
  },
  propose(t, cs, me, d) {
    if (cs.phase !== 'inv' || cs.vote) return { ok: false };
    const cd = cs.candidates.find(x => x.id === d.cand); if (!cd || cs.cleared.includes(cd.id)) return { ok: false };
    const basis = (d.basis || []).map(Number).filter(i => cs.clues[i] && (cs.decoded[i] || cs.owner[i] === me));
    if (!basis.length) return { ok: false, msg: '근거가 되는 단서를 하나 이상 골라 주세요.' };
    cs.vote = { by: me, cand: cd.id, basis: [...new Set(basis)], votes: { [me]: true }, t0: now() };
    feed(t, `${t.members[me].name} 요원이 ${cd.id}(${cd.name}) 스캔을 제안했어요. 동의하나요?`);
    checkVote(t);
  },
  vote(t, cs, me, d) { if (!cs.vote) return; cs.vote.votes[me] = !!d.agree; checkVote(t); },
  toReport(t, cs) { startReport(t); },
  report(t, cs, me, d) {
    if (cs.phase !== 'report') return { ok: false };
    const i = cs.owner.indexOf(me); const r = cs.report[i]; if (!r || r.done) return { ok: false };
    if (answerOk(d.answer, cs.clues[i].key)) { r.done = true; r.by = t.members[me].name; checkReport(t); return { ok: true }; }
    r.tries++; cs.repFail = (cs.repFail || 0) + 1; return { ok: false, tries: r.tries };
  },
};

function checkVote(t) {
  const cs = t.m.cs, v = cs.vote; if (!v) return;
  const voters = t.members.map((mm, i) => i).filter(i => !t.members[i].bot && isOnline(t.members[i]));
  t.members.forEach((mm, i) => { if (mm.bot) v.votes[i] = true; });
  if (Object.entries(v.votes).some(([, a]) => a === false)) {
    feed(t, '반대 의견이 있어 스캔을 취소했어요. 증거를 더 맞춰 보세요.'); cs.vote = null; return;
  }
  const timedOut = now() - v.t0 > 20000;
  if (!timedOut && !voters.every(i => v.votes[i] === true)) return;
  doScan(t);
}
function doScan(t) {
  const cs = t.m.cs, v = cs.vote; cs.vote = null;
  const cd = cs.candidates.find(x => x.id === v.cand);
  cs.scanSeq = (cs.scanSeq || 0) + 1;
  if (cd.alien) {
    cs.basisBonus = v.basis.length === cs.clues.length ? 10 : 0;
    cs.scan = { seq: cs.scanSeq, cand: cd.id, ok: true };
    cs.phase = 'reveal'; cs.solvedAt = now(); cs.revealAt = now();
    feed(t, `스캔 성공! ${cd.name}의 정체는 ${ALIENS[cs.species].name}!`);
    ttsTeam(t, cs.scenario.line[0], -1, 2600);
  } else {
    cs.wrong++; cs.cleared.push(cd.id); cs.marks[cd.id] = true;
    cs.scan = { seq: cs.scanSeq, cand: cd.id, ok: false };
    feed(t, `${cd.name}은(는) 진짜 지구인이었어요. (-15점) 다시 조사하세요.`);
  }
}
function checkReport(t) {
  const cs = t.m.cs;
  if (Object.values(cs.report).every(r => r.done)) { feed(t, '사건 보고서 완성!'); cs.phase = 'reportDone'; cs.reportDoneAt = now(); }
}

/* ---------------- 봇·시간 처리 ---------------- */
setInterval(() => {
  for (const c of Object.values(CLASSES)) for (const t of c.teams) {
    if (!t.m || !t.m.cs || t.m.done) continue;
    const cs = t.m.cs; let changed = false;
    const humansOn = t.members.filter(mm => !mm.bot && isOnline(mm)).length;
    if (cs.phase === 'brief' && (now() - cs.t0 > 40000 || (humansOn && t.members.every((mm, i) => mm.bot || !isOnline(mm) || cs.ready[i])))) { goInvestigate(t); changed = true; }
    if (cs.phase === 'inv') {
      cs.owner.forEach((mi, i) => {
        const mm = t.members[mi];
        if (cs.posted[i] || !mm) return;
        if (mm.bot && now() > (cs.botPlan[mi] || 0)) { A.post(t, cs, mi); changed = true; }
        else if (!mm.bot && !isOnline(mm) && now() - cs.tInv > 25000) { cs.posted[i] = now(); feed(t, `${mm.name} 요원의 연결이 끊겨 단서를 자동 전송했어요.`); ttsTeam(t, cs.clues[i].text, -1); changed = true; }
      });
      cs.clues.forEach((cl, i) => {
        if (!cs.posted[i] || cs.decoded[i]) return;
        const owner = cs.owner[i];
        const otherHumans = t.members.some((mm, k) => k !== owner && !mm.bot && isOnline(mm));
        const hasBot = t.members.some((mm, k) => k !== owner && mm.bot);
        const wait = otherHumans ? 30000 : 3000;
        if (now() - cs.posted[i] > wait && (hasBot || !otherHumans)) {
          const b = t.members.findIndex((mm, k) => k !== owner && mm.bot);
          cs.decoded[i] = b >= 0 ? t.members[b].name : 'auto';
          if (b >= 0) feed(t, `${t.members[b].name}가 단서를 대신 해독했어요.`);
          changed = true;
        }
      });
      if (cs.vote) { checkVote(t); changed = true; }
    }
    if (cs.phase === 'reveal' && now() - cs.revealAt > 20000) { startReport(t); changed = true; }
    if (cs.phase === 'report') {
      for (const [i, r] of Object.entries(cs.report)) {
        if (r.done) continue;
        const mm = t.members[cs.owner[i]];
        if (!mm || (mm.bot && now() - cs.reportAt > 3500) || (!mm.bot && !isOnline(mm) && now() - cs.reportAt > 8000) || now() - cs.reportAt > 150000) { r.done = true; r.by = mm ? mm.name : ''; r.auto = true; changed = true; }
      }
      if (changed) checkReport(t);
    }
    if (cs.phase === 'reportDone' && now() - cs.reportDoneAt > 4500) { finishCase(t); continue; }
    if (changed) push(t);
  }
}, 1000);

/* ---------------- 학생에게 보내는 화면 정보 ---------------- */
function viewFor(t, me) {
  const m = t.m;
  const base = { team: t.name, cls: CLASSES[t.cls].name, practice: t.cls === 'P', me,
    members: t.members.map((mm, i) => ({ name: mm.name, bot: mm.bot, online: isOnline(mm), me: i === me })) };
  if (!m) return { ...base, phase: 'wait' };
  const cs = m.cs;
  const v = { ...base, phase: cs.phase, no: cs.no, total: m.total, score: m.score, parts: m.parts, allParts: PARTS.slice(0, m.total),
    chapter: chapter(m), final: cs.final, unitTitles: cs.units.map(u => ({ u, t: UNITS[u].t })),
    scenario: { title: cs.scenario.title, place: cs.scenario.place, icon: cs.scenario.icon, role: cs.scenario.role, anomaly: cs.scenario.anomaly },
    elapsed: cs.tInv ? now() - cs.tInv : 0, hqReady: cs.phase === 'inv' && now() - cs.tInv >= 90000 && cs.posted.some(x => !x),
    ready: t.members.map((mm, i) => !!(mm.bot || cs.ready[i])),
    feed: cs.feed.slice(-8).map(f => f.x), wrong: cs.wrong };
  if (cs.phase === 'missionDone') {
    v.results = m.results;
    v.totalSec = m.results.reduce((s, r) => s + r.sec, 0);
    v.stamps = [
      { img: 'act-see', name: '매의 눈', ok: (m.wrongN || 0) <= Math.max(0, m.total - 2), desc: '오답 스캔을 거의 하지 않았어요' },
      { img: 'act-talk', name: '대화의 달인', ok: (m.askN || 0) >= m.total * 4, desc: `영어 인터뷰 ${m.askN || 0}회` },
      { img: 'act-write', name: '기록 요원', ok: (m.repFail || 0) === 0, desc: '보고서를 한 번에 정확하게 썼어요' },
    ];
    return v;
  }
  const mine = cs.owner.indexOf(me);
  v.myClue = mine >= 0 ? { i: mine, text: cs.clues[mine].text, posted: !!cs.posted[mine], hint: cs.hints[me] ? cs.clues[mine].ko : null } : null;
  const open = ['reveal', 'report', 'reportDone'].includes(cs.phase); // 정체 공개 뒤에는 전체 공개
  v.clues = cs.clues.map((cl, i) => {
    const owner = t.members[cs.owner[i]];
    const o = { i, owner: owner ? owner.name : '', mine: cs.owner[i] === me, unit: cl.unit };
    if (cs.phase === 'brief' && !open) { o.status = 'hidden'; return o; }
    if (cs.owner[i] === me || cs.decoded[i] || open) { o.status = open || cs.decoded[i] ? 'decoded' : (cs.posted[i] ? 'sent' : 'hidden'); if (o.status !== 'hidden') { o.text = cl.text; o.by = cs.decoded[i]; } }
    else if (cs.posted[i]) { o.status = 'pending'; o.text = G.blankOut(cl.text, cl.key); o.opts = cl.opts; o.full = cl.text; }
    else o.status = 'hidden';
    if (o.status === 'hidden') o.text = null;
    return o;
  });
  v.candidates = cs.candidates.map(cd => ({ id: cd.id, name: cd.name, look: cd.look, docs: G.dossier(cd, cs, cs.revealed[cd.id]),
    marked: !!cs.marks[cd.id], cleared: cs.cleared.includes(cd.id), asked: Object.keys(cs.revealed[cd.id]) }));
  v.questions = cs.questions.map(q => ({ qid: q.qid, q: q.q }));
  v.rows = cs.show.filter(id => DIM[id].doc !== 'interview' || cs.candidates.some(cd => cs.revealed[cd.id][id]))
    .map(id => ({ dim: id, doc: DIM[id].doc, field: DIM[id].doc === 'interview' ? DIM[id].q : DIM[id].field, u: DIM[id].u }));
  v.vote = cs.vote ? { by: t.members[cs.vote.by].name, mine: cs.vote.by === me, cand: cs.vote.cand, basis: cs.vote.basis, myVote: cs.vote.votes[me], left: Math.max(0, 20 - Math.round((now() - cs.vote.t0) / 1000)) } : null;
  v.scan = cs.scan;
  if (['reveal', 'report', 'reportDone'].includes(cs.phase)) {
    const al = cs.candidates.find(x => x.alien);
    const sp = ALIENS[cs.species];
    v.reveal = { cand: al.id, name: al.name, species: cs.species, alien: sp.name, en: sp.en, gag: sp.gag, trait: sp.trait, line: cs.scenario.line,
      clues: cs.clues.map(c => c.text) };
  }
  if (cs.phase === 'report' || cs.phase === 'reportDone') {
    v.report = cs.clues.map((cl, i) => {
      const r = cs.report[i] || {}; const own = cs.owner[i] === me;
      return { i, owner: t.members[cs.owner[i]] ? t.members[cs.owner[i]].name : '', mine: own, done: !!r.done,
        blank: G.blankOut(cl.text, cl.key), text: r.done ? cl.text : null, first: own ? cl.key[0] : null, len: own ? cl.key.length : null,
        tries: own ? r.tries : 0, opts: own && r.tries >= 2 ? cl.opts : null };
    });
  }
  return v;
}
function teacherTeam(t) {
  const m = t.m, cs = m && m.cs;
  return { id: t.id, name: t.name,
    members: t.members.map(mm => ({ name: mm.name, bot: mm.bot, online: isOnline(mm) })),
    no: m ? m.no : 0, total: m ? m.total : 0, score: m ? m.score : 0, parts: m ? m.parts.length : 0, done: m ? m.done : false,
    phase: cs ? cs.phase : 'wait', title: cs ? cs.scenario.title : '', units: cs ? cs.units : [],
    wrong: cs ? cs.wrong : 0, decoded: cs && cs.decoded ? cs.decoded.filter(Boolean).length : 0, clues: cs && cs.clues ? cs.clues.length : 0,
    elapsed: cs && cs.tInv ? Math.round((now() - cs.tInv) / 1000) : 0, results: m ? m.results : [] };
}
function teacherView(c) {
  return { id: c.id, name: c.name, code: c.code, status: c.status, settings: c.settings,
    players: Object.values(c.players).map(p => ({ token: p.token, name: p.name, online: p.online, team: (teamOf(p) || {}).name || '' })),
    teams: c.teams.map(teacherTeam) };
}

/* 화면 갱신 묶어 보내기 */
const dirtyTeams = new Set(); const dirtyCls = new Set(); let flushT = null;
function push(t) { dirtyTeams.add(t); dirtyCls.add(t.cls); schedule(); }
function pushCls(c) { dirtyCls.add(c.id); for (const t of c.teams) dirtyTeams.add(t); schedule(); }
function schedule() { if (!flushT) flushT = setTimeout(flush, 60); }
function flush() {
  flushT = null;
  for (const t of dirtyTeams) t.members.forEach((mm, i) => { const p = mm.token && TOKENS[mm.token]; if (p && p.sid) io.to(p.sid).emit('state', viewFor(t, i)); });
  dirtyTeams.clear();
  for (const id of dirtyCls) if (CLASSES[id]) io.to('t:' + id).emit('t:state', teacherView(CLASSES[id]));
  dirtyCls.clear();
}
function sendLobby(p) {
  const c = CLASSES[p.cls];
  if (p.sid) io.to(p.sid).emit('state', { phase: 'wait', cls: c.name, name: p.name, status: c.status, units: c.settings.units, practice: p.cls === 'P' });
}
function ttsTeam(t, text, except, delay) {
  t.members.forEach((mm, i) => { if (i === except) return; const p = mm.token && TOKENS[mm.token]; if (p && p.sid) io.to(p.sid).emit('tts', { text, delay: delay || 0 }); });
}

/* ---------------- 소켓 ---------------- */
io.on('connection', sock => {
  sock.on('s:join', (d, ack = () => {}) => {
    d = d || {};
    let p = d.token && TOKENS[d.token];
    if (p && (!d.code || CLASSES[p.cls].code === d.code || p.cls === 'P')) return bind(p, sock, ack);
    const c = Object.values(CLASSES).find(x => x.code && x.code === String(d.code || '').trim());
    if (!c) return ack({ ok: false, msg: '반 입장 코드가 맞지 않아요.' });
    const name = String(d.name || '').trim().slice(0, 12);
    if (!name) return ack({ ok: false, msg: '이름을 써 주세요.' });
    p = Object.values(c.players).find(x => x.name === name);
    if (p && p.online && p.sid !== sock.id) return ack({ ok: false, msg: '같은 이름의 친구가 이미 들어와 있어요. 이름 뒤에 번호를 붙여 주세요.' });
    if (!p) { p = { token: crypto.randomUUID(), name, cls: c.id, sid: null, online: false, teamId: null }; c.players[p.token] = p; TOKENS[p.token] = p; }
    bind(p, sock, ack);
    if (c.status === 'running' && !p.teamId) { placeLate(c, p); pushCls(c); }
  });
  sock.on('s:practice', (d, ack = () => {}) => {
    d = d || {};
    const name = String(d.name || '').trim().slice(0, 12) || '신입 요원';
    const c = CLASSES.P;
    const p = { token: crypto.randomUUID(), name, cls: 'P', sid: null, online: false, teamId: null };
    c.players[p.token] = p; TOKENS[p.token] = p;
    const units = d.unit === 'all' || !d.unit ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [Number(d.unit)];
    const t = newTeam('P', [p]); fillBots(t, 3);
    bind(p, sock, ack);
    startMission(t, { settings: { units, mode: units.length > 1 ? 'mix' : 'unit', cases: Math.max(1, Math.min(4, Number(d.cases) || 2)), final: units.length > 1, bots: true } });
  });
  function bind(p, s, ack) {
    if (p.sid && p.sid !== s.id) { const old = io.sockets.sockets.get(p.sid); if (old) old.emit('kicked', '다른 기기에서 접속했어요.'); }
    p.sid = s.id; p.online = true; s.data.token = p.token;
    ack({ ok: true, token: p.token, name: p.name, cls: CLASSES[p.cls].name });
    const t = teamOf(p);
    if (t) push(t); else sendLobby(p);
    dirtyCls.add(p.cls); schedule();
  }
  for (const ev of ['ready', 'post', 'decode', 'ask', 'mark', 'hint', 'hq', 'propose', 'vote', 'toReport', 'report']) {
    sock.on('s:' + ev, (d, ack = () => {}) => { const p = TOKENS[sock.data.token]; if (!p) return ack({ ok: false }); act(p, ev, d, typeof ack === 'function' ? ack : () => {}); });
  }
  sock.on('s:leave', () => {
    const p = TOKENS[sock.data.token]; if (!p) return;
    if (p.cls === 'P') { const t = teamOf(p); if (t) CLASSES.P.teams = CLASSES.P.teams.filter(x => x !== t); delete CLASSES.P.players[p.token]; delete TOKENS[p.token]; }
  });
  sock.on('s:again', (d, ack = () => {}) => { // 연습 작전 다시
    const p = TOKENS[sock.data.token]; const t = teamOf(p);
    if (p && t && p.cls === 'P' && t.m && t.m.done) { const s = t.m.set; startMission(t, { settings: s }); ack({ ok: true }); } else ack({ ok: false });
  });

  /* ---- 교사 ---- */
  sock.on('t:login', (d, ack = () => {}) => {
    const h = sha((d && d.pw) || '');
    if (h === PW_HASH) { sock.data.teacher = true; ack({ ok: true, classes: CLASS_LIST.map(([id, name, code]) => ({ id, name, code })), units: UNITS }); }
    else ack({ ok: false, msg: '비밀번호가 맞지 않아요.' });
  });
  const T = (ev, fn) => sock.on(ev, (d, ack = () => {}) => { if (!sock.data.teacher) return ack({ ok: false, msg: '로그인이 필요해요.' }); const c = d && CLASSES[d.cls]; fn(d || {}, c, typeof ack === 'function' ? ack : () => {}); });
  T('t:watch', (d, c, ack) => { if (!c) return ack({ ok: false }); for (const r of sock.rooms) if (r.startsWith('t:')) sock.leave(r); sock.join('t:' + c.id); ack({ ok: true, state: teacherView(c) }); });
  T('t:settings', (d, c, ack) => {
    if (!c) return ack({ ok: false });
    const s = d.settings || {};
    const units = (s.units || []).map(Number).filter(u => UNITS[u]);
    c.settings = { units: units.length ? units : c.settings.units, mode: s.mode === 'mix' ? 'mix' : 'unit', cases: Math.max(1, Math.min(8, Number(s.cases) || 3)), teamSize: Number(s.teamSize) === 4 ? 4 : 3, final: !!s.final, bots: s.bots !== false };
    saveSettings(); pushCls(c); ack({ ok: true });
  });
  T('t:assign', (d, c, ack) => { if (!c) return ack({ ok: false }); if (c.status === 'running') return ack({ ok: false, msg: '작전 중에는 다시 배정할 수 없어요. 먼저 작전을 끝내 주세요.' }); autoAssign(c); pushCls(c); for (const p of Object.values(c.players)) if (!p.teamId) sendLobby(p); ack({ ok: true }); });
  T('t:start', (d, c, ack) => {
    if (!c) return ack({ ok: false });
    if (!c.teams.length) autoAssign(c);
    for (const p of Object.values(c.players)) if (p.online && !p.teamId) placeLate(c, p);
    if (!c.teams.length) return ack({ ok: false, msg: '들어온 학생이 없어요.' });
    c.status = 'running'; c.missionNo++;
    for (const t of c.teams) { if (c.settings.bots) fillBots(t, 3); startMission(t); }
    pushCls(c); ack({ ok: true });
  });
  T('t:end', (d, c, ack) => {
    if (!c) return ack({ ok: false });
    for (const t of c.teams) { if (t.m) { saveMission(t, !t.m.done); t.m = null; } }
    c.status = 'lobby'; pushCls(c);
    for (const p of Object.values(c.players)) if (p.sid) io.to(p.sid).emit('ended');
    ack({ ok: true });
  });
  T('t:move', (d, c, ack) => { // 학생을 다른 팀으로
    if (!c) return ack({ ok: false });
    const p = c.players[d.token]; if (!p) return ack({ ok: false });
    const from = teamOf(p); const to = c.teams.find(t => t.id === d.team);
    if (from === to) return ack({ ok: true });
    if (from) { const i = memberIdx(from, p); if (from.m) from.members[i] = { token: null, name: BOT_NAMES.find(n => !from.members.some(m => m.name === n)) || 'AI 요원', bot: true }; else from.members.splice(i, 1); }
    if (to) { const bi = to.members.findIndex(m => m.bot); if (to.m && bi >= 0) { to.members[bi] = { token: p.token, name: p.name, bot: false }; p.teamId = to.id; } else addHuman(to, p); }
    else if (d.team === 'new') { const nt = newTeam(c.id, [p]); if (c.settings.bots) fillBots(nt, 3); if (c.status === 'running') startMission(nt); }
    else p.teamId = null;
    pushCls(c); if (!p.teamId) sendLobby(p); ack({ ok: true });
  });
  T('t:kick', (d, c, ack) => {
    if (!c) return ack({ ok: false });
    const p = c.players[d.token]; if (!p) return ack({ ok: false });
    const t = teamOf(p);
    if (t) { const i = memberIdx(t, p); if (t.m) t.members[i] = { token: null, name: BOT_NAMES.find(n => !t.members.some(m => m.name === n)) || 'AI 요원', bot: true }; else t.members.splice(i, 1); }
    if (p.sid) io.to(p.sid).emit('kicked', '선생님이 내보냈어요.');
    delete c.players[p.token]; delete TOKENS[p.token];
    pushCls(c); ack({ ok: true });
  });
  T('t:clearPlayers', (d, c, ack) => {
    if (!c) return ack({ ok: false });
    if (c.status === 'running') return ack({ ok: false, msg: '작전을 먼저 끝내 주세요.' });
    for (const p of Object.values(c.players)) { if (p.sid) io.to(p.sid).emit('kicked', '선생님이 대기실을 비웠어요. 다시 입장해 주세요.'); delete TOKENS[p.token]; }
    c.players = {}; c.teams = []; pushCls(c); ack({ ok: true });
  });
  sock.on('t:results', (d, ack = () => {}) => { if (!sock.data.teacher) return ack({ ok: false }); ack({ ok: true, results: RESULTS }); });
  sock.on('t:clearResults', (d, ack = () => {}) => { if (!sock.data.teacher) return ack({ ok: false }); RESULTS = d && d.cls ? RESULTS.filter(r => r.cls !== d.cls) : []; saveResults(); ack({ ok: true }); });
  sock.on('t:book', (d, ack = () => {}) => {
    if (!sock.data.teacher) return ack({ ok: false });
    const book = Object.keys(UNITS).map(Number).map(u => {
      const dims = DIMS.filter(x => x.u === u).map(x => {
        let sample;
        if (x.type === 'cmp') sample = `The alien is ${x.up} than Agent Kim. / The alien is ${x.down} than Agent Lee.`;
        else if (x.type === 'date') sample = x.clue(x.gen(G.R));
        else sample = x.clue(x.keys[0]);
        return { label: x.label, doc: x.doc, q: x.q || '', sample, values: x.type === 'cat' ? x.keys.length : '무작위' };
      });
      return { u, t: UNITS[u].t, ko: UNITS[u].ko, dims, scenarios: SCENARIOS.filter(s => s.u === u) };
    });
    ack({ ok: true, book, finals: FINALS, aliens: ALIENS, parts: PARTS });
  });

  sock.on('disconnect', () => {
    const p = TOKENS[sock.data.token];
    if (p && p.sid === sock.id) {
      p.online = false; p.lastSeen = now();
      const t = teamOf(p); if (t) push(t);
      dirtyCls.add(p.cls); schedule();
      if (p.cls === 'P') setTimeout(() => { if (!p.online) { const tt = teamOf(p); if (tt) CLASSES.P.teams = CLASSES.P.teams.filter(x => x !== tt); delete CLASSES.P.players[p.token]; delete TOKENS[p.token]; } }, 10 * 60000);
    }
  });
});

if (require.main === module) server.listen(PORT, () => console.log(`맨 인 블랙 서버: http://localhost:${PORT}  (교사: /teacher.html)`));
module.exports = { server, CLASSES, RESULTS: () => RESULTS };
