/* ===== 0차 app.js =====
 * 장소 데이터는 data/*.json 에서 불러옵니다.
 * j 플래그: JSON 파일에서 연동한 장소는 j:true, 이후 API로 추가하는 장소는 j:false.
 *   → API 데이터 추가: addApiPlaces([{n, c, lat, lng, e?, s?, addr?, tel?, url?}])
 */
const REF={lat:37.5446,lng:127.0557};                 // 웨이팅 중인 식당(성수동 예시 좌표) — 추후 지오코딩/GPS로 교체
const CAT_ORDER=['서점','도서관','공원','카페','쇼핑'];
const MAXPIN=40;                                      // 지도/목록에 한 번에 보여줄 최대 장소 수
const P=[];                                           // 장소 목록 (인덱스 = 장소 ID, 추가만 하고 순서는 바꾸지 않음)
let loadError=false;

const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:null};
const SOURCES=[
 {url:'data/seoul_bookstore_100.json',pick:d=>d.DATA,                       // XCNTS=위도, YDNTS=경도
  map:x=>({n:x.store_name,c:'서점',e:'📚',s:30,lat:num(x.xcnts),lng:num(x.ydnts),addr:x.adres?'서울 '+x.adres:'',tel:x.tel_no,url:x.hmpg_url||x.sns})},
 {url:'data/seoul_library_100.json',pick:d=>d.libraries,
  map:x=>({n:x.name,c:'도서관',e:'🏛️',s:40,lat:x.coordinates&&x.coordinates.latitude,lng:x.coordinates&&x.coordinates.longitude,addr:x.address,tel:x.phone,url:x.website})},
 {url:'data/seoul_park_130.json',pick:d=>d.DATA,                            // XCRD=경도, YCRD=위도(WGS84)
  map:x=>({n:x.park_nm,c:'공원',e:'🌳',s:40,lat:num(x.ycrd),lng:num(x.xcrd),addr:x.park_addr,tel:x.telno,url:x.url})}];

// 기준 위치 대비 도보 시간(w, 분)과 방향(a, 도)을 계산해 지도 빌더가 쓰는 형태로 만든다
function addPlaces(list,fromJson){
 list.forEach(p=>{
  p.n=String(p.n||'').trim();
  if(!p.n||p.lat==null||p.lng==null)return;           // 좌표 없는 항목(예: 서울로7017)은 제외
  const r=Math.PI/180,cos=Math.cos(REF.lat*r),dx=(p.lng-REF.lng)*cos,dy=p.lat-REF.lat;
  const a=Math.sin((p.lat-REF.lat)*r/2)**2+cos*Math.cos(p.lat*r)*Math.sin((p.lng-REF.lng)*r/2)**2;
  const km=12742*Math.asin(Math.sqrt(a));
  P.push({e:'📍',s:40,...p,w:Math.max(1,Math.round(km*1.3/4.8*60)),a:Math.atan2(-dy,dx)/r,j:!!fromJson});   // 직선거리×1.3 ÷ 도보 4.8km/h
 });
}
/* API 연동용: API에서 받은 장소는 j:false 로 추가 */
function addApiPlaces(list){addPlaces(list,false);draw()}

