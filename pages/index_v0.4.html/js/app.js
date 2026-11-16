/* ===== 0차 app.js (v8) =====
 * 장소 데이터는 data/*.json 에서 불러옵니다.
 *   - 서점/도서관/공원: 서울 열린데이터 기반 실제 데이터
 *   - 카페/쇼핑: data/sample_cafe_shop.json (샘플 · 좌표 근사값, 실제 데이터/API로 교체 필요)
 * API 데이터 추가: addApiPlaces([{n, c, lat, lng, e?, s?, addr?, tel?, url?}])
 *
 * v2 변경 요약
 *  - 지역 선택(5곳) · 장소/지역 검색 · 카테고리 복수 선택 · 정렬(가까운 순/체류 짧은 순) · 목록/카드 보기
 *  - localStorage 저장(새로고침해도 웨이팅·코스·관심 공간 유지)
 *  - 시간이 줄어 장소가 빠질 때 토스트로 안내(기존엔 말없이 삭제)
 *  - 진행 중: 대기시간 ±10분 조정, 상태 배너(10분 전 경고 등), 길찾기 링크
 *  - 장소 상세: 주소/전화/홈페이지/길찾기, 도서관은 실제 휴관일·운영시간 표시
 *  - 지도 화면: 지도+시간 막대 고정, 아래 시트만 스크롤
 *
 * v3 변경 요약
 *  - 웨이팅 등록: 식당 입력·지역 선택 삭제 → 지도(Leaflet)에서 현재 위치 지정(클릭/핀 드래그/내 위치 버튼)
 *  - 웨이팅 등록: 남은 시간 + 내 앞 팀 수를 동시에 입력 (팀 수 변경 시 남은 시간 자동 계산, 시간은 직접 수정 가능)
 *  - STEP 2/3: 담은 장소의 체류 시간을 숫자로 자유 입력, '체류 짧은 순' 정렬 삭제
 *
 * v4 변경 요약
 *  - STEP 1: 팀 수/남은 시간 자동 환산 제거 → 각각 따로 저장. 앞 팀 수를 먼저 입력(①)해야 남은 시간(②) 탭이 열림
 *  - 이동 수단: STEP 1에서 제거 → STEP 3(코스 확인)에서 선택. 도보·대중교통·자동차·자전거, 수단별 총 소요시간/코스 안내
 *  - STEP 2: 체류 시간 자유 입력 범위 5~240분
 *
 * v5 변경 요약
 *  - STEP 1 분리: 1-1 내 현재 위치(지도) → 1-2 대기시간 입력. 복귀 목표 시각이 입력에 맞춰 바로 아래에 표시
 *  - 코스 시간 막대: 선택 순서대로 색 구분(1 빨강, 2 초록 …). 같은 색 번호를 핀 · 담은 장소 체류 시간 줄 왼쪽에 표시
 *
 * v6 변경 요약
 *  - 홈: 히어로 영역을 화면 중앙까지 확장 · 등록 버튼 재디자인 · '최근 웨이팅' 삭제 · 추천 코스를 정사각형 2열로
 *  - 웨이팅 장소(1-1): 지도 높이 2배 · 빨간 핀 · 안내 문구 삭제
 *  - 대기시간(1-2): 앞 팀 수 삭제 · 시간 입력 영역 확대
 *  - STEP 2/3: 검색창을 지도 위로 · 지도 확대 · 카테고리/담기만 남기고 나머지 삭제
 *
 * v7 변경 요약
 *  - 1-2 대기시간: 시간 칩 크기 축소
 *  - STEP 2: 카테고리 칩 축소 · 카페 카테고리 항상 표시(API 연결 전엔 빈 목록) · 장소를 누르면 주소/전화/운영·휴무 상세가 펼쳐짐
 *  - 담기 시 모든 장소 체류 시간을 10분(DSTAY)으로 가정해 시간 부족을 계산 (STEP 2 화면에는 표시 안 함)
 *  - 검색: 장소 이름만 · 필터(장소 묶음/영업중/정렬) · 대기 60분 이하는 체류 0분 가정 · 진행 중 홈 원형 표시 · 마이페이지 코스 번호
 *  - API 장소 선택 필드: pop(인기 점수, 클수록 인기) · openNow(true/false) · hours({open,close} 또는 {weekday,saturday,holiday})
 *  - STEP 3: 여유 시간 막대 → 원형 타이머 모양 · 이동 수단 한 줄 · 장소 순서는 ⋮⋮ 핸들 드래그(방향키도 가능) · 체류 시간 조절 한 줄 카드
 *
 * v8 변경 요약
 *  - 이동 수단 기능 삭제: 도보 이동시간만 참고용으로 남김 (장소 목록·상세·코스 타임라인)
 *  - 지도: 반경 점선 원 삭제 · 지도에 보이는 범위(확대/축소/이동)의 장소는 모두 핀으로 표시
 *    웨이팅 시간에 비례한 반경(km) 안의 핀은 크고 진하게, 밖의 핀은 작고 흐리게 강조 · 모든 핀을 웨이팅 장소 선택 핀 모양으로 통일
 *  - 로고: 숫자 0을 핀 모양으로 만든 0차 로고 · 헤더 로고를 누르면 홈으로 이동
 *  - 코스 수정 흐름: 코스 확인 ↔ 지도 / 진행 중 코스 수정 / 마이페이지 코스 수정 (돌아갈 곳이 항상 보임)
 *  - 관심 공간 하트(♡/♥) 버튼 복구 (장소 목록 · 상세)
 *  - 각 페이지 상단 STEP 표기 대신 안내·참고·주의 한두 문장
 *
 * v9 변경 요약
 *  - 로고: 숫자 0을 '코스가 채워지는 원형 타이머' 링으로 교체 (선택 순서 색 호 + 남은 여유 구간)
 *  - 길찾기: 누르면 앱 선택 시트가 열림. 구글지도(웹·앱 어디서나, 전체 경로 자동 입력) / 네이버지도 앱(휴대폰)
 *  - 마이페이지: 코스를 원형 타이머 카드 2열 격자로 표시 (자세한 정보는 눌러서 확인)
 *
 * v10 변경 요약
 *  - 헤더: 우측 버튼을 하트(♥ 관심 공간 N) 바로가기로 변경 → 누르면 마이페이지 '관심 공간' 탭
 *  - 진행 화면: 대기시간 ±10분 조절을 작게·가운데 정렬 / 코스 타임라인은 '도보 · 체류'를 한 줄로, 장소 간격 확대
 *  - 코스 종료 화면: '오늘의 코스' 가운데 정렬
 *  - 마이페이지 코스 카드: [원형 타이머 | 코스 제목·날짜·대기 | 장소 목록]을 한 행에 배치
 *  - 관심 공간: 간략 주소 표시 · 지도 아래와 같은 형태의 필터(장소/영업중/정렬)
 *  - 코스 상세: 하단 버튼을 '다시 시작 + 장소 바꾸기' 한 줄로 정리(하단 메뉴 중앙 버튼과 겹침 해소), 삭제는 본문 맨 아래로
 */
const AREAS=[
 {n:'성수동',lat:37.5446,lng:127.0557},
 {n:'건대입구',lat:37.5404,lng:127.0692},
 {n:'서울숲',lat:37.5444,lng:127.0374},
 {n:'홍대입구',lat:37.5572,lng:126.9245},
 {n:'강남역',lat:37.4979,lng:127.0276}];
const CAT_ORDER=['서점','도서관','공원','카페','쇼핑'];
const CE={서점:'📚',도서관:'🏛️',공원:'🌳',카페:'☕',쇼핑:'🛍️'};
const BUF=10;             // 복귀 여유 시간(분)
const DSTAY=10;           // 담을 때 가정하는 기본 체류 시간(분) — 시간 부족 계산에만 쓰고 STEP 2에는 표시하지 않음
const COL=['#1a73e8','#1e8e3e','#c25e00','#8e24aa','#00838f','#c2185b','#5d4037','#6d4c41'];   // 선택 순서별 색 (흰 글자 대비 확보 · 웨이팅 장소 핀의 빨강과 겹치지 않게)
const colr=j=>COL[j%COL.length];
const CC={서점:'#4f6bed',도서관:'#8b5cf6',공원:'#16a56b',카페:'#e8803a',쇼핑:'#e5528a'};   // 카테고리 색
const ICP={
 서점:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6"/>',
 도서관:'<path d="M3.5 9.5 12 4l8.5 5.5z"/><path d="M6 12v6M10 12v6M14 12v6M18 12v6M4 20.5h16"/>',
 공원:'<path d="M12 21v-6.5"/><path d="M12 14.5c-3.4 0-6-2.4-6-5.4 0-1.8 1-3.2 2.4-3.9C9 3.7 10.3 3 12 3s3 .7 3.6 2.2C17 5.9 18 7.3 18 9.1c0 3-2.6 5.4-6 5.4z"/>',
 카페:'<path d="M5 9h11v4.5A5.5 5.5 0 0 1 10.5 19 5.5 5.5 0 0 1 5 13.5z"/><path d="M16 10.5h1.5a2.3 2.3 0 0 1 0 4.6H16M8 3.5v2M12 3.5v2"/>',
 쇼핑:'<path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
 기타:'<circle cx="12" cy="12" r="5"/>'};
const ico=c=>`<svg class="ic2" viewBox="0 0 24 24" aria-hidden="true">${ICP[c]||ICP.기타}</svg>`;
const cb=c=>`<span class="cb" style="--c:${CC[c]||'#667085'}">${ico(c)}</span>`;   // 테두리 있는 장소 배지
const TGT='<svg class="ic2 tg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="8" fill="none"/></svg>';   // 웨이팅 장소(과녁)
const P=[];               // 장소 목록 (인덱스 = 장소 ID, 추가만 하고 순서는 바꾸지 않음)
let loadError=false;

const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:null};
const SOURCES=[
 {url:'data/seoul_bookstore_100.json',pick:d=>d.DATA,
  map:x=>({n:x.store_name,c:'서점',e:CE.서점,s:30,lat:num(x.xcnts),lng:num(x.ydnts),addr:x.adres?'서울 '+x.adres:'',tel:x.tel_no,url:x.hmpg_url||x.sns})},
 {url:'data/seoul_library_100.json',pick:d=>d.libraries,
  map:x=>({n:x.name,c:'도서관',e:CE.도서관,s:40,lat:x.coordinates&&x.coordinates.latitude,lng:x.coordinates&&x.coordinates.longitude,addr:x.address,tel:x.phone,url:x.website,closed:x.closedDays,hours:x.hours})},
 {url:'data/seoul_park_130.json',pick:d=>d.DATA,
  map:x=>({n:x.park_nm,c:'공원',e:CE.공원,s:40,lat:num(x.ycrd),lng:num(x.xcrd),addr:x.park_addr,tel:x.telno,url:x.url})},
 {url:'data/sample_cafe_shop.json',pick:d=>d.places,
  map:x=>({n:x.name,c:x.cat,e:CE[x.cat],s:x.cat=='카페'?40:50,lat:x.lat,lng:x.lng,addr:x.addr,sample:true})}];

