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
const DSTAY=10;           // 담을 때 가정하는 기본 체류 시간(분) — 시간 부족 계산에만 쓰고 STEP 2에는 표시하지 않음
const COL=['#d93025','#1e8e3e','#1a73e8','#c25e00','#8e24aa','#00838f','#c2185b','#5d4037'];   // 선택 순서별 색 (흰 글자 대비 확보)
const colr=j=>COL[j%COL.length];
const TRS=['도보','대중교통','자동차','자전거'];                      // 이동 수단 (표시 순서)
const TRI={도보:'🚶',대중교통:'🚌',자동차:'🚗',자전거:'🚲'};
const TRF={도보:[1,1],대중교통:[.55,3],자동차:[.22,5],자전거:[.4,2]};   // [도보 시간 대비 배율, 최소 분]
const TRTIP={도보:'걸어서 이동하는 코스예요.',대중교통:'환승·배차 대기는 평균값으로 계산했어요.',자동차:'주차·신호 대기는 최소값만 반영했어요. 주차 가능 여부는 직접 확인하세요.',자전거:'자전거 보관·잠금 시간은 포함하지 않았어요.'};
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
const SAVED=(()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}})();
const S={i:'home',wait:120,tr:'도보',cats:[],sel:[],stay:{},focus:null,view:'list',q:'',start:null,rest:'웨이팅 중인 식당',area:'성수동',loc:{lat:AREAS[0].lat,lng:AREAS[0].lng},fin:null,editId:null,active:false,curId:null,seg:'c',cid:null,sort:'def',onow:false,catOpen:false,favs:[],courses:[],toast:'',top:0};
(function(){const v=SAVED;if(!v||typeof v!='object')return;
 if(Number.isFinite(v.wait))S.wait=Math.min(300,Math.max(10,v.wait));
 if(TRS.includes(v.tr))S.tr=v.tr;
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
function save(){try{localStorage.setItem(KEY,JSON.stringify({wait:S.wait,tr:S.tr,cats:S.cats,rest:S.rest,area:S.area,loc:S.loc,view:S.view,sort:S.sort,onow:S.onow,active:S.active,start:S.start,editId:S.editId,curId:S.curId,sel:nm(S.sel),stay:nmap(S.stay),favs:nm(S.favs),courses:S.courses.map(c=>({...c,sel:nm(c.sel),stay:nmap(c.stay)}))}))}catch(e){}}
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
const ttx=(k,tr,ar)=>{const w=geo(k,ar||S.loc).w,f=TRF[tr]||TRF.도보;return tr=='도보'||!TRF[tr]?w:Math.max(f[1],Math.round(w*f[0]))};
const dstay=w=>(w??S.wait)<=60?0:DSTAY;   // 대기 60분 이하(30분·1시간 등)는 체류 0분으로 가정, 그 외 10분
const sx=(k,m,w)=>m[k]??dstay(w);
const tt=k=>ttx(k,S.tr),stay=k=>sx(k,S.stay),cost=k=>tt(k)*2+stay(k);          // cost = 왕복 이동 + 체류
const total=()=>S.sel.reduce((s,k)=>s+cost(k),0),rem=()=>S.wait-total(),fit=k=>cost(k)<=rem()-BUF;
const ctot=c=>c.sel.reduce((s,k)=>s+ttx(k,c.tr,locOf(c))*2+sx(k,c.stay,c.wait),0);
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
// 시간/이동수단이 바뀌어 초과되면 뒤에서부터 장소를 빼되, 사용자에게 알려준다
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
const hd=()=>`<header class="hd"><span class="logo">◯ 0차</span><button class="pill" data-cd="pill" data-go="${S.active&&S.sel.length?'prog':S.active?'home':'reg'}">${S.active?'⏱ '+hms(remSec()):'⏱ 웨이팅 등록'}</button></header>`;
const toastH=()=>S.toast?`<div class="toast" role="status">${esc(S.toast)}</div>`:'';
const frame=(b,f)=>`${hd()}<main class="body">${b}</main>${f?`<div class="ft">${f}</div>`:''}${nav()}${toastH()}`;
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
const reachMin=w=>Math.max(0,(w-BUF-(S.wait<=60?0:30))/2);                       // 체류 30분 기준으로 편도 몇 분까지 가능한지
const TMAX=()=>Math.max(15,reachMin(S.wait)*1.25);                // 지도에 보여줄 최대 이동시간(분)
const inRange=k=>tt(k)<=TMAX();
const matchQ=k=>{const q=S.q.trim().toLowerCase();if(!q)return true;const p=P[k];return p.n.toLowerCase().includes(q)};   // 장소 이름만 검색
const byDist=(a,b)=>tt(a)-tt(b);
const list=()=>{const ids=P.map((p,k)=>k).filter(k=>(!S.cats.length||S.cats.includes(P[k].c))&&matchQ(k)&&inRange(k)&&(!S.onow||isOpen(k)===true));
 ids.sort(byDist);const b=ids.slice(0,MAXPIN);
 if(S.sort=='def')b.sort((x,y)=>CAT_ORDER.indexOf(P[x].c)-CAT_ORDER.indexOf(P[y].c)||byDist(x,y));      // 기본순: 카테고리 순 → 가까운 순
 else if(S.sort=='pop')b.sort((x,y)=>(P[y].pop||0)-(P[x].pop||0)||byDist(x,y));                         // 인기순: pop 값(API) 큰 순, 없으면 가까운 순
 return [...b,...S.sel.filter(k=>!b.includes(k))]};
// 등록 화면 "갈 수 있는 곳"과 지도 화면 "담을 수 있는 곳"이 같은 기준을 쓰도록 한 함수로 계산
const avail=fresh=>P.map((p,k)=>k).filter(inRange).sort(byDist).slice(0,MAXPIN).filter(k=>fresh?cost(k)<=S.wait-BUF:(!S.sel.includes(k)&&fit(k))).length;
const addBtn=k=>{const on=S.sel.includes(k);return `<button class="add ${on?'on':''}" data-tog="${k}" ${!on&&!fit(k)?'disabled':''} aria-label="${esc(P[k].n)} ${on?'담음, 누르면 빼기':fit(k)?'코스에 담기':'시간 부족'}">${on?'✓ 담음':fit(k)?'+ 담기':'시간 부족'}</button>`};
const chain=c=>c.sel.map(k=>P[k].e).join(' → ');
const title=c=>c.sel.map(k=>esc(P[k].n)).join(' → ');
// 코스는 항상 1개 항목으로 저장. 같은 코스를 다시 시작/저장하면 새로 쌓지 않고 덮어씀
const saveCourse=()=>{const old=S.courses.find(x=>x.id==S.editId),c={id:S.editId||Date.now(),sel:[...S.sel],stay:{...S.stay},wait:S.wait,tr:S.tr,area:S.area,loc:{...S.loc},date:'오늘',review:old&&old.review||''},i=S.courses.findIndex(x=>x.id==c.id);if(i>=0)S.courses[i]=c;else S.courses.push(c);S.editId=c.id;return c.id};
const resetBuild=()=>{S.sel=[];S.stay={};S.editId=null;S.focus=null};

/* ---------- 홈 ---------- */
const home=()=>frame(S.active?
`<p class="sub">웨이팅 진행 중 · ${S.area}</p><h2>${esc(S.rest)}</h2>
<div class="box cur"><p class="sub c">식당 복귀까지</p><div class="big2" data-cd="hms">${hms(remSec())}</div><p class="sub c"><b class="ink">${backAt()}</b>까지 돌아가야 해요</p></div>
<div class="box"><h3>오늘의 0차 코스</h3>${S.sel.length?`<div class="rb flat">${ringSvg()}<div class="rbs"><div class="rbn"><span class="sub">지금</span><b data-cd="stage">${stageTxt()}</b></div><p class="sub rbp">${S.sel.map(k=>esc(P[k].n)).join(' → ')}</p></div></div>`:'<p class="sub">아직 코스가 없어요. 지도에서 갈 곳을 담아보세요.</p>'}</div>
<button class="btn" data-go="${S.sel.length?'prog':'map'}">${S.sel.length?'코스 이어가기 →':'지도에서 코스 만들기 →'}</button>
<button class="btn g mt" data-go="reg">웨이팅 시간 다시 등록</button>`
:
`<section class="hero"><div><p class="hero-k">줄 서는 시간을 내 시간으로</p><h2 class="hero-h">웨이팅,<br>이제 0차로.</h2><p class="hero-s">남은 시간을 입력하면 갈 수 있는 곳을 지도로 보여드려요.</p></div>
<button class="cta" data-go="reg"><span>웨이팅 시간 등록하기</span><span class="cta-a" aria-hidden="true">→</span></button></section>
<h3 class="sec">이런 곳은 어때요</h3><div class="row">${cats().map(c=>`<button class="chip" data-hcat="${c}">${CE[c]} ${c}</button>`).join('')}</div>
<h3 class="sec">추천 코스</h3>
<div class="sqs"><button class="sq" data-pop="서점,공원|90"><span class="ic" aria-hidden="true">📚 🌳</span><span><b>서점 → 공원</b><span class="sub">90분 · 도보</span></span></button>
<button class="sq" data-pop="공원,카페|60"><span class="ic" aria-hidden="true">🌳 ☕</span><span><b>공원 → 카페</b><span class="sub">60분 · 도보</span></span></button></div>`);

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
const reg=()=>frame(`<p class="sub">${S.active?'웨이팅 수정':'STEP 1-1/3 · 위치'}</p><h2>웨이팅 장소</h2>
${S.active?'<div class="alert warn">진행 중인 웨이팅이에요. 위치는 진행 중에 바꿀 수 없어요.</div>':''}
<div class="locwrap"><div class="locmap" id="locmap"></div><button class="locbtn" data-geo="1" ${S.active?'disabled':''} aria-label="현재 위치로 이동">📍</button></div>
${!nearSeoul()?'<p class="sub err mt">서울 밖이에요. 지금은 서울 지역 장소만 있어요. 위치를 서울로 지정해주세요.</p>':''}
<div class="box how"><div class="how-h"><span class="sub">선택한 위치</span><b>${esc(S.area)}${S.area=='선택한 위치'?'':' 부근'}</b></div>
<ul><li>지도를 누르거나 빨간 핀을 끌어 식당 위치를 지정해요</li><li>오른쪽 위 위치 버튼으로 내 위치를 불러올 수 있어요</li><li>이 위치를 기준으로 이동 시간을 계산해요</li></ul></div>`,
`<button class="btn" data-go="wait">다음 · 대기시간 입력 →</button>`);

const waitScr=()=>frame(`<button class="back" data-go="reg">← 위치 다시 지정 (${esc(S.area)})</button>
<p class="sub">${S.active?'웨이팅 수정':'STEP 1-2/3 · 대기시간'}</p><h2>대기시간 입력</h2>
${S.active?'<div class="alert warn">진행 중인 웨이팅이에요. 시간을 바꾸면 남은 시간이 새로 계산돼요.</div>':''}
${regWait()}
<div class="box cur res" aria-live="polite"><p class="sub c">복귀 목표 시각</p><div class="big2">${f2(base()+S.wait)}</div><p class="sub c">지금 ${f2(clock())} + 남은 시간 ${fm(S.wait)}</p><p class="sub c mt">갈 수 있는 곳 <b class="ink">${avail(true)}곳</b> · ${esc(S.area)} 기준</p>${avail(true)?'':'<p class="sub err c mt">대기시간이 짧아 다녀올 수 있는 곳이 없어요. 시간을 늘려보세요.</p>'}</div>`,
`<button class="btn" data-go="${S.active?(S.sel.length?'prog':'map'):'map'}">${S.active?'적용하고 돌아가기 →':'지도에서 코스 만들기 →'}</button>`);

/* ---------- 지도 ---------- */
// 카카오 지도 화면: 핀·반경 원·경로를 실제 좌표로 그린다 (기존 모형용 pos/layout/pins/route 는 쓰지 않음)
const KM={el:null,map:null,ov:[],ring:null,line:null,key:''};
function kpin(k){
 const p=P[k],i=S.sel.indexOf(k),on=i>=0,o=!on&&!fit(k),b=document.createElement('button');
 b.className='mp kp'+(on?' on':'')+(o?' off':'')+(S.focus===k?' f':'');
 if(on){const c=colr(i);b.style.cssText=`background:${c};border-color:${c};color:#fff`}
 b.dataset.n=p.n;b.dataset.focus=k;
 b.setAttribute('aria-label',p.c+' '+p.n+' '+tt(k)+'분'+(on?' 담음':o?' 시간 부족':''));
 b.textContent=(on?i+1+' ':'')+p.e;
 b.addEventListener('click',e=>{e.stopPropagation();S.focus=k;S.top=1;draw()});
 return b}
function kLayers(){
 if(!KM.map)return;
 KM.ov.forEach(o=>o.setMap(null));KM.ov=[];
 if(KM.ring)KM.ring.setMap(null);if(KM.line)KM.line.setMap(null);
 const c=kLL(S.loc.lat,S.loc.lng);
 // 갈 수 있는 반경(원): 편도 가능 분 → 도보 환산 분 → m (geo()의 도보 계산식을 거꾸로)
 const f=S.tr=='도보'||!TRF[S.tr]?1:TRF[S.tr][0];
 const rM=Math.max(150,reachMin(rem())/f*4.8/60/1.3*1000);
 KM.ring=new kakao.maps.Circle({center:c,radius:rM,strokeWeight:2,strokeColor:'#777',strokeOpacity:.9,strokeStyle:'dash',fillColor:'#777',fillOpacity:.06});
 KM.ring.setMap(KM.map);
 if(S.sel.length){
  KM.line=new kakao.maps.Polyline({path:[c,...S.sel.map(k=>kLL(P[k].lat,P[k].lng)),c],strokeWeight:3,strokeColor:'#222',strokeOpacity:.8,strokeStyle:'shortdash'});
  KM.line.setMap(KM.map)}
 const add=(el,pos,z)=>{const o=new kakao.maps.CustomOverlay({position:pos,content:el,xAnchor:.5,yAnchor:.5,zIndex:z,clickable:true});o.setMap(KM.map);KM.ov.push(o)};
 const me=document.createElement('div');me.className='mp me kp';me.textContent='🍽';me.setAttribute('aria-label','웨이팅 중인 식당');
 add(me,c,2);
 list().forEach(k=>add(kpin(k),kLL(P[k].lat,P[k].lng),S.focus===k?5:S.sel.includes(k)?4:3));
}
function mountKakaoMap(){
 const ph0=document.getElementById('kmap');if(!ph0)return;
 if(!kLoad(()=>{
  const ph=document.getElementById('kmap');if(!ph)return;
  if(!KM.el){KM.el=document.createElement('div');KM.el.className='lmap'}
  ph.appendChild(KM.el);
  if(!KM.map)KM.map=new kakao.maps.Map(KM.el,{center:kLL(S.loc.lat,S.loc.lng),level:5});
  const keep=KM.map.getCenter();KM.map.relayout();KM.map.setCenter(keep);
  kLayers();
  const key=S.loc.lat+','+S.loc.lng+'|'+S.wait;                   // 위치·대기시간이 바뀐 때만 반경에 맞춰 다시 확대/축소
  if(KM.key!==key){KM.key=key;KM.map.setBounds(KM.ring.getBounds())}
 }))kFail(ph0);
}
const detail=()=>{const f=S.focus;
 if(f==null||!P[f])return '<div class="hint">지도의 핀이나 아래 목록을 누르면 장소 정보가 보여요</div>';
 const p=P[f],u=safeUrl(p.url),tel=safeTel(p.tel),on=S.sel.includes(f),info=p.c=='도서관'?libInfo(p):TIP[p.c];
 return `<section class="box cur dt"><div class="dt1"><div class="ph">${p.e}</div><div class="grow"><h3>${esc(p.n)}${p.sample?' <span class="badge">샘플</span>':''}</h3><p class="sub">${p.c} · ${S.tr} ${tt(f)}분</p><p class="sub"><b class="ink">총 ${cost(f)}분</b> (왕복 ${tt(f)*2} + 체류 ${stay(f)})</p></div>${addBtn(f)}</div>
${!on&&!fit(f)?'<p class="sub err">시간이 부족해요. 담은 장소의 체류시간을 줄이거나 장소를 빼면 담을 수 있어요.</p>':''}
${p.addr?`<p class="sub">📍 ${esc(p.addr)}</p>`:''}${info?`<p class="sub">🕒 ${esc(info)}</p>`:''}
<div class="acts"><a class="lk" href="${esc(kakaoLink(f))}" target="_blank" rel="noopener noreferrer">길찾기</a>${tel?`<a class="lk" href="tel:${tel}">전화</a>`:''}${u?`<a class="lk" href="${esc(u)}" target="_blank" rel="noopener noreferrer">홈페이지</a>`:''}<button class="lk" data-fav="${f}" aria-pressed="${S.favs.includes(f)}">${S.favs.includes(f)?'♥ 저장됨':'♡ 저장'}</button></div></section>`};
// 장소 상세 (행을 누르면 아래로 펼침): 주소 · 전화 · 운영/휴무(공휴일 포함)
const dtl=k=>{const p=P[k],tel=safeTel(p.tel),isL=p.c=='도서관',h=isL&&p.hours?p.hours.holiday:null,
 op=(isL?libInfo(p):'')||TIP[p.c]||'영업시간·휴무는 방문 전에 확인하세요';
 return `<div class="dti" role="region" aria-label="${esc(p.n)} 상세 정보"><p>📍 ${p.addr?esc(p.addr):'주소 정보 없음'}</p><p>📞 ${tel?`<a href="tel:${tel}">${esc(p.tel)}</a>`:'전화번호 정보 없음'}</p><p>🕒 ${esc(op)}</p>${h&&typeof h=='object'&&h.open?`<p>🗓 공휴일 ${esc(h.open)}–${esc(h.close)}</p>`:''}<div class="acts"><a class="lk" href="${esc(kakaoLink(k))}" target="_blank" rel="noopener noreferrer">길찾기</a></div></div>`};
const row=k=>`<div data-row="${k}"><div class="lr${S.focus===k?' f':''}"><button class="lrn" data-focus="${k}" aria-expanded="${S.focus===k}"><span class="e">${P[k].e}</span><span class="tx"><b>${esc(P[k].n)}</b></span></button>${addBtn(k)}</div>${S.focus===k?dtl(k):''}</div>`;
const card=k=>`<div class="gc"><button class="lrn v" data-focus="${k}"><div class="ph">${P[k].e}</div><b>${esc(P[k].n)}</b><span class="sub">${P[k].c} · ${tt(k)}분</span></button>${addBtn(k)}</div>`;
const sheetList=()=>{
 if(!P.length)return `<div class="hint">${loadError?'데이터를 불러오지 못했어요.<br>로컬 서버(또는 GitHub Pages)에서 열어주세요.':'장소를 불러오는 중이에요…'}</div>`;
 const l=list();return l.length?`<div>${l.map(row).join('')}</div>`:`<div class="hint">${S.cats.length==1&&S.cats[0]=='카페'&&!P.some(p=>p.c=='카페')?'카페 정보를 준비 중이에요.':'조건에 맞는 장소가 없어요.<br>검색어나 필터를 바꿔보세요.'+(S.onow?'<br>영업 정보가 있는 장소만 표시돼요.':'')}</div>`};
const cntTxt=()=>`${list().length}곳 표시 · 지금 담을 수 있는 곳 ${avail(false)}곳`;
function refreshSearch(){if(!document.getElementById('kmap'))return;kLayers();document.getElementById('sheetlist').innerHTML=sheetList()}   // 검색 중엔 입력창을 다시 그리지 않아 한글 입력이 끊기지 않음
// 담은 장소의 체류 시간: 숫자로 자유 입력 (5~240분). 입력 중에는 입력창을 다시 그리지 않고 나머지만 갱신
const ringR=()=>Math.min(46,46*Math.sqrt(Math.min(1,reachMin(rem())/TMAX())));
const ctTxt=k=>`이동 왕복 ${tt(k)*2}분 · 합계 ${cost(k)}분`;
const overTxt=()=>`⚠ 대기시간보다 ${fm(-rem())} 길어요. 체류 시간을 줄이거나 장소를 빼주세요`;
const cfm=()=>!S.sel.length?{t:'장소를 1곳 이상 담아주세요',d:true}:rem()<0?{t:`체류 시간을 줄여주세요 (${fm(-rem())} 초과)`,d:true}:{t:`코스 확인 (${S.sel.length}곳 · ${fm(total())}) →`,d:false};
const chosen=()=>!S.sel.length?'':`<section class="box dt" id="chosen"><h3>담은 장소 · 체류 시간</h3><p class="sub">머무를 시간을 직접 입력하세요 (5~240분)</p>${S.sel.map((k,j)=>`<div class="lr cl" style="border-left-color:${colr(j)}"><span class="dot" style="background:${colr(j)}" aria-label="${j+1}번">${j+1}</span><div class="lrn"><span class="e">${P[k].e}</span><span class="tx"><b>${esc(P[k].n)}</b><span class="sub" data-ct="${k}">${ctTxt(k)}</span></span></div><label class="st"><input class="in stin" type="number" inputmode="numeric" min="5" max="240" step="5" value="${stay(k)}" data-stin="${k}" aria-label="${esc(P[k].n)} 체류 시간(분)"><span>분</span></label></div>`).join('')}<p class="sub err mt" id="stwarn" ${rem()<0?'':'hidden'}>${rem()<0?overTxt():''}</p></section>`;
function refreshStay(){
 const g=id=>document.getElementById(id);if(!g('barw'))return;
 g('barw').innerHTML=bar();kLayers();g('sheetlist').innerHTML=sheetList();g('cnt').textContent=cntTxt();g('detail').innerHTML=detail();
 const w=g('stwarn');if(w){w.hidden=rem()>=0;w.textContent=rem()<0?overTxt():''}
 document.querySelectorAll('[data-ct]').forEach(el=>el.textContent=ctTxt(+el.dataset.ct));
 const b=g('cfm'),c=cfm();b.textContent=c.t;b.disabled=c.d;save();
}
const map=()=>{const c=cfm();
 return frameM(`<input class="in" id="q" type="search" placeholder="장소 이름 검색 (예: 낫저스트북스)" value="${esc(S.q)}" autocomplete="off" aria-label="장소 이름 검색">
<div class="mapx" id="kmap"></div>`,
`${catRow()}
<div id="sheetlist">${sheetList()}</div>`,
 `<button class="btn" id="cfm" data-go="confirm" ${c.d?'disabled':''}>${esc(c.t)}</button>`)};

/* ---------- 코스 확인 ---------- */
const tline=(sel,stm,tr,ar,w)=>{let t=base();
 const r=(tm,name,sub,cls)=>`<div${cls?` class="${cls}"`:''}><b class="tm">${f2(tm)}</b><span class="tx2"><b>${name}</b>${sub?`<span class="sub">${sub}</span>`:''}</span></div>`;
 let h='<div class="tl">'+r(t,'식당에서 출발','');
 sel.forEach(k=>{const a=ttx(k,tr,ar),st=sx(k,stm,w);t+=a;h+=r(t,esc(P[k].n),`도착 · 체류 ${st}분 · ${tr||'이동'} ${a}분`);t+=st+a});
 return [h+r(t,'식당 복귀','','m')+'</div>',t]};
const confirmScr=()=>{const [h]=tline(S.sel,S.stay,S.tr,S.loc),r=rem();
 return frame(`<p class="sub">STEP 3/3 · 코스 확인</p><h2>오늘의 0차 코스</h2>${ringBar()}
<span class="lb">이동 수단</span><div class="modes" role="group" aria-label="이동 수단 선택">${TRS.map(t=>`<button class="mode ${S.tr==t?'on':''} ${trTotal(t)>S.wait?'x':''}" aria-pressed="${S.tr==t}" data-tr="${t}"><span>${TRI[t]} ${t}</span><b>${fm(trTotal(t))}</b></button>`).join('')}</div>

<div id="order">${S.sel.map((k,j)=>`<div class="pc2"><button class="ib sm dh" data-drag="${j}" aria-label="${esc(P[k].n)} 순서 변경 (끌어서 이동, 위·아래 방향키도 가능)">⋮⋮</button><span class="dot sm" style="background:${colr(j)}">${j+1}</span><h3 class="nm">${P[k].e} ${esc(P[k].n)}</h3><div class="st"><button class="ib sm" data-st="${k}:-10" ${stay(k)<=dstay()?'disabled':''} aria-label="체류 10분 줄이기">−</button><b>${stay(k)}분</b><button class="ib sm" data-st="${k}:10" ${stay(k)>=240?'disabled':''} aria-label="체류 10분 늘리기">+</button></div><button class="ib sm" data-rm="${k}" aria-label="${esc(P[k].n)} 빼기">✕</button></div>`).join('')||'<div class="box sub">담은 장소가 없어요</div>'}</div>
${h}<div class="box ${r<0?'errbox':''}"><span class="sub">복귀 여유</span> <b>${r<0?'⚠ '+fm(-r)+' 초과 — 체류를 줄이거나 장소를 빼주세요':fm(r)}</b></div><button class="btn g" data-go="map">← 지도에서 더 담기</button>`,
 `<button class="btn" data-start="1" ${r<0||!S.sel.length?'disabled':''}>코스 시작하기</button><button class="btn g mt" data-later="1" ${S.sel.length?'':'disabled'}>시작 없이 마이페이지에 저장</button>`)};

/* ---------- 진행 / 완료 ---------- */
const prog=()=>{
 if(!S.sel.length)return frame(`<h2>진행 중인 코스가 없어요</h2><div class="box sub c">지도에서 갈 곳을 담아 코스를 만들어보세요.</div>`,`<button class="btn" data-go="map">지도에서 코스 만들기 →</button>`);
 const [h]=tline(S.sel,S.stay,S.tr,S.loc),b=banner(),sp=stagePlace();
 return frame(`<p class="sub">진행 중 · ${esc(S.rest)} · ${S.area}</p><div class="big" data-cd="hms">${hms(remSec())}</div><p class="sub c">식당 복귀까지 · ${backAt()} 복귀</p>
<div class="bn ${b.c}" data-cd="banner" role="status">${esc(b.t)}</div>
<div class="box cur"><p class="sub">지금</p><h3 data-cd="stage">${stageTxt()}</h3><a class="lk" data-cd="stagelink" target="_blank" rel="noopener noreferrer" ${sp==null?'hidden':`href="${esc(kakaoLink(sp))}"`}>길찾기</a></div>
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
(S.seg=='c'?(S.courses.length?S.courses.map((c,i)=>`<button class="box btnbox cs" data-cid="${c.id}"><div class="cs-h"><b>코스 ${i+1}</b><span class="sub">${esc(c.date)}</span></div><p class="cs-r">${title(c)}</p><p class="sub">${esc(c.area||'성수동')} · 대기 ${fm(c.wait)} · 코스 ${fm(ctot(c))} · ${esc(c.tr)}</p>${c.review?`<p class="sub">“${esc(c.review)}”</p>`:''}</button>`).join(''):'<div class="box sub c">보관된 코스가 없어요.<br>등록 탭에서 만들어보세요.</div>')
:(S.favs.length?S.favs.map(k=>`<div class="pc"><div class="ph">${P[k].e}</div><div><h3>${esc(P[k].n)}</h3><p class="sub">${P[k].c}</p></div><button class="add" data-fav="${k}">♥ 해제</button></div>`).join(''):'<div class="box sub c">장소 상세의 ♡를 눌러 저장해보세요.</div>')));
const mc=()=>{const c=S.courses.find(x=>x.id==S.cid);if(!c)return my();const [h]=tline(c.sel,c.stay,c.tr,locOf(c),c.wait);
 return frame(`<button class="back" data-go="my">← 내 코스</button><h2 class="mt">코스 ${S.courses.indexOf(c)+1}</h2><p class="cs-r">${title(c)}</p><p class="sub">${esc(c.date)} · ${esc(c.area||'성수동')}</p>
<div class="row nowrap"><div class="box mini"><span class="sub">대기</span><br><b>${fm(c.wait)}</b></div><div class="box mini"><span class="sub">코스</span><br><b>${fm(ctot(c))}</b></div><div class="box mini"><span class="sub">이동</span><br><b>${esc(c.tr)}</b></div></div>${c.review?`<div class="box"><span class="sub">내 후기</span><p>“${esc(c.review)}”</p></div>`:''}${h}
<p class="sub">같은 코스를 지금 대기시간에 맞춰 다시 쓸 수 있어요.</p>`,
 `<button class="btn" data-redo="${c.id}">이 코스로 다시 시작</button><button class="btn g mt" data-del="${c.id}">삭제</button>`)};

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
const trTotal=t=>S.sel.reduce((a,k)=>a+ttx(k,t,S.loc)*2+sx(k,S.stay),0);
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-cid]'),t=c||e.target.closest('button');
 if(!t||t.disabled)return;const d=t.dataset,has=k=>d[k]!==undefined;
 if(has('go')){if(d.go=='reg')S.editId=null;S.i=(d.go=='prog'&&!S.active)?'home':d.go}
 else if(has('cid')){S.cid=+d.cid;S.i='mc'}
 else if(has('tog')){const k=+d.tog;if(S.sel.includes(k)){S.sel=S.sel.filter(x=>x!=k);delete S.stay[k]}else S.sel=[...S.sel,k]}
 else if(has('hcat')){S.cats=[d.hcat];S.i='reg'}
 else if(has('pop')){const[cs,w]=d.pop.split('|');S.wait=+w;S.tr='도보';resetBuild();
  cs.split(',').forEach(cat=>{const k=P.map((p,i)=>i).filter(i=>P[i].c==cat&&!S.sel.includes(i)&&inRange(i)&&cost(i)<=rem()-BUF).sort(byDist)[0];if(k!=null)S.sel.push(k)});
  if(S.sel.length)S.i='confirm';else{S.i='map';toast('조건에 맞는 장소를 찾지 못했어요')}}
 else if(has('geo')){
  if(!navigator.geolocation){toast('이 브라우저에서는 위치를 지원하지 않아요');draw();return}
  navigator.geolocation.getCurrentPosition(p=>{moveTo(p.coords.latitude,p.coords.longitude,true);draw()},()=>{toast('위치를 가져오지 못했어요. 지도를 눌러 직접 지정해주세요');draw()},{enableHighAccuracy:true,timeout:8000});
  return}
 else if(has('cat')){if(!d.cat)S.cats=[];else S.cats=S.cats.includes(d.cat)?S.cats.filter(x=>x!=d.cat):[...S.cats,d.cat]}
 else if(has('catmenu'))S.catOpen=!S.catOpen;
 else if(has('onow'))S.onow=!S.onow;
 else if(has('view'))S.view=d.view;
 else if(has('wait')){S.wait=+d.wait;if(!S.active)prune()}
 else if(has('adj')){S.wait=clampWait(S.wait+ +d.adj);if(!S.active)prune()}
 else if(has('tr')){S.tr=d.tr}
 else if(has('live')){S.wait=Math.min(300,Math.max(10,S.wait+ +d.live));toast(`대기시간을 ${d.live>0?'+':'−'}10분 조정했어요 · 복귀 ${backAt()}`)}
 else if(has('focus')){if(S.focus===+d.focus&&t.closest('.lr'))S.focus=null;else{S.focus=+d.focus;S.top=1}}   // 행을 다시 누르면 상세 접기
 else if(has('fav')){const k=+d.fav;S.favs=S.favs.includes(k)?S.favs.filter(x=>x!=k):[...S.favs,k]}
 else if(has('st')){const[k,m]=d.st.split(':').map(Number);S.stay[k]=Math.min(240,Math.max(dstay(),stay(k)+m))}
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
  const c=S.courses.find(x=>x.id==+d.redo);S.sel=[...c.sel];S.stay={...c.stay};S.tr=c.tr;S.wait=c.wait;{const l=locOf(c);S.loc={lat:l.lat,lng:l.lng};S.area=c.area||areaLabel(S.loc);GC.clear();recenter=true}S.editId=c.id;S.i='confirm'}
 else if(has('del')){if(!confirm('이 코스를 삭제할까요?'))return;S.courses=S.courses.filter(x=>x.id!=+d.del);S.i='my'}
 else return;
 draw()});
document.addEventListener('input',e=>{
 if(e.target.id=='q'){S.q=e.target.value;refreshSearch()}
 else if(e.target.dataset&&e.target.dataset.stin!==undefined){   // 체류 시간 직접 입력
  const k=+e.target.dataset.stin,v=parseInt(e.target.value,10);
  if(Number.isFinite(v)&&S.sel.includes(k)){S.stay[k]=Math.min(240,Math.max(5,v));refreshStay()}}
});
document.addEventListener('change',e=>{   // 입력을 마치면 범위(5~240)에 맞춰 표시값 정리
 if(e.target.id=='sort'){S.sort=e.target.value;draw();return}
 if(e.target.dataset&&e.target.dataset.stin!==undefined){const k=+e.target.dataset.stin;if(P[k]&&S.sel.includes(k))e.target.value=stay(k)}
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
 else if(k=='pill')el.textContent='⏱ '+hms(remSec());
 else if(k=='stage')el.textContent=stageTxt();
 else if(k=='banner'){const b=banner();el.className='bn '+b.c;el.textContent=b.t}
 else if(k=='stagelink'){const sp=stagePlace();if(sp==null)el.hidden=true;else{el.hidden=false;el.href=kakaoLink(sp)}}})},1000);