async function loadPlaces(){
 const res=await Promise.allSettled(SOURCES.map(async s=>{const r=await fetch(s.url);if(!r.ok)throw new Error(r.status+' '+s.url);return s.pick(await r.json()).map(s.map)}));
 res.forEach(r=>{if(r.status=='fulfilled')addPlaces(r.value,true);else{loadError=true;console.error(r.reason)}});
 // 샘플 코스/관심공간 (이름으로 연결)
 const id=n=>P.findIndex(p=>p.n==n),mk=(i,names,wait,date)=>({id:i,sel:names.map(id).filter(k=>k>=0),stay:{},wait,tr:'도보',date});
 S.courses=[mk(1,['낫저스트북스','서울숲'],120,'10/28'),mk(2,['성수근린공원','공씨책방(성수점)'],90,'10/21')].filter(c=>c.sel.length);
 S.favs=['낫저스트북스'].map(id).filter(k=>k>=0);
 draw();
}
const NOW=14*60+10;
const S={i:'home',wait:120,tr:'도보',cat:'전체',sel:[],stay:{},focus:null,list:false,start:null,rest:'성수동 맛집 (예시)',fin:null,editId:null,active:false,curId:null,seg:'c',cid:null,favs:[],
courses:[]};
const ttx=(k,tr)=>tr=='도보'?P[k].w:Math.max(3,Math.round(P[k].w*.55));
const sx=(k,m)=>m[k]??P[k].s;
const tt=k=>ttx(k,S.tr),stay=k=>sx(k,S.stay),cost=k=>tt(k)*2+stay(k);
const total=()=>S.sel.reduce((s,k)=>s+cost(k),0),rem=()=>S.wait-total(),fit=k=>cost(k)<=rem()-10;
const ctot=c=>c.sel.reduce((s,k)=>s+ttx(k,c.tr)*2+sx(k,c.stay),0);
const prune=()=>{while(rem()<0&&S.sel.length)S.sel.pop()};
const fm=m=>m>=60?Math.floor(m/60)+'시간'+(m%60?' '+m%60+'분':''):m+'분';
const f2=m=>String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const stages=()=>S.sel.flatMap(k=>[{t:`${P[k].e} ${P[k].n}로 이동`,m:tt(k)},{t:`${P[k].n}에서 머무르기`,m:stay(k)},{t:'식당 방향으로 복귀 이동',m:tt(k)}]);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RECENT=['성수동 맛집 (예시)','건대입구 OO식당','서울숲 △△식당'];
const elapsed=()=>S.active&&S.start?Math.floor((Date.now()-S.start)/1000):0;
const remSec=()=>Math.max(0,S.wait*60-elapsed());
const hms=s=>Math.floor(s/3600)+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
const backAt=()=>f2(NOW+S.wait);
const curStage=()=>{const e=elapsed()/60,st=stages();let c=0;for(let j=0;j<st.length;j++){c+=st[j].m;if(e<c)return j}return st.length};
const stageTxt=()=>{const st=stages(),j=curStage();return !st.length?'등록한 코스가 없어요':j>=st.length?'코스를 모두 마쳤어요 · 식당으로 돌아가요':st[j].t+' · 약 '+st[j].m+'분'};
const TAB={home:'home',prog:'home',done:'home',reg:'reg',map:'reg',confirm:'reg',my:'my',mc:'my'};
const nav=()=>{const a=TAB[S.i];return `<div class="nav"><button class="${a=='home'?'on':''}" data-go="home">🏠<br>홈</button><button class="reg ${a=='reg'?'on':''}" data-go="reg">⏱<br>등록</button><button class="${a=='my'?'on':''}" data-go="my">👤<br>마이페이지</button></div>`};
const hd=()=>`<div class="hd"><span>◯ 0차</span><span class="pill" data-cd="pill">${S.active?'⏱ '+hms(remSec()):'⏱ 대기 없음'}</span></div>`;
const frame=(b,f)=>`${hd()}<div class="body">${b}</div>${f?`<div class="ft">${f}</div>`:''}${nav()}`;
const bar=()=>{let h='';S.sel.forEach(k=>h+=`<i style="width:${cost(k)/S.wait*100}%">${P[k].e}${cost(k)}′</i>`);const r=rem();
 return `<div class="bar">${h}<i class="${r<0?'':'m'}" style="flex:1;${r<0?'background:#c33':''}">${r<0?'초과':'여유 '+fm(r)}</i></div>`};
const cats=()=>['전체',...CAT_ORDER.filter(c=>P.some(p=>p.c==c))];
const catRow=()=>`<div class="row">${cats().map(c=>`<button class="chip ${S.cat==c?'on':''}" data-cat="${c}">${c}</button>`).join('')}</div>`;
// 지도 축척: 선택한 대기시간·이동수단의 도달 범위가 항상 지도 안에 들어오도록 (담기 전후로 핀이 움직이지 않게 rem이 아닌 wait 기준)
const reachMin=w=>Math.max(0,(w-10-30)/2);
const scale=()=>44/Math.max(15,reachMin(S.wait)*1.25);
const list=()=>{const base=P.map((p,k)=>k).filter(k=>(S.cat=='전체'||P[k].c==S.cat)&&tt(k)*scale()<=46).sort((a,b)=>tt(a)-tt(b)).slice(0,MAXPIN);
 return [...base,...S.sel.filter(k=>!base.includes(k))]};
