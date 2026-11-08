/* 임시 그래픽: 인간 후보 아바타 + 외계인 6종 (SVG)
   나중에 그린 그림으로 바꾸려면 public/img/ 에 같은 이름의 PNG를 넣으면 됩니다.
   - 외계인: img/alien-pudding.png, alien-eyes.png, alien-noodle.png, alien-twins.png, alien-pouch.png, alien-saucer.png */
(function () {
  // 디자인팀 그림 연결 (public/img). 파일을 바꾸면 그림도 바뀝니다.
  window.MIB_IMG = {};
  ['pudding','eyes','noodle','twins','pouch','saucer'].forEach(k => { window.MIB_IMG['alien-' + k] = 'img/alien-' + k + '.png'; });
  const GLITCH = { pudding: 1, twins: 1, pouch: 1, saucer: 1 };
  const SKIN = ['#f7d7bd', '#eec09a', '#d9a273', '#b97a4f', '#8a5634'];
  const HAIR = ['#1d1a1f', '#4a2f22', '#7a4b2a', '#c99a4c'];
  const CAP = ['#20304f', '#c23b3b', '#2d8a5a', '#e0a020'];
  const TOP = { red: '#d94141', blue: '#3a6fd8', yellow: '#f2c230', green: '#3cae5c', white: '#f4f6f8', purple: '#8a4fd0' };

  function curls(cx, cy, r, n, rr, col) {
    let s = '';
    for (let i = 0; i < n; i++) { const a = Math.PI + (Math.PI * i) / (n - 1); s += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${rr}" fill="${col}"/>`; }
    return s;
  }
  function human(L, size) {
    L = L || {};
    const sk = SKIN[L.skin || 0], hc = HAIR[L.hairColor || 0];
    const top = String(L.top || 'a blue jacket');
    const color = TOP[Object.keys(TOP).find(k => top.includes(k))] || '#3a6fd8';
    const item = top.includes('jacket') ? 'jacket' : top.includes('T-shirt') ? 'tee' : 'shirt';
    const hair = String(L.hair || 'short straight');
    const long = hair.includes('long'), curly = hair.includes('curly');
    const out = color === '#f4f6f8' ? '#9aa3ad' : 'rgba(0,0,0,.25)';
    let s = `<svg viewBox="0 0 120 130" width="${size || 120}" height="${(size || 120) * 130 / 120}" xmlns="http://www.w3.org/2000/svg" class="human">`;
    // 뒷머리(긴 머리)
    if (long) {
      if (curly) { for (let y = 52; y <= 104; y += 13) s += `<circle cx="33" cy="${y}" r="9" fill="${hc}"/><circle cx="87" cy="${y}" r="9" fill="${hc}"/>`; }
      else s += `<path d="M30 46 Q28 92 34 106 L86 106 Q92 92 90 46 Z" fill="${hc}"/>`;
    }
    // 몸통
    s += `<path d="M18 130 Q20 98 44 92 L76 92 Q100 98 102 130 Z" fill="${color}" stroke="${out}" stroke-width="1.5"/>`;
    if (item === 'jacket') s += `<path d="M50 92 L60 118 L70 92 Z" fill="#f0f0f0"/><path d="M48 92 L56 112 L52 130 M72 92 L64 112 L68 130" stroke="rgba(0,0,0,.35)" stroke-width="2" fill="none"/>`;
    if (item === 'tee') s += `<path d="M48 92 Q60 102 72 92" stroke="rgba(0,0,0,.25)" stroke-width="3" fill="none"/>`;
    if (item === 'shirt') s += `<path d="M48 92 L56 102 L60 94 L64 102 L72 92" fill="#fff" stroke="${out}"/><circle cx="60" cy="110" r="1.6" fill="${out}"/><circle cx="60" cy="120" r="1.6" fill="${out}"/>`;
    // 목·얼굴
    s += `<rect x="52" y="78" width="16" height="16" rx="5" fill="${sk}"/>`;
    s += `<ellipse cx="60" cy="56" rx="24" ry="27" fill="${sk}"/>`;
    s += `<ellipse cx="36" cy="58" rx="4" ry="6" fill="${sk}"/><ellipse cx="84" cy="58" rx="4" ry="6" fill="${sk}"/>`;
    // 앞머리
    if (curly) s += curls(60, 46, 24, 9, 8, hc) + `<ellipse cx="60" cy="33" rx="20" ry="10" fill="${hc}"/>`;
    else s += `<path d="M35 54 Q34 26 60 26 Q86 26 85 54 Q78 38 60 38 Q46 38 35 54 Z" fill="${hc}"/>`;
    if (!long && !curly) s += `<path d="M36 52 Q40 36 52 34" stroke="${hc}" stroke-width="5" fill="none"/>`;
    // 얼굴
    const f = L.face || 0;
    s += `<ellipse cx="51" cy="58" rx="2.8" ry="3.4" fill="#222"/><ellipse cx="69" cy="58" rx="2.8" ry="3.4" fill="#222"/>`;
    s += `<path d="M46 50 Q51 ${f % 2 ? 46 : 48} 56 50 M64 50 Q69 ${f % 2 ? 46 : 48} 74 50" stroke="${hc}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    s += f === 2 ? `<ellipse cx="60" cy="72" rx="4" ry="3" fill="#a33"/>` : `<path d="M53 70 Q60 ${f === 3 ? 73 : 76} 67 70" stroke="#a5523a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="45" cy="66" rx="4" ry="2.4" fill="#f08a8a" opacity=".35"/><ellipse cx="75" cy="66" rx="4" ry="2.4" fill="#f08a8a" opacity=".35"/>`;
    if (L.glasses) s += `<g stroke="#222" stroke-width="2.2" fill="rgba(180,220,255,.25)"><circle cx="51" cy="58" r="7"/><circle cx="69" cy="58" r="7"/><path d="M58 58 L62 58 M44 57 L37 55 M76 57 L83 55" fill="none"/></g>`;
    if (L.cap) { const cc = CAP[L.capColor || 0]; s += `<path d="M34 42 Q36 20 60 20 Q84 20 86 42 Z" fill="${cc}"/><path d="M60 40 Q88 38 100 44 Q86 48 62 46 Z" fill="${cc}" stroke="rgba(0,0,0,.25)"/><circle cx="60" cy="21" r="2.5" fill="#fff" opacity=".6"/>`; }
    return s + '</svg>';
  }

  /* ---------- 외계인 ---------- */
  const A = {};
  A.pudding = () => `<g class="a-jiggle"><path d="M22 96 Q16 40 60 30 Q104 40 98 96 Q60 106 22 96 Z" fill="#a77cf0" stroke="#6b3fc0" stroke-width="3"/>
    <path d="M34 54 Q44 38 60 36" stroke="#e8dcff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="48" cy="64" rx="6" ry="8" fill="#2a1450"/><ellipse cx="72" cy="64" rx="6" ry="8" fill="#2a1450"/><circle cx="50" cy="61" r="2" fill="#fff"/><circle cx="74" cy="61" r="2" fill="#fff"/>
    <ellipse cx="60" cy="80" rx="6" ry="4" fill="#4a1f8a"/><path d="M57 84 L60 98 L63 84 Z" fill="#1a1a2a"/>
    ${[30, 44, 58, 72, 86].map(x => `<ellipse cx="${x + 2}" cy="100" rx="6" ry="5" fill="#8f62e0"/>`).join('')}</g>`;
  A.eyes = () => `<g><path d="M36 104 Q30 70 60 64 Q90 70 84 104 Z" fill="#ff9a2e" stroke="#c9600c" stroke-width="3"/>
    ${[[34, 20, -14], [60, 12, 0], [86, 22, 14]].map(([x, y, r], i) => `<g class="a-eye a-eye${i}"><path d="M60 68 Q${(60 + x) / 2} ${y + 30} ${x} ${y + 12}" stroke="#ff9a2e" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="12" fill="#fff" stroke="#c9600c" stroke-width="2.5"/><circle cx="${x + r / 4}" cy="${y + 2}" r="5" fill="#222"/></g>`).join('')}
    <path d="M50 86 Q60 96 70 86" stroke="#7a3300" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M36 84 Q18 74 14 60 M84 84 Q102 74 106 60" stroke="#ff9a2e" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  A.noodle = () => `<g>${[...Array(9)].map((_, i) => { const x = 22 + i * 9.5; return `<path class="a-tent" style="animation-delay:${i * 0.12}s" d="M${x} 66 Q${x + (i % 2 ? 10 : -10)} 88 ${x} 112" stroke="#2ad1c3" stroke-width="5" fill="none" stroke-linecap="round"/>`; }).join('')}
    <ellipse cx="60" cy="50" rx="36" ry="30" fill="#36e0d0" stroke="#109c90" stroke-width="3"/>
    <g stroke="#123" stroke-width="2.5" fill="rgba(255,255,255,.5)"><circle cx="46" cy="48" r="10"/><circle cx="74" cy="48" r="10"/><path d="M56 48 L64 48" fill="none"/></g>
    <circle cx="46" cy="48" r="3.5" fill="#123"/><circle cx="74" cy="48" r="3.5" fill="#123"/><path d="M52 66 Q60 72 68 66" stroke="#0b5f58" stroke-width="3" fill="none"/>
    <rect x="82" y="72" width="22" height="28" rx="2" fill="#c0392b" stroke="#7d2017" stroke-width="2" transform="rotate(12 93 86)"/></g>`;
  A.twins = () => `<g class="a-bob"><g><ellipse cx="38" cy="78" rx="22" ry="26" fill="#6fdc6f" stroke="#2f9a2f" stroke-width="3"/><path d="M30 54 L24 34 M46 54 L52 34" stroke="#2f9a2f" stroke-width="3"/><circle cx="24" cy="32" r="4" fill="#ffe14d"/><circle cx="52" cy="32" r="4" fill="#ffe14d"/>
    <ellipse cx="30" cy="74" rx="7" ry="9" fill="#111"/><ellipse cx="46" cy="74" rx="7" ry="9" fill="#111"/><circle cx="32" cy="71" r="2" fill="#fff"/><circle cx="48" cy="71" r="2" fill="#fff"/><path d="M32 92 Q38 86 44 92" stroke="#1d5a1d" stroke-width="3" fill="none"/></g>
    <g><ellipse cx="84" cy="80" rx="21" ry="24" fill="#ff8ccf" stroke="#c4498e" stroke-width="3"/><path d="M76 58 L72 38 M92 58 L96 38" stroke="#c4498e" stroke-width="3"/><circle cx="72" cy="36" r="4" fill="#7fe3ff"/><circle cx="96" cy="36" r="4" fill="#7fe3ff"/>
    <ellipse cx="77" cy="76" rx="6" ry="8" fill="#111"/><ellipse cx="91" cy="76" rx="6" ry="8" fill="#111"/><circle cx="79" cy="73" r="2" fill="#fff"/><circle cx="93" cy="73" r="2" fill="#fff"/><path d="M78 92 Q84 88 90 92" stroke="#8a1f5c" stroke-width="3" fill="none"/></g>
    <text x="58" y="30" font-size="16" font-weight="900" fill="#ff5a5a">!?</text></g>`;
  A.pouch = () => `<g><ellipse cx="60" cy="74" rx="38" ry="34" fill="#ffd43b" stroke="#c99a00" stroke-width="3"/>
    <path d="M40 18 L46 46 M80 18 L74 46" stroke="#c99a00" stroke-width="5"/><circle cx="40" cy="16" r="9" fill="#fff" stroke="#c99a00" stroke-width="2.5"/><circle cx="80" cy="16" r="9" fill="#fff" stroke="#c99a00" stroke-width="2.5"/><circle cx="42" cy="17" r="4" fill="#222"/><circle cx="78" cy="17" r="4" fill="#222"/>
    <path d="M46 58 Q60 66 74 58" stroke="#8a6500" stroke-width="3" fill="none"/>
    <path d="M32 78 Q60 72 88 78 Q86 104 60 106 Q34 104 32 78 Z" fill="#f2b705" stroke="#c99a00" stroke-width="3"/>
    <rect x="40" y="66" width="12" height="16" rx="2" fill="#4dabf7" transform="rotate(-15 46 74)"/><circle cx="64" cy="70" r="7" fill="#ff6b6b"/><path d="M74 62 L80 76 L70 76 Z" fill="#51cf66"/>
    <text x="54" y="96" font-size="14">🗼</text></g>`;
  A.saucer = () => `<g>${[...Array(6)].map((_, i) => `<path d="M${30 + i * 12} 86 Q${24 + i * 13} 102 ${22 + i * 15} 110" stroke="#5aa9e6" stroke-width="6" fill="none" stroke-linecap="round"/>`).join('')}
    <ellipse cx="60" cy="78" rx="34" ry="20" fill="#74c0fc" stroke="#1c7ed6" stroke-width="3"/>
    <ellipse cx="50" cy="76" rx="5" ry="6" fill="#123"/><ellipse cx="70" cy="76" rx="5" ry="6" fill="#123"/><path d="M52 88 Q60 92 68 88" stroke="#0b4a85" stroke-width="3" fill="none"/>
    <g class="a-hat"><ellipse cx="60" cy="50" rx="40" ry="10" fill="#adb5bd" stroke="#495057" stroke-width="3"/><path d="M40 48 Q42 26 60 26 Q78 26 80 48 Z" fill="#a5d8ff" stroke="#495057" stroke-width="2.5" opacity=".9"/>
    ${[28, 44, 60, 76, 92].map((x, i) => `<circle cx="${x}" cy="52" r="3" fill="${['#ffe066', '#ff6b6b', '#69db7c', '#ffe066', '#ff6b6b'][i]}" class="a-blink" style="animation-delay:${i * 0.2}s"/>`).join('')}</g>
    <rect x="86" y="80" width="18" height="16" rx="3" fill="#e8a33d" stroke="#9c6416" stroke-width="2"/></g>`;

  function alien(kind, size) {
    const img = window.MIB_IMG && window.MIB_IMG['alien-' + kind];
    if (img) return `<img class="alienimg" src="${img}" style="width:${size || 160}px" alt="">`;
    return `<svg viewBox="0 0 120 120" width="${size || 160}" height="${size || 160}" xmlns="http://www.w3.org/2000/svg" class="alien a-${kind}">${(A[kind] || A.pudding)()}</svg>`;
  }
  function witness(i, size) { return `<img class="humanimg" src="img/witness-${((i % 4) + 4) % 4}.png" style="width:${size || 120}px" alt="">`; }
  function agent(i, size) { return `<img class="humanimg" src="img/agent-${((i % 4) + 4) % 4}.png" style="width:${size || 120}px" alt="">`; }
  function alienGlitch(kind, size) {
    if (GLITCH[kind]) return `<img class="alienimg" src="img/alien-${kind}-glitch.png" style="width:${size || 160}px" alt="">`;
    return alien(kind, size);
  }
  const ICON = { school: '🏫', library: '📚', festival: '🎪', bakery: '🥐', studio: '🎬', shop: '🛍️', stage: '🎭', plaza: '🏙️', park: '🎡', gym: '🏋️', hospital: '🏥', travel: '✈️', forest: '🌲', beach: '🏖️', museum: '🏛️', stadium: '🏟️', station: '🚉', market: '🏮', restaurant: '🍽️', village: '🏯', recycle: '♻️' };
  window.ART = { human, alien, alienGlitch, witness, agent, ICON, KINDS: Object.keys(A) };
})();