function addPlaces(list,fromJson){
 list.forEach(p=>{
  p.n=String(p.n||'').trim();
  if(!p.n||p.lat==null||p.lng==null||p.lat<33||p.lat>39||p.lng<124||p.lng>132)return;   // 좌표 없거나 범위 밖이면 제외
  P.push({e:'📍',...p,s:DSTAY,j:!!fromJson});   // 출처별 s 값과 상관없이 기본 체류는 DSTAY
 });
}
function addApiPlaces(list){addPlaces(list,false);draw()}

// 기준 위치(R={lat,lng}) 대비 도보 시간(w, 분)·방향(a, 도). 위치별로 계산 후 캐시
const GC=new Map();
const aref=n=>AREAS.find(a=>a.n==n)||AREAS[0];
const locOf=c=>c.loc||aref(c.area);          // 코스의 기준 위치 (예전 저장 데이터는 지역 이름으로 복원)
const dkm=(a,b)=>{const r=Math.PI/180,h=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lng-a.lng)*r/2)**2;return 12742*Math.asin(Math.sqrt(h))};
const areaLabel=l=>{let b=null,m=1.5;AREAS.forEach(a=>{const d=dkm(a,l);if(d<m){m=d;b=a.n}});return b||'선택한 위치'};   // 가까운 동네 이름(1.5km 이내) 없으면 '선택한 위치'
function geo(k,R){
 const key=R.lat.toFixed(5)+','+R.lng.toFixed(5)+'|'+k;let g=GC.get(key);
 if(!g){
  const p=P[k],r=Math.PI/180,cos=Math.cos(R.lat*r),dx=(p.lng-R.lng)*cos,dy=p.lat-R.lat;
  const a=Math.sin((p.lat-R.lat)*r/2)**2+cos*Math.cos(p.lat*r)*Math.sin((p.lng-R.lng)*r/2)**2;
  const km=12742*Math.asin(Math.sqrt(a));
  g={w:Math.max(1,Math.round(km*1.3/4.8*60)),a:Math.atan2(-dy,dx)/r};   // 직선거리×1.3 ÷ 도보 4.8km/h
  GC.set(key,g);
 }
 return g;
}

/* ---------- 상태 + 저장 ---------- */
const KEY='0cha:v2';
const SAVED=(()=>{try{localStorage.removeItem(KEY)}catch(e){}return null})();   // 새로고침(F5)하면 저장값을 지우고 처음 상태(홈)로 시작
const S={i:'home',from:'map',wait:120,cats:[],sel:[],stay:{},focus:null,view:'list',q:'',start:null,rest:'웨이팅 중인 식당',area:'성수동',loc:{lat:AREAS[0].lat,lng:AREAS[0].lng},fin:null,editId:null,active:false,curId:null,seg:'c',cid:null,sort:'def',onow:false,catOpen:false,favs:[],courses:[],toast:'',top:0,rsheet:false,fcats:[],fcatOpen:false,fonow:false,fsort:'def',wadj:false,mback:null};
(function(){const v=SAVED;if(!v||typeof v!='object')return;
 if(Number.isFinite(v.wait))S.wait=Math.min(300,Math.max(10,v.wait));
 if(Array.isArray(v.cats))S.cats=v.cats.filter(c=>CAT_ORDER.includes(c));
 if(typeof v.rest=='string')S.rest=v.rest.slice(0,40);
 {const l=v.loc,ok=l&&Number.isFinite(l.lat)&&Number.isFinite(l.lng)&&l.lat>33&&l.lat<39&&l.lng>124&&l.lng<132;
  if(ok)S.loc={lat:l.lat,lng:l.lng};else if(AREAS.some(a=>a.n==v.area)){const a=aref(v.area);S.loc={lat:a.lat,lng:a.lng}}
  S.area=areaLabel(S.loc)}
 if(['list','card'].includes(v.view))S.view=v.view;
 if(['def','near','pop'].includes(v.sort))S.sort=v.sort;
 if(v.onow===true)S.onow=true;
 if(v.active&&Number.isFinite(v.start)){S.active=true;S.start=v.start}
 if(Number.isFinite(v.editId))S.editId=v.editId;
 if(Number.isFinite(v.curId))S.curId=v.curId;
})();
const nm=a=>a.map(k=>P[k].n);
const nmap=m=>Object.fromEntries(Object.entries(m).filter(([k])=>P[k]).map(([k,v])=>[P[k].n,v]));
function save(){try{localStorage.setItem(KEY,JSON.stringify({wait:S.wait,cats:S.cats,rest:S.rest,area:S.area,loc:S.loc,view:S.view,sort:S.sort,onow:S.onow,active:S.active,start:S.start,editId:S.editId,curId:S.curId,sel:nm(S.sel),stay:nmap(S.stay),favs:nm(S.favs),courses:S.courses.map(c=>({...c,sel:nm(c.sel),stay:nmap(c.stay)}))}))}catch(e){}}
// 저장된 장소 이름 → 현재 장소 ID (데이터 로드 후 복원)
function restore(){
 const v=SAVED;if(!v||!Array.isArray(v.courses))return false;
 const ids=a=>(Array.isArray(a)?a:[]).map(n=>P.findIndex(p=>p.n==n)).filter(k=>k>=0);
 const sm=m=>Object.fromEntries(Object.entries(m||{}).map(([n,x])=>[P.findIndex(p=>p.n==n),x]).filter(([k])=>k>=0));
 S.sel=ids(v.sel);S.stay=sm(v.stay);S.favs=ids(v.favs);
 S.courses=v.courses.map(c=>({...c,sel:ids(c.sel),stay:sm(c.stay)})).filter(c=>c.sel.length);
 return true;
}
async function loadPlaces(){
 const res=await Promise.allSettled(SOURCES.map(async s=>{const r=await fetch(s.url);if(!r.ok)throw new Error(r.status+' '+s.url);return s.pick(await r.json()).map(s.map)}));
 res.forEach(r=>{if(r.status=='fulfilled')addPlaces(r.value,true);else{loadError=true;console.error(r.reason)}});
 if(!restore()){   // 처음 방문: 샘플 코스/관심공간 (이름으로 연결)
  const id=n=>P.findIndex(p=>p.n==n),mk=(i,names,wait,date)=>({id:i,sel:names.map(id).filter(k=>k>=0),stay:{},wait,area:'성수동',date});
  S.courses=[mk(1,['낫저스트북스','서울숲'],120,'10/28'),mk(2,['성수근린공원','공씨책방(성수점)'],90,'10/21')].filter(c=>c.sel.length);
  S.favs=['낫저스트북스'].map(id).filter(k=>k>=0);
 }
 draw();
}

/* ---------- 계산 ---------- */
const ttx=(k,ar)=>geo(k,ar||S.loc).w;   // 도보 이동시간(분) — 참고용
const dstay=w=>(w??S.wait)<=60?0:DSTAY;   // 대기 60분 이하(30분·1시간 등)는 체류 0분으로 가정, 그 외 10분
const sx=(k,m,w)=>m[k]??dstay(w);
const tt=k=>ttx(k),stay=k=>sx(k,S.stay),cost=k=>tt(k)*2+stay(k);          // cost = 왕복 이동 + 체류
const total=()=>S.sel.reduce((s,k)=>s+cost(k),0),rem=()=>S.wait-total(),fit=k=>cost(k)<=rem()-BUF;
const ctot=c=>c.sel.reduce((s,k)=>s+ttx(k,locOf(c))*2+sx(k,c.stay,c.wait),0);
const cwalk=c=>c.sel.reduce((s,k)=>s+ttx(k,locOf(c))*2,0);   // 코스 도보 왕복 합계(참고)
const fm=m=>m>=60?Math.floor(m/60)+'시간'+(m%60?' '+m%60+'분':''):m+'분';
const f2=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const ro=n=>{const c=String(n).trim().slice(-1).charCodeAt(0)-0xAC00,b=c>=0&&c<11172?c%28:-1;return n+((b==0||b==8)?'로':'으로')};   // 받침에 따라 로/으로
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const base=()=>{if(S.active&&S.start){const d=new Date(S.start);return d.getHours()*60+d.getMinutes()}return clock()};   // 진행 중이면 시작 시각 기준
const elapsed=()=>S.active&&S.start?Math.floor((Date.now()-S.start)/1000):0;
const remSec=()=>Math.max(0,S.wait*60-elapsed());
const hms=s=>Math.floor(s/3600)+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const backAt=()=>f2(base()+S.wait);