const addBtn=k=>{const on=S.sel.includes(k);return `<button class="add ${on?'on':''}" data-tog="${k}" ${!on&&!fit(k)?'disabled':''}>${on?'✓ 담음':fit(k)?'+ 담기':'시간 부족'}</button>`};
const chain=c=>c.sel.map(k=>P[k].e).join(' → ');
const title=c=>c.sel.map(k=>P[k].n).join(' → ');
// 코스는 항상 1개 항목으로 저장. 같은 코스를 다시 시작/저장하면 새로 쌓지 않고 덮어씀
const saveCourse=()=>{const c={id:S.editId||Date.now(),sel:[...S.sel],stay:{...S.stay},wait:S.wait,tr:S.tr,date:'오늘'},i=S.courses.findIndex(x=>x.id==c.id);if(i>=0)S.courses[i]=c;else S.courses.push(c);S.editId=c.id;return c.id};
const resetBuild=()=>{S.sel=[];S.stay={};S.editId=null};

const home=()=>frame(S.active?
`<p class="sub">웨이팅 진행 중</p><h2>${esc(S.rest)}</h2>
<div class="box cur"><p class="sub" style="text-align:center">식당 복귀까지</p><div class="big2" data-cd="hms">${hms(remSec())}</div><p class="sub" style="text-align:center"><b style="color:var(--ink)">${backAt()}</b>까지 돌아가야 해요</p></div>
<div class="box"><h3>오늘의 0차 코스</h3>${S.sel.length?`<b style="font-size:13px">${S.sel.map(k=>P[k].e+' '+P[k].n).join(' → ')}</b><div style="margin:8px 0">${bar()}</div><p class="sub">지금</p><h3 data-cd="stage">${stageTxt()}</h3>`:'<p class="sub">아직 코스가 없어요. 지도에서 갈 곳을 담아보세요.</p>'}</div>
<button class="btn" data-go="${S.sel.length?'prog':'map'}">${S.sel.length?'코스 이어가기 →':'지도에서 코스 만들기 →'}</button>
<button class="btn g" style="margin-top:6px" data-go="reg">웨이팅 시간 다시 등록</button>`
:
`<h2>웨이팅, 이제 0차로.</h2><p class="sub">줄 서는 시간을 내 시간으로 바꿔요.</p>
<div class="box"><h3>지금 웨이팅 중이세요?</h3><p class="sub" style="margin-bottom:10px">하단 <b>등록</b>에서 남은 시간을 입력하면 갈 수 있는 곳을 지도로 보여드려요.</p><button class="btn" data-go="reg">웨이팅 시간 등록하기 →</button></div>
<h3 style="margin-top:16px">최근 웨이팅</h3><div class="row">${RECENT.map(r=>`<button class="chip" data-rest="${esc(r)}">↻ ${esc(r)}</button>`).join('')}</div>
<h3 style="margin-top:16px">이런 곳은 어때요</h3><div class="row"><span class="chip">📚 서점</span><span class="chip">🏛️ 도서관</span><span class="chip">🌳 공원</span><span class="chip">☕ 카페</span></div>
<h3 style="margin-top:16px">인기 코스</h3><div class="box"><b style="font-size:13px">서점 → 서울숲</b><p class="sub">90분 · 성수러버 님</p></div><div class="box"><b style="font-size:13px">공원 → 카페</b><p class="sub">60분 · 산책러 님</p></div>`);

const reg=()=>frame(`<p class="sub">STEP 1/3 · 등록</p><h2>웨이팅 등록</h2>
<label class="lb">식당</label><input class="in" id="rest" value="${esc(S.rest)}">
<label class="lb">남은 대기시간</label><div class="stp"><button data-adj="-10">−</button><div class="big2" style="min-width:150px">${fm(S.wait)}</div><button data-adj="10">+</button></div>
<div class="row" style="justify-content:center">${[30,60,90,120,180].map(m=>`<button class="chip ${S.wait==m?'on':''}" data-wait="${m}">${fm(m)}</button>`).join('')}</div>
<label class="lb">이동 방식</label><div class="row">${['도보','대중교통'].map(t=>`<button class="chip ${S.tr==t?'on':''}" data-tr="${t}">${t=='도보'?'🚶':'🚌'} ${t}</button>`).join('')}</div>
<div class="box"><p class="sub">복귀 목표 시각</p><b>${f2(NOW+S.wait)}</b> <span class="sub">(지금 ${f2(NOW)} 기준)</span><p class="sub" style="margin-top:6px">갈 수 있는 곳 <b style="color:var(--ink)">${P.map((p,k)=>k).filter(k=>cost(k)<=S.wait-10).length}곳</b></p></div>`,`<button class="btn" data-go="map">지도에서 코스 만들기 →</button>`);

