'use strict';
/* =====================================================================
   맨 인 블랙 : 수상한 지구 생활 — 단원별 증거 항목 + 시나리오
   - 증거 항목(dim): 후보들이 가진 정보 한 가지. 사건마다 팀 인원 수만큼 골라
     외계인의 단서로 쓴다.
   - doc: 이 정보가 후보 서류의 어디에 보이는지
       photo(사진·인상착의), id(신원 카드), schedule(일정표), receipt(영수증),
       record(측정 기록), note(메모·기록지), interview(질문해야 보이는 인터뷰)
   ===================================================================== */

const UNITS = {
  1: { t: 'What Grade Are You In?', ko: '학년·학교 장소' },
  2: { t: 'What Do You Want to Be?', ko: '장래 희망' },
  3: { t: 'When Is the Field Trip?', ko: '날짜·행사' },
  4: { t: 'He Has Short Curly Hair', ko: '외모·옷차림' },
  5: { t: 'How Often Do You Exercise?', ko: '빈도·생활 습관' },
  6: { t: "I'm Going to Go on a Trip", ko: '계획 말하기' },
  7: { t: 'What Season Do You Like?', ko: '좋아하는 계절과 이유' },
  8: { t: "I'm Faster Than You", ko: '비교하기' },
  9: { t: 'How Can I Get to the Museum?', ko: '교통수단·길 안내' },
  10: { t: "I'd Like to Have the Fruit Salad", ko: '음식 주문과 맛' },
  11: { t: 'Do You Know About Songpyeon?', ko: '전통문화·권유' },
  12: { t: 'We Should Save the World', ko: '환경·해야 할 일' },
};

const DIMS = [];
function cat(d) { d.type = 'cat'; d.keys = d.vals.map(v => v[0]); d.ko = Object.fromEntries(d.vals); DIMS.push(d); }
function cmp(d) { d.type = 'cmp'; DIMS.push(d); }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------- 1단원 ---------------- */
const ORD = { third: '3rd', fourth: '4th', fifth: '5th', sixth: '6th', first: '1st', second: '2nd' };
cat({ id: 'grade', u: 1, label: '학년', doc: 'interview', q: 'What grade are you in?',
  vals: [['third', '3학년'], ['fourth', '4학년'], ['fifth', '5학년'], ['sixth', '6학년']],
  ans: v => `I'm in the ${v} grade.`, clue: v => `The alien is in the ${v} grade.`, key: v => v });
cat({ id: 'floor', u: 1, label: '교실 층', doc: 'id', field: 'Classroom',
  vals: [['first', '1층'], ['second', '2층'], ['third', '3층'], ['fourth', '4층'], ['fifth', '5층']],
  show: v => `${ORD[v]} floor`, clue: v => `The alien's classroom is on the ${v} floor.`, key: v => v });
const ROOMS = [['music room', '음악실'], ['art room', '미술실'], ['library', '도서관'], ['science room', '과학실'], ['computer room', '컴퓨터실'], ['gym', '체육관']];
cat({ id: 'favplace', u: 1, label: '좋아하는 장소', doc: 'interview', q: "What's your favorite place in the school?",
  vals: ROOMS, ans: v => `My favorite place is the ${v}.`, clue: v => `The alien said, "My favorite place is the ${v}."`, key: v => v });
cat({ id: 'asked', u: 1, label: '물어본 장소', doc: 'note', field: 'Visitor log',
  vals: [['English classroom', '영어실'], ['art room', '미술실'], ['music room', '음악실'], ['science room', '과학실'], ['computer room', '컴퓨터실'], ["nurse's office", '보건실']],
  show: v => `Asked: "Where's the ${v}?"`, clue: v => `The alien asked, "Where's the ${v}?"`, key: v => v });

/* ---------------- 2단원 ---------------- */
const art = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
cat({ id: 'job', u: 2, label: '장래 희망', doc: 'interview', q: 'What do you want to be?',
  vals: [['actor', '배우'], ['baker', '제빵사'], ['car designer', '자동차 디자이너'], ['painter', '화가'], ['soccer player', '축구 선수'], ['writer', '작가'], ['scientist', '과학자'], ['pilot', '비행기 조종사']],
  ans: v => `I want to be ${art(v)}.`, clue: v => `The alien said, "I want to be ${art(v)}."`, key: v => v });
cat({ id: 'goodat', u: 2, label: '잘하는 것', doc: 'note', field: 'Teacher\'s note',
  vals: [['acting', '연기'], ['baking bread', '빵 굽기'], ['drawing pictures', '그림 그리기'], ['writing stories', '이야기 쓰기'], ['playing soccer', '축구'], ['singing', '노래'], ['cooking', '요리']],
  show: v => `You're good at ${v}!`, clue: v => `The alien is good at ${v}.`, key: v => v });
