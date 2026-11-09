const places=[
 {id:1,name:"카페 모리",cat:"카페",emoji:"☕",walk:6,stay:40,desc:"조용한 분위기의 아늑한 카페",reason:"이동 부담이 적고 짧게 쉬기 좋아요."},
 {id:2,name:"소품샵 담",cat:"쇼핑",emoji:"🛍️",walk:8,stay:35,desc:"아기자기한 소품 편집숍",reason:"구경하는 시간이 짧아 웨이팅 중 방문하기 좋아요."},
 {id:3,name:"연무장 서점",cat:"문화",emoji:"📚",walk:10,stay:45,desc:"독립출판물 전문 서점",reason:"실내에서 여유롭게 시간을 보내기 좋아요."},
 {id:4,name:"서울숲 산책길",cat:"산책",emoji:"🌿",walk:12,stay:30,desc:"바깥 공기를 쐴 수 있는 산책로",reason:"가벼운 산책으로 기분 전환하기 좋아요."}
];
let waitMinutes=120, travel="도보", selected=null, course=[], favorites=[], recent=null, filter="전체";

function go(id){
 document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
 document.getElementById(id).classList.add('active');
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.nav===id));
 if(id==='results') renderPlaces();
 if(id==='mypage') renderFavorites();
 if(id==='course') renderCourse();
 window.scrollTo(0,0);
}

document.querySelectorAll('#timeChoices .choice').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#timeChoices .choice').forEach(x=>x.classList.remove('selected'));
 b.classList.add('selected'); waitMinutes=+b.dataset.time;
});
document.querySelectorAll('#travelChoices .choice').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#travelChoices .choice').forEach(x=>x.classList.remove('selected'));
 b.classList.add('selected'); travel=b.dataset.travel;
});
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
 b.classList.add('active'); filter=b.dataset.filter; renderPlaces();
});

function showRecommendations(){
 document.getElementById('waitMetric').textContent = `${waitMinutes>=60?Math.floor(waitMinutes/60)+'시간':''}${waitMinutes%60?waitMinutes%60+'분':''}`;
 document.getElementById('headerTimer').textContent = `⏱ ${Math.floor(waitMinutes/60)}:00:00`;
 go('results');
}

function travelTime(p){ return travel==='도보'? p.walk : Math.max(3, Math.round(p.walk*0.55)); }
function buffer(p){ return waitMinutes - (travelTime(p)*2 + p.stay); }

function renderPlaces(){
 const list = document.getElementById('placeList'); list.innerHTML='';
 places.filter(p=>(filter==='전체'||p.cat===filter)&&buffer(p)>=10).forEach(p=>{
  const saved = favorites.includes(p.id), b = buffer(p);
  const card = document.createElement('article'); card.className='place-card';
  card.innerHTML=`
    <div class="place-art">${p.emoji}</div>
    <div>
      <div class="place-title-row">
        <h3 style="font-size:14px; margin:0;">${p.name}</h3>
        <button class="save-btn ${saved?'saved':''}" onclick="toggleFavorite(${p.id})">${saved?'♥':'♡'}</button>
      </div>
      <div class="sub" style="margin:2px 0;">${p.cat} · ${travel} ${travelTime(p)}분</div>
      <div class="visit-info">왕복 이동 <b>${travelTime(p)*2}분</b> · 복귀 여유 <b>${b}분</b></div>
      <button class="btn ghost" style="padding:4px 8px; font-size:10px; margin-top:6px;" onclick="openDetail(${p.id})">상세 보기 →</button>
    </div>`;
  list.appendChild(card);
 });
}

function toggleFavorite(id){
 favorites = favorites.includes(id)? favorites.filter(x=>x!==id) : [...favorites, id];
 renderPlaces(); renderFavorites();
 toast(favorites.includes(id)?'관심공간에 저장했어요.':'관심공간에서 삭제했어요.');
}

function renderFavorites(){
 const list = document.getElementById('favoriteList'); list.innerHTML='';
 const saved = places.filter(p=>favorites.includes(p.id));
 if(!saved.length){ list.innerHTML='<div class="empty">저장된 관심 공간이 없어요.<br>추천 목록에서 ♡를 눌러보세요.</div>'; return; }
 saved.forEach(p=>{
  const el = document.createElement('div'); el.className='place-card';
  el.innerHTML=`<div class="place-art" style="height:60px; font-size:18px;">${p.emoji}</div><div><h3 style="font-size:13px; margin:0;">${p.name}</h3><button class="btn ghost" style="padding:2px 6px; font-size:10px; margin-top:6px;" onclick="openDetail(${p.id})">상세 보기</button></div>`;
  list.appendChild(el);
 });
}

function openDetail(id){
 selected = places.find(p=>p.id===id); recent = selected.name;
 document.getElementById('detailArt').textContent = selected.emoji;
 document.getElementById('detailCategory').textContent = selected.cat.toUpperCase();
 document.getElementById('detailName').textContent = selected.name;
 document.getElementById('detailDesc').textContent = selected.desc;
 document.getElementById('detailWalk').textContent = travelTime(selected)+'분';
 document.getElementById('detailStay').textContent = selected.stay+'분';
 document.getElementById('detailBuffer').textContent = buffer(selected)+'분';
 document.getElementById('detailWhy').innerHTML = `<li>${selected.reason}</li>`;
 
 const btn = document.getElementById('addToCourseBtn');
 if(course.includes(selected.id)){
   btn.textContent = '✓ 이번 코스에 추가됨';
   btn.classList.add('added');
 } else {
   btn.textContent = '+ 이번 코스에 추가하기';
   btn.classList.remove('added');
 }
 go('detail');
}

function addToCourse(){
 if(!course.includes(selected.id)){
   course.push(selected.id);
   const btn = document.getElementById('addToCourseBtn');
   btn.textContent = '✓ 이번 코스에 추가됨';
   btn.classList.add('added');
   toast('내 코스에 저장되었습니다.');
 } else {
   toast('이미 내 코스에 담긴 공간입니다.');
 }
}

function renderCourse(){
 const items = document.getElementById('courseItems'), chosen = places.filter(p=>course.includes(p.id));
 document.getElementById('courseCount').textContent = chosen.length+'곳';
 if(!chosen.length){ items.innerHTML='<div class="empty">아직 추가한 공간이 없어요.</div>'; return; }
 items.innerHTML = chosen.map((p,i)=>`
   <div class="course-item">
     <span class="course-num">${i+1}</span>
     <div style="flex:1"><b>${p.name}</b> <span class="sub">(${p.stay}분 체류)</span></div>
     <button class="back" onclick="removeCourse(${p.id})">삭제</button>
   </div>`).join('');
 const total = chosen.reduce((s,p)=>s+travelTime(p)*2+p.stay, 0);
 document.getElementById('courseDuration').textContent = total+'분';
 document.getElementById('courseWait').textContent = waitMinutes+'분';
 document.getElementById('courseBuffer').textContent = (waitMinutes-total)+'분';
}

function removeCourse(id){ course=course.filter(x=>x!==id); renderCourse(); toast('코스에서 삭제했어요.'); }
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>t.classList.remove('show'),1800); }
document.getElementById('recentPlace').textContent = '아직 확인한 공간이 없어요.';