const map=()=>{const r=rem(),rm=Math.min(46,reachMin(r)*scale()),f=S.focus;
 const pos=k=>{const d=tt(k)*scale(),an=P[k].a*Math.PI/180;return [50+d*Math.cos(an),50+d*Math.sin(an)*1.43]};
 const pins=list().map(k=>{const p=P[k],[x,y]=pos(k),on=S.sel.includes(k),o=!on&&!fit(k);
  return `<button class="mp ${on?'on':''} ${o?'off':''} ${f===k?'f':''}" style="left:${x}%;top:${y}%" data-focus="${k}">${on?S.sel.indexOf(k)+1+' ':''}${p.e}</button>`}).join('');
 const lines=S.sel.map(k=>{const [x,y]=pos(k);return `<line x1="50" y1="50" x2="${x}" y2="${y}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>`}).join('');
 return frame(`<p class="sub">STEP 2/3 · 지도에서 담기 · ${fm(S.wait)} · ${S.tr}</p><div class="ph mapx box" style="margin:6px 0"><div class="ring" style="left:50%;top:50%;width:${rm*2}%;height:${rm*2*1.43}%"></div><svg class="rt" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg><div class="mp" style="left:50%;top:50%;background:var(--ink);color:var(--bg)">🍽</div>${pins}</div>
${P.length?'':'<div class="box sub" style="text-align:center">'+(loadError?'데이터를 불러오지 못했어요.<br>로컬 서버(또는 GitHub Pages)에서 열어주세요.':'장소를 불러오는 중이에요…')+'</div>'}
<p class="sub">점선 원 = 지금 다녀올 수 있는 범위 · 흐린 핀 = 시간 부족</p><div style="margin-top:8px">${bar()}</div>
${f!=null?`<div class="pc cur" style="margin-top:10px"><div class="ph">${P[f].e}</div><div><h3>${P[f].n} <button class="back" style="border:0;background:none;font-size:15px" data-fav="${f}">${S.favs.includes(f)?'♥':'♡'}</button></h3><p class="sub">${P[f].c} · ${S.tr} ${tt(f)}분 · 체류 ${stay(f)}분</p><p class="sub">총 ${cost(f)}분</p></div>${addBtn(f)}</div>`:`<div class="box sub" style="text-align:center">핀을 눌러 장소를 확인해보세요</div>`}
<div class="row" style="margin-top:8px;align-items:center;justify-content:space-between"><span class="sub">${S.cat=='전체'?'전체 장소':S.cat} ${list().length}곳</span><button class="chip" style="padding:4px 10px;font-size:11px" data-listt="1">${S.list?'목록 접기 ▴':'목록 보기 ▾'}</button></div>${catRow()}
${S.list?list().map(k=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:12px"><span>${P[k].e} <b>${P[k].n}</b> <span class="sub">${tt(k)}분</span></span>${addBtn(k)}</div>`).join(''):''}`,
 `<button class="btn" data-go="confirm" ${S.sel.length?'':'disabled'}>${S.sel.length?`코스 확인 (${S.sel.length}곳 · ${fm(total())}) →`:'장소를 1곳 이상 담아주세요'}</button>`)};

const tline=(sel,stm,tr)=>{let t=NOW,h='<div class="tl"><div><b>'+f2(t)+'</b> 식당에서 출발</div>';sel.forEach(k=>{const a=ttx(k,tr),s=sx(k,stm);t+=a;h+=`<div><b>${f2(t)}</b> ${P[k].e} ${P[k].n} 도착 · ${s}분</div>`;t+=s+a});return [h+`<div class="m"><b>${f2(t)}</b> 식당 복귀</div></div>`,t]};
const confirm=()=>{const [h]=tline(S.sel,S.stay,S.tr),r=rem();
 return frame(`<p class="sub">STEP 3/3 · 코스 확인</p><h2>오늘의 0차 코스</h2>${bar()}
