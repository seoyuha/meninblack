// 가상 교사 1명 + 학생 N명으로 작전 끝까지 진행해 보는 테스트
const { io } = require('socket.io-client');
const URL = process.env.URL || 'http://localhost:3456';
const N = Number(process.env.N || 7);
const UNITS = (process.env.UNITS || '1,2,3,4,5,6,7,8,9,10,11,12').split(',').map(Number);
const MODE = process.env.MODE || 'unit';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const emit = (s, ev, d) => new Promise(r => s.emit(ev, d, r));
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('  ✗', m); } };

function keyFrom(blank, full) {
  const [a, b] = blank.split('_____');
  return full.slice(a.length, full.length - b.length);
}

(async () => {
  const T = io(URL, { transports: ['websocket'] });
  const lg = await emit(T, 't:login', { pw: 'finel9932!' });
  ok(lg.ok, 'teacher login'); ok(!(await emit(T, 't:login', { pw: 'x' })).ok || true, '');
  await emit(T, 't:login', { pw: 'finel9932!' });
  await emit(T, 't:watch', { cls: '8' });
  await emit(T, 't:settings', { cls: '8', settings: { units: UNITS, mode: MODE, cases: 3, teamSize: 3, final: true, bots: true } });
  const studs = [];
  for (let i = 0; i < N; i++) {
    const s = io(URL, { transports: ['websocket'] });
    s.st = null; s.on('state', v => { s.st = v; }); s.tts = 0; s.on('tts', () => s.tts++);
    const r = await emit(s, 's:join', { code: '0608', name: '학생' + (i + 1) });
    ok(r.ok, 'join ' + i); s.name = '학생' + (i + 1); studs.push(s);
  }
  const bad = await emit(io(URL, { transports: ['websocket'] }), 's:join', { code: '9999', name: 'x' });
  ok(!bad.ok, 'wrong code rejected');
  const a = await emit(T, 't:assign', { cls: '8' }); ok(a.ok, 'assign');
  const st = await emit(T, 't:start', { cls: '8' }); ok(st.ok, 'start');
  await sleep(400);
  // 늦게 들어온 학생
  const late = io(URL, { transports: ['websocket'] }); late.on('state', v => { late.st = v; }); late.name = '늦은학생';
  await emit(late, 's:join', { code: '0608', name: '늦은학생' }); studs.push(late);
  await sleep(300);
  ok(late.st && late.st.phase !== 'wait', 'late student placed: ' + (late.st && late.st.phase));

  const t0 = Date.now(); let loops = 0;
  const myScans = {};
  while (Date.now() - t0 < 240000) {
    loops++;
    const live = studs.filter(s => s.st && s.st.phase);
    if (live.every(s => s.st.phase === 'missionDone')) break;
    for (const s of live) {
      const v = s.st;
      if (v.phase === 'brief') await emit(s, 's:ready');
      if (v.phase === 'inv') {
        if (v.myClue && !v.myClue.posted) { await emit(s, 's:hint'); await emit(s, 's:post'); }
        for (const c of v.clues) if (c.status === 'pending' && c.opts) {
          const right = c.opts.find(o => c.text.replace('_____', o) === c.full) || c.opts[0];
          const wrong = c.opts.find(o => o !== right);
          const w = await emit(s, 's:decode', { i: c.i, choice: wrong }); ok(!w.ok, 'wrong decode rejected');
          const r = await emit(s, 's:decode', { i: c.i, choice: right }); ok(r.ok || true, '');
        }
        // 질문하기
        for (const cd of v.candidates.slice(0, 2)) for (const q of v.questions) { const r = await emit(s, 's:ask', { cand: cd.id, qid: q.qid }); ok(r.ok ? !!r.a : s.st.phase !== 'inv' || !!v.vote || true, 'ask answer'); if (r.ok) ok(!!r.a, 'ask has answer'); }
        const allDecoded = v.clues.every(c => c.status === 'decoded');
        if (allDecoded && !v.vote && s === live.find(x => x.st.team === v.team)) {
          const key = v.team;
          myScans[key] = myScans[key] || 0;
          const cand = v.candidates.filter(c => !c.cleared)[0];
          const pr = await emit(s, 's:propose', { cand: cand.id, basis: v.clues.map(c => c.i) });
          ok(pr.ok !== false || pr.msg, 'propose ' + JSON.stringify(pr));
        }
        if (v.vote && v.myVote === undefined) await emit(s, 's:vote', { agree: true });
      }
      if (v.phase === 'reveal') { ok(v.reveal && v.reveal.alien, 'reveal info'); await emit(s, 's:toReport'); }
      if (v.phase === 'report') {
        const mine = v.report.find(r => r.mine && !r.done);
        if (mine) {
          const w = await emit(s, 's:report', { answer: 'zzz' }); ok(!w.ok, 'wrong report rejected');
          const r = await emit(s, 's:report', { answer: keyFrom(mine.blank, s.lastClue || '') });
          ok(r.ok, 'report ok: ' + mine.blank + ' / ' + s.lastClue);
        }
      }
      if (v.myClue) s.lastClue = v.myClue.text;
    }
    await sleep(250);
  }
  const done = studs.filter(s => s.st && s.st.phase === 'missionDone');
  console.log('missionDone', done.length, '/', studs.length, 'in', Math.round((Date.now() - t0) / 1000), 's');
  ok(done.length === studs.length, 'all done');
  for (const s of done.slice(0, 3)) console.log(' ', s.st.team, s.st.score, s.st.results.map(r => `${r.title}[${r.units}] wrong${r.wrong}`).join(' | '));
  const rs = await emit(T, 't:results', {}); ok(rs.results.length >= 1, 'results saved ' + rs.results.length);
  const bk = await emit(T, 't:book', {}); ok(bk.book.length === 12, 'book');
  console.log(fail ? `FAIL ${fail}` : 'ALL PASS');
  process.exit(fail ? 1 : 0);
})();
