/* ===== 0차 app.js =====
 * 장소 데이터는 data/*.json 에서 불러옵니다.
 * j 플래그: JSON 파일에서 연동한 데이터는 j:true, 이후 API로 추가하는 데이터는 j:false.
 *   → API 데이터 추가: addApiPlaces([{id, name, cat, lat, lng, ...}])  (아래 참고)
 */

// 웨이팅 중인 식당(기준 위치). 현재는 성수동 예시 좌표 고정 — 추후 지오코딩/GPS로 교체
const REF = { name: '성수동 맛집 (예시)', lat: 37.5446, lng: 127.0557 };
const PAGE_SIZE = 20;
const CAT_ORDER = ['카페', '쇼핑', '서점', '도서관', '공원'];

/* ---------- 데이터 소스 (JSON) ---------- */
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const trim = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };
const hoursText = h => h && h.weekday ? `평일 ${h.weekday.open}~${h.weekday.close} · 토 ${h.saturday.open}~${h.saturday.close} · 공휴일 ${h.holiday.open}~${h.holiday.close}` : '';

const SOURCES = [
  { url: 'data/seoul_bookstore_100.json', pick: d => d.DATA, // XCNTS=위도, YDNTS=경도
    map: x => ({
      id: 'book-' + x.store_seq_no, name: x.store_name, cat: '서점', emoji: '📚', stay: 30,
      lat: num(x.xcnts), lng: num(x.ydnts),
      desc: `${x.code_value} · ${x.store_type_name}`,
      reason: '실내에서 책 구경하며 조용히 시간을 보내기 좋아요.',
      address: x.adres ? '서울 ' + x.adres : '', phone: x.tel_no, link: x.hmpg_url || x.sns }) },
  { url: 'data/seoul_library_100.json', pick: d => d.libraries,
    map: x => ({
      id: 'lib-' + x.id, name: x.name, cat: '도서관', emoji: '🏛️', stay: 40,
      lat: x.coordinates && x.coordinates.latitude, lng: x.coordinates && x.coordinates.longitude,
      desc: `${x.district} · ${x.type} · 열람석 ${x.seats}석`,
      reason: '열람실에서 잠시 쉬어가기 좋고, 대기 시간이 길어도 부담이 없어요.',
      address: x.address, phone: x.phone, link: x.website, hours: hoursText(x.hours), closed: x.closedDays }) },
  { url: 'data/seoul_park_130.json', pick: d => d.DATA, // XCRD=경도, YCRD=위도 (WGS84)
    map: x => ({
      id: 'park-' + x.sn, name: (x.park_nm || '').trim(), cat: '공원', emoji: '🌳', stay: 40,
      lat: num(x.ycrd), lng: num(x.xcrd),
      desc: trim(x.park_otln, 60) || x.rgn,
      reason: '바깥 공기를 쐬며 가볍게 걷고 기분 전환하기 좋아요.',
      address: x.park_addr, phone: x.telno, link: x.url }) }
];

let places = [];
let waitMinutes = 120, travel = '도보', selected = null, course = [], favorites = [], recent = null, filter = '전체', shown = PAGE_SIZE;
let loadError = false;

async function loadPlaces() {
  const results = await Promise.allSettled(SOURCES.map(async s => {
    const res = await fetch(s.url);
    if (!res.ok) throw new Error(res.status + ' ' + s.url);
    return s.pick(await res.json()).map(s.map);
  }));
  results.forEach(r => { if (r.status === 'fulfilled') addPlaces(r.value, true); else { loadError = true; console.error(r.reason); } });
  // 좌표 없는 항목(예: 서울로7017)은 거리 계산이 불가하여 제외
  places = places.filter(p => p.name && p.lat != null && p.lng != null);
  afterDataChange();
}

/* j 플래그를 붙여 places 에 추가. fromJson=true → j:true */
function addPlaces(list, fromJson) { list.forEach(p => places.push({ ...p, j: !!fromJson })); }
/* API 연동용: API에서 받은 데이터는 j:false 로 추가 */
function addApiPlaces(list) { addPlaces(list, false); places = places.filter(p => p.name && p.lat != null && p.lng != null); afterDataChange(); }

function afterDataChange() { buildFilters(); renderPlaces(); renderMapPins(); }

/* ---------- 계산 ---------- */
function distKm(p) {
  const r = Math.PI / 180, dLa = (p.lat - REF.lat) * r, dLo = (p.lng - REF.lng) * r;
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(REF.lat * r) * Math.cos(p.lat * r) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}
// 직선거리 × 1.3(우회) ÷ 도보 4.8km/h
const walkMin = p => Math.max(1, Math.round(distKm(p) * 1.3 / 4.8 * 60));
const travelTime = p => travel === '도보' ? walkMin(p) : Math.max(3, Math.round(walkMin(p) * 0.55));
const buffer = p => waitMinutes - (travelTime(p) * 2 + p.stay);
const byId = id => places.find(p => p.id === id);
const fmtMin = m => m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + m % 60 + '분' : '') : m + '분';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';