${S.sel.map((k,j)=>`<div class="pc" style="grid-template-columns:1fr auto"><div><h3>${j+1}. ${P[k].e} ${P[k].n}</h3><div class="st" style="margin-top:6px">체류 <button data-st="${k}:-10">−</button><b>${stay(k)}분</b><button data-st="${k}:10">+</button></div></div><div class="st"><button data-mv="${j}:-1">↑</button><button data-mv="${j}:1">↓</button><button data-rm="${k}">✕</button></div></div>`).join('')||'<div class="box sub">담은 장소가 없어요</div>'}
${h}<div class="box" style="${r<0?'border-color:#c33;color:#c33':''}"><span class="sub">복귀 여유</span> <b>${r<0?fm(-r)+' 초과 — 체류를 줄이거나 장소를 빼주세요':fm(r)}</b></div><button class="btn g" data-go="map">← 지도에서 더 담기</button>`,
 `<button class="btn" data-start="1" ${r<0||!S.sel.length?'disabled':''}>코스 시작하기</button><button class="btn g" style="margin-top:6px" data-later="1" ${S.sel.length?'':'disabled'}>시작 없이 마이페이지에 저장</button>`)};

const prog=()=>{
 if(!S.sel.length)return frame(`<h2>진행 중인 코스가 없어요</h2><div class="box sub" style="text-align:center">등록 탭에서 코스를 만들어보세요.</div>`);
 const [h]=tline(S.sel,S.stay,S.tr);
 return frame(`<p class="sub">진행 중 · ${esc(S.rest)}</p><div class="big" data-cd="hms">${hms(remSec())}</div><p class="sub" style="text-align:center">식당 복귀까지 · ${backAt()} 복귀</p>
<div class="box cur"><p class="sub">지금</p><h3 data-cd="stage">${stageTxt()}</h3></div>${h}
<div class="alert">🔔 웨이팅 순서가 가까워지면 알려드려요</div>`,`<button class="btn" data-finish="1">식당 도착 · 코스 종료</button><button class="btn g" style="margin-top:6px" data-go="home">홈에서 계속 보기</button>`)};
const done=()=>{const F=S.fin||{n:S.sel.length,use:Math.min(total(),S.wait),rest:Math.max(rem(),0)};return frame(`<h2>0차 완료 🎉</h2><p class="sub">남은 대기 시간을 알차게 보냈어요.</p><div class="box"><div class="row" style="justify-content:space-around;text-align:center"><div><span class="sub">방문</span><br><b>${F.n}곳</b></div><div><span class="sub">활용</span><br><b>${fm(F.use)}</b></div><div><span class="sub">복귀 여유</span><br><b>${fm(F.rest)}</b></div></div></div><div class="alert">✓ 마이페이지 '내 코스'에 보관됐어요</div><label class="lb">한 줄 후기 (선택)</label><input class="in" placeholder="이 코스, 어땠나요?">`,`<button class="btn" data-go="my">내 코스 보러가기</button><button class="btn g" style="margin-top:6px" data-go="home">홈으로</button>`)};

const my=()=>frame(`<h2>마이페이지</h2><p class="sub">내가 만든 코스와 저장한 공간</p><div class="seg"><button class="${S.seg=='c'?'on':''}" data-seg="c">내 코스 ${S.courses.length}</button><button class="${S.seg=='f'?'on':''}" data-seg="f">관심 공간 ${S.favs.length}</button></div>`+
(S.seg=='c'?(S.courses.length?S.courses.slice().reverse().map(c=>`<div class="box" data-cid="${c.id}" style="cursor:pointer"><b style="font-size:13px">${title(c)}</b><p class="sub" style="margin-top:4px">${c.date} · 대기 ${fm(c.wait)} · 코스 ${fm(ctot(c))} · ${c.tr}</p></div>`).join(''):'<div class="box sub" style="text-align:center">보관된 코스가 없어요.<br>등록 탭에서 만들어보세요.</div>')
:(S.favs.length?S.favs.map(k=>`<div class="pc" style="grid-template-columns:56px 1fr auto"><div class="ph">${P[k].e}</div><div><h3>${P[k].n}</h3><p class="sub">${P[k].c} · 체류 ${P[k].s}분</p></div><button class="add" data-fav="${k}">♥ 해제</button></div>`).join(''):'<div class="box sub" style="text-align:center">지도에서 ♡를 눌러 저장해보세요.</div>')));
const mc=()=>{const c=S.courses.find(x=>x.id==S.cid);if(!c)return my();const [h,t]=tline(c.sel,c.stay,c.tr);
 return frame(`<button class="back" style="border:0;background:none;color:var(--mut);font-weight:700;font-size:12px;padding:0" data-go="my">← 내 코스</button><h2 style="margin-top:8px">${title(c)}</h2><p class="sub">${c.date} · ${chain(c)}</p>