// 안전한 링크/전화 (데이터에 이상한 값이 있어도 javascript: 같은 스킴은 막는다)
const safeUrl=u=>{u=String(u||'').trim();if(/^https?:\/\//i.test(u))return u;if(/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(u))return 'https://'+u;return ''};
const safeTel=t=>String(t||'').replace(/[^\d+\-]/g,'').slice(0,20);
const kakaoLink=k=>`https://map.kakao.com/link/to/${encodeURIComponent(P[k].n)},${P[k].lat},${P[k].lng}`;

// 도서관 운영 정보: 실제 휴관일/운영시간 데이터 사용
const DAYS=['일','월','화','수','목','금','토'];
const ORD={첫째:1,둘째:2,셋째:3,넷째:4,다섯째:5};
function libClosed(p){   // 오늘이 휴관일인지 (요일 + 몇째 주)
 if(!p.closed)return false;
 const now=new Date(),d=now.getDay(),wk=Math.ceil(now.getDate()/7);
 const cl=String(p.closed||'').replace(/[가-힣]*공휴일/g,'').replace(/\(일요일 제외\)|일요일을 제외한/g,'');
 return cl.split(/[+,]/).some(seg=>{
  const ords=[...seg.matchAll(/첫째|둘째|셋째|넷째|다섯째/g)].map(m=>ORD[m[0]]);
  const w=seg.replace(/\s/g,'').replace(/첫째|둘째|셋째|넷째|다섯째/g,'').replace(/매[주월]?/g,'').replace(/^주/,'').replace(/주(?=[월화수목금토일])/g,'')[0];
  return w==DAYS[d]&&(!ords.length||ords.includes(wk))});
}
function libInfo(p){
 if(!p.hours)return '';
 const d=new Date().getDay(),h=d==0?p.hours.holiday:d==6?p.hours.saturday:p.hours.weekday;
 return (libClosed(p)?'⚠ 오늘은 휴관일일 수 있어요 · ':'')+(h?`오늘 ${h.open}–${h.close} · `:'')+'휴관 '+(p.closed||'정보 없음');
}
// 영업 여부: true 영업중 / false 영업 아님 / null 정보 없음 (공원은 상시 개방으로 간주)
const mins=t=>{const m=/(\d{1,2}):?(\d{2})/.exec(String(t||''));return m?+m[1]*60+ +m[2]:null};
function openState(p){
 if(p.c=='공원')return true;
 if(typeof p.openNow=='boolean')return p.openNow;
 const h=p.hours;if(!h)return null;
 if(libClosed(p))return false;
 const d=new Date().getDay(),t=h.open!=null?h:(d==0?h.holiday:d==6?h.saturday:h.weekday);
 const o=t&&mins(t.open),c=t&&mins(t.close);if(o==null||c==null)return null;
 const n=clock();return n>=o&&n<c;
}
const isOpen=k=>openState(P[k]);
const TIP={서점:'영업시간·휴무는 방문 전에 확인하세요',공원:'대부분 상시 개방이에요 (시설별 운영시간은 다를 수 있어요)',카페:'영업시간은 방문 전에 확인하세요',쇼핑:'영업시간은 방문 전에 확인하세요'};

/* ---------- 토스트 ---------- */
let toastT;
function toast(m){S.toast=m;clearTimeout(toastT);toastT=setTimeout(()=>{S.toast='';const el=document.querySelector('.toast');if(el)el.remove()},3000)}
// 시간이 바뀌어 초과되면 뒤에서부터 장소를 빼되, 사용자에게 알려준다
const prune=()=>{const out=[];while(rem()<0&&S.sel.length)out.push(P[S.sel.pop()].n);if(out.length)toast(`시간이 줄어 ${out.join(', ')}을(를) 뺐어요`)};
const resetSel=msg=>{if(S.sel.length){S.sel=[];S.stay={};toast(msg)}S.focus=null};
// 현재 위치 변경: 담은 장소는 비우고(이동시간이 달라지므로) 지도 중심을 옮길지(center) 정한다
let recenter=false;
function moveTo(lat,lng,center){
 if(S.active)return false;lat=+lat;lng=+lng;if(!Number.isFinite(lat)||!Number.isFinite(lng))return false;
 if(Math.abs(lat-S.loc.lat)<1e-5&&Math.abs(lng-S.loc.lng)<1e-5){if(center)recenter=true;return false}
 S.loc={lat:+lat.toFixed(5),lng:+lng.toFixed(5)};S.area=areaLabel(S.loc);GC.clear();recenter=!!center;
 resetSel('위치가 바뀌어 담은 장소를 비웠어요');return true}
const setLoc=(lat,lng)=>{if(moveTo(lat,lng))draw()};

/* ---------- 진행 단계 ---------- */
const stages=()=>S.sel.flatMap(k=>[{t:`${ro(P[k].n)} 이동`,m:tt(k)},{t:`${P[k].n}에서 머무르기`,m:stay(k)},{t:'식당 방향으로 복귀 이동',m:tt(k)}]);
const curStage=()=>{const e=elapsed()/60,st=stages();let c=0;for(let j=0;j<st.length;j++){c+=st[j].m;if(e<c)return j}return st.length};
const stageTxt=()=>{const st=stages(),j=curStage();return !st.length?'등록한 코스가 없어요':j>=st.length?'코스를 모두 마쳤어요 · 식당으로 돌아가요':st[j].t+' · 약 '+st[j].m+'분'};
// 진행 화면 '지금' 카드용: 제목(단계)과 부제(도착/종료 시각 · 소요)를 나눠서 돌려준다
const stageInfo=()=>{const st=stages(),j=curStage();
 if(!st.length)return{t:'등록한 코스가 없어요',s:''};
 if(j>=st.length)return{t:'지금 식당으로 돌아가세요',s:'코스를 모두 마쳤어요'};
 let c=0;for(let i=0;i<=j;i++)c+=st[i].m;
 const m=st[j].m,at=f2(base()+c);
 return{t:st[j].t,s:j%3==1?`${at}까지 · 체류 ${m}분`:`${at} 도착 · 도보 ${m}분`}};
const leftTxt=()=>remSec()<=0?'· 예상 대기시간 종료':`· ${fm(Math.ceil(remSec()/60))} 남음`;
const stagePlace=()=>{const j=curStage();if(j>=S.sel.length*3||j%3==2)return null;return S.sel[Math.floor(j/3)]};   // 길찾기 대상(이동/체류 단계의 장소)
const banner=()=>{const r=rem(),s=remSec();
 if(s<=0)return{c:'err',t:'⚠ 예상 대기시간이 끝났어요. 지금 식당으로 돌아가세요'};
 if(r<0)return{c:'err',t:`⚠ 코스가 대기시간보다 ${fm(-r)} 길어요. 마지막 장소를 빼거나 일찍 복귀하세요`};
 if(s<=600)return{c:'warn',t:'🔔 10분 안에 식당으로 돌아갈 준비를 해주세요'};
 return{c:'ok',t:`✓ 복귀까지 여유 있어요 · 코스 여유 ${fm(r)}`}};

/* ---------- 공통 UI ---------- */
const svg=p=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={home:svg('<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>'),
 clock:svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
 route:svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
 user:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>')};
const tabOf=()=>{const i=S.i;if(i=='prog')return S.active?'reg':'home';return {home:'home',done:'home',reg:'reg',wait:'reg',map:'reg',confirm:'reg',my:'my',mc:'my'}[i]};
const nav=()=>{const a=tabOf(),go=S.active?(S.sel.length?'prog':'map'):'reg';
 return `<nav class="nav" aria-label="메인 메뉴"><button class="${a=='home'?'on':''}" data-go="home">${IC.home}<span>홈</span></button><button class="reg ${a=='reg'?'on':''}" data-go="${go}">${S.active?IC.route:IC.clock}<span>${S.active?'코스':'등록'}</span></button><button class="${a=='my'?'on':''}" data-go="my">${IC.user}<span>마이페이지</span></button></nav>`};
const LOGO=(()=>{const R=10.5,C=2*Math.PI*R,fr=[.3,.24,.2];let acc=0;   // 숫자 0 = 코스가 채워지는 원형 타이머 (색은 코스 선택 순서 색, 남은 구간은 복귀 여유)
 const seg=fr.map((f,j)=>{const len=f*C,o=-acc;acc+=len;return `<circle cx="16" cy="16" r="${R}" stroke="${COL[j]}" stroke-dasharray="${len-1.6} ${C}" stroke-dashoffset="${o}"/>`}).join('');
 return `<svg class="lg0" viewBox="0 0 32 32" aria-hidden="true"><circle class="tk" cx="16" cy="16" r="${R}"/><g transform="rotate(-90 16 16)">${seg}</g></svg>`})();
const note=(k,t)=>`<p class="note ${k=='주의'?'warn':k=='참고'?'ref':''}"><b>${k}</b><span>${t.split(/(?<=\.)\s+/).join('<br>')}</span></p>`;   // 페이지 상단 안내(안내·참고·주의)
// 헤더 우측: 관심 공간(하트) 바로가기. 어느 화면에서든 저장한 장소로 이동
const hd=()=>{const n=S.favs.length,on=S.i=='my'&&S.seg=='f';return `<header class="hd"><button class="logo" data-go="home" aria-label="0차 홈으로 이동">${LOGO}<span>차</span></button><button class="fvb${on?' on':''}" data-favgo="1" aria-label="관심 공간 ${n}곳 보기"><span class="fh" aria-hidden="true">${n?'♥':'♡'}</span><b>${n}</b></button></header>`};
const toastH=()=>S.toast?`<div class="toast" role="status">${esc(S.toast)}</div>`:'';

/* ---------- 미니 플레이어: 진행 중인 코스를 홈·마이페이지 하단에 띄움(배달 진행 배너처럼) ---------- */
const mpOn=()=>S.active&&S.sel.length&&['home','my','mc'].includes(S.i);
const mpSub=()=>`${backAt()}까지 복귀 · ${remSec()<=0?'예상 대기시간 종료':fm(Math.ceil(remSec()/60))+' 남음'}`;
const miniPlayer=()=>{if(!mpOn())return '';const si=stageInfo();
 return `<button class="mp ${banner().c}" data-cd="mpc" data-go="prog" aria-label="진행 중인 코스 보기"><span class="mp-ic" aria-hidden="true"><svg class="ic2" viewBox="0 0 24 24" width="22" height="22"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M6 15.8V10a4 4 0 0 1 4-4h5.8"/></svg></span><span class="mp-tx"><span class="mp-k">웨이팅 중 · 0차 코스</span><b class="mp-t" data-cd="st1">${esc(si.t)}</b><span class="mp-s" data-cd="mps">${esc(mpSub())}</span></span><span class="mp-go" aria-hidden="true">›</span></button>`};
const frame=(b,f)=>`${hd()}<main class="body${mpOn()?' hasmp':''}">${b}</main>${f?`<div class="ft">${f}</div>`:''}${miniPlayer()}${nav()}${toastH()}${routeSheet()}`;
const frameM=(top,sheet,f)=>`${hd()}<main class="mapbody"><div class="mtop">${top}</div><div class="sheet" id="sheet">${sheet}</div></main>${f?`<div class="ft">${f}</div>`:''}${nav()}${toastH()}`;
const bar=()=>{let h='';S.sel.forEach((k,j)=>h+=`<i style="width:${cost(k)/S.wait*100}%;background:${colr(j)};color:#fff">${j+1} ${P[k].e} ${cost(k)}′</i>`);const r=rem();
 return `<div class="bar" role="img" aria-label="${r<0?'대기시간 '+fm(-r)+' 초과':'복귀 여유 '+fm(r)}">${h}<i class="${r<0?'x':'m'}" style="flex:1">${r<0?'⚠ '+fm(-r)+' 초과':'여유 '+fm(r)}</i></div>`};
// STEP 3 여유 시간: 원형 타이머 모양 (선택 순서별 색 호 + 가운데 복귀 여유)
const ringSvg=()=>{const R=48,C=2*Math.PI*R,r=rem(),over=r<0;let acc=0;
 const segs=over?`<circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--err)" stroke-width="12"/>`:S.sel.map((k,j)=>{const len=Math.min(cost(k)/S.wait*C,C-acc),g=len>4?1.5:0,o=-acc;acc+=len;return `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${colr(j)}" stroke-width="12" stroke-dasharray="${Math.max(len-g,0)} ${C}" stroke-dashoffset="${o}"/>`}).join('');
 return `<div class="rbc" role="img" aria-label="${over?'대기시간 '+fm(-r)+' 초과':'대기시간 '+fm(S.wait)+' 중 복귀 여유 '+fm(r)}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--fill)" stroke-width="12"/><g transform="rotate(-90 60 60)">${segs}</g></svg><div class="rbt"><span class="sub">${over?'초과':'복귀 여유'}</span><b class="${over?'ov':''}">${fm(Math.abs(r))}</b></div></div>`};
// STEP 3 여유 시간: 원형 타이머 모양 (선택 순서별 색 호 + 가운데 복귀 여유)
const ringBar=()=>`<div class="rb">${ringSvg()}<div class="rbs"><div><span class="sub">대기시간</span><b>${fm(S.wait)}</b></div><div><span class="sub">코스 사용</span><b>${fm(total())}</b></div>${S.sel.length?`<div class="rbl">${S.sel.map((k,j)=>`<span class="dot sm" style="background:${colr(j)}">${j+1}</span>`).join('')}</div>`:''}</div></div>`;
const cats=()=>CAT_ORDER.filter(c=>c=='카페'||P.some(p=>p.c==c));   // 카페는 API 연결 전이라도 항상 표시
const CATS4=['서점','도서관','공원','카페'];
const catLbl=()=>!S.cats.length?'장소':'장소 · '+S.cats[0]+(S.cats.length>1?' 외 '+(S.cats.length-1):'');
const catRow=()=>`<div class="flt" role="group" aria-label="필터"><button class="chip ${S.cats.length||S.catOpen?'on':''}" data-catmenu="1" aria-expanded="${S.catOpen}">${esc(catLbl())} ${S.catOpen?'▴':'▾'}</button><button class="chip ${S.onow?'on':''}" data-onow="1" aria-pressed="${S.onow}">영업중</button><select class="srt" id="sort" aria-label="정렬"><option value="def" ${S.sort=='def'?'selected':''}>기본순</option><option value="near" ${S.sort=='near'?'selected':''}>거리 가까운 순</option><option value="pop" ${S.sort=='pop'?'selected':''}>인기순</option></select></div>
${S.catOpen?`<div class="catp"><div class="row cats" role="group" aria-label="장소 카테고리 (여러 개 선택 가능)"><button class="chip ${S.cats.length?'':'on'}" aria-pressed="${!S.cats.length}" data-cat="">전체</button>${CATS4.map(c=>`<button class="chip ${S.cats.includes(c)?'on':''}" aria-pressed="${S.cats.includes(c)}" data-cat="${c}">${CE[c]} ${c}</button>`).join('')}</div></div>`:''}`;

/* ---------- 지도/목록 계산 ---------- */
// 반경(km)은 웨이팅 시간에 비례 (30분 0.6km · 60분 1.2km · 120분 2.4km · 240분 4.8km). 지도에 원은 그리지 않고, 반경 안 핀을 더 크고 진하게 강조
const RAD=()=>Math.max(.5,S.wait*.02);
const radTxt=()=>(+RAD().toFixed(1))+'km';
const inRad=k=>dkm(S.loc,P[k])<=RAD();
// 지금 지도에 보이는 범위(KM.vb) 안에 있는지. 지도가 아직 없으면 반경 안으로 대신 판단
const inView=k=>{const b=KM.vb,p=P[k];if(!b)return inRad(k);return p.lat>=b.s&&p.lat<=b.n&&p.lng>=b.w&&p.lng<=b.e};
const matchQ=k=>{const q=S.q.trim().toLowerCase();if(!q)return true;const p=P[k];return p.n.toLowerCase().includes(q)};   // 장소 이름만 검색
const byDist=(a,b)=>tt(a)-tt(b);
// 목록 = 지도에 보이는 핀과 같은 장소 (검색어가 있으면 범위와 상관없이 이름이 맞는 장소 전체)
const list=()=>{const q=S.q.trim(),b=P.map((p,k)=>k).filter(k=>(!S.cats.length||S.cats.includes(P[k].c))&&matchQ(k)&&(q||inView(k))&&(!S.onow||isOpen(k)===true));
 b.sort(byDist);
 if(S.sort=='def')b.sort((x,y)=>CAT_ORDER.indexOf(P[x].c)-CAT_ORDER.indexOf(P[y].c)||byDist(x,y));      // 기본순: 카테고리 순 → 가까운 순
 else if(S.sort=='pop')b.sort((x,y)=>(P[y].pop||0)-(P[x].pop||0)||byDist(x,y));                         // 인기순: pop 값(API) 큰 순, 없으면 가까운 순
 return [...b,...S.sel.filter(k=>!b.includes(k))]};
// 등록 화면 "갈 수 있는 곳": 반경 안에서 시간이 되는 장소 수
const avail=fresh=>P.map((p,k)=>k).filter(inRad).filter(k=>fresh?cost(k)<=S.wait-BUF:(!S.sel.includes(k)&&fit(k))).length;
const addBtn=k=>{const on=S.sel.includes(k);return `<button class="add ${on?'on':''}" data-tog="${k}" ${!on&&!fit(k)?'disabled':''} aria-label="${esc(P[k].n)} ${on?'담음, 누르면 빼기':fit(k)?'코스에 담기':'시간 부족'}">${on?'✓ 담음':fit(k)?'+ 담기':'시간 부족'}</button>`};
const chain=c=>c.sel.map(k=>P[k].e).join(' → ');
const title=c=>c.sel.map(k=>esc(P[k].n)).join(' → ');
// 코스는 항상 1개 항목으로 저장. 같은 코스를 다시 시작/저장하면 새로 쌓지 않고 덮어씀
const saveCourse=()=>{const old=S.courses.find(x=>x.id==S.editId),c={id:S.editId||Date.now(),sel:[...S.sel],stay:{...S.stay},wait:S.wait,area:S.area,loc:{...S.loc},date:'오늘',review:old&&old.review||''},i=S.courses.findIndex(x=>x.id==c.id);if(i>=0)S.courses[i]=c;else S.courses.push(c);S.editId=c.id;return c.id};
const resetBuild=()=>{S.sel=[];S.stay={};S.editId=null;S.focus=null};

/* ---------- 홈 ---------- */
const home=()=>frame(note('안내','웨이팅 중 남은 시간 동안 다녀올 수 있는 주변 장소를 코스로 만들어드려요.')+(
`<section class="hero"><div><p class="hero-k">줄 서는 시간을 내 시간으로</p><h2 class="hero-h">웨이팅,<br>이제 0차로.</h2><p class="hero-s">남은 시간을 입력하면 갈 수 있는 곳을 지도로 보여드려요.</p></div>
<button class="cta" data-go="reg"><span>웨이팅 시간 등록하기</span><span class="cta-a" aria-hidden="true">→</span></button></section>
<h3 class="sec">이런 곳은 어때요</h3><div class="row">${cats().map(c=>`<button class="chip" data-hcat="${c}">${CE[c]} ${c}</button>`).join('')}</div>
<h3 class="sec">추천 코스</h3>
<div class="sqs"><button class="sq" data-pop="서점,공원|90"><span class="ic" aria-hidden="true">📚 🌳</span><span><b>서점 → 공원</b><span class="sub">90분 · 도보</span></span></button>
<button class="sq" data-pop="공원,카페|60"><span class="ic" aria-hidden="true">🌳 ☕</span><span><b>공원 → 카페</b><span class="sub">60분 · 도보</span></span></button></div>`));

/* ---------- 등록 ---------- */
/* ---------- 카카오지도 공통 ---------- */
const kOK=()=>!!(window.kakao&&kakao.maps);
let kLoaded=false;
function kLoad(cb){if(!kOK())return false;if(kLoaded){cb();return true}kakao.maps.load(()=>{kLoaded=true;cb()});return true}   // autoload=false 라서 load() 안에서 지도를 만든다
const kLL=(lat,lng)=>new kakao.maps.LatLng(lat,lng);
const kFail=ph=>{ph.innerHTML='<div class="hint">지도를 불러오지 못했어요.<br>인터넷 연결과 카카오 앱키·도메인 등록을 확인해주세요.</div>'};

// 위치 지정 지도(카카오). 화면이 다시 그려져도 지도 요소는 유지하고 새 자리에 다시 끼워 넣는다
const LM={el:null,map:null,mk:null};
const redPin=()=>new kakao.maps.MarkerImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42"><path d="M15 1C7.3 1 1 7.2 1 15c0 10.5 14 26 14 26s14-15.5 14-26C29 7.2 22.7 1 15 1z" fill="#d93025" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5.5" fill="#fff"/></svg>'),new kakao.maps.Size(30,42),{offset:new kakao.maps.Point(15,41)});
function mountLocMap(){
 const ph0=document.getElementById('locmap');if(!ph0)return;
 if(!kLoad(()=>{
  const ph=document.getElementById('locmap');if(!ph)return;          // 로딩 중 화면이 바뀌었으면 중단
  if(!LM.el){LM.el=document.createElement('div');LM.el.className='lmap'}
  ph.appendChild(LM.el);
  const c=kLL(S.loc.lat,S.loc.lng);
  if(!LM.map){
   LM.map=new kakao.maps.Map(LM.el,{center:c,level:4});
   LM.mk=new kakao.maps.Marker({position:c,image:redPin(),draggable:true,title:'웨이팅 장소'});LM.mk.setMap(LM.map);
   kakao.maps.event.addListener(LM.map,'click',e=>setLoc(e.latLng.getLat(),e.latLng.getLng()));
   kakao.maps.event.addListener(LM.mk,'dragend',()=>{const q=LM.mk.getPosition();setLoc(q.getLat(),q.getLng())});
  }
  const keep=LM.map.getCenter();LM.map.relayout();LM.map.setCenter(keep);   // 요소를 다시 끼운 뒤 크기 반영
  LM.mk.setPosition(c);LM.mk.setDraggable(!S.active);
  if(recenter){LM.map.setCenter(c);LM.map.setLevel(3);recenter=false}
 }))kFail(ph0);
}
// 대기시간 입력: 남은 시간만 입력
const regWait=()=>`<div class="box timebox" role="group" aria-label="남은 시간 입력"><p class="sub c">식당에서 안내받은 남은 시간</p><div class="stp"><button data-adj="-10" aria-label="10분 줄이기">−</button><div class="big2" aria-live="polite">${fm(S.wait)}</div><button data-adj="10" aria-label="10분 늘리기">+</button></div>
<div class="row ctr">${[30,60,90,120,180].map(m=>`<button class="chip ${S.wait==m?'on':''}" data-wait="${m}">${fm(m)}</button>`).join('')}</div></div>`;
const nearSeoul=()=>dkm(S.loc,{lat:37.5665,lng:126.978})<35;
const reg=()=>frame(`${S.active?note('주의','진행 중인 웨이팅이라 위치는 바꿀 수 없어요.'):''}<h2>웨이팅 장소</h2>
<div class="locwrap"><div class="locmap" id="locmap"></div><button class="locbtn" data-geo="1" ${S.active?'disabled':''} aria-label="현재 위치로 이동">📍</button></div>
${!nearSeoul()?'<p class="sub err mt">서울 밖이에요. 지금은 서울 지역 장소만 있어요. 위치를 서울로 지정해주세요.</p>':''}
<div class="box how"><div class="how-h"><span class="sub">선택한 위치</span><b>${esc(S.area)}${S.area=='선택한 위치'?'':' 부근'}</b></div>
<ul><li>지도를 누르거나 빨간 핀을 끌어 식당 위치를 지정해요</li><li>오른쪽 위 위치 버튼으로 내 위치를 불러올 수 있어요</li></ul></div>`,
`<button class="btn" data-go="wait">다음 · 대기시간 입력 →</button>`);

const waitScr=()=>frame(`<button class="back" data-go="reg">← 위치 다시 지정 (${esc(S.area)})</button>
${S.active?note('주의','진행 중에 시간을 바꾸면 남은 시간이 새로 계산돼요.'):note('안내','식당에서 안내받은 남은 시간을 입력하세요. 시간에 비례해 다녀올 수 있는 반경이 정해져요.')}<h2>대기시간 입력</h2>
${regWait()}
<div class="box cur res" aria-live="polite"><p class="sub c">복귀 목표 시각</p><div class="big2">${f2(base()+S.wait)}</div><p class="sub c mt">반경 약 <b class="ink">${radTxt()}</b> 안에서 갈 수 있는 곳 <b class="ink">${avail(true)}곳</b> · ${esc(S.area)} 기준</p>${avail(true)?'':'<p class="sub err c mt">대기시간이 짧아 다녀올 수 있는 곳이 없어요. 시간을 늘려보세요.</p>'}</div>`,
`<button class="btn" data-go="${S.active?(S.sel.length?'prog':'map'):'map'}">${S.active?'적용하고 돌아가기 →':'지도에서 코스 만들기 →'}</button>`);

/* ---------- 지도 ---------- */
// 카카오 지도 화면: 지도에 보이는 범위의 장소를 모두 핀으로 그린다 (원 없음). 핀 모양은 웨이팅 장소 선택 핀과 같은 물방울
const KM={el:null,map:null,ov:[],line:null,key:'',vb:null,t:null};
let panNext=false;
const mkey=()=>S.loc.lat+','+S.loc.lng+'|'+S.wait;
const PIN='<svg viewBox="0 0 30 42" aria-hidden="true"><path class="bd" d="M15 1.2C7.4 1.2 1.2 7.3 1.2 14.9c0 10.2 13.8 25.9 13.8 25.9s13.8-15.7 13.8-25.9C28.8 7.3 22.6 1.2 15 1.2z"/><path class="hl" d="M6.2 11.5C7.4 6.9 11 4.4 15 4.4"/><circle class="in" cx="15" cy="15" r="9.6"/></svg>';
function kpin(k){
 const p=P[k],i=S.sel.indexOf(k),on=i>=0,ri=inRad(k),o=!on&&ri&&!fit(k),b=document.createElement('button');
 b.className='kp '+(on?'on':ri?'in':'out')+(o?' off':'')+(S.focus===k?' f':'');
 if(on)b.style.setProperty('--pc',colr(i));else if(ri&&!o)b.style.setProperty('--pc',CC[p.c]||'#475467');
 b.dataset.n=p.n;b.dataset.focus=k;
 b.setAttribute('aria-label',p.c+' '+p.n+' 도보 '+tt(k)+'분'+(on?' 담음':o?' 시간 부족':ri?'':' 반경 밖'));
 b.innerHTML=PIN+`<span class="pe">${ico(p.c)}</span>`+(on?`<i class="nb">${i+1}</i>`:'');
 b.addEventListener('click',e=>{e.stopPropagation();S.focus=k;S.top=1;draw()});
 return b}
function kLayers(){
 if(!KM.map)return;
 KM.ov.forEach(o=>o.setMap(null));KM.ov=[];
 if(KM.line){KM.line.setMap(null);KM.line=null}
 const c=kLL(S.loc.lat,S.loc.lng);
 if(S.sel.length){
  KM.line=new kakao.maps.Polyline({path:[c,...S.sel.map(k=>kLL(P[k].lat,P[k].lng)),c],strokeWeight:3,strokeColor:'#222',strokeOpacity:.8,strokeStyle:'shortdash'});
  KM.line.setMap(KM.map)}
 const add=(el,pos,z)=>{const o=new kakao.maps.CustomOverlay({position:pos,content:el,xAnchor:.5,yAnchor:1,zIndex:z,clickable:true});o.setMap(KM.map);KM.ov.push(o)};   // 핀 끝(아래 가운데)이 좌표
 list().forEach(k=>add(kpin(k),kLL(P[k].lat,P[k].lng),S.focus===k?9:S.sel.includes(k)?7:inRad(k)?5:3));
 const me=document.createElement('div');me.className='kp me';me.innerHTML=PIN+`<span class="pe">${TGT}</span>`;me.setAttribute('aria-label','웨이팅 장소');
 add(me,c,20);
}
function readView(){if(!KM.map)return;const b=KM.map.getBounds(),a=b.getSouthWest(),z=b.getNorthEast();KM.vb={s:a.getLat(),w:a.getLng(),n:z.getLat(),e:z.getLng()}}
// 위치·대기시간이 바뀐 때: 반경(km)이 한눈에 들어오도록 확대/축소 (이후엔 사용자가 자유롭게 조절)
function fitRadius(){const r=RAD(),dLat=r/111.32,dLng=r/(111.32*Math.cos(S.loc.lat*Math.PI/180));
 KM.map.setBounds(new kakao.maps.LatLngBounds(kLL(S.loc.lat-dLat,S.loc.lng-dLng),kLL(S.loc.lat+dLat,S.loc.lng+dLng)))}
// 지도 범위가 바뀌면(확대/축소/이동) 핀과 목록을 다시 계산. 입력창은 다시 그리지 않음
function refreshMap(){
 if(!document.getElementById('kmap'))return;
 kLayers();const sl=document.getElementById('sheetlist'),ct=document.getElementById('cnt');
 if(sl)sl.innerHTML=sheetList();if(ct)ct.textContent=cntTxt();
}
function mountKakaoMap(){
 const ph0=document.getElementById('kmap');if(!ph0)return;
 if(!kLoad(()=>{
  const ph=document.getElementById('kmap');if(!ph)return;
  if(!KM.el){KM.el=document.createElement('div');KM.el.className='lmap'}
  ph.appendChild(KM.el);
  if(!KM.map){
   KM.map=new kakao.maps.Map(KM.el,{center:kLL(S.loc.lat,S.loc.lng),level:5});
   KM.map.addControl(new kakao.maps.ZoomControl(),kakao.maps.ControlPosition.RIGHT);
   kakao.maps.event.addListener(KM.map,'idle',()=>{clearTimeout(KM.t);KM.t=setTimeout(()=>{if(!document.getElementById('kmap'))return;readView();refreshMap()},80)});
  }
  const keep=KM.map.getCenter();KM.map.relayout();KM.map.setCenter(keep);
  if(KM.key!==mkey()){KM.key=mkey();fitRadius()}
  readView();
  if(panNext&&S.focus!=null&&P[S.focus]){panNext=false;if(!inView(S.focus))KM.map.panTo(kLL(P[S.focus].lat,P[S.focus].lng))}   // 검색 결과가 화면 밖이면 그 장소로 이동
  refreshMap();
 }))kFail(ph0);
}
// 장소 상세 (행을 누르면 아래로 펼침): 주소 · 전화 · 운영/휴무(공휴일 포함) · 도보 시간(참고)
const dtl=k=>{const p=P[k],tel=safeTel(p.tel),isL=p.c=='도서관',h=isL&&p.hours?p.hours.holiday:null,fv=S.favs.includes(k),
 op=(isL?libInfo(p):'')||TIP[p.c]||'영업시간·휴무는 방문 전에 확인하세요';
 return `<div class="dti" role="region" aria-label="${esc(p.n)} 상세 정보"><p>🚶 도보 약 ${tt(k)}분 (참고)</p><p>📍 ${p.addr?esc(p.addr):'주소 정보 없음'}</p><p>📞 ${tel?`<a href="tel:${tel}">${esc(p.tel)}</a>`:'전화번호 정보 없음'}</p><p>🕒 ${esc(op)}</p>${h&&typeof h=='object'&&h.open?`<p>🗓 공휴일 ${esc(h.open)}–${esc(h.close)}</p>`:''}<div class="acts"><a class="lk" href="${esc(kakaoLink(k))}" target="_blank" rel="noopener noreferrer">길찾기</a><button class="lk" data-fav="${k}" aria-pressed="${fv}">${fv?'♥ 관심 공간 저장됨':'♡ 관심 공간 저장'}</button></div></div>`};
// 관심 공간 하트 버튼 (마이페이지 '관심 공간'에 저장/해제)
const heart=k=>{const fv=S.favs.includes(k);return `<button class="hb ${fv?'on':''}" data-fav="${k}" aria-pressed="${fv}" aria-label="${esc(P[k].n)} 관심 공간 ${fv?'해제':'저장'}">${fv?'♥':'♡'}</button>`};
const row=k=>`<div data-row="${k}"><div class="lr${S.focus===k?' f':''}"><button class="lrn" data-focus="${k}" aria-expanded="${S.focus===k}">${cb(P[k].c)}<span class="tx"><b>${esc(P[k].n)}</b><span class="sub">도보 ${tt(k)}분</span></span></button>${heart(k)}${addBtn(k)}</div>${S.focus===k?dtl(k):''}</div>`;
const sheetList=()=>{
 if(!P.length)return `<div class="hint">${loadError?'데이터를 불러오지 못했어요.<br>로컬 서버(또는 GitHub Pages)에서 열어주세요.':'장소를 불러오는 중이에요…'}</div>`;
 const l=list();return l.length?`<div>${l.map(row).join('')}</div>`:`<div class="hint">${S.cats.length==1&&S.cats[0]=='카페'&&!P.some(p=>p.c=='카페')?'카페 정보를 준비 중이에요.':'지도에 보이는 범위에 맞는 장소가 없어요.<br>지도를 축소하거나 필터를 바꿔보세요.'+(S.onow?'<br>영업 정보가 있는 장소만 표시돼요.':'')}</div>`};
const cntTxt=()=>{const l=list();return `${l.length}곳 · 반경 ${radTxt()} 안 ${l.filter(inRad).length}곳`};
const refreshSearch=refreshMap;
const cfm=()=>!S.sel.length?{t:'장소를 1곳 이상 담아주세요',d:true}:rem()<0?{t:`체류 시간을 줄여주세요 (${fm(-rem())} 초과)`,d:true}:{t:`코스 확인 (${S.sel.length}곳 · ${fm(total())}) →`,d:false};
// 코스 수정 중인지 (저장된 코스를 불러와 고치는 중)
const editing=()=>S.editId!=null&&S.courses.some(c=>c.id==S.editId);
const mapBack=()=>{   // 장소 담는 화면의 '뒤로': 온 곳으로 돌아감
 const t=S.mback=='confirm'?'confirm':S.active?(S.sel.length?'prog':'home'):editing()?'mc':'wait';
 const L={confirm:'코스 확인',prog:'진행 화면',home:'홈',mc:'코스 상세',wait:'대기시간 입력'}[t];
 return `<button class="back mb" data-go="${t}" aria-label="뒤로 가기 · ${L}">← ${L}</button>`};
const map=()=>{const c=cfm(),ed=editing();
 if(KM.key!==mkey())KM.vb=null;   // 위치·대기시간이 바뀐 직후엔 예전 지도 범위를 쓰지 않음
 const sec=S.active?(S.sel.length?'<button class="btn g" data-go="prog">진행 화면으로</button>':'<button class="btn g" data-go="home">홈으로</button>'):ed?`<button class="btn g" data-cid="${S.editId}">코스 상세로</button>`:'';
 const main=`<button class="btn" id="cfm" data-go="confirm" ${c.d?'disabled':''}>${esc(sec&&!c.d?`코스 확인 (${S.sel.length}곳) →`:c.t)}</button>`;
 return frameM(`${mapBack()}${note('안내','핀을 눌러 장소를 담아보세요. 진한 핀은 대기시간 반경 안이에요.')}<input class="in" id="q" type="search" placeholder="장소 이름 검색 (예: 낫저스트북스)" value="${esc(S.q)}" autocomplete="off" aria-label="장소 이름 검색">
<div class="mapx" id="kmap"></div>`,
`${catRow()}
<div id="sheetlist">${sheetList()}</div>`,
 sec?`<div class="duo">${main}${sec}</div>`:main)};

/* ---------- 코스 확인 ---------- */
// 코스 전체 길찾기 (웨이팅 장소 출발 → 담은 장소 경유 → 웨이팅 장소 복귀, 도보). 경로는 자동 입력됨
// 1) 구글지도: 웹 주소라 PC·휴대폰 어디서나 바로 경로가 보임 (경유지 최대 9곳)
// 2) 네이버지도: 휴대폰 앱 전용 (경유지 최대 5곳)
const gUrl=()=>{const l=S.loc,o=l.lat+','+l.lng,w=S.sel.slice(0,9).map(k=>P[k].lat+','+P[k].lng).join('|');
 return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${o}${w?'&waypoints='+encodeURIComponent(w):''}&travelmode=walking`};
function openNaver(){
 const l=S.loc,v=S.sel.slice(0,5),q=encodeURIComponent,nm_=q(S.rest||'웨이팅 장소'),app=q(location.origin&&location.origin!='null'?location.origin:'zerocha');
 let u=`route/walk?slat=${l.lat}&slng=${l.lng}&sname=${nm_}&dlat=${l.lat}&dlng=${l.lng}&dname=${nm_}`;
 v.forEach((k,i)=>{u+=`&v${i+1}lat=${P[k].lat}&v${i+1}lng=${P[k].lng}&v${i+1}name=${q(P[k].n)}`});
 u+=`&appname=${app}`;
 const ua=navigator.userAgent||'';
 if(S.sel.length>5)toast('네이버지도는 경유지가 5곳까지라 앞의 5곳만 열려요');
 if(/Android/i.test(ua))location.href=`intent://${u}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;S.browser_fallback_url=${q(gUrl())};end`;   // 앱이 없으면 구글지도로
 else if(/iPhone|iPad|iPod/i.test(ua)){const t=Date.now();location.href='nmap://'+u;setTimeout(()=>{if(Date.now()-t<2000)location.href=gUrl()},1500)}
 else{toast('네이버지도는 휴대폰 앱에서 열려요. PC에서는 구글지도를 이용해주세요');draw()}
}
// 길찾기 앱 선택 시트 (진행 화면)
const routeSheet=()=>!S.rsheet||S.i!='prog'||!S.sel.length?'':`<div class="rs" role="dialog" aria-modal="true" aria-label="길찾기 앱 선택"><button class="rs-bg" data-rclose="1" aria-label="닫기"></button><div class="rs-p"><h3>길찾기 열기</h3><p class="sub">${esc(S.rest)} → ${S.sel.map(k=>esc(P[k].n)).join(' → ')} → 복귀<br>경로가 자동으로 입력돼요 (도보)</p>
<a class="rs-o" href="${esc(gUrl())}" target="_blank" rel="noopener noreferrer"><b>구글지도</b><span class="sub">PC·휴대폰 모두 가능 · 경유지 ${Math.min(S.sel.length,9)}곳 전체 입력</span></a>
<button class="rs-o" data-nav="1"><b>네이버지도 앱</b><span class="sub">휴대폰에서 열려요 · 경유지 최대 5곳</span></button>
<button class="btn g mt" data-rclose="1">닫기</button></div></div>`;
const tline=(sel,stm,ar,w,nav)=>{let t=base();
 const r=(tm,name,sub,cls,go,sty)=>`<div class="${cls||''}${go?' hasgo':''}"${sty?` style="${sty}"`:''}><b class="tm">${f2(tm)}</b><span class="tx2"><b>${name}</b>${sub?`<span class="sub">${sub}</span>`:''}</span>${go?`<a class="lk go" href="${esc(go)}" target="_blank" rel="noopener noreferrer">길찾기</a>`:''}</div>`;
 let h='<div class="tl">'+r(t,'식당에서 출발','','s');
 sel.forEach((k,i)=>{const a=ttx(k,ar),st=sx(k,stm,w);t+=a;h+=r(t,esc(P[k].n),`도보 ${a}분 이동 · 체류 ${st}분`,'pl',null,'--pc:'+colr(i));t+=st+a});   // 도보·체류는 한 줄
 const last=sel.length?ttx(sel[sel.length-1],ar):0;
 return [h+r(t,'식당 복귀',sel.length?`도보 ${last}분 이동`:'','m')+'</div>',t]};
// 코스 확인(수정): 어디서 왔는지(S.from)에 따라 '돌아가기'가 지도 / 진행 화면 / 코스 상세로 이어진다
const BK={prog:'← 진행 화면으로',mc:'← 코스 상세로',map:'← 지도에서 장소 수정'};
const confirmScr=()=>{const [h]=tline(S.sel,S.stay,S.loc),r=rem(),ed=editing(),dis=r<0||!S.sel.length?'disabled':'',
 bf=(S.from=='prog'&&S.active)||(S.from=='mc'&&ed&&!S.active)?S.from:'map';
 return frame(`<button class="back" data-go="${bf}">${BK[bf]}</button>
${note('참고','⋮⋮로 순서를 바꾸고 체류 시간을 조절하세요. 이동시간은 도보 기준 참고값이에요.')}<h2>오늘의 0차 코스</h2>${ringBar()}

<div id="order">${S.sel.map((k,j)=>`<div class="pc2"><button class="ib sm dh" data-drag="${j}" aria-label="${esc(P[k].n)} 순서 변경 (끌어서 이동, 위·아래 방향키도 가능)">⋮⋮</button><span class="dot sm" style="background:${colr(j)}">${j+1}</span>${cb(P[k].c)}<h3 class="nm">${esc(P[k].n)}</h3><div class="st"><button class="ib sm" data-st="${k}:-10" ${stay(k)<=dstay()?'disabled':''} aria-label="체류 10분 줄이기">−</button><b>${stay(k)}분</b><button class="ib sm" data-st="${k}:10" ${stay(k)>=240?'disabled':''} aria-label="체류 10분 늘리기">+</button></div><button class="ib sm" data-rm="${k}" aria-label="${esc(P[k].n)} 빼기">✕</button></div>`).join('')||'<div class="box sub">담은 장소가 없어요</div>'}</div>
<button class="btn g mt" data-go="map">＋ 다른 장소 더 담기 (지도)</button>
${h}<div class="box ${r<0?'errbox':''}"><span class="sub">복귀 여유</span> <b>${r<0?'⚠ '+fm(-r)+' 초과 — 체류를 줄이거나 장소를 빼주세요':fm(r)}</b></div>`,
 S.active?`<button class="btn" data-apply="1" ${dis}>수정 완료 · 진행 화면으로</button>`
 :`<button class="btn" data-start="1" ${dis}>코스 시작하기</button><button class="btn g mt" data-later="1" ${S.sel.length?'':'disabled'}>${ed?'수정 내용 저장':'시작 없이 마이페이지에 저장'}</button>`)};

/* ---------- 진행 / 완료 ---------- */
const prog=()=>{
 if(!S.sel.length)return frame(`<h2>진행 중인 코스가 없어요</h2><div class="box sub c">지도에서 갈 곳을 담아 코스를 만들어보세요.</div>`,`<button class="btn" data-go="map">지도에서 코스 만들기 →</button>`);
 const [h]=tline(S.sel,S.stay,S.loc),b=banner(),si=stageInfo(),r=rem();
 return frame(`<p class="sub">${esc(S.rest)} · ${S.area}</p>
<div class="rtop"><p class="rt"><b class="rt1">${backAt()}까지 복귀</b><span class="rt2" data-cd="left">${leftTxt()}</span></p><button class="chipb" data-wadj="1" aria-expanded="${S.wadj}">대기시간 조정</button></div>
${S.wadj?`<div class="adj" role="group" aria-label="대기시간 조절"><button data-live="-10" aria-label="대기시간 10분 줄이기">−10분</button><span>대기시간</span><button data-live="10" aria-label="대기시간 10분 늘리기">+10분</button></div>`:''}
<div class="nowc ${b.c}" data-cd="hero"><span class="nk">지금</span><b class="nt" data-cd="st1">${esc(si.t)}</b><span class="ns" data-cd="st2">${esc(si.s)}</span>
<button class="btn rbtn" data-route="1"><svg class="ic2" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M6 15.8V10a4 4 0 0 1 4-4h5.8"/></svg>길찾기</button></div>
<div class="bn ${b.c}" data-cd="banner" role="status" ${b.c=='ok'?'hidden':''}>${esc(b.t)}</div>
<div class="slk"><span>복귀 여유</span><b class="${r<0?'err':''}">${r<0?'⚠ '+fm(-r)+' 초과':fm(r)}</b></div>
<div class="rth"><h3>오늘의 코스</h3></div>
${h}
<div class="duo"><button class="btn g" data-go="confirm">✎ 순서·체류 수정</button><button class="btn g" data-go="map">＋ 장소 더 담기</button></div>`,
 `<button class="btn" data-finish="1">식당 도착 · 코스 종료</button>`)};
const done=()=>{const F=S.fin||{n:0,use:0,rest:0,names:[],cid:null,wait:0};
 return frame(`${note('안내','코스가 마이페이지 \'내 코스\'에 보관됐어요. 언제든 다시 시작하거나 수정할 수 있어요.')}<h2>0차 완료</h2><p class="sub">남은 대기 시간을 알차게 보냈어요.</p>
<div class="box"><div class="row stats"><div><span class="sub">방문</span><br><b>${F.n}곳</b></div><div><span class="sub">활용</span><br><b>${fm(F.use)}</b></div><div><span class="sub">복귀 여유</span><br><b>${fm(F.rest)}</b></div></div></div>
<div class="box"><h3 class="c">오늘의 코스</h3>${F.names.length?`<ol class="dcs">${F.names.map((n,i)=>`<li><span class="dot" style="background:${colr(i)}">${i+1}</span><b>${esc(n)}</b></li>`).join('')}</ol>`:'<p class="sub">—</p>'}</div>
<button class="btn g mt" data-share="1">코스 공유하기</button>`,
 `<button class="btn" data-go="my">내 코스 보러가기</button><button class="btn g mt" data-go="home">홈으로</button>`)};

/* ---------- 마이페이지 ---------- */
// 마이페이지: 코스를 원형 타이머로 표시 (선택 순서별 색 호 + 가운데 코스 소요 시간, 남은 구간은 복귀 여유)
const cring=c=>{const R=48,C=2*Math.PI*R,w=c.wait,lc=locOf(c),cs=c.sel.map(k=>ttx(k,lc)*2+sx(k,c.stay,w)),tot=cs.reduce((a,b)=>a+b,0),over=tot>w;let acc=0;
 const segs=over?`<circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--err)" stroke-width="12"/>`:cs.map((m,j)=>{const len=Math.min(m/w*C,C-acc),g=len>4?1.5:0,o=-acc;acc+=len;return `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${colr(j)}" stroke-width="12" stroke-dasharray="${Math.max(len-g,0)} ${C}" stroke-dashoffset="${o}"/>`}).join('');
 return `<div class="rbc cr" role="img" aria-label="대기 ${fm(w)} 중 코스 ${fm(tot)}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--fill)" stroke-width="12"/><g transform="rotate(-90 60 60)">${segs}</g></svg><div class="rbt"><span class="sub">소요</span><b class="${over?'ov':''}">${tot}<small>분</small></b></div></div>`};
// 마이페이지 코스 카드: 한 행에 [원형 타이머 | 제목·날짜·대기 | 장소 목록] — 공백 없이 한눈에 보이게
const ccard=(c,i)=>{const vis=c.sel.slice(0,4),more=c.sel.length-vis.length;
 return `<button class="cc2" data-cid="${c.id}" aria-label="코스 ${i+1} 상세 보기"><span class="cc2-ring">${cring(c)}</span><span class="cc2-info"><b class="cc2-t">코스 ${i+1}</b><span class="sub">${esc(c.date)} · ${esc(c.area||'성수동')}</span><span class="sub">대기 ${fm(c.wait)} · ${c.sel.length}곳</span></span>`+
 `<span class="cc2-pl">${vis.map((k,j)=>`<span class="cc2-p"><i class="dot sm" style="background:${colr(j)}">${j+1}</i><span class="nm">${esc(P[k].n)}</span></span>`).join('')}${more>0?`<span class="sub cc2-m">외 ${more}곳</span>`:''}</span></button>`};
// 관심 공간: 간략 주소(구 + 도로명 + 번호) · 필터는 지도 아래 필터와 같은 형태 (상태는 지도와 별도)
const shortAddr=a=>String(a||'').replace(/\([^)]*\)/g,'').replace(/^서울(특별시|시)?\s*/,'').trim().split(/\s+/).slice(0,3).join(' ');
const favList=()=>{const b=S.favs.filter(k=>(!S.fcats.length||S.fcats.includes(P[k].c))&&(!S.fonow||isOpen(k)===true));
 b.sort(byDist);
 if(S.fsort=='def')b.sort((x,y)=>CAT_ORDER.indexOf(P[x].c)-CAT_ORDER.indexOf(P[y].c)||byDist(x,y));
 else if(S.fsort=='pop')b.sort((x,y)=>(P[y].pop||0)-(P[x].pop||0)||byDist(x,y));
 return b};
const fcatLbl=()=>!S.fcats.length?'장소':'장소 · '+S.fcats[0]+(S.fcats.length>1?' 외 '+(S.fcats.length-1):'');
const favRow=()=>`<div class="flt" role="group" aria-label="관심 공간 필터"><button class="chip ${S.fcats.length||S.fcatOpen?'on':''}" data-fcatmenu="1" aria-expanded="${S.fcatOpen}">${esc(fcatLbl())} ${S.fcatOpen?'▴':'▾'}</button><button class="chip ${S.fonow?'on':''}" data-fonow="1" aria-pressed="${S.fonow}">영업중</button><select class="srt" id="fsort" aria-label="정렬"><option value="def" ${S.fsort=='def'?'selected':''}>기본순</option><option value="near" ${S.fsort=='near'?'selected':''}>거리 가까운 순</option><option value="pop" ${S.fsort=='pop'?'selected':''}>인기순</option></select></div>
${S.fcatOpen?`<div class="catp"><div class="row cats" role="group" aria-label="장소 카테고리 (여러 개 선택 가능)"><button class="chip ${S.fcats.length?'':'on'}" aria-pressed="${!S.fcats.length}" data-fcat="">전체</button>${CATS4.map(c=>`<button class="chip ${S.fcats.includes(c)?'on':''}" aria-pressed="${S.fcats.includes(c)}" data-fcat="${c}">${CE[c]} ${c}</button>`).join('')}</div></div>`:''}`;
const favItem=k=>{const ad=shortAddr(P[k].addr);return `<div class="pc">${cb(P[k].c)}<div><h3>${esc(P[k].n)}</h3><p class="sub">${esc(P[k].c)}${ad?' · '+esc(ad):''}</p></div><button class="add" data-fav="${k}">♥ 해제</button></div>`};
const my=()=>frame(`${note('안내','만든 코스와 하트(♡)로 저장한 공간을 모아봐요. 코스를 눌러 수정하거나 다시 시작할 수 있어요.')}<h2>마이페이지</h2><p class="sub">내가 만든 코스와 저장한 공간</p><div class="seg"><button class="${S.seg=='c'?'on':''}" data-seg="c">내 코스 ${S.courses.length}</button><button class="${S.seg=='f'?'on':''}" data-seg="f">관심 공간 ${S.favs.length}</button></div>`+
(S.seg=='c'?(S.courses.length?`<div class="clist">${S.courses.map(ccard).join('')}<button class="cc2 new" data-go="reg" aria-label="새 코스 만들기"><span class="nw" aria-hidden="true">+</span><span class="cc2-info"><b class="cc2-t">새 코스 만들기</b><span class="sub">웨이팅 등록하기</span></span></button></div>`:'<div class="box sub c">보관된 코스가 없어요.<br>등록 탭에서 만들어보세요.</div>')
:(S.favs.length?favRow()+(favList().length?favList().map(favItem).join(''):'<div class="box sub c">조건에 맞는 관심 공간이 없어요.<br>필터를 바꿔보세요.</div>'):'<div class="box sub c">지도 장소 목록의 ♡를 눌러 저장해보세요.</div>')));
// 코스 상세: 하단은 '다시 시작(주) + 장소 바꾸기' 한 줄. 삭제는 자주 쓰지 않으므로 본문 맨 아래로
const mc=()=>{const c=S.courses.find(x=>x.id==S.cid);if(!c)return my();const [h]=tline(c.sel,c.stay,locOf(c),c.wait);
 return frame(`<button class="back" data-go="my">← 내 코스</button>${note('참고','저장 당시 대기시간 기준이에요. 장소·순서·체류 시간을 수정하거나 이 코스로 다시 시작할 수 있어요.')}<h2 class="mt">코스 ${S.courses.indexOf(c)+1}</h2><p class="cs-r">${title(c)}</p><p class="sub">${esc(c.date)} · ${esc(c.area||'성수동')}</p>
<div class="row nowrap"><div class="box mini"><span class="sub">대기</span><br><b>${fm(c.wait)}</b></div><div class="box mini"><span class="sub">코스</span><br><b>${fm(ctot(c))}</b></div><div class="box mini"><span class="sub">도보 왕복</span><br><b>${fm(cwalk(c))}</b></div></div>${h}<button class="dl" data-del="${c.id}">이 코스 삭제</button>`,
 `<div class="duo w32"><button class="btn" data-redo="${c.id}">이 코스로 다시 시작</button><button class="btn g" data-edit="${c.id}">장소 바꾸기</button></div>`)};

/* ---------- 렌더 ---------- */
const SC={home,reg,wait:waitScr,map,confirm:confirmScr,prog,done,my,mc};
let lastScr=null;
function draw(){
 const root=document.getElementById('phone'),sc=root.querySelector('.body,.sheet');
 const keep=S.i===lastScr&&sc?sc.scrollTop:0,jump=S.top;          // 버튼을 눌러도 스크롤 위치 유지 (기존엔 맨 위로 튐)
 root.innerHTML=SC[S.i]();if(S.i==='reg')mountLocMap();else if(S.i==='map')mountKakaoMap();
 const n=root.querySelector('.body,.sheet');if(n)n.scrollTop=keep;
 if(S.i==='map'&&jump&&S.focus!=null){const r=root.querySelector('[data-row="'+S.focus+'"]');if(r)r.scrollIntoView({block:'nearest'})}
 lastScr=S.i;S.top=0;save();
}
const clampWait=w=>Math.min(240,Math.max(30,w));
// 저장된 코스를 불러와 수정 모드로 (위치·대기시간·장소·체류 시간 복원)
function loadCourse(c){S.sel=[...c.sel];S.stay={...c.stay};S.wait=c.wait;{const l=locOf(c);S.loc={lat:l.lat,lng:l.lng};S.area=c.area||areaLabel(S.loc);GC.clear();recenter=true}S.editId=c.id;S.cid=c.id;S.from='mc'}
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-cid]'),t=c||e.target.closest('button');
 if(!t||t.disabled)return;const d=t.dataset,has=k=>d[k]!==undefined;
 if(has('go')){S.rsheet=false;if(d.go=='reg')S.editId=null;if(d.go=='map')S.mback=S.i;if(d.go=='confirm')S.from=S.i;S.i=(d.go=='prog'&&!S.active)?'home':d.go}
 else if(has('cid')){S.cid=+d.cid;S.i='mc'}
 else if(has('tog')){const k=+d.tog;if(S.sel.includes(k)){S.sel=S.sel.filter(x=>x!=k);delete S.stay[k]}else S.sel=[...S.sel,k]}
 else if(has('hcat')){if(S.active){toast('진행 중인 코스가 있어요. 먼저 종료해주세요');draw();return}S.cats=[d.hcat];S.i='reg'}
 else if(has('pop')){S.mback=null;if(S.active){toast('진행 중인 코스가 있어요. 먼저 종료해주세요');draw();return}const[cs,w]=d.pop.split('|');S.wait=+w;S.from='map';resetBuild();
  cs.split(',').forEach(cat=>{const k=P.map((p,i)=>i).filter(i=>P[i].c==cat&&!S.sel.includes(i)&&inRad(i)&&cost(i)<=rem()-BUF).sort(byDist)[0];if(k!=null)S.sel.push(k)});
  if(S.sel.length)S.i='confirm';else{S.i='map';toast('조건에 맞는 장소를 찾지 못했어요')}}
 else if(has('geo')){
  if(!navigator.geolocation){toast('이 브라우저에서는 위치를 지원하지 않아요');draw();return}
  navigator.geolocation.getCurrentPosition(p=>{moveTo(p.coords.latitude,p.coords.longitude,true);draw()},()=>{toast('위치를 가져오지 못했어요. 지도를 눌러 직접 지정해주세요');draw()},{enableHighAccuracy:true,timeout:8000});
  return}
 else if(has('cat')){if(!d.cat)S.cats=[];else S.cats=S.cats.includes(d.cat)?S.cats.filter(x=>x!=d.cat):[...S.cats,d.cat]}
 else if(has('catmenu'))S.catOpen=!S.catOpen;
 else if(has('favgo')){S.rsheet=false;S.seg='f';S.i='my'}
 else if(has('fcat')){if(!d.fcat)S.fcats=[];else S.fcats=S.fcats.includes(d.fcat)?S.fcats.filter(x=>x!=d.fcat):[...S.fcats,d.fcat]}
 else if(has('fcatmenu'))S.fcatOpen=!S.fcatOpen;
 else if(has('fonow'))S.fonow=!S.fonow;
 else if(has('onow'))S.onow=!S.onow;
 else if(has('view'))S.view=d.view;
 else if(has('wait')){S.wait=+d.wait;if(!S.active)prune()}
 else if(has('adj')){S.wait=clampWait(S.wait+ +d.adj);if(!S.active)prune()}
 else if(has('wadj'))S.wadj=!S.wadj;
 else if(has('live')){S.wait=Math.min(300,Math.max(10,S.wait+ +d.live));toast(`대기시간을 ${d.live>0?'+':'−'}10분 조정했어요 · 복귀 ${backAt()}`)}
 else if(has('focus')){if(S.focus===+d.focus&&t.closest('.lr'))S.focus=null;else{S.focus=+d.focus;S.top=1;panNext=true}}   // 행을 다시 누르면 상세 접기
 else if(has('fav')){const k=+d.fav,had=S.favs.includes(k);S.favs=had?S.favs.filter(x=>x!=k):[...S.favs,k];toast(had?'관심 공간에서 뺐어요':'관심 공간에 저장했어요 · 마이페이지에서 볼 수 있어요')}
 else if(has('st')){const[k,m]=d.st.split(':').map(Number);S.stay[k]=Math.min(240,Math.max(dstay(),stay(k)+m))}
 else if(has('rm'))S.sel=S.sel.filter(x=>x!=+d.rm);
 else if(has('start')){S.curId=saveCourse();S.active=true;S.start=Date.now();S.i='prog'}
 else if(has('route'))S.rsheet=true;
 else if(has('rclose'))S.rsheet=false;
 else if(has('nav')){openNaver();return}
 else if(has('apply')){S.curId=saveCourse();S.i='prog';toast('코스를 수정했어요')}   // 진행 중 코스 수정 완료 → 진행 화면으로
 else if(has('later')){const ed=editing(),id=saveCourse();resetBuild();if(ed){S.cid=id;S.i='mc';toast('수정한 코스를 저장했어요')}else{S.seg='c';S.i='my';toast('내 코스에 저장했어요')}}
 else if(has('finish')){S.rsheet=false;S.wadj=false;if(S.editId!=null)saveCourse();S.fin={n:S.sel.length,use:Math.min(total(),S.wait),rest:Math.max(rem(),0),names:nm(S.sel),cid:S.curId,wait:S.wait};S.active=false;S.start=null;resetBuild();S.i='done'}
 else if(has('share')){const txt=`0차 코스 · ${(S.fin&&S.fin.names||[]).join(' → ')} (대기 ${fm(S.fin?S.fin.wait:0)})`;
  if(navigator.share)navigator.share({text:txt}).catch(()=>{});
  else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>{toast('코스를 복사했어요');draw()},()=>{});
  else toast('이 브라우저에서는 공유를 지원하지 않아요')}
 else if(has('seg'))S.seg=d.seg;
 else if(has('redo')||has('edit')){if(S.active){toast('진행 중인 코스가 있어요. 먼저 종료해주세요');draw();return}
  const c=S.courses.find(x=>x.id==+(d.redo??d.edit));if(!c)return;loadCourse(c);S.mback=null;S.i=has('edit')?'map':'confirm'}   // 시작 → 코스 확인 / 장소 바꾸기 → 지도
 else if(has('del')){if(!confirm('이 코스를 삭제할까요?'))return;S.courses=S.courses.filter(x=>x.id!=+d.del);S.i='my'}
 else return;
 draw()});