cat({ id: 'subject', u: 2, label: '좋아하는 과목', doc: 'id', field: 'Favorite subject',
  vals: [['music', '음악'], ['art', '미술'], ['science', '과학'], ['math', '수학'], ['P.E.', '체육'], ['English', '영어'], ['Korean', '국어']],
  show: v => v, clue: v => `The alien's favorite subject is ${v}.`, key: v => v });
cat({ id: 'liketo', u: 2, label: '좋아하는 일', doc: 'interview', q: 'What do you like to do?',
  vals: [['help animals', '동물 돕기'], ['read books', '책 읽기'], ['make things', '만들기'], ['take pictures', '사진 찍기'], ['play the piano', '피아노 치기'], ['care for plants', '식물 돌보기']],
  ans: v => `I like to ${v}.`, clue: v => `The alien said, "I like to ${v}."`, key: v => v });

/* ---------------- 3단원 (날짜) ---------------- */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MKO = MONTHS.map((m, i) => `${i + 1}월`);
function ordinal(n) { const s = (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'); return n + s; }
function dateDim(id, label, ev, q, ans) {
  DIMS.push({ id, u: 3, label, type: 'date', doc: q ? 'interview' : 'schedule', field: ev, q,
    gen: R => [R.int(0, 11), R.pick([1, 2, 3, 5, 8, 11, 12, 13, 15, 21, 22, 23, 25, 28, 30])],
    alt: (v, R) => { for (;;) { const n = R.chance(0.5) ? [v[0], R.pick([1, 2, 3, 11, 12, 13, 21, 22, 23, 30])] : [R.int(0, 11), v[1]]; if (n[0] !== v[0] || n[1] !== v[1]) return n; } },
    fmt: v => `${MONTHS[v[0]]} ${ordinal(v[1])}`, ko: v => `${v[0] + 1}월 ${v[1]}일`,
    show: v => `${MONTHS[v[0]]} ${ordinal(v[1])}`,
    ans: ans ? (v => ans(`${MONTHS[v[0]]} ${ordinal(v[1])}`)) : null,
    clue: v => `The alien's ${ev.toLowerCase()} is on ${MONTHS[v[0]]} ${ordinal(v[1])}.`,
    key: v => `${MONTHS[v[0]]} ${ordinal(v[1])}` });
}
dateDim('bday', '생일', 'Birthday', 'When is your birthday?', d => `It's on ${d}.`);
dateDim('ftrip', '현장 체험 학습 날짜', 'Field trip');
dateDim('sday', '운동회 날짜', 'Sports day');
dateDim('tshow', '장기 자랑 날짜', 'Talent show');

/* ---------------- 4단원 (외모: 사진으로도 보임) ---------------- */
cat({ id: 'hair', u: 4, label: '머리 모양', doc: 'photo', field: 'Hair',
  vals: [['short curly', '짧은 곱슬머리'], ['short straight', '짧은 생머리'], ['long curly', '긴 곱슬머리'], ['long straight', '긴 생머리']],
  show: v => `${v} hair`, clue: v => `The alien has ${v} hair.`, key: v => v });
cat({ id: 'top', u: 4, label: '윗옷', doc: 'photo', field: 'Wearing',
  vals: [['a red jacket', '빨간 재킷'], ['a blue jacket', '파란 재킷'], ['a yellow T-shirt', '노란 티셔츠'], ['a green T-shirt', '초록 티셔츠'], ['a white shirt', '흰 셔츠'], ['a purple shirt', '보라 셔츠']],
  show: v => v, clue: v => `The alien is wearing ${v}.`, key: v => v.replace(/^a /, '') });
cat({ id: 'glasses', u: 4, label: '안경', doc: 'photo', field: 'Glasses',
  vals: [['yes', '안경 씀'], ['no', '안경 안 씀']],
  show: v => v === 'yes' ? 'wearing glasses' : 'no glasses',
  clue: v => v === 'yes' ? 'The alien is wearing glasses.' : "The alien isn't wearing glasses.", key: v => v === 'yes' ? 'is' : "isn't", keyOpts: ['is', "isn't", 'are'] });
cat({ id: 'cap', u: 4, label: '모자', doc: 'photo', field: 'Cap',
  vals: [['yes', '모자 씀'], ['no', '모자 안 씀']],
  show: v => v === 'yes' ? 'wearing a cap' : 'no cap',
  clue: v => v === 'yes' ? 'The alien is wearing a cap.' : "The alien isn't wearing a cap.", key: v => v === 'yes' ? 'is' : "isn't", keyOpts: ['is', "isn't", 'are'] });

/* ---------------- 5단원 ---------------- */
cat({ id: 'exercise', u: 5, label: '운동 횟수', doc: 'interview', q: 'How often do you exercise?',
  vals: [['once a week', '일주일에 한 번'], ['twice a week', '일주일에 두 번'], ['three times a week', '일주일에 세 번'], ['four times a week', '일주일에 네 번'], ['every day', '매일']],
  ans: v => cap(v) + '.', clue: v => `The alien said, "I exercise ${v}."`, key: v => v });
cat({ id: 'brush', u: 5, label: '양치 횟수', doc: 'interview', q: 'How often do you brush your teeth?',
  vals: [['once a day', '하루에 한 번'], ['twice a day', '하루에 두 번'], ['three times a day', '하루에 세 번']],
  ans: v => cap(v) + '.', clue: v => `The alien said, "I brush my teeth ${v}."`, key: v => v });
cat({ id: 'fastfood', u: 5, label: '패스트푸드', doc: 'record', field: 'Fast food',
  vals: [['never', '절대 안 먹음'], ['once a month', '한 달에 한 번'], ['twice a month', '한 달에 두 번'], ['once a week', '일주일에 한 번']],
  show: v => v, clue: v => v === 'never' ? 'The alien said, "I never eat fast food."' : `The alien said, "I eat fast food ${v}."`, key: v => v });
cat({ id: 'veggie', u: 5, label: '채소 먹기', doc: 'record', field: 'Vegetables',
  vals: [['every day', '매일'], ['twice a week', '일주일에 두 번'], ['once a week', '일주일에 한 번'], ['three times a week', '일주일에 세 번']],
  show: v => v, clue: v => `The alien said, "I eat vegetables ${v}."`, key: v => v });

/* ---------------- 6단원 ---------------- */
cat({ id: 'weekend', u: 6, label: '주말 계획', doc: 'interview', q: 'What are you going to do this weekend?',
  vals: [['go fishing', '낚시'], ['go hiking', '하이킹'], ['go camping', '캠핑'], ['go swimming', '수영'], ['go shopping', '쇼핑'], ['go on a trip', '여행']],
  ans: v => `I'm going to ${v}.`, clue: v => `The alien said, "I'm going to ${v} this weekend."`, key: v => v.replace(/^go /, '') });
cat({ id: 'tomorrow', u: 6, label: '내일 계획', doc: 'note', field: 'Planner · Tomorrow',
  vals: [['visit my aunt', '이모 방문'], ['write a letter', '편지 쓰기'], ['see the stars', '별 보기'], ['buy a phone', '전화기 사기'], ['watch a film', '영화 보기'], ['clean my room', '방 청소']],
  show: v => v, clue: v => `The alien said, "I'm going to ${v} tomorrow."`, key: v => v });
cat({ id: 'tripto', u: 6, label: '여행 장소', doc: 'interview', q: 'Where are you going to go this summer?',
  vals: [['Jeju', '제주'], ['Busan', '부산'], ['Gyeongju', '경주'], ['Sokcho', '속초'], ['Jeonju', '전주']],
  ans: v => `I'm going to go to ${v}.`, clue: v => `The alien is going to go to ${v} this summer.`, key: v => v });
cat({ id: 'withwho', u: 6, label: '함께 갈 사람', doc: 'note', field: 'Planner · With',
  vals: [['my family', '가족'], ['my friends', '친구들'], ['my dad', '아빠'], ['my mom', '엄마'], ['my cousin', '사촌']],
  show: v => v, clue: v => `The alien said, "I'm going to go on a trip with ${v}."`, key: v => v.replace(/^my /, '') });

/* ---------------- 7단원 ---------------- */
const SEASONS = [['spring', '봄'], ['summer', '여름'], ['fall', '가을'], ['winter', '겨울']];
cat({ id: 'season', u: 7, label: '좋아하는 계절', doc: 'interview', q: 'What season do you like?',
  vals: SEASONS, ans: v => `I like ${v}.`, clue: v => `The alien said, "I like ${v}."`, key: v => v });
const REASONS = { spring: [['see flowers', '꽃 보기'], ['go on a picnic', '소풍 가기']], summer: [['swim', '수영'], ['eat watermelon', '수박 먹기']], fall: [['see colorful leaves', '단풍 보기'], ['go hiking', '하이킹']], winter: [['make a snowman', '눈사람 만들기'], ['go skiing', '스키 타기']] };
cat({ id: 'reason', u: 7, label: '좋아하는 이유', doc: 'interview', q: 'Why do you like it?', link: 'season',
  vals: Object.values(REASONS).flat(), allowed: p => REASONS[p.season].map(x => x[0]),
  ans: v => `Because I can ${v}.`, clue: v => `The alien said, "Because I can ${v}."`, key: v => v });
cat({ id: 'dislike', u: 7, label: '싫어하는 계절', doc: 'note', field: 'Diary',
  vals: SEASONS, notEq: 'season',
  show: v => `I don't like ${v}.`, clue: v => `The alien doesn't like ${v}.`, key: v => v });
cat({ id: 'weather', u: 7, label: '오늘 날씨 메모', doc: 'note', field: 'Diary · Today',
  vals: [['warm', '따뜻함'], ['hot', '더움'], ['cool', '시원함'], ['cold', '추움']],
  show: v => `It's ${v} today.`, clue: v => `The alien wrote, "It's ${v} today."`, key: v => v });

/* ---------------- 8단원 (비교) ---------------- */
cmp({ id: 'height', u: 8, label: '키', doc: 'record', field: 'Height', min: 140, max: 178, step: 1, unit: ' cm', up: 'taller', down: 'shorter', ko: ['더 크다', '더 작다'] });
cmp({ id: 'run', u: 8, label: '50 m 달리기', doc: 'record', field: '50 m run', min: 7.2, max: 10.8, step: 0.1, unit: ' sec', up: 'slower', down: 'faster', ko: ['더 느리다', '더 빠르다'] });
cmp({ id: 'age', u: 8, label: '나이', doc: 'record', field: 'Age', min: 12, max: 60, step: 1, unit: '', up: 'older', down: 'younger', ko: ['나이가 더 많다', '더 어리다'] });
cmp({ id: 'lift', u: 8, label: '들 수 있는 무게', doc: 'record', field: 'Can lift', min: 10, max: 60, step: 1, unit: ' kg', up: 'stronger', down: 'weaker', ko: ['힘이 더 세다', '힘이 더 약하다'] });

/* ---------------- 9단원 ---------------- */
cat({ id: 'transport', u: 9, label: '가는 방법', doc: 'interview', q: 'How can I get to the museum?',
  vals: [['by bus', '버스'], ['by subway', '지하철'], ['by bike', '자전거'], ['by taxi', '택시'], ['on foot', '걸어서']],
  ans: v => v === 'on foot' ? 'You can walk there.' : `You can go there ${v}.`,
  clue: v => v === 'on foot' ? 'The alien said, "You can walk there."' : `The alien said, "You can go there ${v}."`,
  key: v => v === 'on foot' ? 'walk' : v.replace('by ', ''), keyOpts: ['bus', 'subway', 'bike', 'taxi', 'walk'] });
cat({ id: 'shop', u: 9, label: '가게 위치', doc: 'note', field: 'Shop location',
  vals: [['next to the bank', '은행 옆'], ['across from the park', '공원 건너편'], ['between the school and the hospital', '학교와 병원 사이'], ['in front of the library', '도서관 앞'], ['behind the post office', '우체국 뒤'], ['next to the bakery', '빵집 옆']],
  show: v => `It's ${v}.`, clue: v => `The alien's shop is ${v}.`, key: v => v.split(' ').slice(0, v.startsWith('in front') ? 3 : 2).join(' '),
  keyOpts: ['next to', 'across from', 'in front of', 'behind', 'between the'] });
cat({ id: 'direction', u: 9, label: '알려 준 길', doc: 'interview', q: 'Where is the bookstore?',
  vals: [['Go straight one block and turn left.', '한 블록 직진 후 왼쪽'], ['Go straight one block and turn right.', '한 블록 직진 후 오른쪽'], ['Go straight two blocks and turn left.', '두 블록 직진 후 왼쪽'], ['Go straight two blocks and turn right.', '두 블록 직진 후 오른쪽'], ['Go straight three blocks and turn left.', '세 블록 직진 후 왼쪽']],
  ans: v => v, clue: v => `The alien said, "${v}"`, key: v => v.match(/(one block|two blocks|three blocks)/)[0], keyOpts: ['one block', 'two blocks', 'three blocks'] });
cat({ id: 'busno', u: 9, label: '버스 번호', doc: 'note', field: 'Bus card',
  vals: [['7', '7번'], ['10', '10번'], ['12', '12번'], ['25', '25번'], ['30', '30번']],
  show: v => `Bus number ${v}`, clue: v => `The alien said, "Take bus number ${v}."`, key: v => v });

/* ---------------- 10단원 ---------------- */
const FOODS = [['fruit salad', '과일 샐러드', ['sweet', 'sour', 'delicious']], ['fried rice', '볶음밥', ['salty', 'spicy', 'delicious']], ['spaghetti', '스파게티', ['delicious', 'salty']], ['bulgogi', '불고기', ['sweet', 'salty', 'delicious']], ['tteokbokki', '떡볶이', ['spicy', 'sweet']], ['pizza', '피자', ['salty', 'delicious']], ['fish', '생선 요리', ['salty', 'delicious']]];
cat({ id: 'main', u: 10, label: '주문한 요리', doc: 'receipt', field: 'Main',
  vals: FOODS.map(f => [f[0], f[1]]), show: v => v, clue: v => `The alien said, "I'd like to have the ${v}."`, key: v => v });
cat({ id: 'drink', u: 10, label: '주문한 음료', doc: 'receipt', field: 'Drink',
  vals: [['orange juice', '오렌지 주스'], ['milk', '우유'], ['lemonade', '레모네이드'], ['water', '물'], ['apple juice', '사과 주스']],
  show: v => v, clue: v => `The alien said, "I'd like to have ${v}."`, key: v => v });
cat({ id: 'taste', u: 10, label: '맛 평가', doc: 'interview', q: 'How is the food?', link: 'main',
  vals: [['sweet', '달다'], ['salty', '짜다'], ['spicy', '맵다'], ['sour', '시다'], ['delicious', '맛있다']],
  allowed: p => FOODS.find(f => f[0] === p.main)[2],
  ans: v => `It's ${v}.`, clue: v => `The alien said, "It's ${v}."`, key: v => v });
cat({ id: 'dessert', u: 10, label: '디저트', doc: 'interview', q: 'What would you like for dessert?',
  vals: [['ice cream', '아이스크림'], ['cake', '케이크'], ['cookies', '쿠키'], ['bingsu', '빙수'], ['apple pie', '사과파이']],
  ans: v => `I'd like to have ${({ 'ice cream': 'ice cream', cake: 'a piece of cake', cookies: 'some cookies', bingsu: 'bingsu', 'apple pie': 'apple pie' })[v]}.`,
  clue: v => `The alien ordered ${v} for dessert.`, key: v => v });

/* ---------------- 11단원 ---------------- */
const TRAD = [['songpyeon', '송편'], ['hanbok', '한복'], ['tuho', '투호'], ['yunnori', '윷놀이'], ['jegichagi', '제기차기'], ['ganggangsullae', '강강술래']];
cat({ id: 'know', u: 11, label: '알고 있는 전통문화', doc: 'interview', q: 'Do you know about Korean traditions?',
  vals: TRAD, ans: v => `Yes, I do. I know about ${v}.`, clue: v => `The alien said, "I know about ${v}."`, key: v => v });
cat({ id: 'suggest', u: 11, label: '제안한 활동', doc: 'interview', q: 'What do you want to do at the festival?',
  vals: [['making songpyeon', '송편 만들기'], ['wearing hanbok', '한복 입기'], ['playing tuho', '투호 놀이'], ['playing yunnori', '윷놀이'], ['flying a kite', '연날리기'], ['making hanji', '한지 만들기']],
  ans: v => `How about ${v}?`, clue: v => `The alien said, "How about ${v}?"`, key: v => v });
cat({ id: 'booth', u: 11, label: '일하는 부스', doc: 'id', field: 'Booth',
  vals: [['hanbok booth', '한복 부스'], ['tteok booth', '떡 부스'], ['tuho booth', '투호 부스'], ['kite booth', '연 부스'], ['hanji booth', '한지 부스']],
  show: v => v, clue: v => `The alien works at the ${v}.`, key: v => v });
cat({ id: 'holiday', u: 11, label: '좋아하는 명절', doc: 'id', field: 'Favorite holiday',
  vals: [['Chuseok', '추석'], ['Seollal', '설날'], ['Dano', '단오'], ['Daeboreum', '정월 대보름']],
  show: v => v, clue: v => `The alien's favorite holiday is ${v}.`, key: v => v });

/* ---------------- 12단원 ---------------- */
cat({ id: 'should', u: 12, label: '해야 할 일', doc: 'interview', q: 'What should we do for the Earth?',
  vals: [['save water', '물 아끼기'], ['recycle cans', '캔 재활용'], ['plant trees', '나무 심기'], ['use both sides of paper', '종이 양면 쓰기'], ['save energy', '에너지 아끼기'], ['walk to school', '걸어서 등교']],
  ans: v => `We should ${v}.`, clue: v => `The alien said, "We should ${v}."`, key: v => v });
cat({ id: 'dontforget', u: 12, label: '잊지 말 것', doc: 'interview', q: 'Do you have a tip for us?',
  vals: [['turn off the lights', '불 끄기'], ['turn off the water', '물 잠그기'], ['bring your own cup', '개인 컵 챙기기'], ['bring a shopping bag', '장바구니 챙기기'], ['pick up trash', '쓰레기 줍기']],
  ans: v => `Don't forget to ${v}.`, clue: v => `The alien said, "Don't forget to ${v}."`, key: v => v });
cat({ id: 'bring', u: 12, label: '늘 가지고 다니는 것', doc: 'record', field: 'Eco item',
  vals: [['tumbler', '텀블러'], ['shopping bag', '장바구니'], ['handkerchief', '손수건'], ['chopsticks', '개인 수저'], ['lunch box', '도시락통']],
  show: v => `my own ${v}`, clue: v => `The alien always brings its own ${v}.`, key: v => v });
cat({ id: 'poster', u: 12, label: '캠페인 포스터', doc: 'note', field: 'Campaign poster',
  vals: [['Save Water', '물 절약'], ['Save Energy', '에너지 절약'], ['Protect Animals', '동물 보호'], ['Reduce Trash', '쓰레기 줄이기'], ['Plant Trees', '나무 심기']],
  show: v => `"${v}!"`, clue: v => `The alien's poster says "${v}!"`, key: v => v.split(' ')[1].toLowerCase(), keyOpts: ['water', 'energy', 'animals', 'trash', 'trees'] });

const DIM = Object.fromEntries(DIMS.map(d => [d.id, d]));

/* 질문 목록에 섞을 엉뚱한 질문(대답이 없음) */
const DECOY_QS = ["What's your favorite color?", 'Can you swim?', 'How old is your dog?', 'Do you like pizza?', 'What time is it?'];

/* =====================================================================
   외계인 6종
   ===================================================================== */
const ALIENS = {
  pudding: { name: '푸딩콩', en: 'Puddingkong', gag: '놀라서 주저앉더니 납작한 푸딩이 되었다!', trait: '젤리 같은 몸과 작은 발 여러 개. 긴장을 많이 한다.' },
  eyes: { name: '눈돌이', en: 'Nundol', gag: '눈마다 선글라스를 따로 쓰려다 꼬여 버렸다!', trait: '세 개의 눈이 각각 다른 방향을 본다. 호기심 대장.' },
  noodle: { name: '면발박사', en: 'Dr. Noodle', gag: '모든 촉수가 동시에 책장을 넘기기 시작했다!', trait: '가느다란 촉수가 잔뜩 달린 지구 책 수집가.' },
  twins: { name: '쌍둥밤', en: 'Twin Chestnuts', gag: '"네가 대답했잖아!" "아니야, 네가!" 둘이 티격태격한다.', trait: '작은 외계인 둘이 인간 한 명으로 위장했다.' },
  pouch: { name: '주머니씨', en: 'Mr. Pouch', gag: '작은 열쇠고리를 꺼내려다 거대한 기념품까지 와르르!', trait: '배 주머니에 기념품을 잔뜩 넣은 관광객.' },
  saucer: { name: '접시대장', en: 'Captain Saucer', gag: '비행접시 모자만 먼저 출발해서 황급히 쫓아간다!', trait: '짧은 몸, 여러 다리, 비행접시 모자를 쓴 배달원.' },
};

/* =====================================================================
   시나리오 — 단원마다 3개 + 번역기 회수 작전(종합) 3개
   place: 출동 장소 / role: 후보들의 역할 / anomaly: 이상 현상
   line: 정체 공개 후 외계인이 하는 말(단원 표현 복습)
   ===================================================================== */
const S = (id, u, title, place, icon, role, anomaly, line) => ({ id, u, title, place, icon, role, anomaly, line });
const SCENARIOS = [
  S('u1a', 1, '전학생의 비밀', '초등학교 교무실', 'school', '전학 온 학생', '전학 서류의 학년 칸이 계속 바뀌어 써진다.', ["I'm in the sixth grade, too. Nice to meet you!", '나도 6학년이야. 만나서 반가워!']),
  S('u1b', 1, '사라진 교실', '초등학교 복도', 'school', '학교 방문객', '안내판의 층 번호가 저절로 뒤섞였다.', ["Where's the music room? Oh, it's on the second floor!", '음악실이 어디지? 아, 2층에 있구나!']),
  S('u1c', 1, '수상한 학교 탐방', '학교 도서관', 'library', '학교 탐방 참가자', '방문 기록에 지구에 없는 교실 이름이 찍혔다.', ['My favorite place is the library. I love books!', '내가 제일 좋아하는 곳은 도서관이야. 책이 좋아!']),
  S('u2a', 2, '꿈 발표 대회의 소동', '어린이 진로 박람회', 'festival', '진로 박람회 참가자', '장래 희망 카드가 저절로 날아다닌다.', ['I want to be a pilot. I can fly already!', '나는 비행기 조종사가 되고 싶어. 이미 날 수는 있지만!']),
  S('u2b', 2, '빵집의 수상한 견습생', '동네 빵집', 'bakery', '빵집 견습생', '빵이 모두 별 모양으로 부풀어 오른다.', ["I'm good at baking bread. Try this star bread!", '나 빵 굽기 잘해. 이 별빵 먹어 봐!']),
  S('u2c', 2, '방송국 오디션', '어린이 방송국', 'studio', '오디션 참가자', '카메라에 찍힌 얼굴이 세 개로 보인다.', ["I'm good at acting. Was I a good human?", '나 연기 잘하지? 인간 연기 괜찮았어?']),
  S('u3a', 3, '뒤죽박죽 학사 일정', '학교 행정실', 'school', '행사 담당 선생님', '달력의 날짜가 모두 32일로 바뀌었다.', ["When is the field trip? I can't wait!", '현장 체험 학습 언제야? 너무 기대돼!']),
  S('u3b', 3, '생일 파티 초대장', '파티 용품 가게', 'shop', '초대장을 사러 온 손님', '초대장 날짜가 외계 문자로 찍혀 나온다.', ["My birthday is on December 25th. Come to my party!", '내 생일은 12월 25일이야. 파티에 와!']),
  S('u3c', 3, '장기 자랑 리허설', '학교 강당', 'stage', '장기 자랑 참가자', '무대 조명이 혼자 춤을 춘다.', ['The talent show is on Friday. I can dance with my eyes!', '장기 자랑은 금요일이야. 나 눈으로 춤출 수 있어!']),
  S('u4a', 4, '목격자를 찾아라', '시내 광장', 'plaza', '광장의 시민', '사진을 찍으면 사람 대신 젤리가 찍힌다.', ['I have short curly hair. Do you like it?', '나 짧은 곱슬머리야. 마음에 들어?']),
  S('u4b', 4, '패션쇼의 이상한 모델', '패션쇼 무대', 'stage', '패션쇼 모델', '옷 색깔이 1분마다 바뀐다.', ["I'm wearing a red jacket. It's my favorite!", '나 빨간 재킷 입었어. 제일 좋아하는 옷이야!']),
  S('u4c', 4, '미아 보호소의 손님', '놀이공원 안내소', 'park', '안내소에 온 손님', '안내 방송이 거꾸로 흘러나온다.', ['What does my friend look like? He has big eyes!', '내 친구 어떻게 생겼냐고? 눈이 커!']),
  S('u5a', 5, '헬스장의 괴력 회원', '동네 헬스장', 'gym', '헬스장 회원', '운동 기구가 혼자 움직인다.', ['I exercise every day. Good for me!', '나 매일 운동해. 잘했지?']),
  S('u5b', 5, '치과 대기실의 수상한 환자', '어린이 치과', 'hospital', '치과 대기 환자', '칫솔들이 줄을 서서 행진한다.', ['I brush my teeth three times a day. All twelve teeth!', '나 하루에 세 번 이 닦아. 이 열두 개 전부!']),
  S('u5c', 5, '건강 검진의 날', '보건소', 'hospital', '건강 검진 참가자', '체중계 숫자가 외계 문자로 나온다.', ['I eat vegetables every day. Earth carrots are so good!', '나 매일 채소 먹어. 지구 당근 최고!']),
  S('u6a', 6, '여행사의 수상한 손님', '여행사', 'travel', '여행 상담 손님', '여행 일정표가 우주 지도로 바뀐다.', ["I'm going to go on a trip to Jeju. I can't wait!", '나 제주로 여행 갈 거야. 너무 기대돼!']),
  S('u6b', 6, '캠핑장의 밤', '숲속 캠핑장', 'forest', '캠핑장 손님', '밤하늘의 별이 지그재그로 움직인다.', ["I'm going to see the stars. I'm going to find my home!", '별을 볼 거야. 우리 집을 찾을 거야!']),
  S('u6c', 6, '주말 계획 설문 조사', '마트 설문 부스', 'shop', '설문 참여자', '설문지 답이 전부 "UFO"로 바뀌었다.', ["I'm going to go fishing this weekend. Fish are my friends!", '이번 주말에 낚시하러 갈 거야. 물고기는 내 친구야!']),
  S('u7a', 7, '눈 내리는 여름', '해변 공원', 'beach', '공원 방문객', '한여름 해변에 눈이 내린다.', ['I like winter because I can make a snowman. Sorry!', '눈사람 만들 수 있어서 겨울이 좋아. 미안해!']),
  S('u7b', 7, '계절 사진 전시회', '사진 미술관', 'museum', '전시회 관람객', '사진 속 나뭇잎이 빙글빙글 돈다.', ['I like fall because I can see colorful leaves.', '단풍을 볼 수 있어서 가을이 좋아.']),
  S('u7c', 7, '일기 예보 대소동', '방송국 기상실', 'studio', '기상 캐스터 지원자', '일기 예보 화면에 사계절이 한꺼번에 나온다.', ['What season do you like? I like all four!', '어느 계절 좋아해? 나는 네 계절 다!']),
  S('u8a', 8, '어린이 운동회 기록실', '운동장', 'stadium', '운동회 참가자', '달리기 기록이 0.1초로 찍혔다.', ["I'm faster than you. I have twelve legs!", '내가 너보다 빨라. 다리가 열두 개거든!']),
  S('u8b', 8, '놀이기구 키 재기', '놀이공원 입구', 'park', '놀이기구 대기자', '키 재는 막대가 저절로 늘어난다.', ["I'm taller than you today. Tomorrow? I don't know!", '오늘은 내가 너보다 커. 내일은? 몰라!']),
  S('u8c', 8, '힘자랑 대회', '마을 축제 무대', 'festival', '힘자랑 대회 참가자', '역기가 하늘로 둥둥 떠오른다.', ["I'm stronger than an elephant! Just kidding.", '나 코끼리보다 힘세! 농담이야.']),
  S('u9a', 9, '박물관 가는 길', '시내 버스 정류장', 'station', '길 안내 자원봉사자', '버스 노선도가 미로처럼 꼬였다.', ['You can go there by bus. Take bus number 10!', '버스로 갈 수 있어. 10번 버스를 타!']),
  S('u9b', 9, '사라진 서점', '시장 골목', 'market', '골목 상점 주인', '가게 간판들이 서로 자리를 바꿨다.', ['Go straight two blocks and turn left. It is on your right.', '두 블록 직진해서 왼쪽으로 돌아. 오른쪽에 있어.']),
  S('u9c', 9, '지하철역의 길 잃은 관광객', '지하철역', 'station', '역 안내 데스크 직원', '지하철 안내 화면에 외계 노선이 생겼다.', ['How can I get to the museum? I am lost, too!', '박물관에 어떻게 가? 나도 길을 잃었어!']),
  S('u10a', 10, '이상한 식당 주문', '패밀리 레스토랑', 'restaurant', '식당 손님', '주문서 메뉴가 전부 "별가루 수프"로 바뀌었다.', ["I'd like to have the fruit salad, please. It's sweet!", '과일 샐러드 주세요. 달콤해요!']),
  S('u10b', 10, '푸드 트럭 축제', '푸드 트럭 거리', 'festival', '푸드 트럭 손님', '음식에서 무지개 연기가 피어오른다.', ["How is it? It's spicy! But delicious!", '맛이 어떠냐고? 매워! 그래도 맛있어!']),
  S('u10c', 10, '급식실의 수상한 영양사', '학교 급식실', 'school', '급식실 직원', '반찬이 식판 위에서 춤을 춘다.', ["What would you like? I'd like to have the bulgogi!", '뭐 먹을래? 나는 불고기!']),
  S('u11a', 11, '축제장의 비밀', '전통문화 축제장', 'festival', '축제 부스 직원', '송편이 공중에 떠서 빙글빙글 돈다.', ['Do you know about songpyeon? It is a Korean rice cake!', '송편 알아? 한국의 떡이야!']),
  S('u11b', 11, '민속촌 체험 학습', '민속촌', 'village', '민속촌 체험 강사', '윷가락이 던지기도 전에 모가 나온다.', ['How about playing yunnori? I always get mo!', '윷놀이 할래? 나는 항상 모가 나와!']),
  S('u11c', 11, '박물관의 수상한 방문객', '국립 민속 박물관', 'museum', '박물관 관람객', '한복 전시품의 색이 형광색으로 변했다.', ['I know about hanbok. Can I wear it? Oh, I have eight arms.', '한복 알아. 입어 봐도 돼? 아, 나 팔이 여덟 개구나.']),
  S('u12a', 12, '사라진 분리수거함', '아파트 재활용장', 'recycle', '재활용장 주민', '캔이 저절로 납작해져 날아다닌다.', ['We should recycle cans. My spaceship is made of cans!', '캔을 재활용해야 해. 내 우주선도 캔으로 만들었어!']),
  S('u12b', 12, '에너지 절약 캠페인', '시청 앞 광장', 'plaza', '캠페인 참가자', '건물 불이 모스 부호처럼 깜빡인다.', ["Don't forget to turn off the lights. Earth needs rest, too.", '불 끄는 거 잊지 마. 지구도 쉬어야 해.']),
  S('u12c', 12, '나무 심기 행사', '시민 공원', 'forest', '나무 심기 자원봉사자', '심은 나무가 하룻밤 새 10 m로 자랐다.', ['We should plant trees. I watered them a little too much!', '나무를 심어야 해. 물을 좀 너무 많이 줬나 봐!']),
];
const FINALS = [
  S('fin1', 0, '번역기 회수 작전 ①: 우주 공항', '지구 출국 터미널', 'station', '터미널 이용객', '모든 안내 방송이 여러 행성 언어로 섞여 나온다.', ['Thank you, agents! Now I can talk with Earth people again!', '고마워요, 요원들! 이제 다시 지구인과 이야기할 수 있어요!']),
  S('fin2', 0, '번역기 회수 작전 ②: 한밤의 박물관', '시립 박물관', 'museum', '야간 관람객', '전시품 설명이 전부 거꾸로 써졌다.', ["I'm sorry! I just wanted to read every book on Earth!", '미안해요! 지구의 책을 전부 읽고 싶었을 뿐이에요!']),
  S('fin3', 0, '번역기 회수 작전 ③: 대축제의 밤', '도시 대축제장', 'festival', '축제 손님', '불꽃놀이가 외계 문자를 그린다.', ['Thank you! Let\'s enjoy the festival together!', '고마워요! 축제를 같이 즐겨요!']),
];

const PARTS = ['수신 안테나', '번역 코어', '음성 칩', '위장 렌즈', '에너지 셀', '기억 메모리', '연결 회로', '보호 덮개'];
const NAMES = ['Mina', 'Jiho', 'Tom', 'Emma', 'Sora', 'Leo', 'Yuna', 'Ben', 'Amy', 'Daniel', 'Hana', 'Kevin', 'Sophie', 'Juho', 'Lily', 'Max', 'Nari', 'Ryan', 'Grace', 'Minjun', 'Olivia', 'Sam', 'Ella', 'Taeho', 'Chloe', 'Noah', 'Seoyeon', 'Jack', 'Mia', 'Dohyun'];

module.exports = { UNITS, DIMS, DIM, DECOY_QS, ALIENS, SCENARIOS, FINALS, PARTS, NAMES, MONTHS, MKO };
