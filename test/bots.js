// 학생 N명이 들어와 천천히 자동 플레이 (교사 조작은 브라우저에서)
const { io } = require('socket.io-client');
const URL = process.env.URL || 'http://localhost:3456';
const N = Number(process.env.N || 7);
const CODE = process.env.CODE || '0608';
const SPEED = Number(process.env.SPEED || 1200); // 루프 간격(ms)
const sleep = ms => new Promise(r => setTimeout(r, ms));
const emit = (s, ev, d) => new Promise(r => s.emit(ev, d, x => r(x || {})));
function keyFrom(blank, full) { const [a, b] = blank.split('_____'); return full.slice(a.length, full.length - b.length); }

(async () => {
  const studs = [];
  for (let i = 0; i < N; i++) {
    const s = io(URL, { transports: ['websocket'] });
    s.on('state', v => { s.st = v; });
    await emit(s, 's:join', { code: CODE, name: '학생' + (i + 1) });
    studs.push(s);
    await sleep(120);
  }
  console.log('joined', N);
  while (true) {
    for (const s of studs) {
      const v = s.st; if (!v || !v.phase) continue;
      try {
        if (v.phase === 'brief') await emit(s, 's:ready');
        if (v.phase === 'inv') {
          if (v.myClue && !v.myClue.posted) await emit(s, 's:post');
          for (const c of v.clues) if (c.status === 'pending' && c.opts) {
            const right = c.opts.find(o => c.text.replace('_____', o) === c.full) || c.opts[0];
            await emit(s, 's:decode', { i: c.i, choice: right });
            break; // 한 루프에 하나씩만 (천천히)
          }
          const allDecoded = v.clues.length && v.clues.every(c => c.status === 'decoded');
          if (allDecoded && !v.vote) {
            const cand = v.candidates.filter(c => !c.cleared)[0];
            if (cand) await emit(s, 's:propose', { cand: cand.id, basis: v.clues.map(c => c.i) });
          }
          if (v.vote && v.myVote === undefined) await emit(s, 's:vote', { agree: true });
        }
        if (v.phase === 'reveal') await emit(s, 's:toReport');
        if (v.phase === 'report') {
          const mine = v.report.find(r => r.mine && !r.done);
          if (mine && s.lastClue) await emit(s, 's:report', { answer: keyFrom(mine.blank, s.lastClue) });
        }
        if (v.myClue) s.lastClue = v.myClue.text;
      } catch (e) {}
    }
    await sleep(SPEED);
  }
})();
