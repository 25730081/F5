/* ===== 0차 app.js (v2 · UI/UX 피드백 반영판) =====
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
 */
const AREAS=[
 {n:'성수동',lat:37.5446,lng:127.0557},
 {n:'건대입구',lat:37.5404,lng:127.0692},
 {n:'서울숲',lat:37.5444,lng:127.0374},
 {n:'홍대입구',lat:37.5572,lng:126.9245},
 {n:'강남역',lat:37.4979,lng:127.0276}];
const CAT_ORDER=['서점','도서관','공원','카페','쇼핑'];
const CE={서점:'📚',도서관:'🏛️',공원:'🌳',카페:'☕',쇼핑:'🛍️'};
const MAXPIN=40;          // 지도/목록에 한 번에 보여줄 최대 장소 수
const BUF=10;             // 복귀 여유 시간(분)
const PER_TEAM=5;         // 앞 팀 수 → 대기시간 환산 (팀당 분, 예시 값)
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
  P.push({e:'📍',s:40,...p,j:!!fromJson});
 });
}
function addApiPlaces(list){addPlaces(list,false);draw()}

// 기준 지역 대비 도보 시간(w, 분)·방향(a, 도). 지역별로 계산 후 캐시
const GC=new Map();
const aref=n=>AREAS.find(a=>a.n==n)||AREAS[0];
function geo(k,ar){
 const key=ar+'|'+k;let g=GC.get(key);
 if(!g){
  const R=aref(ar),p=P[k],r=Math.PI/180,cos=Math.cos(R.lat*r),dx=(p.lng-R.lng)*cos,dy=p.lat-R.lat;
  const a=Math.sin((p.lat-R.lat)*r/2)**2+cos*Math.cos(p.lat*r)*Math.sin((p.lng-R.lng)*r/2)**2;
  const km=12742*Math.asin(Math.sqrt(a));
  g={w:Math.max(1,Math.round(km*1.3/4.8*60)),a:Math.atan2(-dy,dx)/r};   // 직선거리×1.3 ÷ 도보 4.8km/h
  GC.set(key,g);
 }
 return g;
}

/* ---------- 상태 + 저장 ---------- */
const KEY='0cha:v2';
const SAVED=(()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}})();
const S={i:'home',wait:120,tr:'도보',cats:[],sel:[],stay:{},focus:null,view:'list',sort:'dist',q:'',start:null,rest:'성수동 맛집 (예시)',area:'성수동',mode:'time',teams:4,fin:null,editId:null,active:false,curId:null,seg:'c',cid:null,favs:[],courses:[],toast:'',top:0};
(function(){const v=SAVED;if(!v||typeof v!='object')return;
 if(Number.isFinite(v.wait))S.wait=Math.min(300,Math.max(10,v.wait));
 if(['도보','대중교통'].includes(v.tr))S.tr=v.tr;
 if(Array.isArray(v.cats))S.cats=v.cats.filter(c=>CAT_ORDER.includes(c));
 if(typeof v.rest=='string')S.rest=v.rest.slice(0,40);
 if(AREAS.some(a=>a.n==v.area))S.area=v.area;
 if(['time','team'].includes(v.mode))S.mode=v.mode;
 if(Number.isFinite(v.teams))S.teams=Math.min(40,Math.max(1,v.teams));
 if(['dist','stay'].includes(v.sort))S.sort=v.sort;
 if(['list','card'].includes(v.view))S.view=v.view;
 if(v.active&&Number.isFinite(v.start)){S.active=true;S.start=v.start}
 if(Number.isFinite(v.editId))S.editId=v.editId;
 if(Number.isFinite(v.curId))S.curId=v.curId;
})();
const nm=a=>a.map(k=>P[k].n);
const nmap=m=>Object.fromEntries(Object.entries(m).filter(([k])=>P[k]).map(([k,v])=>[P[k].n,v]));
function save(){try{localStorage.setItem(KEY,JSON.stringify({wait:S.wait,tr:S.tr,cats:S.cats,rest:S.rest,area:S.area,mode:S.mode,teams:S.teams,sort:S.sort,view:S.view,active:S.active,start:S.start,editId:S.editId,curId:S.curId,sel:nm(S.sel),stay:nmap(S.stay),favs:nm(S.favs),courses:S.courses.map(c=>({...c,sel:nm(c.sel),stay:nmap(c.stay)}))}))}catch(e){}}
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
  const id=n=>P.findIndex(p=>p.n==n),mk=(i,names,wait,date)=>({id:i,sel:names.map(id).filter(k=>k>=0),stay:{},wait,tr:'도보',area:'성수동',date});
  S.courses=[mk(1,['낫저스트북스','서울숲'],120,'10/28'),mk(2,['성수근린공원','공씨책방(성수점)'],90,'10/21')].filter(c=>c.sel.length);
  S.favs=['낫저스트북스'].map(id).filter(k=>k>=0);
 }
 draw();
}