/* ---------- 화면 전환 ---------- */
function go(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === id));
  if (id === 'results') renderPlaces();
  if (id === 'mypage') renderFavorites();
  if (id === 'course') renderCourse();
  if (id === 'mapView') renderMapPins();
  window.scrollTo(0, 0);
}

document.querySelectorAll('#timeChoices .choice').forEach(b => b.onclick = () => {
  document.querySelectorAll('#timeChoices .choice').forEach(x => x.classList.remove('selected'));
  b.classList.add('selected'); waitMinutes = +b.dataset.time;
});
document.querySelectorAll('#travelChoices .choice').forEach(b => b.onclick = () => {
  document.querySelectorAll('#travelChoices .choice').forEach(x => x.classList.remove('selected'));
  b.classList.add('selected'); travel = b.dataset.travel;
});

/* ---------- 필터 ---------- */
function buildFilters() {
  const cats = [...new Set(places.map(p => p.cat))].sort((a, b) => (CAT_ORDER.indexOf(a) + 99) % 99 - (CAT_ORDER.indexOf(b) + 99) % 99);
  const row = document.getElementById('filterRow');
  row.innerHTML = ['전체', ...cats].map(c => `<button class="filter ${c === filter ? 'active' : ''}" data-filter="${esc(c)}">${esc(c)}</button>`).join('');
}
document.getElementById('filterRow').addEventListener('click', e => {
  const b = e.target.closest('.filter'); if (b) setFilter(b.dataset.filter);
});
function setFilter(c) { filter = c; shown = PAGE_SIZE; buildFilters(); renderPlaces(); }
function openCategory(c) { setFilter(c); go('results'); }

function showRecommendations() {
  document.getElementById('waitMetric').textContent = fmtMin(waitMinutes);
  document.getElementById('headerTimer').textContent = `⏱ ${Math.floor(waitMinutes / 60)}:00:00`;
  shown = PAGE_SIZE;
  go('results');
}

/* ---------- 추천 목록 ---------- */
function renderPlaces() {
  const list = document.getElementById('placeList'), more = document.getElementById('moreBtn');
  document.getElementById('waitMetric').textContent = fmtMin(waitMinutes);
  const items = places.filter(p => (filter === '전체' || p.cat === filter) && buffer(p) >= 10)
                      .sort((a, b) => travelTime(a) - travelTime(b));
  document.getElementById('placeCount').textContent = items.length + '곳';

  if (!items.length) {
    list.innerHTML = `<div class="empty">${places.length ? '조건에 맞는 공간이 없어요.<br>대기시간을 늘리거나 이동 방식을 바꿔보세요.'
      : loadError ? '데이터를 불러오지 못했어요.<br>로컬 서버(또는 GitHub Pages)에서 열어주세요.' : '공간을 불러오는 중이에요…'}</div>`;
    more.style.display = 'none'; return;
  }
  list.innerHTML = items.slice(0, shown).map(p => {
    const saved = favorites.includes(p.id), b = buffer(p);
    return `<article class="place-card">
      <div class="place-art">${p.emoji || '📍'}</div>
      <div>
        <div class="place-title-row">
          <h3 style="font-size:14px; margin:0;">${esc(p.name)}</h3>
          <button class="save-btn ${saved ? 'saved' : ''}" data-act="fav" data-id="${esc(p.id)}">${saved ? '♥' : '♡'}</button>
        </div>
        <div class="sub" style="margin:2px 0;">${esc(p.cat)} · ${travel} ${travelTime(p)}분</div>
        <div class="visit-info">왕복 이동 <b>${travelTime(p) * 2}분</b> · 복귀 여유 <b>${b}분</b></div>
        <button class="btn ghost" style="padding:4px 8px; font-size:10px; margin-top:6px;" data-act="detail" data-id="${esc(p.id)}">상세 보기 →</button>
      </div></article>`;
  }).join('');
  more.style.display = items.length > shown ? 'block' : 'none';
  more.textContent = `더보기 (${shown}/${items.length})`;
}
function showMore() { shown += PAGE_SIZE; renderPlaces(); }

// 카드 버튼 클릭 (이벤트 위임)
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const id = t.dataset.id;
  if (t.dataset.act === 'fav') toggleFavorite(id);
  else if (t.dataset.act === 'detail') openDetail(id);
  else if (t.dataset.act === 'remove') removeCourse(id);
});

/* ---------- 관심공간 ---------- */
function toggleFavorite(id) {
  favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
  renderPlaces(); renderFavorites();
  toast(favorites.includes(id) ? '관심공간에 저장했어요.' : '관심공간에서 삭제했어요.');
}
function renderFavorites() {
  const list = document.getElementById('favoriteList');
  const saved = favorites.map(byId).filter(Boolean);
  if (!saved.length) { list.innerHTML = '<div class="empty">저장된 관심 공간이 없어요.<br>추천 목록에서 ♡를 눌러보세요.</div>'; return; }
  list.innerHTML = saved.map(p => `<div class="place-card">
    <div class="place-art" style="height:60px; font-size:18px;">${p.emoji || '📍'}</div>
    <div><h3 style="font-size:13px; margin:0;">${esc(p.name)}</h3>
    <button class="btn ghost" style="padding:2px 6px; font-size:10px; margin-top:6px;" data-act="detail" data-id="${esc(p.id)}">상세 보기</button></div></div>`).join('');
}