document.addEventListener('input',e=>{
 if(e.target.id=='q'){S.q=e.target.value;refreshSearch()}
});
document.addEventListener('change',e=>{   // 입력을 마치면 범위(5~240)에 맞춰 표시값 정리
 if(e.target.id=='sort'){S.sort=e.target.value;draw();return}
 if(e.target.id=='fsort'){S.fsort=e.target.value;draw();return}
});
/* ---------- 코스 확인: 드래그로 순서 변경 ---------- */
let DR=null;
document.addEventListener('pointerdown',e=>{
 const h=e.target.closest&&e.target.closest('[data-drag]');if(!h||S.i!=='confirm')return;
 const cards=[...document.querySelectorAll('#order .pc2')],j=+h.dataset.drag,el=cards[j];if(!el)return;
 e.preventDefault();
 const rects=cards.map(c=>c.getBoundingClientRect());
 DR={j,el,cards,rects,y0:e.clientY,to:j,id:e.pointerId,gap:cards[1]?rects[1].top-rects[0].bottom:8};
 el.classList.add('drag');cards.forEach((c,i)=>{if(i!==j)c.classList.add('sh')});
 try{h.setPointerCapture(e.pointerId)}catch(_){}
});
document.addEventListener('pointermove',e=>{
 if(!DR||e.pointerId!==DR.id)return;
 const {j,el,cards,rects,gap}=DR,dy=e.clientY-DR.y0,cy=rects[j].top+rects[j].height/2+dy;
 el.style.transform=`translateY(${dy}px)`;
 let to=j;rects.forEach((r,i)=>{if(cy>=r.top&&cy<=r.bottom)to=i});
 if(cy<rects[0].top)to=0;if(cy>rects[rects.length-1].bottom)to=rects.length-1;
 DR.to=to;const sh=rects[j].height+gap;
 cards.forEach((c,i)=>{if(i===j)return;c.style.transform=(j<to&&i>j&&i<=to)?`translateY(${-sh}px)`:(j>to&&i>=to&&i<j)?`translateY(${sh}px)`:''});
});
const dragEnd=e=>{
 if(!DR||e.pointerId!==DR.id)return;
 const {j,to,cards}=DR;DR=null;
 if(e.type=='pointerup'&&to!==j){const [k]=S.sel.splice(j,1);S.sel.splice(to,0,k);draw()}
 else cards.forEach(c=>{c.style.transform='';c.classList.remove('drag','sh')});
};
document.addEventListener('pointerup',dragEnd);document.addEventListener('pointercancel',dragEnd);
document.addEventListener('keydown',e=>{   // 키보드: 핸들에서 ↑↓
 const h=e.target.closest&&e.target.closest('[data-drag]');if(!h||!['ArrowUp','ArrowDown'].includes(e.key))return;
 e.preventDefault();const j=+h.dataset.drag,n=j+(e.key=='ArrowUp'?-1:1);if(n<0||n>=S.sel.length)return;
 [S.sel[j],S.sel[n]]=[S.sel[n],S.sel[j]];draw();const nh=document.querySelector(`[data-drag="${n}"]`);if(nh)nh.focus();
});
draw();
loadPlaces();
setInterval(()=>{if(!S.active)return;document.querySelectorAll('[data-cd]').forEach(el=>{const k=el.dataset.cd;
 if(k=='hms')el.textContent=hms(remSec());
 
 else if(k=='stage')el.textContent=stageTxt();
 else if(k=='left')el.textContent=leftTxt();
 else if(k=='mps')el.textContent=mpSub();
 else if(k=='mpc')el.className='mp '+banner().c;
 else if(k=='st1')el.textContent=stageInfo().t;
 else if(k=='st2')el.textContent=stageInfo().s;
 else if(k=='hero')el.className='nowc '+banner().c;
 else if(k=='banner'){const b=banner();el.className='bn '+b.c;el.textContent=b.t;el.hidden=b.c=='ok'}})},1000);
