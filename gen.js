'use strict';
/* 사건 생성기: 매번 새 후보·새 단서. 모든 단서를 합쳐야 정답이 하나로 정해진다. */
const { DIMS, DIM, DECOY_QS, ALIENS, SCENARIOS, FINALS, NAMES, UNITS } = require('./data');

const R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  chance: p => Math.random() < p,
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
};
const AGENTS = ['Agent Kim', 'Agent Park', 'Agent Lee', 'Agent Choi', 'Agent Jung', 'Agent Han'];

/* ---------- 값 고르기 ---------- */
function allowedVals(d, p) {
  let ks = d.keys;
  if (d.allowed) ks = d.allowed(p);
  if (d.notEq) ks = ks.filter(k => k !== p[d.notEq]);
  return ks;
}
const roundStep = (d, x) => Math.round(Math.round(x / d.step) * d.step * 10) / 10;
function randVal(d, p) {
  if (d.type === 'cat') return R.pick(allowedVals(d, p));
  if (d.type === 'date') return d.gen(R);
  return roundStep(d, d.min + Math.random() * (d.max - d.min));
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function validFor(d, v, p) { return d.type !== 'cat' || allowedVals(d, p).includes(v); }

/* 기반 항목(계절, 요리)을 먼저 정한다 */
function ordered(dims) { return dims.slice().sort((a, b) => (a.link || a.notEq ? 1 : 0) - (b.link || b.notEq ? 1 : 0)); }

/* 비교 단서 기준값 */
function cmpSide(d, v, c) { return c.dir === 'up' ? v > c.T : v < c.T; }
function cmpRand(d, c, side) {
  for (let t = 0; t < 200; t++) {
    const v = roundStep(d, d.min + Math.random() * (d.max - d.min));
    if (Math.abs(v - c.T) < d.step * 2) continue;
    if (cmpSide(d, v, c) === side) return v;
  }
  return c.dir === 'up' ? (side ? c.T + d.step * 4 : c.T - d.step * 4) : (side ? c.T - d.step * 4 : c.T + d.step * 4);
}

function sat(clue, p) {
  const d = DIM[clue.dim];
  if (d.type === 'cmp') return cmpSide(d, p[d.id], clue.cmp);
  return same(p[d.id], clue.val);
}

/* ---------- 단서 문장 ---------- */
function keyOpts(d, val, key, c) {
  let pool;
  if (d.type === 'cmp') { pool = [d.up, d.down, ...DIMS.filter(x => x.type === 'cmp' && x !== d).map(x => R.pick([x.up, x.down]))]; }
  else if (d.type === 'date') { pool = []; for (let i = 0; i < 6; i++) pool.push(d.key(d.alt(val, R))); }
  else pool = d.keyOpts || d.keys.map(k => d.key(k));
  const others = R.shuffle([...new Set(pool)].filter(x => x.toLowerCase() !== key.toLowerCase())).slice(0, 2);
  return R.shuffle([key, ...others]);
}
function makeClue(d, alien) {
  const v = alien[d.id];
  if (d.type === 'cmp') {
    const dir = R.chance(0.5) ? 'up' : 'down';
    const gap = d.step * R.int(4, 10);
    let T = roundStep(d, dir === 'up' ? v - gap : v + gap);
    T = Math.max(d.min + d.step * 3, Math.min(d.max - d.step * 3, T));
    if (dir === 'up' && T >= v) T = roundStep(d, v - d.step * 2);
    if (dir === 'down' && T <= v) T = roundStep(d, v + d.step * 2);
    const ref = R.pick(AGENTS), word = d[dir];
    const fmt = x => (d.step < 1 ? x.toFixed(1) : x) + d.unit;
    return { dim: d.id, unit: d.u, cmp: { dir, T }, key: word,
      text: `The alien is ${word} than ${ref}. (${ref}: ${fmt(T)})`,
      ko: `${d.label}: ${ref}(${fmt(T)})보다 ${d.ko[dir === 'up' ? 0 : 1]}` };
  }
  const key = d.key(v);
  return { dim: d.id, unit: d.u, val: v, key, text: d.clue(v),
    ko: `${d.label}: ${d.type === 'date' ? d.ko(v) : d.ko[v]}` };
}

/* ---------- 사건 하나 ---------- */
function pickDims(units, n, mixed) {
  if (!mixed || units.length === 1) {
    const u = units.length === 1 ? units[0] : R.pick(units);
    return { used: [u], dims: R.shuffle(DIMS.filter(d => d.u === u)).slice(0, n) };
  }
  const us = R.shuffle(units).slice(0, Math.max(2, Math.min(n, units.length)));
  const pools = Object.fromEntries(us.map(u => [u, R.shuffle(DIMS.filter(d => d.u === u))]));
  const dims = []; let i = 0;
  while (dims.length < n) { const u = us[i++ % us.length]; const d = pools[u].shift(); if (d) dims.push(d); }
  return { used: us, dims };
}

function appearance(p) {
  const hair = p.hair || R.pick(DIM.hair.keys);
  return {
    skin: R.int(0, 4), hair, hairColor: R.int(0, 3),
    glasses: (p.glasses || (R.chance(0.3) ? 'yes' : 'no')) === 'yes',
    cap: (p.cap || (R.chance(0.25) ? 'yes' : 'no')) === 'yes',
    capColor: R.int(0, 3),
    top: p.top || R.pick(DIM.top.keys),
    face: R.int(0, 3),
  };
}

function buildCase({ units, n, mixed, final, scenario }) {
  units = units.map(Number).filter(u => UNITS[u]);
  if (!units.length) units = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  for (let tries = 0; tries < 80; tries++) {
    const { used, dims: clued } = pickDims(units, n, mixed || final);
    const all = ordered(DIMS.filter(d => used.includes(d.u)));
    // 연결된 기반 항목이 빠지지 않게
    for (const d of all) { if (d.link && !all.includes(DIM[d.link])) all.unshift(DIM[d.link]); if (d.notEq && !all.includes(DIM[d.notEq])) all.unshift(DIM[d.notEq]); }
    const order = ordered(all);

    const alien = {};
    for (const d of order) alien[d.id] = randVal(d, alien);
    const clues = clued.map(d => makeClue(d, alien));
    const clueOf = Object.fromEntries(clues.map(c => [c.dim, c]));

    const cands = [{ p: alien, alien: true }];
    for (const target of clued) {
      const p = {};
      for (const d of order) {
        const c = clueOf[d.id];
        if (!c) { p[d.id] = randVal(d, p); continue; }
        if (d.type === 'cmp') { p[d.id] = cmpRand(d, c.cmp, d !== target); continue; }
        if (d === target) {
          let v = null;
          for (let t = 0; t < 40; t++) { const x = d.type === 'date' ? d.alt(alien[d.id], R) : randVal(d, p); if (!same(x, alien[d.id]) && validFor(d, x, p)) { v = x; break; } }
          if (v === null) { p[d.id] = randVal(d, p); } else p[d.id] = v;
          continue;
        }
        p[d.id] = validFor(d, alien[d.id], p) ? alien[d.id] : randVal(d, p);
      }
      cands.push({ p, alien: false, target: target.id });
    }
    // 검증: 모든 단서를 만족하는 후보는 외계인 하나뿐
    const ok = cands.filter(c => clues.every(cl => sat(cl, c.p)));
    if (ok.length !== 1 || !ok[0].alien) continue;
    // 단서 하나만으로는 정답이 드러나지 않음
    if (clues.some(cl => cands.filter(c => sat(cl, c.p)).length < 2)) continue;
    // 정답 후보가 아닌 사람은 모두 서로 다른 모습
    const sig = cands.map(c => JSON.stringify(clues.map(cl => DIM[cl.dim].type === 'cmp' ? sat(cl, c.p) : c.p[cl.dim])));
    if (new Set(sig).size !== sig.length) continue;

    for (const c of clues) c.opts = keyOpts(DIM[c.dim], c.val, c.key, c);
    // 보여 줄 항목: 단서 항목 + 같은 단원의 다른 항목(최대 6)
    let show = clued.slice();
    for (const d of R.shuffle(all.filter(d => !clued.includes(d)))) if (show.length < 6) show.push(d);
    if (used.includes(4)) for (const d of DIMS.filter(d => d.u === 4)) if (!show.includes(d)) show.push(d);
    show = DIMS.filter(d => show.includes(d)); // 원래 순서

    const names = R.shuffle(NAMES);
    const shuffled = R.shuffle(cands);
    const candidates = shuffled.map((c, i) => ({
      id: 'ABCDE'[i], name: names[i], profile: c.p, alien: c.alien, look: appearance(c.p),
    }));
    const qs = R.shuffle([
      ...show.filter(d => d.doc === 'interview').map(d => ({ qid: d.id, q: d.q })),
      ...R.shuffle(DECOY_QS).slice(0, 2).map((q, i) => ({ qid: 'x' + i, q })),
    ]);
    const species = R.pick(Object.keys(ALIENS));
    return {
      scenario, units: used, final: !!final, species,
      clues: R.shuffle(clues), candidates, show: show.map(d => d.id), questions: qs,
    };
  }
  throw new Error('사건 생성 실패: ' + units.join(','));
}

/* 후보 서류(학생에게 보내는 형태). revealed: 질문으로 알아낸 인터뷰 항목 */
function fmtVal(d, v) {
  if (d.type === 'cmp') return (d.step < 1 ? v.toFixed(1) : v) + d.unit;
  if (d.type === 'date') return d.fmt(v);
  return d.show ? d.show(v) : v;
}
function dossier(c, cs, revealed) {
  const docs = [];
  for (const id of cs.show) {
    const d = DIM[id], v = c.profile[id];
    if (d.doc === 'interview') {
      if (revealed && revealed[id]) docs.push({ doc: 'interview', dim: id, q: d.q, a: d.ans(v) });
    } else docs.push({ doc: d.doc, dim: id, field: d.field, text: fmtVal(d, v) });
  }
  return docs;
}
function answer(c, qid) {
  const d = DIM[qid];
  if (!d || d.doc !== 'interview') return null;
  return d.ans(c.profile[qid]);
}

/* 단서 문장 속 핵심어를 빈칸으로 */
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function blankOut(text, key) {
  const re = new RegExp(`(?<![A-Za-z])${esc(key)}(?![A-Za-z'])`, 'i');
  if (!re.test(text)) return null;
  return text.replace(re, '_____');
}

function pickScenario(units, final, usedIds) {
  if (final) { const f = FINALS.filter(s => !usedIds.includes(s.id)); return R.pick(f.length ? f : FINALS); }
  let pool = SCENARIOS.filter(s => units.includes(s.u) && !usedIds.includes(s.id));
  if (!pool.length) pool = SCENARIOS.filter(s => units.includes(s.u));
  return R.pick(pool);
}

module.exports = { buildCase, dossier, answer, blankOut, pickScenario, fmtVal, R, sat };