/* ---------- 상세 ---------- */
function openDetail(id) {
  selected = byId(id); if (!selected) return;
  recent = selected.name;
  document.getElementById('recentPlace').textContent = recent;
  const p = selected, b = buffer(p);
  document.getElementById('detailArt').textContent = p.emoji || '📍';
  document.getElementById('detailCategory').textContent = p.cat;
  document.getElementById('detailName').textContent = p.name;
  document.getElementById('detailDesc').textContent = p.desc || '';
  document.getElementById('detailWalk').textContent = travelTime(p) + '분';
  document.getElementById('detailStay').textContent = p.stay + '분';
  document.getElementById('detailBuffer').textContent = b + '분';
  document.getElementById('detailWhy').innerHTML =
    `<li>${esc(p.reason || '')}</li><li>${travel}로 ${travelTime(p)}분 거리(약 ${distKm(p).toFixed(1)}km)라 ${fmtMin(Math.max(b, 0))} 여유 있게 돌아올 수 있어요.</li>`;

  const url = safeUrl(p.link);
  const rows = [['주소', p.address], ['전화', p.phone], ['운영시간', p.hours], ['휴관일', p.closed]]
    .filter(r => r[1]).map(r => `<li><b>${r[0]}</b> ${esc(r[1])}</li>`);
  if (url) rows.push(`<li><b>링크</b> <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">바로가기</a></li>`);
  document.getElementById('detailInfo').innerHTML = rows.join('') || '<li>등록된 정보가 없어요.</li>';

  const btn = document.getElementById('addToCourseBtn');
  const added = course.includes(p.id);
  btn.textContent = added ? '✓ 이번 코스에 추가됨' : '+ 이번 코스에 추가하기';
  btn.classList.toggle('added', added);
  go('detail');
}

function addToCourse() {
  if (!selected) return;
  if (!course.includes(selected.id)) {
    course.push(selected.id);
    const btn = document.getElementById('addToCourseBtn');
    btn.textContent = '✓ 이번 코스에 추가됨'; btn.classList.add('added');
    toast('내 코스에 저장되었습니다.');
  } else toast('이미 내 코스에 담긴 공간입니다.');
}

/* ---------- 내 코스 ---------- */
function renderCourse() {
  const items = document.getElementById('courseItems'), chosen = course.map(byId).filter(Boolean);
  document.getElementById('courseCount').textContent = chosen.length + '곳';
  document.getElementById('courseWait').textContent = fmtMin(waitMinutes);
  if (!chosen.length) {
    items.innerHTML = '<div class="empty">아직 추가한 공간이 없어요.</div>';
    document.getElementById('courseDuration').textContent = '0분';
    document.getElementById('courseBuffer').textContent = '-'; return;
  }
  items.innerHTML = chosen.map((p, i) => `<div class="course-item">
    <span class="course-num">${i + 1}</span>
    <div style="flex:1"><b>${esc(p.name)}</b> <span class="sub">(${p.stay}분 체류)</span></div>
    <button class="back" data-act="remove" data-id="${esc(p.id)}">삭제</button></div>`).join('');
  const total = chosen.reduce((s, p) => s + travelTime(p) * 2 + p.stay, 0);
  document.getElementById('courseDuration').textContent = fmtMin(total);
  document.getElementById('courseBuffer').textContent = fmtMin(Math.max(waitMinutes - total, 0)) + (waitMinutes < total ? ' 초과' : '');
}
function removeCourse(id) { course = course.filter(x => x !== id); renderCourse(); toast('코스에서 삭제했어요.'); }

/* ---------- 지도(와이어프레임): 가까운 3곳 표시 ---------- */
function renderMapPins() {
  const box = document.getElementById('mapPins'); if (!box) return;
  const near = [...places].sort((a, b) => distKm(a) - distKm(b)).slice(0, 3);
  const k = 111, cos = Math.cos(REF.lat * Math.PI / 180);
  const off = near.map(p => ({ p, dx: (p.lng - REF.lng) * cos * k, dy: (p.lat - REF.lat) * k }));
  const max = Math.max(0.1, ...off.map(o => Math.hypot(o.dx, o.dy)));
  const s = 32 / max; // 가장 먼 핀이 중심에서 32% 떨어지도록
  box.innerHTML = `<div class="map-pin" style="top:45%; left:50%;">📍 식당</div>` + off.map(o =>
    `<div class="map-pin" style="top:${(45 - o.dy * s).toFixed(1)}%; left:${(50 + o.dx * s).toFixed(1)}%;">${o.p.emoji || '📍'} ${esc(o.p.name)}</div>`).join('');
}

function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => t.classList.remove('show'), 1800); }
document.getElementById('recentPlace').textContent = '아직 확인한 공간이 없어요.';
loadPlaces();