<div class="row" style="margin:12px 0"><div class="box" style="flex:1;margin:0;text-align:center"><span class="sub">대기</span><br><b>${fm(c.wait)}</b></div><div class="box" style="flex:1;margin:0;text-align:center"><span class="sub">코스</span><br><b>${fm(ctot(c))}</b></div><div class="box" style="flex:1;margin:0;text-align:center"><span class="sub">이동</span><br><b>${c.tr}</b></div></div>${h}
<p class="sub">같은 코스를 지금 대기시간에 맞춰 다시 쓸 수 있어요.</p>`,`<button class="btn" data-redo="${c.id}">이 코스로 다시 시작</button><button class="btn g" style="margin-top:6px" data-del="${c.id}">삭제</button>`)};

const SC={home,reg,map,confirm,prog,done,my,mc};
function draw(){
 document.getElementById('phone').innerHTML=SC[S.i]();
}
document.addEventListener('click',e=>{const c=e.target.closest('[data-cid]'),t=c||e.target.closest('button');if(!t||t.disabled)return;const d=t.dataset;
 if(d.go){if(d.go=='reg')S.editId=null;S.i=d.go;if(d.go=='prog'&&!S.active){S.active=true;S.start=Date.now()}}
 else if(d.cid){S.cid=+d.cid;S.i='mc'}
 else if(d.tog!=null){const k=+d.tog;S.sel=S.sel.includes(k)?S.sel.filter(x=>x!=k):[...S.sel,k]}
 else if(d.rest){S.rest=d.rest;S.i='reg'}
 else if(d.cat)S.cat=d.cat;
 else if(d.wait){S.wait=+d.wait;prune()}
 else if(d.adj){S.wait=Math.min(240,Math.max(30,S.wait+ +d.adj));prune()}
 else if(d.tr){S.tr=d.tr;prune()}
 else if(d.focus!=null)S.focus=+d.focus;
 else if(d.listt)S.list=!S.list;
 else if(d.fav!=null){const k=+d.fav;S.favs=S.favs.includes(k)?S.favs.filter(x=>x!=k):[...S.favs,k]}
 else if(d.st){const[k,m]=d.st.split(':').map(Number);S.stay[k]=Math.max(10,stay(k)+m)}
 else if(d.mv){const[j,m]=d.mv.split(':').map(Number),n=j+m;if(n>=0&&n<S.sel.length)[S.sel[j],S.sel[n]]=[S.sel[n],S.sel[j]]}
 else if(d.rm)S.sel=S.sel.filter(x=>x!=+d.rm);
 else if(d.start){S.curId=saveCourse();S.active=true;S.start=Date.now();S.i='prog'}
 else if(d.later){saveCourse();resetBuild();S.seg='c';S.i='my'}
 else if(d.finish){S.fin={n:S.sel.length,use:Math.min(total(),S.wait),rest:Math.max(rem(),0)};S.active=false;S.start=null;resetBuild();S.i='done'}
 else if(d.seg)S.seg=d.seg;
 else if(d.redo){const c=S.courses.find(x=>x.id==+d.redo);S.sel=[...c.sel];S.stay={...c.stay};S.tr=c.tr;S.wait=c.wait;S.editId=c.id;S.i='confirm'}
 else if(d.del){S.courses=S.courses.filter(x=>x.id!=+d.del);S.i='my'}
 else return;
 draw()});
draw();
loadPlaces();
document.addEventListener('input',e=>{if(e.target.id=='rest')S.rest=e.target.value});
setInterval(()=>{if(!S.active)return;document.querySelectorAll('[data-cd]').forEach(el=>{const k=el.dataset.cd;el.textContent=k=='hms'?hms(remSec()):k=='pill'?'⏱ '+hms(remSec()):stageTxt()})},1000);