/* ---------- 계산 ---------- */
const ttx=(k,tr,ar)=>{const w=geo(k,ar||S.area).w;return tr=='도보'?w:Math.max(3,Math.round(w*.55))};
const sx=(k,m)=>m[k]??P[k].s;
const tt=k=>ttx(k,S.tr),stay=k=>sx(k,S.stay),cost=k=>tt(k)*2+stay(k);          // cost = 왕복 이동 + 체류
const total=()=>S.sel.reduce((s,k)=>s+cost(k),0),rem=()=>S.wait-total(),fit=k=>cost(k)<=rem()-BUF;
const ctot=c=>c.sel.reduce((s,k)=>s+ttx(k,c.tr,c.area)*2+sx(k,c.stay),0);
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
const RECENT=[{n:'성수동 맛집 (예시)',a:'성수동'},{n:'건대입구 예시 식당',a:'건대입구'},{n:'서울숲 예시 식당',a:'서울숲'}];

// 안전한 링크/전화 (데이터에 이상한 값이 있어도 javascript: 같은 스킴은 막는다)
const safeUrl=u=>{u=String(u||'').trim();if(/^https?:\/\//i.test(u))return u;if(/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(u))return 'https://'+u;return ''};
const safeTel=t=>String(t||'').replace(/[^\d+\-]/g,'').slice(0,20);
const kakao=k=>`https://map.kakao.com/link/to/${encodeURIComponent(P[k].n)},${P[k].lat},${P[k].lng}`;

// 도서관 운영 정보: 실제 휴관일/운영시간 데이터 사용
const DAYS=['일','월','화','수','목','금','토'];
function libInfo(p){
 if(!p.hours)return '';
 const now=new Date(),d=now.getDay(),wk=Math.ceil(now.getDate()/7),h=d==0?p.hours.holiday:d==6?p.hours.saturday:p.hours.weekday;
 const ORD={첫째:1,둘째:2,셋째:3,넷째:4,다섯째:5};
 const cl=String(p.closed||'').replace(/[가-힣]*공휴일/g,'').replace(/\(일요일 제외\)|일요일을 제외한/g,'');
 // 구간별로 요일 + (있다면) 몇째 주인지 확인: "매주 월요일", "첫째 주 화", "매월둘째넷째월요일" 등
 const closedToday=cl.split(/[+,]/).some(seg=>{
  const ords=[...seg.matchAll(/첫째|둘째|셋째|넷째|다섯째/g)].map(m=>ORD[m[0]]);
  const w=seg.replace(/\s/g,'').replace(/첫째|둘째|셋째|넷째|다섯째/g,'').replace(/매[주월]?/g,'').replace(/^주/,'').replace(/주(?=[월화수목금토일])/g,'')[0];
  return w==DAYS[d]&&(!ords.length||ords.includes(wk))});
 return (closedToday?'⚠ 오늘은 휴관일일 수 있어요 · ':'')+(h?`오늘 ${h.open}–${h.close} · `:'')+'휴관 '+(p.closed||'정보 없음');
}
const TIP={서점:'영업시간·휴무는 방문 전에 확인하세요',공원:'대부분 상시 개방이에요 (시설별 운영시간은 다를 수 있어요)',카페:'영업시간은 방문 전에 확인하세요',쇼핑:'영업시간은 방문 전에 확인하세요'};

/* ---------- 토스트 ---------- */
let toastT;
function toast(m){S.toast=m;clearTimeout(toastT);toastT=setTimeout(()=>{S.toast='';const el=document.querySelector('.toast');if(el)el.remove()},3000)}
// 시간/이동수단이 바뀌어 초과되면 뒤에서부터 장소를 빼되, 사용자에게 알려준다
const prune=()=>{const out=[];while(rem()<0&&S.sel.length)out.push(P[S.sel.pop()].n);if(out.length)toast(`시간이 줄어 ${out.join(', ')}을(를) 뺐어요`)};
const resetSel=msg=>{if(S.sel.length){S.sel=[];S.stay={};toast(msg)}S.focus=null};

/* ---------- 진행 단계 ---------- */
const stages=()=>S.sel.flatMap(k=>[{t:`${P[k].e} ${ro(P[k].n)} 이동`,m:tt(k)},{t:`${P[k].n}에서 머무르기`,m:stay(k)},{t:'식당 방향으로 복귀 이동',m:tt(k)}]);
const curStage=()=>{const e=elapsed()/60,st=stages();let c=0;for(let j=0;j<st.length;j++){c+=st[j].m;if(e<c)return j}return st.length};
const stageTxt=()=>{const st=stages(),j=curStage();return !st.length?'등록한 코스가 없어요':j>=st.length?'코스를 모두 마쳤어요 · 식당으로 돌아가요':st[j].t+' · 약 '+st[j].m+'분'};
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
const tabOf=()=>{const i=S.i;if(i=='prog')return S.active?'reg':'home';return {home:'home',done:'home',reg:'reg',map:'reg',confirm:'reg',my:'my',mc:'my'}[i]};
const nav=()=>{const a=tabOf(),go=S.active?(S.sel.length?'prog':'map'):'reg';
 return `<nav class="nav" aria-label="메인 메뉴"><button class="${a=='home'?'on':''}" data-go="home">${IC.home}<span>홈</span></button><button class="reg ${a=='reg'?'on':''}" data-go="${go}">${S.active?IC.route:IC.clock}<span>${S.active?'코스':'등록'}</span></button><button class="${a=='my'?'on':''}" data-go="my">${IC.user}<span>마이페이지</span></button></nav>`};
const hd=()=>`<header class="hd"><span class="logo">◯ 0차</span><button class="pill" data-cd="pill" data-go="${S.active&&S.sel.length?'prog':S.active?'home':'reg'}">${S.active?'⏱ '+hms(remSec()):'⏱ 웨이팅 등록'}</button></header>`;
const toastH=()=>S.toast?`<div class="toast" role="status">${esc(S.toast)}</div>`:'';
const frame=(b,f)=>`${hd()}<main class="body">${b}</main>${f?`<div class="ft">${f}</div>`:''}${nav()}${toastH()}`;
const frameM=(top,sheet,f)=>`${hd()}<main class="mapbody"><div class="mtop">${top}</div><div class="sheet" id="sheet">${sheet}</div></main>${f?`<div class="ft">${f}</div>`:''}${nav()}${toastH()}`;
const bar=()=>{let h='';S.sel.forEach(k=>h+=`<i style="width:${cost(k)/S.wait*100}%">${P[k].e} ${cost(k)}′</i>`);const r=rem();
 return `<div class="bar" role="img" aria-label="${r<0?'대기시간 '+fm(-r)+' 초과':'복귀 여유 '+fm(r)}">${h}<i class="${r<0?'x':'m'}" style="flex:1">${r<0?'⚠ '+fm(-r)+' 초과':'여유 '+fm(r)}</i></div>`};
const cats=()=>CAT_ORDER.filter(c=>P.some(p=>p.c==c));
const catRow=()=>`<div class="row" role="group" aria-label="카테고리 (여러 개 선택 가능)"><button class="chip ${S.cats.length?'':'on'}" aria-pressed="${!S.cats.length}" data-cat="">전체</button>${cats().map(c=>`<button class="chip ${S.cats.includes(c)?'on':''}" aria-pressed="${S.cats.includes(c)}" data-cat="${c}">${CE[c]} ${c}</button>`).join('')}</div>`;

/* ---------- 지도/목록 계산 ---------- */
const reachMin=w=>Math.max(0,(w-BUF-30)/2);                       // 체류 30분 기준으로 편도 몇 분까지 가능한지
const TMAX=()=>Math.max(15,reachMin(S.wait)*1.25);                // 지도에 보여줄 최대 이동시간(분)
const inRange=k=>tt(k)<=TMAX();
const matchQ=k=>{const q=S.q.trim().toLowerCase();if(!q)return true;const p=P[k];return (p.n+' '+(p.addr||'')+' '+p.c).toLowerCase().includes(q)};
const byDist=(a,b)=>tt(a)-tt(b);
const list=()=>{const ids=P.map((p,k)=>k).filter(k=>(!S.cats.length||S.cats.includes(P[k].c))&&matchQ(k)&&inRange(k));
 ids.sort(S.sort=='stay'?(a,b)=>stay(a)-stay(b)||byDist(a,b):byDist);const b=ids.slice(0,MAXPIN);
 return [...b,...S.sel.filter(k=>!b.includes(k))]};
// 등록 화면 "갈 수 있는 곳"과 지도 화면 "담을 수 있는 곳"이 같은 기준을 쓰도록 한 함수로 계산
const avail=fresh=>P.map((p,k)=>k).filter(inRange).sort(byDist).slice(0,MAXPIN).filter(k=>fresh?cost(k)<=S.wait-BUF:(!S.sel.includes(k)&&fit(k))).length;
const addBtn=k=>{const on=S.sel.includes(k);return `<button class="add ${on?'on':''}" data-tog="${k}" ${!on&&!fit(k)?'disabled':''} aria-label="${esc(P[k].n)} ${on?'담음, 누르면 빼기':fit(k)?'코스에 담기':'시간 부족'}">${on?'✓ 담음':fit(k)?'+ 담기':'시간 부족'}</button>`};
const chain=c=>c.sel.map(k=>P[k].e).join(' → ');
const title=c=>c.sel.map(k=>esc(P[k].n)).join(' → ');
// 코스는 항상 1개 항목으로 저장. 같은 코스를 다시 시작/저장하면 새로 쌓지 않고 덮어씀
const saveCourse=()=>{const old=S.courses.find(x=>x.id==S.editId),c={id:S.editId||Date.now(),sel:[...S.sel],stay:{...S.stay},wait:S.wait,tr:S.tr,area:S.area,date:'오늘',review:old&&old.review||''},i=S.courses.findIndex(x=>x.id==c.id);if(i>=0)S.courses[i]=c;else S.courses.push(c);S.editId=c.id;return c.id};
const resetBuild=()=>{S.sel=[];S.stay={};S.editId=null;S.focus=null};

/* ---------- 홈 ---------- */
const home=()=>frame(S.active?
`<p class="sub">웨이팅 진행 중 · ${S.area}</p><h2>${esc(S.rest)}</h2>
<div class="box cur"><p class="sub c">식당 복귀까지</p><div class="big2" data-cd="hms">${hms(remSec())}</div><p class="sub c"><b class="ink">${backAt()}</b>까지 돌아가야 해요</p></div>
<div class="box"><h3>오늘의 0차 코스</h3>${S.sel.length?`<b>${S.sel.map(k=>P[k].e+' '+esc(P[k].n)).join(' → ')}</b><div class="gap">${bar()}</div><p class="sub">지금</p><h3 data-cd="stage">${stageTxt()}</h3>`:'<p class="sub">아직 코스가 없어요. 지도에서 갈 곳을 담아보세요.</p>'}</div>
<button class="btn" data-go="${S.sel.length?'prog':'map'}">${S.sel.length?'코스 이어가기 →':'지도에서 코스 만들기 →'}</button>
<button class="btn g mt" data-go="reg">웨이팅 시간 다시 등록</button>`
:
`<h2>웨이팅, 이제 0차로.</h2><p class="sub">줄 서는 시간을 내 시간으로 바꿔요.</p>
<div class="box"><h3>지금 웨이팅 중이세요?</h3><p class="sub gap">남은 시간(또는 앞 팀 수)을 입력하면 갈 수 있는 곳을 지도로 보여드려요.</p><button class="btn" data-go="reg">웨이팅 시간 등록하기 →</button></div>
<h3 class="sec">최근 웨이팅</h3><div class="row">${RECENT.map((r,i)=>`<button class="chip" data-rest="${i}">↻ ${esc(r.n)}</button>`).join('')}</div>
<h3 class="sec">이런 곳은 어때요</h3><div class="row">${cats().map(c=>`<button class="chip" data-hcat="${c}">${CE[c]} ${c}</button>`).join('')}</div>
<h3 class="sec">추천 코스 <span class="sub">(눌러서 바로 만들기)</span></h3>
<button class="box btnbox" data-pop="서점,공원|90"><b>📚 서점 → 🌳 공원</b><p class="sub">90분 · 도보 · 가까운 곳으로 자동 구성</p></button>
<button class="box btnbox" data-pop="공원,카페|60"><b>🌳 공원 → ☕ 카페</b><p class="sub">60분 · 도보 · 가까운 곳으로 자동 구성</p></button>`);

/* ---------- 등록 ---------- */
const reg=()=>frame(`<p class="sub">${S.active?'웨이팅 수정':'STEP 1/3 · 등록'}</p><h2>웨이팅 등록</h2>
${S.active?'<div class="alert warn">진행 중인 웨이팅이에요. 시간을 바꾸면 남은 시간이 새로 계산돼요.</div>':''}
<label class="lb" for="rest">식당</label><input class="in" id="rest" value="${esc(S.rest)}" maxlength="40" autocomplete="off">
<span class="lb">웨이팅 지역</span><div class="row" role="group" aria-label="웨이팅 지역">${AREAS.map(a=>`<button class="chip ${S.area==a.n?'on':''}" aria-pressed="${S.area==a.n}" data-area="${a.n}" ${S.active?'disabled':''}>${a.n}</button>`).join('')}</div>
<span class="lb">대기시간 입력 방식</span><div class="seg"><button class="${S.mode=='time'?'on':''}" data-mode="time">남은 시간</button><button class="${S.mode=='team'?'on':''}" data-mode="team">내 앞 팀 수</button></div>
${S.mode=='time'?`<div class="stp"><button data-adj="-10" aria-label="10분 줄이기">−</button><div class="big2 w150" aria-live="polite">${fm(S.wait)}</div><button data-adj="10" aria-label="10분 늘리기">+</button></div>
<div class="row ctr">${[30,60,90,120,180].map(m=>`<button class="chip ${S.wait==m?'on':''}" data-wait="${m}">${fm(m)}</button>`).join('')}</div>`
:`<div class="stp"><button data-teams="-1" aria-label="한 팀 줄이기">−</button><div class="big2 w150" aria-live="polite">${S.teams}팀</div><button data-teams="1" aria-label="한 팀 늘리기">+</button></div>
<p class="sub c">팀당 약 ${PER_TEAM}분으로 계산해요 (예시 값) → 약 <b class="ink">${fm(S.wait)}</b></p>`}
<span class="lb">이동 방식</span><div class="row">${['도보','대중교통'].map(t=>`<button class="chip ${S.tr==t?'on':''}" aria-pressed="${S.tr==t}" data-tr="${t}">${t=='도보'?'🚶':'🚌'} ${t}</button>`).join('')}</div>
<div class="box"><p class="sub">복귀 목표 시각</p><b class="big3">${f2(base()+S.wait)}</b> <span class="sub">(지금 ${f2(clock())} 기준)</span><p class="sub mt">갈 수 있는 곳 <b class="ink">${avail(true)}곳</b> · ${S.area} 기준</p>${avail(true)?'':'<p class="sub err mt">대기시간이 짧아 다녀올 수 있는 곳이 없어요. 시간을 늘려보세요.</p>'}</div>`,
`<button class="btn" data-go="${S.active?(S.sel.length?'prog':'map'):'map'}">${S.active?'적용하고 돌아가기 →':'지도에서 코스 만들기 →'}</button>`);

/* ---------- 지도 ---------- */
const pos=k=>{const d=46*Math.sqrt(Math.min(1,tt(k)/TMAX())),an=geo(k,S.area).a*Math.PI/180;return [50+d*Math.cos(an),50+d*Math.sin(an)]};   // 가까운 핀이 겹치지 않게 √ 스케일, 타원으로 펼쳐 지도 전체 사용
// 핀 겹침 완화: 가까운 핀끼리 서로 밀어내 터치할 수 있게 배치 (지도는 축척이 아닌 개략도)
const layout=()=>{const ids=list(),L=new Map(ids.map(k=>[k,pos(k)])),mx=7.5,my=13;
 for(let it=0;it<40;it++){let moved=false;
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=L.get(ids[i]),b=L.get(ids[j]),dx=b[0]-a[0],dy=b[1]-a[1];
   if(Math.abs(dx)<mx&&Math.abs(dy)<my){const sx=(dx>=0?1:-1)*(mx-Math.abs(dx))/2+(dx==0?.3:0),sy=(dy>=0?1:-1)*(my-Math.abs(dy))/2+(dy==0?.3:0);
    // 겹침이 더 작은 축 방향으로만 밀어낸다
    if((mx-Math.abs(dx))/mx<(my-Math.abs(dy))/my){a[0]-=sx;b[0]+=sx}else{a[1]-=sy;b[1]+=sy}moved=true}}
  if(!moved)break}
 L.forEach(q=>{q[0]=Math.min(94,Math.max(6,q[0]));q[1]=Math.min(90,Math.max(10,q[1]))});return L};
const pins=()=>{const L=layout();return list().map(k=>{const p=P[k],[x,y]=L.get(k),on=S.sel.includes(k),o=!on&&!fit(k);
 return `<button class="mp ${on?'on':''} ${o?'off':''} ${S.focus===k?'f':''}" style="left:${x}%;top:${y}%" data-focus="${k}" data-n="${esc(p.n)}" aria-label="${esc(p.c+' '+p.n+' '+tt(k)+'분'+(on?' 담음':o?' 시간 부족':''))}">${on?S.sel.indexOf(k)+1+' ':''}${p.e}</button>`}).join('')};
const route=()=>{if(!S.sel.length)return '';const L=layout(),pts=[[50,50],...S.sel.map(k=>L.get(k)||pos(k)),[50,50]];return `<polyline points="${pts.map(q=>q.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`};
const detail=()=>{const f=S.focus;
 if(f==null||!P[f])return '<div class="hint">지도의 핀이나 아래 목록을 누르면 장소 정보가 보여요</div>';
 const p=P[f],u=safeUrl(p.url),tel=safeTel(p.tel),on=S.sel.includes(f),info=p.c=='도서관'?libInfo(p):TIP[p.c];
 return `<section class="box cur dt"><div class="dt1"><div class="ph">${p.e}</div><div class="grow"><h3>${esc(p.n)}${p.sample?' <span class="badge">샘플</span>':''}</h3><p class="sub">${p.c} · ${S.tr} ${tt(f)}분</p><p class="sub"><b class="ink">총 ${cost(f)}분</b> (왕복 ${tt(f)*2} + 체류 ${stay(f)})</p></div>${addBtn(f)}</div>
${!on&&!fit(f)?'<p class="sub err">시간이 부족해요. 담은 장소의 체류시간을 줄이거나 장소를 빼면 담을 수 있어요.</p>':''}
${p.addr?`<p class="sub">📍 ${esc(p.addr)}</p>`:''}${info?`<p class="sub">🕒 ${esc(info)}</p>`:''}
<div class="acts"><a class="lk" href="${esc(kakao(f))}" target="_blank" rel="noopener noreferrer">길찾기</a>${tel?`<a class="lk" href="tel:${tel}">전화</a>`:''}${u?`<a class="lk" href="${esc(u)}" target="_blank" rel="noopener noreferrer">홈페이지</a>`:''}<button class="lk" data-fav="${f}" aria-pressed="${S.favs.includes(f)}">${S.favs.includes(f)?'♥ 저장됨':'♡ 저장'}</button></div></section>`};
const row=k=>`<div class="lr"><button class="lrn" data-focus="${k}"><span class="e">${P[k].e}</span><span class="tx"><b>${esc(P[k].n)}</b><span class="sub">${P[k].c} · ${tt(k)}분 · 체류 ${stay(k)}분</span></span></button>${addBtn(k)}</div>`;
const card=k=>`<div class="gc"><button class="lrn v" data-focus="${k}"><div class="ph">${P[k].e}</div><b>${esc(P[k].n)}</b><span class="sub">${P[k].c} · ${tt(k)}분 · 체류 ${stay(k)}분</span></button>${addBtn(k)}</div>`;
const sheetList=()=>{
 if(!P.length)return `<div class="hint">${loadError?'데이터를 불러오지 못했어요.<br>로컬 서버(또는 GitHub Pages)에서 열어주세요.':'장소를 불러오는 중이에요…'}</div>`;
 const l=list();return l.length?`<div class="${S.view=='card'?'grid':''}">${l.map(S.view=='card'?card:row).join('')}</div>`:'<div class="hint">조건에 맞는 장소가 없어요.<br>검색어나 카테고리를 바꿔보세요.</div>'};
const cntTxt=()=>`${list().length}곳 표시 · 지금 담을 수 있는 곳 ${avail(false)}곳`;
function refreshSearch(){const a=document.getElementById('pins');if(!a)return;a.innerHTML=pins();document.getElementById('sheetlist').innerHTML=sheetList();document.getElementById('cnt').textContent=cntTxt()}   // 검색 중엔 입력창을 다시 그리지 않아 한글 입력이 끊기지 않음
const map=()=>{const r=rem(),rm=Math.min(46,46*Math.sqrt(Math.min(1,reachMin(r)/TMAX())));
 return frameM(`<p class="sub">STEP 2/3 · 지도에서 담기 · ${S.area} · ${fm(S.wait)} · ${S.tr}</p>
<div class="mapx ph"><div class="ring" style="left:50%;top:50%;width:${rm*2}%;height:${rm*2}%"></div><svg class="rt" viewBox="0 0 100 100" preserveAspectRatio="none">${route()}</svg><div class="mp me" style="left:50%;top:50%" aria-label="웨이팅 중인 식당">🍽</div><div id="pins">${pins()}</div></div>
<p class="sub lg">점선 원 = 다녀올 수 있는 범위 · 흐린 핀 = 시간 부족</p>${bar()}`,
`${detail()}
<input class="in" id="q" type="search" placeholder="장소·지역 검색 (예: 서점, 광진구)" value="${esc(S.q)}" autocomplete="off" aria-label="장소 또는 지역 검색">
${catRow()}
<div class="tools"><div class="seg sm" role="group" aria-label="정렬"><button class="${S.sort=='dist'?'on':''}" data-sort="dist">가까운 순</button><button class="${S.sort=='stay'?'on':''}" data-sort="stay">체류 짧은 순</button></div><div class="seg sm" role="group" aria-label="보기 방식"><button class="${S.view=='list'?'on':''}" data-view="list" aria-label="목록으로 보기">☰</button><button class="${S.view=='card'?'on':''}" data-view="card" aria-label="카드로 보기">▦</button></div></div>
<p class="sub" id="cnt">${cntTxt()}</p><div id="sheetlist">${sheetList()}</div>`,
 `<button class="btn" data-go="confirm" ${S.sel.length?'':'disabled'}>${S.sel.length?`코스 확인 (${S.sel.length}곳 · ${fm(total())}) →`:'장소를 1곳 이상 담아주세요'}</button>`)};

/* ---------- 코스 확인 ---------- */
const tline=(sel,stm,tr,ar)=>{let t=base(),h='<div class="tl"><div><b>'+f2(t)+'</b> 식당에서 출발</div>';sel.forEach(k=>{const a=ttx(k,tr,ar),s=sx(k,stm);t+=a;h+=`<div><b>${f2(t)}</b> ${P[k].e} ${esc(P[k].n)} 도착 · ${s}분</div>`;t+=s+a});return [h+`<div class="m"><b>${f2(t)}</b> 식당 복귀</div></div>`,t]};
const confirmScr=()=>{const [h]=tline(S.sel,S.stay,S.tr,S.area),r=rem();
 return frame(`<p class="sub">STEP 3/3 · 코스 확인</p><h2>오늘의 0차 코스</h2>${bar()}
${S.sel.map((k,j)=>`<div class="pc2"><div class="r1"><h3>${j+1}. ${P[k].e} ${esc(P[k].n)}</h3><button class="ib" data-rm="${k}" aria-label="${esc(P[k].n)} 빼기">✕</button></div><div class="r2"><div class="st"><span>체류</span><button class="ib" data-st="${k}:-10" ${stay(k)<=10?'disabled':''} aria-label="체류 10분 줄이기">−</button><b>${stay(k)}분</b><button class="ib" data-st="${k}:10" ${stay(k)>=180?'disabled':''} aria-label="체류 10분 늘리기">+</button></div><div class="st"><button class="ib" data-mv="${j}:-1" ${j==0?'disabled':''} aria-label="순서 위로">↑</button><button class="ib" data-mv="${j}:1" ${j==S.sel.length-1?'disabled':''} aria-label="순서 아래로">↓</button></div></div></div>`).join('')||'<div class="box sub">담은 장소가 없어요</div>'}
${h}<div class="box ${r<0?'errbox':''}"><span class="sub">복귀 여유</span> <b>${r<0?'⚠ '+fm(-r)+' 초과 — 체류를 줄이거나 장소를 빼주세요':fm(r)}</b></div><button class="btn g" data-go="map">← 지도에서 더 담기</button>`,
 `<button class="btn" data-start="1" ${r<0||!S.sel.length?'disabled':''}>코스 시작하기</button><button class="btn g mt" data-later="1" ${S.sel.length?'':'disabled'}>시작 없이 마이페이지에 저장</button>`)};

/* ---------- 진행 / 완료 ---------- */
const prog=()=>{
 if(!S.sel.length)return frame(`<h2>진행 중인 코스가 없어요</h2><div class="box sub c">지도에서 갈 곳을 담아 코스를 만들어보세요.</div>`,`<button class="btn" data-go="map">지도에서 코스 만들기 →</button>`);
 const [h]=tline(S.sel,S.stay,S.tr,S.area),b=banner(),sp=stagePlace();
 return frame(`<p class="sub">진행 중 · ${esc(S.rest)} · ${S.area}</p><div class="big" data-cd="hms">${hms(remSec())}</div><p class="sub c">식당 복귀까지 · ${backAt()} 복귀</p>
<div class="bn ${b.c}" data-cd="banner" role="status">${esc(b.t)}</div>
<div class="box cur"><p class="sub">지금</p><h3 data-cd="stage">${stageTxt()}</h3><a class="lk" data-cd="stagelink" target="_blank" rel="noopener noreferrer" ${sp==null?'hidden':`href="${esc(kakao(sp))}"`}>길찾기</a></div>
<div class="row ctr"><button class="chip" data-live="-10">대기 −10분</button><button class="chip" data-live="10">대기 +10분</button></div><p class="sub c">줄이 빨리 줄거나 늘어나면 눌러서 맞춰주세요</p>${h}`,
 `<button class="btn" data-finish="1">식당 도착 · 코스 종료</button><button class="btn g mt" data-go="home">홈에서 계속 보기</button>`)};
const done=()=>{const F=S.fin||{n:0,use:0,rest:0,names:[],cid:null,wait:0,review:''};
 return frame(`<h2>0차 완료</h2><p class="sub">남은 대기 시간을 알차게 보냈어요.</p>
<div class="box"><div class="row stats"><div><span class="sub">방문</span><br><b>${F.n}곳</b></div><div><span class="sub">활용</span><br><b>${fm(F.use)}</b></div><div><span class="sub">복귀 여유</span><br><b>${fm(F.rest)}</b></div></div></div>
<div class="box"><h3>오늘의 코스</h3><p>${F.names.map(esc).join(' → ')||'—'}</p></div>
<div class="alert ok">✓ 마이페이지 '내 코스'에 보관됐어요</div>
<label class="lb" for="rv">한 줄 후기 (선택)</label><div class="rvr"><input class="in" id="rv" maxlength="60" placeholder="이 코스, 어땠나요?" value="${esc(F.review||'')}" autocomplete="off"><button class="btn sm" data-review="1">남기기</button></div>
<button class="btn g mt" data-share="1">코스 공유하기</button>`,
 `<button class="btn" data-go="my">내 코스 보러가기</button><button class="btn g mt" data-go="home">홈으로</button>`)};

/* ---------- 마이페이지 ---------- */
const my=()=>frame(`<h2>마이페이지</h2><p class="sub">내가 만든 코스와 저장한 공간</p><div class="seg"><button class="${S.seg=='c'?'on':''}" data-seg="c">내 코스 ${S.courses.length}</button><button class="${S.seg=='f'?'on':''}" data-seg="f">관심 공간 ${S.favs.length}</button></div>`+
(S.seg=='c'?(S.courses.length?S.courses.slice().reverse().map(c=>`<button class="box btnbox" data-cid="${c.id}"><b>${title(c)}</b><p class="sub">${esc(c.date)} · ${esc(c.area||'성수동')} · 대기 ${fm(c.wait)} · 코스 ${fm(ctot(c))} · ${esc(c.tr)}</p>${c.review?`<p class="sub">“${esc(c.review)}”</p>`:''}</button>`).join(''):'<div class="box sub c">보관된 코스가 없어요.<br>등록 탭에서 만들어보세요.</div>')
:(S.favs.length?S.favs.map(k=>`<div class="pc"><div class="ph">${P[k].e}</div><div><h3>${esc(P[k].n)}</h3><p class="sub">${P[k].c} · 체류 ${P[k].s}분</p></div><button class="add" data-fav="${k}">♥ 해제</button></div>`).join(''):'<div class="box sub c">장소 상세의 ♡를 눌러 저장해보세요.</div>')));
const mc=()=>{const c=S.courses.find(x=>x.id==S.cid);if(!c)return my();const [h]=tline(c.sel,c.stay,c.tr,c.area);
 return frame(`<button class="back" data-go="my">← 내 코스</button><h2 class="mt">${title(c)}</h2><p class="sub">${esc(c.date)} · ${esc(c.area||'성수동')} · ${chain(c)}</p>
<div class="row nowrap"><div class="box mini"><span class="sub">대기</span><br><b>${fm(c.wait)}</b></div><div class="box mini"><span class="sub">코스</span><br><b>${fm(ctot(c))}</b></div><div class="box mini"><span class="sub">이동</span><br><b>${esc(c.tr)}</b></div></div>${c.review?`<div class="box"><span class="sub">내 후기</span><p>“${esc(c.review)}”</p></div>`:''}${h}
<p class="sub">같은 코스를 지금 대기시간에 맞춰 다시 쓸 수 있어요.</p>`,
 `<button class="btn" data-redo="${c.id}">이 코스로 다시 시작</button><button class="btn g mt" data-del="${c.id}">삭제</button>`)};

/* ---------- 렌더 ---------- */
const SC={home,reg,map,confirm:confirmScr,prog,done,my,mc};
let lastScr=null;
function draw(){
 const root=document.getElementById('phone'),sc=root.querySelector('.body,.sheet');
 const keep=S.i===lastScr&&sc&&!S.top?sc.scrollTop:0;          // 버튼을 눌러도 스크롤 위치 유지 (기존엔 맨 위로 튐)
 root.innerHTML=SC[S.i]();
 const n=root.querySelector('.body,.sheet');if(n)n.scrollTop=keep;
 lastScr=S.i;S.top=0;save();
}
const clampWait=w=>Math.min(240,Math.max(30,w));
const teamWait=()=>clampWait(Math.round(S.teams*PER_TEAM/10)*10);
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-cid]'),t=c||e.target.closest('button');
 if(!t||t.disabled)return;const d=t.dataset,has=k=>d[k]!==undefined;
 if(has('go')){if(d.go=='reg')S.editId=null;S.i=(d.go=='prog'&&!S.active)?'home':d.go}
 else if(has('cid')){S.cid=+d.cid;S.i='mc'}
 else if(has('tog')){const k=+d.tog;S.sel=S.sel.includes(k)?S.sel.filter(x=>x!=k):[...S.sel,k]}
 else if(has('rest')){const r=RECENT[+d.rest];S.rest=r.n;if(S.area!=r.a){S.area=r.a;resetSel('지역이 바뀌어 담은 장소를 비웠어요')}S.i='reg'}
 else if(has('hcat')){S.cats=[d.hcat];S.i='reg'}
 else if(has('pop')){const[cs,w]=d.pop.split('|');S.wait=+w;S.mode='time';S.tr='도보';resetBuild();
  cs.split(',').forEach(cat=>{const k=P.map((p,i)=>i).filter(i=>P[i].c==cat&&!S.sel.includes(i)&&inRange(i)&&cost(i)<=rem()-BUF).sort(byDist)[0];if(k!=null)S.sel.push(k)});
  if(S.sel.length)S.i='confirm';else{S.i='map';toast('조건에 맞는 장소를 찾지 못했어요')}}
 else if(has('area')){if(S.area!=d.area){S.area=d.area;resetSel('지역이 바뀌어 담은 장소를 비웠어요')}}
 else if(has('mode')){S.mode=d.mode;if(S.mode=='team'){S.wait=teamWait();if(!S.active)prune()}}
 else if(has('teams')){S.teams=Math.min(40,Math.max(1,S.teams+ +d.teams));S.wait=teamWait();if(!S.active)prune()}
 else if(has('cat')){if(!d.cat)S.cats=[];else S.cats=S.cats.includes(d.cat)?S.cats.filter(x=>x!=d.cat):[...S.cats,d.cat]}
 else if(has('sort'))S.sort=d.sort;
 else if(has('view'))S.view=d.view;
 else if(has('wait')){S.wait=+d.wait;if(!S.active)prune()}
 else if(has('adj')){S.wait=clampWait(S.wait+ +d.adj);if(!S.active)prune()}
 else if(has('tr')){S.tr=d.tr;if(!S.active)prune()}
 else if(has('live')){S.wait=Math.min(300,Math.max(10,S.wait+ +d.live));toast(`대기시간을 ${d.live>0?'+':'−'}10분 조정했어요 · 복귀 ${backAt()}`)}
 else if(has('focus')){S.focus=+d.focus;S.top=1}
 else if(has('fav')){const k=+d.fav;S.favs=S.favs.includes(k)?S.favs.filter(x=>x!=k):[...S.favs,k]}
 else if(has('st')){const[k,m]=d.st.split(':').map(Number);S.stay[k]=Math.min(180,Math.max(10,stay(k)+m))}
 else if(has('mv')){const[j,m]=d.mv.split(':').map(Number),n=j+m;if(n>=0&&n<S.sel.length)[S.sel[j],S.sel[n]]=[S.sel[n],S.sel[j]]}
 else if(has('rm'))S.sel=S.sel.filter(x=>x!=+d.rm);
 else if(has('start')){S.curId=saveCourse();S.active=true;S.start=Date.now();S.i='prog'}
 else if(has('later')){saveCourse();resetBuild();S.seg='c';S.i='my';toast('내 코스에 저장했어요')}
 else if(has('finish')){S.fin={n:S.sel.length,use:Math.min(total(),S.wait),rest:Math.max(rem(),0),names:nm(S.sel),cid:S.curId,wait:S.wait,review:''};S.active=false;S.start=null;resetBuild();S.i='done'}
 else if(has('review')){const v=(document.getElementById('rv').value||'').trim().slice(0,60),cr=S.courses.find(x=>x.id==(S.fin&&S.fin.cid));if(S.fin)S.fin.review=v;if(cr)cr.review=v;toast(v?'후기를 저장했어요':'후기를 비웠어요')}
 else if(has('share')){const txt=`0차 코스 · ${(S.fin&&S.fin.names||[]).join(' → ')} (대기 ${fm(S.fin?S.fin.wait:0)})`;
  if(navigator.share)navigator.share({text:txt}).catch(()=>{});
  else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>{toast('코스를 복사했어요');draw()},()=>{});
  else toast('이 브라우저에서는 공유를 지원하지 않아요')}
 else if(has('seg'))S.seg=d.seg;
 else if(has('redo')){if(S.active){toast('진행 중인 코스가 있어요. 먼저 종료해주세요');draw();return}
  const c=S.courses.find(x=>x.id==+d.redo);S.sel=[...c.sel];S.stay={...c.stay};S.tr=c.tr;S.wait=c.wait;S.mode='time';S.area=c.area||'성수동';S.editId=c.id;S.i='confirm'}
 else if(has('del')){if(!confirm('이 코스를 삭제할까요?'))return;S.courses=S.courses.filter(x=>x.id!=+d.del);S.i='my'}
 else return;
 draw()});
document.addEventListener('input',e=>{
 if(e.target.id=='rest')S.rest=e.target.value;
 else if(e.target.id=='q'){S.q=e.target.value;refreshSearch()}
});
draw();
loadPlaces();
setInterval(()=>{if(!S.active)return;document.querySelectorAll('[data-cd]').forEach(el=>{const k=el.dataset.cd;
 if(k=='hms')el.textContent=hms(remSec());
 else if(k=='pill')el.textContent='⏱ '+hms(remSec());
 else if(k=='stage')el.textContent=stageTxt();
 else if(k=='banner'){const b=banner();el.className='bn '+b.c;el.textContent=b.t}
 else if(k=='stagelink'){const sp=stagePlace();if(sp==null)el.hidden=true;else{el.hidden=false;el.href=kakao(sp)}}})},1000);
