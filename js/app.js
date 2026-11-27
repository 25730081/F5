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
 *  - 헤더: 우측을 관심 공간 하트(♥) 바로가기로 표시 (숫자 없음)
 *  - 진행 화면: 대기시간 ±10분 조절을 작게·가운데 정렬 / 코스 타임라인은 '도보 · 체류'를 한 줄로, 장소 간격 확대
 *  - 코스 종료 화면: '오늘의 코스' 가운데 정렬
 *  - 마이페이지 코스 카드: [원형 타이머 | 코스 제목·날짜·대기 | 장소 목록]을 한 행에 배치
 *  - 관심 공간: 간략 주소 표시 · 지도 아래와 같은 형태의 필터(장소/영업중/정렬)
 *  - 코스 상세: 하단 버튼을 '다시 시작 + 장소 바꾸기' 한 줄로 정리(하단 메뉴 중앙 버튼과 겹침 해소), 삭제는 본문 맨 아래로
 *
 * v11 변경 요약
 *  - 헤더: 알림(🔔) 아이콘 추가 · 코스별로 '장소 출발 5분 전'(DEP_PRE), '웨이팅 차례 10분 전'(WAIT_PRE) 알림
 *  - 웨이팅 장소: 검색창 추가(카카오 장소 검색) · 입력하면 관련 장소 목록 · 엔터를 누르면 지도에 마커로 표시 → 마커를 눌러 선택
 *  - 웨이팅 장소 선택 + 대기시간 입력을 한 페이지로 통합(기존 '대기시간 입력' 페이지 삭제) · 장소를 고르면 아래에 대기시간 입력이 나타남
 *
 * v12 변경 요약
 *  - 코스 검색(지도) 화면: 정렬 '거리 가까운 순'을 기본·맨 위로 · 담기 버튼을 카트 아이콘으로 · 장소 이름 검색창을 목록 위 필터 자리로 이동
 *  - 장소 종류 필터를 지도 안(위쪽 칩)으로 이동: 서점 버튼을 누르면 서점만 표시 (다시 누르면 전체)
 *  - '장소를 1곳 이상 담아주세요' 버튼 삭제: 카트 아이콘으로 담으면 그때 '코스 확인' 버튼이 나타남
 *  - 모든 화면: 뒤로가기는 < 아이콘 하나로 통일(옆 글자 삭제) · 안내/참고/주의 문구는 우측 정렬 ? 툴팁(눌러서 열기)
 *
 * v13 변경 요약
 *  - 웨이팅 장소: 지도 삭제 · 검색(입력 시 관련 장소 / 엔터 시 검색 결과) 목록에서 눌러 바로 선택
 *  - 코스 확인: 담은 장소가 1곳이면 ✕ 숨김 · '다른 장소 더 담기' 버튼 대신 '오늘의 0차 코스' 옆 ＋ 아이콘 · 하단 [코스 시작하기(메인) | 저장(작게)] 좌우 배치
 *  - 코스 시작하기 / 저장 모두 마이페이지에 저장 · 진행 화면에 웨이팅 남은 시간 실시간(초 단위) 카운트
 *  - 코스 담기(지도): 장소 이름 검색창을 영업중 · 정렬과 같은 행·같은 높이로
 *  - 헤더: 하트(관심 공간) 제거 · 알림은 '현재 진행 중인 코스'의 출발/웨이팅 알림이 시간에 맞춰 차례로 도착
 *
 * v14 변경 요약
 *  - 마이페이지: 처음 상태의 샘플 코스 2개 · 관심 공간 삭제(새로고침하면 비어 있음)
 *  - 코스 이름: '코스 N' 대신 사용자가 정한 웨이팅 음식점 이름 · 내 코스에 검색(음식점·장소) · 기간(오늘/7일/30일) · 정렬(최신/오래된/대기 긴 순) 필터
 *  - 관심 공간: '♥ 해제' 대신 쓰레기통 아이콘으로 삭제
 *  - 모든 화면: ? 툴팁을 페이지 제목과 같은 행에 배치 · 상단 여백 축소
 *  - 진행 화면: 웨이팅 남은 시간 타이머 · '코스 종료' 버튼 삭제 → 대기시간이 끝나면 자동 종료 후 만족도 조사(좋아요/별로에요)
 *  - 미니 플레이어: 남은 시간(굵고 크게) + 옆에 'N시까지 복귀' + 아래에 이동해야 할 장소
 *
 * v16 변경 요약
 *  - 로그인 화면 추가: 마이페이지 · 홈 '웨이팅 시간 등록하기' · 하단 등록 버튼(그 밖에 로그인이 필요한 화면 포함)은 로그인 전이면 로그인 화면으로
 *  - 로그인 후 원래 가려던 화면으로 이동 · '로그인 상태 유지'를 켜면 새로고침해도 유지(localStorage '0cha:auth') · 마이페이지 맨 아래 로그아웃
 *  - 지금은 서버 없이 화면 흐름만 동작 (아이디·비밀번호가 비어 있지 않으면 로그인, 간편 로그인도 데모 로그인)
 *
 * v17 변경 요약
 *  - 박물관·미술관·쇼핑은 data/seoul_museum.json · seoul_gallery.json · seoul_shopping.json 에서 읽음 (장소 상세에 '분류' 표시)
 *  - 비짓서울 API는 카페 · 체험관광(공예체험 Cq3m6s6 · 전통체험 Cd0m9o0)만 호출 · 마트/창고형 제외
 *  - 전시회 버튼·데이터 삭제 (비짓서울 전시회 데이터가 대부분 2022~2023년에 끝난 전시라 제외)
 *  - 홈 리디자인(v17): 스톱워치 히어로 · 안내 문구 3장 · 인기 있는 공간 · 추천 코스 카드 · 떠 있는 하단 메뉴 (사진 자리는 네모 박스)
 *  - 계정별 저장 정리: 관심 공간·내 코스를 계정 키로 저장 · 로그아웃하면 화면에서만 지우고 다시 로그인하면 복원
 *    장소키에 좌표 포함(같은 이름 지점 구분) · 장소가 늦게 올라와도 저장된 코스가 잘리지 않음
 *
 * v18 변경 요약 (디자인 시안 반영 · 세룰리안 블루 테마)
 *  - 전체 화면 컬러 통일: 로얄 블루 #4169E1 · 라이트 블루 #E8EDFF · 네이비 #1F2D5B · 그레이 블루 #6B7A99 · 화이트 #F8FAFF
 *  - 헤더: 로고 + 흰 원형 알림 버튼 / 하단 메뉴: 떠 있는 둥근 바 + 큰 원(마이페이지에서는 마이페이지가 큰 원)
 *  - 로그인·회원가입: 상단 [로그인 | 회원가입] 탭 · 로그인 상태 유지 + 비밀번호 찾기 한 줄 · 하단 '아직 회원이 아니신가요?'
 *  - 웨이팅 장소: 검색 결과를 흰 카드 목록(이름 / 분류 | 주소 / >)으로 · 입력 지우기(✕)
 *  - 웨이팅 정보: 선택한 장소 카드 · 대기시간 카드(10분·30분·1시간·2시간·3시간) · '오후 3시 30분에 대기 완료 예정' 안내 · 등록하기
 *  - 지도: 카테고리 칩을 지도 위 줄로 · 확대/축소·웨이팅 장소·코스 길찾기 버튼 · 웨이팅 장소는 파란 점
 *    장소 목록: 카테고리 아이콘 원 · '도보 N분 • 거리' · 하트 · 담기 알약 버튼 / 영업중·정렬은 드롭다운
 *  - 코스 확인: 원형 여유 카드 · 한 줄 장소 카드(⋮⋮ · 번호 · 아이콘 · −/+) · 타임라인 장소 카드 · 복귀 여유 깃발 박스
 *  - 진행: '식당 > 동네' 경로 · '지금' 카드(사진 자리 + 길찾기) · 복귀 여유 초록 알약 · 현재 장소 강조 타임라인
 *  - 마이페이지: 프로필 카드(아이디 · 일반 회원 · 로그아웃) · 코스 카드(총 N분 링 · 장소 번호 목록 · >) · 관심 공간 카드(휴지통)
 */
const AREAS=[
 {n:'성수동',lat:37.5446,lng:127.0557},
 {n:'건대입구',lat:37.5404,lng:127.0692},
 {n:'서울숲',lat:37.5444,lng:127.0374},
 {n:'홍대입구',lat:37.5572,lng:126.9245},
 {n:'강남역',lat:37.4979,lng:127.0276}];
const CAT_ORDER=['서점','도서관','공원','카페','쇼핑','체험관광','미술관','박물관'];
const CE={서점:'📚',도서관:'🏛️',공원:'🌳',카페:'☕',쇼핑:'🛍️',체험관광:'🎨',미술관:'🖌️',박물관:'🏺'};
const BUF=10;             // 복귀 여유 시간(분)
const DSTAY=10;           // 담을 때 가정하는 기본 체류 시간(분) — 시간 부족 계산에만 쓰고 STEP 2에는 표시하지 않음
const COL=['#4169E1','#2E9E5B','#E07B2E','#8B5CF6','#0E8FA3','#D9467F','#5B6B8C','#A15C1F'];   // v18: 선택 순서별 색 (1 로얄 블루 · 2 초록 · 3 주황 …, 흰 글자 대비 확보)
const colr=j=>COL[j%COL.length];
const CC={서점:'#4f6bed',도서관:'#8b5cf6',공원:'#16a56b',카페:'#e8803a',쇼핑:'#e5528a',체험관광:'#d97706',미술관:'#7c3aed',박물관:'#0f766e'};   // 카테고리 색
const ICP={
 서점:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6"/>',
 도서관:'<path d="M3.5 9.5 12 4l8.5 5.5z"/><path d="M6 12v6M10 12v6M14 12v6M18 12v6M4 20.5h16"/>',
 공원:'<path d="M12 21v-6.5"/><path d="M12 14.5c-3.4 0-6-2.4-6-5.4 0-1.8 1-3.2 2.4-3.9C9 3.7 10.3 3 12 3s3 .7 3.6 2.2C17 5.9 18 7.3 18 9.1c0 3-2.6 5.4-6 5.4z"/>',
 카페:'<path d="M5 9h11v4.5A5.5 5.5 0 0 1 10.5 19 5.5 5.5 0 0 1 5 13.5z"/><path d="M16 10.5h1.5a2.3 2.3 0 0 1 0 4.6H16M8 3.5v2M12 3.5v2"/>',
 쇼핑:'<path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
 체험관광:'<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
 미술관:'<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-1.3-1.1-1.5-1.1-2.7 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r=".9"/><circle cx="10.5" cy="7.2" r=".9"/><circle cx="15" cy="7.8" r=".9"/>',
 박물관:'<path d="M4 9.5 12 4l8 5.5"/><path d="M5.5 9.5h13M7 12v6M12 12v6M17 12v6M4 20.5h16"/>',
 기타:'<circle cx="12" cy="12" r="5"/>'};
const ico=c=>`<svg class="ic2" viewBox="0 0 24 24" aria-hidden="true">${ICP[c]||ICP.기타}</svg>`;
const cb=c=>`<span class="cb" style="--c:${CC[c]||'#667085'}">${ico(c)}</span>`;   // 테두리 있는 장소 배지
const TGT='<svg class="ic2 tg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="8" fill="none"/></svg>';   // 웨이팅 장소(과녁)
const P=[];               // 장소 목록 (인덱스 = 장소 ID, 추가만 하고 순서는 바꾸지 않음)
let loadError=false;

const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:null};
const vsRows=d=>Array.isArray(d)?d:(d&&(d.DATA||d.data))||[];   // 비짓서울 JSON: {meta, DATA:[...]} (배열만 있는 파일도 허용)
const SOURCES=[
 {url:'data/seoul_bookstore_100.json',pick:d=>d.DATA,
  map:x=>({n:x.store_name,c:'서점',e:CE.서점,s:30,lat:num(x.xcnts),lng:num(x.ydnts),addr:x.adres?'서울 '+x.adres:'',tel:x.tel_no,url:x.hmpg_url||x.sns,
   hrsTxt:x.hours,closedTxt:x.closed,note:x.hours_note,wk:parseWeek(x.hours),cd:parseClosed(x.closed)})},
 {url:'data/seoul_library_100.json',pick:d=>d.libraries,
  map:x=>({n:x.name,c:'도서관',e:CE.도서관,s:40,lat:x.coordinates&&x.coordinates.latitude,lng:x.coordinates&&x.coordinates.longitude,addr:x.address,tel:x.phone,url:x.website,closed:x.closedDays,hours:x.hours})},
 {url:'data/seoul_park_130.json',pick:d=>d.DATA,
  map:x=>({n:x.park_nm,c:'공원',e:CE.공원,s:40,lat:num(x.ycrd),lng:num(x.xcrd),addr:x.park_addr,tel:x.telno,url:x.url})},
 // 박물관·미술관·쇼핑: 비짓서울 데이터를 미리 받아 둔 JSON (tools/visitseoul_json.html 로 생성 · {meta, DATA:[...]} 형식)
 {url:'data/seoul_museum.json',pick:vsRows,map:x=>({...x,c:'박물관',e:CE.박물관,lat:num(x.lat),lng:num(x.lng)})},
 {url:'data/seoul_gallery.json',pick:vsRows,map:x=>({...x,c:'미술관',e:CE.미술관,lat:num(x.lat),lng:num(x.lng)})},
 {url:'data/seoul_shopping.json',pick:vsRows,map:x=>({...x,c:'쇼핑',e:CE.쇼핑,lat:num(x.lat),lng:num(x.lng)})}];
 // 카페 · 체험관광(공예체험·전통체험)은 파일 맨 아래 비짓서울 API 코드가 직접 받아 addPlaces()로 추가

function addPlaces(list,fromJson){
 list.forEach(p=>{
  p.n=String(p.n||'').trim();
  if(!p.n||p.lat==null||p.lng==null||p.lat<33||p.lat>39||p.lng<124||p.lng>132)return;   // 좌표 없거나 범위 밖이면 제외
  P.push({e:'📍',...p,s:DSTAY,j:!!fromJson});   // 출처별 s 값과 상관없이 기본 체류는 DSTAY
  indexPlace(P.length-1);
 });
 resolveFavs();   // 저장해 둔 관심 공간 중 방금 올라온 장소가 있으면 복원
 if(rehydrateCourses())courseDirty=true;   // 저장해 둔 코스 중 장소가 덜 채워졌던 것을 다시 채움
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
const S={sheetX:'c',i:'home',from:'map',wait:120,cats:[],sel:[],stay:{},focus:null,view:'list',q:'',start:null,rest:'웨이팅 중인 식당',area:'성수동',loc:{lat:AREAS[0].lat,lng:AREAS[0].lng},fin:null,editId:null,active:false,curId:null,seg:'c',cid:null,sort:'near',onow:false,catOpen:false,favs:[],courses:[],toast:'',top:0,rsheet:false,fcats:[],fcatOpen:false,fonow:false,fsort:'def',wadj:false,mback:null,picked:false,wq:'',sugg:[],sgst:'',res:[],rstat:'',cand:null,swait:false,nopen:false,unread:0,nfired:{},nlog:[],hs:0,cq:'',cdate:'all',csort:'new',sat:'',user:null,after:null,lid:'',lpw:'',lkeep:true,lerr:'',lbusy:false,jid:'',jpw:'',jpw2:'',jerr:''};
// 로그인: '로그인 상태 유지'를 켜면 새로고침해도 유지 (코스 저장값과 별도 키)
const AUTH='0cha:auth';
// 회원정보 저장소: 구글 시트(member) ← Apps Script 웹앱 (컬럼: userId | password(해시) | createdate)
const MEMBER_API='https://script.google.com/macros/s/AKfycbyoKyI4dQK8vx73z06E0QxpaneA3qi429dzX4G8hO2js_bsdhsLsKmwJibgiC1B9ish/exec';
async function memberApi(payload){
 const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);
 try{
  const r=await fetch(MEMBER_API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:ctl.signal});   // text/plain → CORS preflight 없이 호출
  return await r.json();
 }catch(e){return{ok:false,message:'서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요'}}
 finally{clearTimeout(tm)}
}
S.user=(()=>{try{const v=JSON.parse(localStorage.getItem(AUTH));return v&&typeof v.id=='string'&&v.id?{id:v.id.slice(0,40),via:v.via||'id'}:null}catch(e){return null}})();
/* ---------- 계정별 저장: 관심 공간 · 내 코스 (localStorage) ----------
 *   관심 공간 키: 0cha:favs:<로그인방식>:<아이디>    값: ["장소키", ...]
 *   내 코스  키: 0cha:courses:<로그인방식>:<아이디> 값: [{id, sel:["장소키"...], stay:{"장소키":분}, wait, rest, area, loc, date, review}, ...]
 *   장소키 = "카테고리|장소명|위도|경도" (같은 이름의 체인 지점도 구분). 예전에 저장한 "카테고리|장소명" 도 그대로 읽음
 *   장소 ID(P의 순번)는 데이터가 올라오는 순서에 따라 바뀌어서 장소키로 저장하고, 불러올 때 현재 ID로 되돌린다
 *   로그아웃: 화면(메모리)에서만 지우고 저장소는 그대로 → 같은 계정으로 다시 로그인하면 그대로 다시 나옴
 *   장소가 아직 안 올라온 코스는 원본(_raw)을 그대로 보관 → 늦게 올라와도, 끝내 못 찾아도 저장된 내용이 지워지지 않음 */
const FAVP='0cha:favs:',COURSEP='0cha:courses:';
const acctKey=pre=>S.user?pre+(S.user.via||'id')+':'+encodeURIComponent(S.user.id):null;
const pkey=p=>p.c+'|'+p.n+'|'+(+p.lat).toFixed(5)+'|'+(+p.lng).toFixed(5);
const PIDX=new Map();   // 장소키 · 예전 키(카테고리|장소명) → 장소 ID
function indexPlace(k){const p=P[k],a=pkey(p),b=p.c+'|'+p.n;if(!PIDX.has(a))PIDX.set(a,k);if(!PIDX.has(b))PIDX.set(b,k)}
const findKey=s=>PIDX.has(s)?PIDX.get(s):-1;
const readJSON=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
let jsonDone=false,apiDone=false,placesFinal=false;   // 장소 받기(JSON 파일 + 비짓서울 API)가 모두 끝났는지
let courseDirty=false;   // 늦게 올라온 장소로 코스가 채워졌는지 (마이페이지 다시 그리기용)

// 관심 공간
let favMiss=[];   // 저장돼 있지만 아직 장소 목록에 안 올라온 장소키
function resolveFavs(){if(!favMiss.length)return;favMiss=favMiss.filter(s=>{const k=findKey(s);if(k<0)return true;if(!S.favs.includes(k))S.favs.push(k);return false})}
function loadFavs(){S.favs=[];favMiss=[];const k=acctKey(FAVP);if(!k)return;const v=readJSON(k);if(Array.isArray(v))favMiss=v.filter(x=>typeof x=='string').slice(0,500);resolveFavs()}
function saveFavs(){const k=acctKey(FAVP);if(!k)return;try{localStorage.setItem(k,JSON.stringify([...S.favs.filter(i=>P[i]).map(i=>pkey(P[i])),...favMiss]))}catch(e){}}

// 내 코스
let cLast='';   // 마지막으로 저장한 내용 (바뀐 때만 다시 씀)
function hydrate(r){   // 저장 형태 → 화면용 (장소키 → 장소 ID)
 const names=(Array.isArray(r.sel)?r.sel:[]).filter(x=>typeof x=='string'),sel=names.map(findKey).filter(k=>k>=0),stay={};
 Object.entries(r.stay&&typeof r.stay=='object'?r.stay:{}).forEach(([n,v])=>{const k=findKey(n);if(k>=0&&Number.isFinite(v))stay[k]=v});
 const {_raw,_miss,...c}={...r,sel,stay},miss=names.length-sel.length;
 return miss?{...c,_raw:r,_miss:miss}:c}
function toRaw(c){   // 화면용 → 저장 형태. 장소가 덜 올라온 코스는 원본을 그대로 저장
 if(c._raw)return c._raw;
 const {_raw,_miss,...o}=c;
 return {...o,sel:c.sel.filter(k=>P[k]).map(k=>pkey(P[k])),stay:Object.fromEntries(Object.entries(c.stay||{}).filter(([k])=>P[k]).map(([k,v])=>[pkey(P[k]),v]))}}
function loadCourses(){S.courses=[];cLast='';const k=acctKey(COURSEP);if(!k)return;const v=readJSON(k);if(!Array.isArray(v))return;
 S.courses=v.filter(r=>r&&typeof r=='object'&&Number.isFinite(r.id)&&Array.isArray(r.sel)&&r.sel.length).slice(0,200).map(hydrate);
 cLast=JSON.stringify(S.courses.map(toRaw))}
function rehydrateCourses(){let ch=false;S.courses=S.courses.map(c=>{if(!c._miss)return c;const n=hydrate(c._raw);if((n._miss||0)!==c._miss)ch=true;return n});return ch}
function saveCourses(){const k=acctKey(COURSEP);if(!k)return;try{const s=JSON.stringify(S.courses.map(toRaw));if(s!==cLast){localStorage.setItem(k,s);cLast=s}}catch(e){}}

// 로그인 · 로그아웃 · 장소 받기 완료
function loadAccount(){loadFavs();loadCourses()}
function clearAccount(){S.favs=[];favMiss=[];S.courses=[];cLast=''}
function checkFinal(){if(jsonDone&&apiDone&&!placesFinal){placesFinal=true;if(['my','mc'].includes(S.i))draw()}}
function placesDone(){apiDone=true;checkFinal()}   // 비짓서울 API 코드가 받기를 마치면 호출 (성공·실패 상관없이)
loadAccount();   // 새로고침 후에도 '로그인 상태 유지'면 그 계정의 관심 공간·코스를 읽어옴
(function(){const v=SAVED;if(!v||typeof v!='object')return;
 if(Number.isFinite(v.wait))S.wait=Math.min(300,Math.max(10,v.wait));
 if(Array.isArray(v.cats))S.cats=v.cats.filter(c=>CAT_ORDER.includes(c));
 if(typeof v.rest=='string')S.rest=v.rest.slice(0,40);
 {const l=v.loc,ok=l&&Number.isFinite(l.lat)&&Number.isFinite(l.lng)&&l.lat>33&&l.lat<39&&l.lng>124&&l.lng<132;
  if(ok)S.loc={lat:l.lat,lng:l.lng};else if(AREAS.some(a=>a.n==v.area)){const a=aref(v.area);S.loc={lat:a.lat,lng:a.lng}}
  S.area=areaLabel(S.loc)}
 if(['list','card'].includes(v.view))S.view=v.view;
 if(['def','near'].includes(v.sort))S.sort=v.sort;
 if(v.onow===true)S.onow=true;
 if(v.active&&Number.isFinite(v.start)){S.active=true;S.start=v.start}
 if(Number.isFinite(v.editId))S.editId=v.editId;
 if(Number.isFinite(v.curId))S.curId=v.curId;
})();
const nm=a=>a.map(k=>P[k].n);
const nmap=m=>Object.fromEntries(Object.entries(m).filter(([k])=>P[k]).map(([k,v])=>[P[k].n,v]));
function save(){try{localStorage.setItem(KEY,JSON.stringify({wait:S.wait,cats:S.cats,rest:S.rest,area:S.area,loc:S.loc,view:S.view,sort:S.sort,onow:S.onow,active:S.active,start:S.start,editId:S.editId,curId:S.curId,sel:nm(S.sel),stay:nmap(S.stay)}))}catch(e){}}
// 저장된 장소 이름 → 현재 장소 ID (데이터 로드 후 복원)
function restore(){
 const v=SAVED;if(!v||typeof v!='object')return false;
 const ids=a=>(Array.isArray(a)?a:[]).map(n=>P.findIndex(p=>p.n==n)).filter(k=>k>=0);
 const sm=m=>Object.fromEntries(Object.entries(m||{}).map(([n,x])=>[P.findIndex(p=>p.n==n),x]).filter(([k])=>k>=0));
 S.sel=ids(v.sel);S.stay=sm(v.stay);
 return true;
}
async function loadPlaces(){
 const res=await Promise.allSettled(SOURCES.map(async s=>{const r=await fetch(s.url);if(!r.ok)throw new Error(r.status+' '+s.url);return s.pick(await r.json()).map(s.map)}));
 res.forEach(r=>{if(r.status=='fulfilled')addPlaces(r.value,true);else{loadError=true;console.error(r.reason)}});
 restore();
 jsonDone=true;checkFinal();
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
// 서점 운영시간 문자열 → 요일별 시간. 예) '월~금 11:00-20:30 / 토 11:00-18:30' · '평일 10:00-17:00' · '화-금 13:00-23:00 / 주말·공휴일 11:00-23:00' · '10:00-22:00'(매일)
const WD='일월화수목금토';
function parseWeek(s){
 s=String(s||'').trim();if(!s||s=='미확인')return null;
 const w=Array(7).fill(null);let hol=null,any=false;
 s.split('/').forEach(seg=>{
  const m=/^(.*?)\s*(\d{1,2}:\d{2})\s*[-~–]\s*(\d{1,2}:\d{2})\s*$/.exec(seg.trim());if(!m)return;
  const t={open:m[2],close:m[3]},spec=m[1].trim(),days=[];
  if(!spec)days.push(0,1,2,3,4,5,6);
  else spec.split(/[·,\s]+/).forEach(tok=>{
   if(!tok)return;
   if(tok=='평일'){days.push(1,2,3,4,5);return}
   if(tok=='주말'){days.push(0,6);return}
   if(tok=='공휴일'){hol=t;return}
   const r=/^([일월화수목금토])[~\-–]([일월화수목금토])$/.exec(tok);
   if(r){let a=WD.indexOf(r[1]);const b=WD.indexOf(r[2]);for(let i=0;i<7;i++){days.push(a);if(a==b)break;a=(a+1)%7}return}
   if(tok.length==1&&WD.includes(tok))days.push(WD.indexOf(tok));
  });
  if(days.length){days.forEach(d=>{w[d]=t});any=true}
 });
 return any?{w,hol}:null;
}
// 서점 휴무 문자열 → 쉬는 요일 Set. 예) '일요일' · '월요일, 화요일' · '월~목요일' · '금요일, 토요일 정기휴무' (설날·추석·공휴일은 요일이 아니므로 무시)
function parseClosed(s){
 const set=new Set();
 const rest=String(s||'').replace(/([일월화수목금토])\s*[~\-–]\s*([일월화수목금토])\s*요일/g,(_,a,b)=>{let i=WD.indexOf(a);const e=WD.indexOf(b);for(let n=0;n<7;n++){set.add(i);if(i==e)break;i=(i+1)%7}return ' '});
 rest.replace(/([일월화수목금토])\s*요일/g,(_,a)=>{set.add(WD.indexOf(a));return ' '});
 return set;
}
// 서점 영업 여부: true 영업중 / false 휴무·영업시간 아님 / null 정보 없음
function bookState(p){
 const d=new Date().getDay();
 if(p.cd&&p.cd.has(d))return false;
 const t=p.wk&&p.wk.w[d];if(!t)return null;
 const o=mins(t.open);let c=mins(t.close);if(o==null||c==null)return null;
 if(c==0)c=1440;
 const n=clock();return c>o?(n>=o&&n<c):(n>=o||n<c);   // 마감이 시작보다 이르면 자정을 넘기는 영업
}
// 장소 상세용 오늘 운영시간 {t:'19:00 - 21:00', st:'영업중', c:'ok|err|'}
function todayHrs(p){
 const d=new Date().getDay(),n=clock();
 const mk=t=>{const o=mins(t.open);return{t:`${t.open} - ${t.close}`,st:openState(p)===true?'영업중':(o!=null&&n<o?'영업 전':'영업 종료'),c:openState(p)===true?'ok':''}};
 if(p.c=='서점'&&'wk' in p){
  if(p.cd&&p.cd.has(d))return{t:'',st:'휴무',c:'err'};
  const t=p.wk&&p.wk.w[d];return t?mk(t):{t:'',st:p.wk?'확인 필요':'정보 없음',c:''};
 }
 if(p.c=='도서관'&&p.hours){
  if(libClosed(p))return{t:'',st:'휴관',c:'err'};
  const t=p.hours.open!=null?p.hours:(d==0?p.hours.holiday:d==6?p.hours.saturday:p.hours.weekday);
  return t&&t.open?mk(t):{t:'',st:'정보 없음',c:''};
 }
 if(p.c=='공원')return{t:'상시 개방',st:'',c:''};
 if(p.hrsTxt)return{t:p.hrsTxt,st:'',c:''};   // 비짓서울 장소: 이용시간 원문(자유 텍스트) 그대로 표시
 return{t:'',st:'정보 없음',c:''};
}
function openState(p){
 if(p.c=='공원')return true;
 if(p.c=='서점'&&'wk' in p)return bookState(p);
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
const setLoc=(lat,lng)=>{if(S.active)return;S.picked=true;S.rest='웨이팅 중인 식당';S.swait=true;moveTo(lat,lng);draw()};

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
 user:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
 userF:'<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7.6" r="4.4"/><path d="M3.6 21c0-4.4 3.9-7 8.4-7s8.4 2.6 8.4 7z"/></svg>'};
// v18 디자인 공통 아이콘
const sv2=(p,w,sw)=>`<svg viewBox="0 0 24 24" width="${w||20}" height="${w||20}" fill="none" stroke="currentColor" stroke-width="${sw||2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const UI={
 chev:sv2('<path d="m9 6 6 6-6 6"/>',22,2.2),
 chevS:sv2('<path d="m9 6 6 6-6 6"/>',16,2.4),
 down:sv2('<path d="m6 9 6 6 6-6"/>',18,2.4),
 search:sv2('<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.5-4.5"/>',26,2),
 searchS:sv2('<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.5-4.5"/>',20,2),
 x:sv2('<path d="M6 6l12 12M18 6 6 18"/>',22,2),
 info:sv2('<circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.6" r=".6" fill="currentColor"/>',22,1.9),
 clock:sv2('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.3 2"/>',18,2),
 cal:sv2('<rect x="3.5" y="5" width="15" height="14.5" rx="3"/><path d="M3.5 10h15M8 3v4M14 3v4"/><circle cx="18" cy="18" r="3.6" fill="#fff"/><path d="M18 16.6v1.6l1 .7"/>',46,1.6),
 flag:sv2('<path d="M6 21V4"/><path d="M6 4h11l-2.5 4L17 12H6"/>',22,1.9),
 plane:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M21.4 2.6a1 1 0 0 0-1.1-.2L2.9 9.7a1 1 0 0 0 .1 1.9l7 2.3 2.3 7a1 1 0 0 0 1.9.1l7.3-17.4a1 1 0 0 0-.1-1z"/></svg>',
 planeO:sv2('<path d="M21 3 3 10.5l7.2 2.6L13 21z"/><path d="m10.2 13.1 4-4"/>',22,2),
 pin:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z"/></svg>',
 feet:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><g fill="currentColor"><ellipse cx="8" cy="7.5" rx="3.2" ry="4.6"/><ellipse cx="8" cy="15.6" rx="2.2" ry="1.8"/><ellipse cx="16" cy="11.5" rx="3.2" ry="4.6"/><ellipse cx="16" cy="19.6" rx="2.2" ry="1.8"/></g></svg>',
 trash:sv2('<path d="M4 6.5h16M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7M6.2 6.5l.9 12.6a2 2 0 0 0 2 1.9h5.8a2 2 0 0 0 2-1.9l.9-12.6M10 10.5v6M14 10.5v6"/>',24,1.9),
 crown:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#F5A623" d="M3 8.5l4.5 3.5L12 5l4.5 7L21 8.5 19.3 18H4.7z"/><rect x="4.7" y="18.6" width="14.6" height="2" rx="1" fill="#E8931A"/></svg>',
 plus:sv2('<path d="M12 5v14M5 12h14"/>',22,2.2),
 minus:sv2('<path d="M5 12h14"/>',22,2.2),
 shoe:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3 15.5c0-1.5.6-3 1.8-4.2L7 9l2.6 2.4c.9.8 2.1 1.1 3.3.8l2.3-.6c1.6 2.4 4.1 3.4 6.3 3.9.3.1.5.4.5.7v1.3c0 .8-.7 1.5-1.5 1.5H5.5A2.5 2.5 0 0 1 3 16.5z"/></svg>',
 me:sv2('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5"/>',26,2),
 fork:sv2('<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.2 1.2-3.5 3.6-3.5 6.5V13H17"/>',22,2),
 sparkle:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 9 3 4M11 7l1-5M14 12h5"/></svg>'};
// 거리 표시: 120m · 1.2km
const distTxt=(k,ar)=>{const m=dkm(ar||S.loc,P[k])*1000*1.3;return m<1000?Math.round(m/10)*10+'m':(m/1000).toFixed(1)+'km'};
// 시각 표시: 오후 3시 30분
const ampm=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mi=m%60,h12=h%12||12;return `${h<12?'오전':'오후'} ${h12}시${mi?' '+mi+'분':''}`};
const tabOf=()=>{const i=S.i;if(i=='prog')return S.active?'reg':'home';return {home:'home',done:'home',reg:'reg',map:'reg',confirm:'reg',my:'my',mc:'my'}[i]};
const nav=()=>{const a=tabOf(),go=S.active?(S.sel.length?'prog':'map'):'reg';   // v18.1: 모든 화면 같은 모양 — 가운데 큰 원 '코스'
 return `<nav class="nav nav2" aria-label="메인 메뉴"><button class="${a=='home'?'on':''}" data-go="home"${a=='home'?' aria-current="page"':''}>${IC.home}<span>홈</span></button><button class="big ${a=='reg'?'on':''}" data-go="${go}"${a=='reg'?' aria-current="page"':''}>${IC.route}<span>코스</span></button><button class="${a=='my'?'on':''}" data-go="my"${a=='my'?' aria-current="page"':''}>${IC.user}<span>마이페이지</span></button></nav>`};
const LOGO=(()=>{const R=10.5,C=2*Math.PI*R,fr=[.3,.24,.2];let acc=0;   // 숫자 0 = 코스가 채워지는 원형 타이머 (색은 코스 선택 순서 색, 남은 구간은 복귀 여유)
 const seg=fr.map((f,j)=>{const len=f*C,o=-acc;acc+=len;return `<circle cx="16" cy="16" r="${R}" stroke="${COL[j]}" stroke-dasharray="${len-1.6} ${C}" stroke-dashoffset="${o}"/>`}).join('');
 return `<svg class="lg0" viewBox="0 0 32 32" aria-hidden="true"><circle class="tk" cx="16" cy="16" r="${R}"/><g transform="rotate(-90 16 16)">${seg}</g></svg>`})();
// 안내·참고·주의 문구: 모든 화면에서 ? 아이콘 툴팁(누르면 열림 · 우측 정렬). 뒤로가기는 < 아이콘 하나로 통일
const BKI=svg('<path d="m15 18-6-6 6-6"/>');
const backBtn=(go,label)=>`<button class="back" data-go="${go}" aria-label="뒤로 가기${label?' · '+label:''}">${BKI}</button>`;
const tip=(k,t)=>`<span class="tipw"><button class="tipq ${k=='주의'?'warn':''}" data-tip="1" aria-expanded="false" aria-label="${k} 보기"><span aria-hidden="true">?</span></button><span class="tipb" role="tooltip"><b>${k}</b>${t.split(/(?<=\.)\s+/).join('<br>')}</span></span>`;
const note=(k,t)=>`<div class="tb">${tip(k,t)}</div>`;                       // ? 만 우측 정렬
const tbar=(back,k,t)=>`<div class="tb">${back}${tip(k,t)}</div>`;
// 페이지 제목 행: [뒤로 <] 제목 ........ [추가 버튼] [?] — 모든 화면에서 제목과 ? 툴팁이 같은 행
const ttl=(title,k,t,o)=>{o=o||{};return `<div class="tb th">${o.back||''}<h2>${title}</h2>${o.x||''}${tip(k,t)}</div>`};            // 왼쪽 < · 오른쪽 ?
// 헤더 우측: 알림
const BELLI='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>';
const bellBtn=()=>`<button class="bellb${S.nopen?' on':''}" data-bell="1" aria-expanded="${S.nopen}" aria-label="알림${S.unread?' · 새 알림 '+S.unread+'개':''}">${BELLI}${S.unread?`<i class="bdg">${S.unread>9?'9+':S.unread}</i>`:''}</button>`;
const hd=()=>`<header class="hd"><button class="logo" data-go="home" aria-label="0차 홈으로 이동">${LOGO}<span>차</span></button><div class="hr">${bellBtn()}</div></header>`;
const toastH=()=>S.toast?`<div class="toast" role="status">${esc(S.toast)}</div>`:'';

/* ---------- 미니 플레이어: 진행 중인 코스를 홈·마이페이지 하단에 띄움(배달 진행 배너처럼) ---------- */
const mpOn=()=>S.active&&S.sel.length&&['home','my','mc'].includes(S.i);
const mpDest=()=>{const j=curStage();if(j>=S.sel.length*3)return '식당으로 복귀';const k=S.sel[Math.floor(j/3)],p=j%3;return p==0?`이동 · ${P[k].n}`:p==1?`체류 · ${P[k].n}`:'복귀 · 식당'};   // 미니 플레이어: 지금 가야 할 곳
const mpLeft=()=>remSec()<=0?'0분':fm(Math.ceil(remSec()/60));
const miniPlayer=()=>{if(!mpOn())return '';   // 남은 시간(크고 굵게) + 몇 시까지 복귀 + 아래에 이동해야 할 장소
 return `<button class="mp ${banner().c}" data-cd="mpc" data-go="prog" aria-label="진행 중인 코스 보기"><span class="mp-ic" aria-hidden="true"><svg class="ic2" viewBox="0 0 24 24" width="22" height="22"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M6 15.8V10a4 4 0 0 1 4-4h5.8"/></svg></span><span class="mp-tx"><span class="mp-r1"><b class="mp-big" data-cd="mpbig">${mpLeft()}</b><span class="mp-ret" data-cd="mpret">${backAt()}까지 복귀</span></span><span class="mp-t" data-cd="mpd">${esc(mpDest())}</span></span><span class="mp-go" aria-hidden="true">›</span></button>`};
const frame=(b,f)=>`${hd()}<main class="body${mpOn()?' hasmp':''}">${b}</main>${f?`<div class="ft">${f}</div>`:''}${miniPlayer()}${nav()}${toastH()}${routeSheet()}${notifSheet()}`;
// v18.1 지도 화면: 지도는 남는 높이를 모두 쓰고, 장소 목록은 아래에서 올라오는 시트(손잡이를 끌어 올리면 커지고 내리면 작아짐 · 네이버지도 장소검색처럼)
const frameM=(top,sheet,f)=>`${hd()}<main class="mapbody"><div class="mtop">${top}</div><section class="bsheet${S.sheetX==='e'?' ex':''}" id="bsheet" aria-label="장소 목록"><button class="sh-h" data-shh="1" aria-label="장소 목록 ${S.sheetX==='e'?'줄이기':'크게 보기'} (위아래로 끌어서 조절)" aria-expanded="${S.sheetX==='e'}"><i></i></button><div class="sheet" id="sheet">${sheet}</div></section></main>${f?`<div class="ft">${f}</div>`:''}${nav()}${toastH()}${notifSheet()}`;
const bar=()=>{let h='';S.sel.forEach((k,j)=>h+=`<i style="width:${cost(k)/S.wait*100}%;background:${colr(j)};color:#fff">${j+1} ${P[k].e} ${cost(k)}′</i>`);const r=rem();
 return `<div class="bar" role="img" aria-label="${r<0?'대기시간 '+fm(-r)+' 초과':'복귀 여유 '+fm(r)}">${h}<i class="${r<0?'x':'m'}" style="flex:1">${r<0?'⚠ '+fm(-r)+' 초과':'여유 '+fm(r)}</i></div>`};
// STEP 3 여유 시간: 원형 타이머 모양 (선택 순서별 색 호 + 가운데 복귀 여유)
const ringSvg=()=>{const R=48,C=2*Math.PI*R,r=rem(),over=r<0;let acc=0;
 const segs=over?`<circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--err)" stroke-width="12"/>`:S.sel.map((k,j)=>{const len=Math.min(cost(k)/S.wait*C,C-acc),g=len>4?1.5:0,o=-acc;acc+=len;return `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${colr(j)}" stroke-width="12" stroke-dasharray="${Math.max(len-g,0)} ${C}" stroke-dashoffset="${o}"/>`}).join('');
 return `<div class="rbc" role="img" aria-label="${over?'대기시간 '+fm(-r)+' 초과':'대기시간 '+fm(S.wait)+' 중 복귀 여유 '+fm(r)}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--fill)" stroke-width="12"/><g transform="rotate(-90 60 60)">${segs}</g></svg><div class="rbt"><span class="sub">${over?'초과':'복귀 여유'}</span><b class="${over?'ov':''}">${fm(Math.abs(r))}</b></div></div>`};
// STEP 3 여유 시간: 원형 타이머 모양 (선택 순서별 색 호 + 가운데 복귀 여유)
const ringBar=x=>`<div class="rb${x?' hasx':''}">${ringSvg()}<div class="rbs"><div><span class="sub">대기시간</span><b>${fm(S.wait)}</b></div><div><span class="sub">코스 사용</span><b>${fm(total())}</b></div></div>${x||''}</div>`;   // v18.1: 번호 점 삭제 · 우측 상단에 + (장소 더 담기)
const cats=()=>CAT_ORDER.filter(c=>c=='카페'||P.some(p=>p.c==c));   // 카페는 API 연결 전이라도 항상 표시
const CATS4=['서점','도서관','공원','카페','쇼핑','체험관광','미술관','박물관'];   // 지도 안 칩 · 관심 공간 필터 (지도 칩은 가로 스크롤)
// 장소 종류 필터: 지도 안(위쪽 칩). 누르면 그 종류만 표시, 같은 칩을 다시 누르거나 '전체'를 누르면 전체
// v18: 지도 위 한 줄 칩 (전체 = 네이비 채움 · 나머지는 흰 알약 + 카테고리 색 아이콘)
const mapCats=()=>`<div class="mcats" role="group" aria-label="장소 종류 (누르면 해당 장소만 지도에 표시)"><button class="mchip ${S.cats.length?'':'on'}" aria-pressed="${!S.cats.length}" data-cat="">전체</button>${CATS4.map(c=>`<button class="mchip ${S.cats.includes(c)?'on':''}" aria-pressed="${S.cats.includes(c)}" data-cat="${c}" style="--c:${CC[c]}">${ico(c)}${c}</button>`).join('')}</div>`;
// 목록 위: 장소 이름 검색 | 영업중 ▾ · 거리 가까운 순 ▾ (드롭다운)
const dd=(id,label,opts,val)=>`<label class="dd"><select id="${id}" aria-label="${label}">${opts.map(([v,t])=>`<option value="${v}" ${val==v?'selected':''}>${t}</option>`).join('')}</select>${UI.down}</label>`;
const mapFlt=()=>`<div class="flt3" role="group" aria-label="필터"><label class="fsr">${UI.searchS}<input id="q" type="search" placeholder="장소 이름 검색" value="${esc(S.q)}" autocomplete="off" aria-label="장소 이름 검색"></label><i class="fbar" aria-hidden="true"></i>${dd('onow','영업 여부',[['all','전체'],['on','영업중']],S.onow?'on':'all')}${dd('sort','정렬',[['near','거리 가까운 순'],['def','기본순']],S.sort)}</div>`;

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
 return [...b,...S.sel.filter(k=>!b.includes(k))]};
// 등록 화면 "갈 수 있는 곳": 반경 안에서 시간이 되는 장소 수
const avail=fresh=>P.map((p,k)=>k).filter(inRad).filter(k=>fresh?cost(k)<=S.wait-BUF:(!S.sel.includes(k)&&fit(k))).length;
const CARTI=on=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>${on?'<path d="m10 10.8 2 2 4-4"/>':''}</svg>`;   // 카트 아이콘 (담으면 체크 표시)
// v18: 알약 버튼 (시안의 '길찾기' 자리) — 코스에 담기 / 담음 / 시간 부족
const addBtn=k=>{const on=S.sel.includes(k),ok=fit(k);return `<button class="addp ${on?'on':''}" data-tog="${k}" ${!on&&!ok?'disabled':''} aria-pressed="${on}" aria-label="${esc(P[k].n)} ${on?'담음, 누르면 빼기':ok?'코스에 담기':'시간 부족'}">${on?sv2('<path d="m5 12.5 4.5 4.5L19 7.5"/>',18,2.6):ok?UI.plane:''}<span>${on?'담음':ok?'담기':'시간 부족'}</span></button>`};
const chain=c=>c.sel.map(k=>P[k].e).join(' → ');
const title=c=>c.sel.map(k=>esc(P[k].n)).join(' → ');
// 코스는 항상 1개 항목으로 저장. 같은 코스를 다시 시작/저장하면 새로 쌓지 않고 덮어씀
const saveCourse=()=>{const old=S.courses.find(x=>x.id==S.editId),c={id:S.editId||Date.now(),sel:[...S.sel],stay:{...S.stay},wait:S.wait,rest:S.rest,area:S.area,loc:{...S.loc},date:'오늘',review:old&&old.review||''},i=S.courses.findIndex(x=>x.id==c.id);if(i>=0)S.courses[i]=c;else S.courses.push(c);S.editId=c.id;return c.id};
const resetBuild=()=>{S.sel=[];S.stay={};S.editId=null;S.focus=null};

/* ---------- 홈 ---------- */
// ===== v17 홈: 히어로(스톱워치 일러스트 · 안내 문구 3장) + 인기 있는 공간 + 추천 코스 =====
// 컬러: 로얄 블루 #4169E1 · 라이트 블루 #E8EDFF · 네이비 #1F2D5B · 그레이 블루 #6B7A99 · 화이트 #F8FAFF (style.css v17 홈)
const HS=[   // v18.2: 히어로 문구 1개 고정 (넘김·자동 전환 없음)
 {t:'줄 서는 시간도 내 시간으로',s:'대기시간만 입력하면<br>다녀올 수 있는 곳을 알려드려요.'}];
const SWATCH=(()=>{   // 스톱워치 일러스트 (SVG 직접 그림 · 외부 이미지 없음)
 const ticks=Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180,r1=i%3?47:44,r2=53,x=v=>(140+Math.sin(a)*v).toFixed(1),y=v=>(138-Math.cos(a)*v).toFixed(1);return `<line x1="${x(r1)}" y1="${y(r1)}" x2="${x(r2)}" y2="${y(r2)}"/>`}).join('');
 const orbit='<ellipse cx="135" cy="150" rx="124" ry="34" transform="rotate(-14 135 150)" fill="none" stroke="url(#swRing)" stroke-width="2.6"/>';
 return `<svg class="sw" viewBox="0 0 260 240" aria-hidden="true"><defs>
<radialGradient id="swBody" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#eef2fc"/><stop offset="1" stop-color="#bccbef"/></radialGradient>
<radialGradient id="swFace" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#eaf0fc"/></radialGradient>
<linearGradient id="swBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7698ff"/><stop offset="1" stop-color="#2f56d6"/></linearGradient>
<linearGradient id="swRing" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4169E1" stop-opacity="0"/><stop offset=".45" stop-color="#8aa6ff" stop-opacity=".95"/><stop offset="1" stop-color="#4169E1" stop-opacity=".05"/></linearGradient>
<clipPath id="swFront"><rect x="-20" y="150" width="300" height="120" transform="rotate(-14 135 150)"/></clipPath>
<filter id="swSh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#4169E1" flood-opacity=".28"/></filter><filter id="swBlur" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="6"/></filter></defs>
<ellipse cx="140" cy="226" rx="70" ry="8" fill="#4169E1" opacity=".22" filter="url(#swBlur)"/>
${orbit}
<g filter="url(#swSh)"><circle cx="140" cy="30" r="15" fill="none" stroke="#e2e8f7" stroke-width="8"/><path d="M127 24a15 15 0 0 1 27-3" fill="none" stroke="#4169E1" stroke-width="4.5" stroke-linecap="round"/>
<rect x="128" y="42" width="24" height="22" rx="5" fill="url(#swBody)" stroke="#dbe2f4"/>
<rect x="196" y="62" width="20" height="16" rx="4" transform="rotate(42 206 70)" fill="url(#swBody)" stroke="#dbe2f4"/>
<circle cx="140" cy="138" r="78" fill="url(#swBody)" stroke="#d2dcf5" stroke-width="2"/></g><path d="M86 104a62 62 0 0 1 58-44" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/>
<circle cx="140" cy="138" r="66" fill="none" stroke="#dfe6f8" stroke-width="5"/><circle cx="140" cy="138" r="63" fill="url(#swFace)" stroke="#d6dff5" stroke-width="1.5"/>
<g stroke="#4169E1" stroke-width="3" stroke-linecap="round">${ticks}</g>
<g class="sw-hand"><path d="M140 86 147 136a7 7 0 0 1-14 0z" fill="url(#swBlue)"/></g>
<circle cx="140" cy="138" r="11" fill="url(#swBlue)"/><circle cx="137" cy="135" r="3" fill="#fff" opacity=".55"/>
<g clip-path="url(#swFront)">${orbit}</g>
<g stroke="#4169E1" stroke-width="6" stroke-linecap="round"><path d="M26 50l15 17"/><path d="M47 37l9 22"/><path d="M70 31l3 22"/></g>
<g class="sw-pin"><path d="M224 146c-13 0-23 10-23 23 0 17 23 40 23 40s23-23 23-40c0-13-10-23-23-23z" fill="url(#swBlue)"/><circle cx="224" cy="169" r="8.5" fill="#fff"/></g></svg>`})();
const HI={   // 홈 아이콘
 clock:'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5.2l3.4 2"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12h15M13.5 6l6 6-6 6"/></svg>',
 more:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
 heart:on=>`<svg viewBox="0 0 24 24" width="20" height="20" fill="${on?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.8 1.3-1.7 2.8-2.8 4.8-2.8 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"/></svg>`,
 pin:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
 walk:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8"/><path d="m9 21 2.5-6.5L14 17v4M7.5 12l2.5-4.5h4l2.5 4M11.5 14.5 12 7.5"/></svg>'};
// 인기 있는 공간: 웨이팅 기준 위치에서 가장 가까운 곳을 카테고리별 1곳씩 (최대 3곳) — 평점 데이터가 없어 '도보 N분'으로 표시
const homePicks=()=>{const out=[];
 for(const c of ['카페','미술관','공원','서점','박물관','쇼핑','도서관','체험관광']){if(out.length>=3)break;
  let b=-1,bw=1e9;P.forEach((p,k)=>{if(p.c!==c)return;const w=tt(k);if(w<bw){bw=w;b=k}});if(b>=0)out.push(b)}
 return out};
const ppCard=k=>{const p=P[k],fv=S.favs.includes(k);
 return `<div class="pp"><button class="pp-b" data-hcat="${esc(p.c)}" aria-label="${esc(p.n)} · ${esc(p.c)} 둘러보기"><span class="pp-ph" style="--c:${CC[p.c]||'#4169E1'}">${ico(p.c)}</span><span class="pp-tx"><b>${UI.pin}${esc(p.n)}</b><span>${HI.walk}${tt(k)}분 · ${distTxt(k)}</span></span></button><button class="pp-hb${fv?' on':''}" data-fav="${k}" aria-pressed="${fv}" aria-label="${esc(p.n)} 관심 공간 ${fv?'해제':'저장'}">${HI.heart(fv)}</button></div>`};
const RC=[{pop:'서점,공원|90',t:'서점 → 공원',n:2,c:['서점','공원']},{pop:'공원,카페|60',t:'공원 → 카페',n:2,c:['공원','카페']}];
const rcCard=r=>{const w=+r.pop.split('|')[1];
 return `<button class="rc" data-pop="${r.pop}" aria-label="${r.t} 코스 · 웨이팅 ${fm(w)} 기준 · 이 코스로 시작"><span class="rc-ph" aria-hidden="true">${r.c.map(c=>`<i style="--c:${CC[c]}">${ico(c)}</i>`).join('')}</span><span class="rc-chip">${HI.clock.replace(/width="30" height="30"/,'width="18" height="18"')}${fm(w)} 남음</span><b class="rc-t">${r.t} 코스</b><span class="rc-m">${HI.pin}${r.n}곳<i aria-hidden="true"></i>도보</span><span class="rc-go" aria-hidden="true">${HI.arrow}</span></button>`};
const home=()=>{const hs=HS[0],pk=homePicks();
 return frame(`<section class="hero2" aria-label="0차 소개">
<div class="h2-art">${SWATCH}</div>
<div class="h2-copy"><p class="h2-tag" data-hs="t">${hs.t}</p><h2 class="h2-h">웨이팅,<br>이제 <em>0차</em>로.</h2><p class="h2-s" data-hs="s">${hs.s}</p></div>
<button class="cta2" data-go="reg"><span class="cta2-ic">${HI.clock}</span><span class="cta2-bar" aria-hidden="true"></span><span class="cta2-t">웨이팅 정보 등록하기</span><span class="cta2-go" aria-hidden="true">${HI.arrow}</span></button>
</section>
<div class="sec2"><h3>인기 있는 공간</h3><button class="more" data-go="reg">더보기 ${HI.more}</button></div>
<div class="pps">${pk.length?pk.map(ppCard).join(''):'<div class="pp sk"></div><div class="pp sk"></div><div class="pp sk"></div>'}</div>
<div class="sec2"><h3>추천 코스</h3><button class="more" data-go="reg">더보기 ${HI.more}</button></div>
<div class="rcs">${RC.map(rcCard).join('')}</div>`)};


/* ---------- 등록 ---------- */
/* ---------- 카카오지도 공통 ---------- */
const kOK=()=>!!(window.kakao&&kakao.maps);
let kLoaded=false;
function kLoad(cb){if(!kOK())return false;if(kLoaded){cb();return true}kakao.maps.load(()=>{kLoaded=true;cb()});return true}   // autoload=false 라서 load() 안에서 지도를 만든다
const kLL=(lat,lng)=>new kakao.maps.LatLng(lat,lng);
const kFail=ph=>{ph.innerHTML='<div class="hint">지도를 불러오지 못했어요.<br>인터넷 연결과 카카오 앱키·도메인 등록을 확인해주세요.</div>'};

const nearSeoul=()=>dkm(S.loc,{lat:37.5665,lng:126.978})<35;

/* ---------- 웨이팅 장소 검색 (카카오 장소 검색) ---------- */
// 입력하는 동안 관련 장소 목록이 뜨고, 엔터(검색)를 누르면 검색 결과 목록이 떠요. 목록에서 장소를 눌러 바로 선택
const PL={svc:null,t:null,seq:0};
function kSearch(q,size,cb){
 const sv=kakao.maps.services;if(!sv){cb(null);return}
 PL.svc=PL.svc||new sv.Places();
 PL.svc.keywordSearch(q,(d,st)=>{
  if(st===sv.Status.OK)cb(d.map(x=>({n:x.place_name,addr:x.road_address_name||x.address_name||'',cat:String(x.category_name||'').split(' > ').slice(-1)[0],lat:+x.y,lng:+x.x})));
  else if(st===sv.Status.ZERO_RESULT)cb([]);else cb(null)},{size,location:kLL(S.loc.lat,S.loc.lng)})}
const SG_ERR='<p class="sub err">장소 검색을 불러오지 못했어요.<br>카카오 앱키·도메인 등록과 장소 검색(services) 사용 설정을 확인해주세요.</p>';
// v18: 흰 카드 목록 — 이름(굵게) / 분류 | 주소 / 오른쪽 >
const sgList=(h,l,w)=>`<div class="sg" role="group" aria-label="${esc(h)}"><ul>${l.map((r,i)=>`<li><button class="sgb" data-pick="${w}:${i}" aria-label="${esc(r.n)} 웨이팅 장소로 선택"><span class="sgt"><b>${esc(r.n)}</b><span class="sub">${r.cat?`${esc(r.cat)}<i aria-hidden="true">|</i>`:''}${esc(r.addr)}</span></span>${UI.chev}</button></li>`).join('')}</ul></div>`;
const sgHtml=()=>{
 if(S.rstat=='ok')return sgList(`검색 결과 ${S.res.length}곳 · 눌러서 웨이팅 장소를 선택하세요`,S.res,'r');
 if(S.rstat=='none')return '<p class="sub sgi">검색 결과가 없어요. 다른 이름으로 검색해보세요</p>';
 if(S.rstat=='err')return SG_ERR;
 if(!S.wq.trim())return '';
 if(S.sgst=='err')return SG_ERR;
 if(S.sgst=='none')return '<p class="sub sgi">관련 장소가 없어요</p>';
 if(!S.sugg.length)return '';
 return sgList('관련 장소 · 눌러서 선택하거나, 엔터(검색)로 더 많은 결과를 볼 수 있어요',S.sugg,'s')};
const paintSg=()=>{const el=document.getElementById('sgbox');if(el)el.innerHTML=sgHtml()};
function clearRes(){S.res=[];S.rstat=''}
function suggest(){   // 입력 중: 관련 장소 목록 (0.25초 쉬었다가 검색)
 clearTimeout(PL.t);const q=S.wq.trim();
 if(!q){PL.seq++;S.sugg=[];S.sgst='';paintSg();return}
 PL.t=setTimeout(()=>{const my=++PL.seq;
  const fail=()=>{S.sugg=[];S.sgst='err';paintSg()};
  if(!kLoad(()=>kSearch(q,6,r=>{if(my!==PL.seq)return;if(r==null){fail();return}S.sugg=r;S.sgst=r.length?'ok':'none';paintSg()})))fail()},250)}
function runSearch(){   // 엔터: 검색 결과 목록
 const q=S.wq.trim();if(!q||S.active)return;
 clearTimeout(PL.t);const my=++PL.seq;S.sugg=[];S.sgst='';
 const fail=()=>{S.res=[];S.rstat='err';paintSg()};
 if(!kLoad(()=>kSearch(q,15,r=>{if(my!==PL.seq)return;if(r==null){fail();return}S.res=r;S.rstat=r.length?'ok':'none';paintSg()})))fail();
 const i=document.getElementById('wq');if(i)i.blur()}   // 키패드를 내려 목록이 보이게

/* ---------- 웨이팅 장소 + 대기시간 (한 페이지) ---------- */
// 대기시간 입력 카드: 시계 아이콘 · −/+ 원형 버튼 · 빠른 선택(10분~3시간)
const WCHIPS=[10,30,60,120,180];
const regWait=()=>`<div class="wcard" role="group" aria-label="예상 대기 시간 입력"><span class="wc-ic" aria-hidden="true">${UI.clock.replace(/width="18" height="18"/,'width="46" height="46"')}<i>${UI.sparkle}</i></span><p class="wc-q">예상 대기 시간을 입력해주세요</p>
<div class="wc-stp"><button class="wc-b" data-adj="-10" ${S.wait<=10?'disabled':''} aria-label="10분 줄이기">${UI.minus}</button><div class="wc-v" aria-live="polite">${fm(S.wait)}</div><button class="wc-b" data-adj="10" ${S.wait>=300?'disabled':''} aria-label="10분 늘리기">${UI.plus}</button></div>
<div class="wc-chips">${WCHIPS.map(m=>`<button class="${S.wait==m?'on':''}" data-wait="${m}" aria-pressed="${S.wait==m}">${fm(m)}</button>`).join('')}</div></div>`;
const reg=()=>{const pk=S.picked||S.active,av=avail(true);
 let body,foot;
 if(!pk){   // 1) 웨이팅 장소 검색
  body=`${ttl('웨이팅 장소','안내','웨이팅 중인 장소를 검색해 목록에서 눌러 선택하세요. 고르면 대기시간 입력이 나타나요.')}
<div class="srch2"><span class="s-ic">${UI.search}</span><input id="wq" type="search" enterkeyhint="search" placeholder="웨이팅 중인 장소 검색 (예: 성수 연무장길)" value="${esc(S.wq)}" autocomplete="off" aria-label="웨이팅 장소 검색"><button class="clr" data-wqclr="1" aria-label="검색어 지우기">${UI.x}</button></div>
<div class="sgbox" id="sgbox" aria-live="polite">${sgHtml()}</div>
<p class="rg-info">${UI.info}장소를 고르면 이 아래에 대기시간 입력이 나타나요.</p>
${!nearSeoul()?'<p class="sub err c mt">서울 밖이에요. 지금은 서울 지역 장소만 있어요.</p>':''}`;
  foot='<button class="btn" disabled>웨이팅 장소를 먼저 선택해주세요</button>';
 }else{   // 2) 웨이팅 정보 (선택한 장소 + 대기시간 + 대기 완료 예정 시각)
  body=`${S.active?ttl('웨이팅 정보','주의','진행 중인 웨이팅이라 장소는 바꿀 수 없어요. 대기시간만 조정할 수 있고, 남은 시간이 새로 계산돼요.'):ttl('웨이팅 정보','안내','선택한 장소를 누르면 다른 장소로 바꿀 수 있어요. 식당에서 안내받은 예상 대기 시간을 입력해주세요.')}
<button class="selp" id="waitsec" data-repick="1" ${S.active?'disabled':''} aria-label="선택한 장소 ${esc(S.rest)}${S.active?'':' · 눌러서 다른 장소로 바꾸기'}"><span class="selp-k">선택한 장소</span><b class="selp-n">${esc(S.rest)}</b>${S.active?'':UI.chev}</button>
<h3 class="sec3">대기시간 입력</h3>
${regWait()}
<h3 class="sec3 lt">예상 대기 시간 안내</h3>
<div class="eta" aria-live="polite"><span class="eta-ic">${UI.cal}</span><span class="eta-bar" aria-hidden="true"></span><span class="eta-tx"><b>${ampm(base()+S.wait)}</b><span>에 대기 완료 예정이에요 !</span></span></div>
<p class="rg-av${av?'':' err'}">${av?`${esc(S.area)} 기준 반경 약 ${radTxt()} 안에서 다녀올 수 있는 곳 <b>${av}곳</b>`:'대기시간이 짧아 다녀올 수 있는 곳이 없어요. 시간을 늘려보세요.'}</p>
${!nearSeoul()?'<p class="sub err c mt">서울 밖이에요. 지금은 서울 지역 장소만 있어요.</p>':''}`;
  foot=`<button class="btn" data-go="${S.active?(S.sel.length?'prog':'map'):'map'}">${S.active?'적용하고 돌아가기':'등록하기'}</button>`;
 }
 return frame(body,foot)};

/* ---------- 지도 ---------- */
// 카카오 지도 화면: 지도에 보이는 범위의 장소를 모두 핀으로 그린다 (원 없음). 핀 모양은 웨이팅 장소 선택 핀과 같은 물방울
const KM={el:null,map:null,ov:[],line:null,key:'',vb:null,t:null};
let panNext=false;
const mkey=()=>S.loc.lat+','+S.loc.lng+'|'+S.wait;
const PIN='<svg viewBox="0 0 30 42" aria-hidden="true"><path class="bd" d="M15 1.2C7.4 1.2 1.2 7.3 1.2 14.9c0 10.2 13.8 25.9 13.8 25.9s13.8-15.7 13.8-25.9C28.8 7.3 22.6 1.2 15 1.2z"/><path class="hl" d="M6.2 11.5C7.4 6.9 11 4.4 15 4.4"/><circle class="in" cx="15" cy="15" r="9.6"/></svg>';
function kpin(k){
 const p=P[k],i=S.sel.indexOf(k),on=i>=0,ri=inRad(k),o=!on&&ri&&!fit(k),b=document.createElement('button');
 b.className='kp '+(on?'on':ri?'in':'out')+(o?' off':'')+(S.focus===k?' f':'');
 if(on)b.style.setProperty('--pc',colr(i));else b.style.setProperty('--pc',CC[p.c]||'#6B7A99');   // v18.1: 핀 색 = 카테고리 색 (서점 파랑 · 도서관 보라 · 공원 초록 · 카페 주황 …). 반경 밖·시간 부족은 흐리게(CSS)
 b.dataset.n=p.n;b.dataset.focus=k;
 b.setAttribute('aria-label',p.c+' '+p.n+' 도보 '+tt(k)+'분'+(on?' 담음':o?' 시간 부족':ri?'':' 반경 밖'));
 b.innerHTML=PIN+`<span class="pe">${ico(p.c)}</span>`+(on?`<i class="nb">${i+1}</i>`:'');
 b.addEventListener('click',e=>{e.stopPropagation();S.focus=S.focus===k?null:k;S.top=1;if(S.focus!=null&&S.sheetX!=='e')S.sheetX='e';draw()});   // 같은 핀을 다시 누르면 설명 닫기
 return b}
function kLayers(){
 if(!KM.map)return;
 KM.ov.forEach(o=>o.setMap(null));KM.ov=[];
 if(KM.line){KM.line.setMap(null);KM.line=null}
 const c=kLL(S.loc.lat,S.loc.lng);
 if(S.sel.length){
  KM.line=new kakao.maps.Polyline({path:[c,...S.sel.map(k=>kLL(P[k].lat,P[k].lng)),c],strokeWeight:3,strokeColor:'#222',strokeOpacity:.8,strokeStyle:'shortdash'});
  KM.line.setMap(KM.map)}
 const add=(el,pos,z,ya)=>{const o=new kakao.maps.CustomOverlay({position:pos,content:el,xAnchor:.5,yAnchor:ya??1,zIndex:z,clickable:true});o.setMap(KM.map);KM.ov.push(o)};   // 핀 끝(아래 가운데)이 좌표
 list().forEach(k=>add(kpin(k),kLL(P[k].lat,P[k].lng),S.focus===k?9:S.sel.includes(k)?7:inRad(k)?5:3));
 const me=document.createElement('div');me.className='kme';me.innerHTML='<i></i>';me.setAttribute('role','img');me.setAttribute('aria-label','웨이팅 장소');   // v18: 웨이팅 장소 = 파란 점 + 퍼지는 원
 add(me,c,20,.5);
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
const vrow=(t,v)=>v?`<div><dt>${t}</dt><dd>${esc(v)}</dd></div>`:'';
const dtl=k=>{const p=P[k],tel=safeTel(p.tel),fv=S.favs.includes(k),h=todayHrs(p),cl=p.c=='도서관'?p.closed:(p.closedTxt||'');   // v18.2: 홈페이지 링크 삭제
 return `<div class="dti" role="region" aria-label="${esc(p.n)} 상세 정보"><dl class="inf"><div><dt>운영시간 안내</dt><dd>${h.t?`<b>${esc(h.t)}</b>`:''}${h.st?`<span class="st ${h.c}">${esc(h.st)}</span>`:''}</dd></div>${vrow('분류',p.sub)}${vrow('기간',p.period)}${cl?`<div><dt>휴무</dt><dd>${esc(cl)}</dd></div>`:''}${vrow('영업일',p.bizDays)}${vrow('이용요금',p.fee)}<div><dt>주소</dt><dd>${p.addr?esc(p.addr):'정보 없음'}</dd></div><div><dt>도보</dt><dd>약 ${tt(k)}분</dd></div><div><dt>전화</dt><dd>${tel?`<a href="tel:${tel}">${esc(p.tel)}</a>`:'정보 없음'}</dd></div>${vrow('교통',p.subway)}${vrow('알아두세요',p.important)}${vrow('편의시설',p.access)}${vrow('소개',descLine(p))}</dl><div class="acts"><a class="lk" href="${esc(kakaoLink(k))}" target="_blank" rel="noopener noreferrer">길찾기</a><button class="lk" data-fav="${k}" aria-pressed="${fv}">${fv?'♥ 관심 공간 저장됨':'♡ 관심 공간 저장'}</button></div></div>`};
// v18.1 소개 한 줄: 비짓서울 본문에 섞인 CSS 코드(.se-contents{…})를 지우고 첫 문장만. 한국어 소개가 없으면 분류 + 태그 단어로 한 줄 만듦
const descLine=p=>{let d=String(p.desc||'').replace(/<style[\s\S]*?<\/style>/gi,' ');
 if(d.includes('{')||d.includes('}'))d=d.replace(/^[\s\S]*\}/,'').replace(/^[^가-힣]*$/,'');   // 마지막 } 까지는 CSS
 d=d.replace(/\s+/g,' ').trim();
 if(/[가-힣]/.test(d)){const m=/^.+?(?:[.!?。]|다\.|요\.)(?=\s|$)/.exec(d);d=(m?m[0]:d);return d.length>70?d.slice(0,68).trim()+'…':d}
 const w=String(p.tags||'').split('#').map(x=>x.trim()).filter(x=>x&&/[가-힣]/.test(x)&&!/서울|쇼핑|관광|여행|명소|가볼만한/.test(x)&&x!==p.n).slice(0,3);
 return w.length?`${p.sub||p.c} · ${w.join(', ')}`:''};
// 관심 공간 하트 버튼 (마이페이지 '관심 공간'에 저장/해제)
const heart=k=>{const fv=S.favs.includes(k);return `<button class="hb ${fv?'on':''}" data-fav="${k}" aria-pressed="${fv}" aria-label="${esc(P[k].n)} 관심 공간 ${fv?'해제':'저장'}">${HI.heart(fv).replace(/width="20" height="20"/,'width="26" height="26"').replace('stroke-width="2"','stroke-width="1.8"')}</button>`};
// v18 장소 행: [카테고리 색 원 아이콘] 이름 / 📍 도보 N분 • 거리 ........ ♡ [담기]
const cic=c=>`<span class="cic" style="--c:${CC[c]||'#6B7A99'}">${ico(c)}</span>`;
const row=k=>`<div data-row="${k}" class="lrw${S.focus===k?' f':''}"><div class="lr2"><button class="lrn" data-focus="${k}" aria-expanded="${S.focus===k}">${cic(P[k].c)}<span class="tx"><b>${esc(P[k].n)}</b><span class="sub">${UI.pin}도보 ${tt(k)}분<i aria-hidden="true">•</i>${distTxt(k)}</span></span></button>${heart(k)}${addBtn(k)}</div>${S.focus===k?dtl(k):''}</div>`;
const sheetList=()=>{
 if(!P.length)return `<div class="hint">${loadError?'데이터를 불러오지 못했어요.<br>로컬 서버(또는 GitHub Pages)에서 열어주세요.':'장소를 불러오는 중이에요…'}</div>`;
 const l=list();return l.length?`<div class="lcard">${l.map(row).join('')}</div>`:`<div class="hint">${S.cats.length==1&&S.cats[0]=='카페'&&!P.some(p=>p.c=='카페')?'카페 정보를 준비 중이에요.':'지도에 보이는 범위에 맞는 장소가 없어요.<br>지도를 축소하거나 필터를 바꿔보세요.'+(S.onow?'<br>영업 정보가 있는 장소만 표시돼요.':'')}</div>`};
const cntTxt=()=>{const l=list();return `${l.length}곳 · 반경 ${radTxt()} 안 ${l.filter(inRad).length}곳`};
// v18 지도 위 버튼: 확대/축소 · 웨이팅 장소로 · 코스 길찾기
const mapCtl=()=>`<div class="mzoom" role="group" aria-label="지도 확대·축소"><button data-mzoom="-1" aria-label="지도 확대">${UI.plus}</button><button data-mzoom="1" aria-label="지도 축소">${UI.minus}</button></div><button class="mfab l" data-mme="1" aria-label="웨이팅 장소로 지도 이동">${UI.me}</button><button class="mfab r" data-mroute="1" aria-label="담은 코스 길찾기 (구글지도)">${UI.planeO}</button>`;
const refreshSearch=refreshMap;
const cfm=()=>!S.sel.length?{t:'장소를 1곳 이상 담아주세요',d:true}:rem()<0?{t:`체류 시간을 줄여주세요 (${fm(-rem())} 초과)`,d:true}:{t:`코스 확인 (${S.sel.length}곳 · ${fm(total())}) →`,d:false};
// 코스 수정 중인지 (저장된 코스를 불러와 고치는 중)
const editing=()=>S.editId!=null&&S.courses.some(c=>c.id==S.editId);
const mapBack=()=>{   // 장소 담는 화면의 '뒤로': 온 곳으로 돌아감
 const t=S.mback=='confirm'?'confirm':S.active?(S.sel.length?'prog':'home'):editing()?'mc':'reg';
 const L={confirm:'코스 확인',prog:'진행 화면',home:'홈',mc:'코스 상세',reg:'웨이팅 장소'}[t];
 return backBtn(t,L)};
const map=()=>{const c=cfm(),ed=editing();
 if(KM.key!==mkey())KM.vb=null;   // 위치·대기시간이 바뀐 직후엔 예전 지도 범위를 쓰지 않음
 const sec=S.active?(S.sel.length?'<button class="btn g" data-go="prog">진행 화면으로</button>':'<button class="btn g" data-go="home">홈으로</button>'):ed?`<button class="btn g" data-cid="${S.editId}">코스 상세로</button>`:'';
 const main=`<button class="btn" id="cfm" data-go="confirm" ${c.d?'disabled':''}>${esc(sec&&!c.d?`코스 확인 (${S.sel.length}곳) →`:c.t)}</button>`;
 return frameM(`${tbar(mapBack(),'안내','핀을 눌러 장소를 보고 담기 버튼으로 코스에 담아보세요. 파란 핀은 대기시간 반경 안에서 다녀올 수 있는 곳이에요.')}${mapCats()}<div class="mapw"><div class="mapx" id="kmap"></div>${mapCtl()}</div>`,
`${mapFlt()}
<div id="sheetlist">${sheetList()}</div>`,
 S.sel.length?(sec?`<div class="duo">${main}${sec}</div>`:main):'')};   // 장소를 담기 전엔 하단 버튼 없음 → 카트로 담으면 '코스 확인'이 나타남

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
/* ---------- 알림 ---------- */
// 진행 중인 코스: 장소에서 출발하기 DEP_PRE분 전 · 웨이팅 차례 WAIT_PRE분 전에 알림 (앱이 열려 있는 동안)
const DEP_PRE=5,WAIT_PRE=10;
const fms=ms=>{const d=new Date(ms);return f2(d.getHours()*60+d.getMinutes())};
function alerts(){
 if(!S.active||!S.start||!S.sel.length)return [];
 const out=[],st=stages();let c=0;
 st.forEach((x,j)=>{c+=x.m;if(j%3==1){const k=S.sel[Math.floor(j/3)];
  out.push({id:'d'+k,at:S.start+Math.max(0,c-DEP_PRE)*60000,t:`${P[k].n} 출발 준비`,s:`${DEP_PRE}분 뒤 ${fms(S.start+c*60000)}에 출발해요`})}});
 out.push({id:'w',at:S.start+Math.max(0,S.wait-WAIT_PRE)*60000,t:'웨이팅 차례가 가까워졌어요',s:`${WAIT_PRE}분 뒤 ${fms(S.start+S.wait*60000)} · 식당으로 돌아갈 준비를 해주세요`});
 return out.sort((a,b)=>a.at-b.at)}
const akey=a=>a.id+'@'+Math.round(a.at/60000);
const permRow=()=>{if(!('Notification' in window))return '';const p=Notification.permission;
 return p=='granted'?'<p class="sub c mt">기기 알림이 켜져 있어요 · 앱을 열어둔 동안 알려드려요</p>':p=='denied'?'<p class="sub c mt">기기 알림이 차단돼 있어요. 브라우저 설정에서 허용해주세요</p>':'<button class="btn g mt" data-nperm="1">기기 알림 켜기</button>'};
// 알림 시트: 진행 중인 코스의 알림이 시간에 맞춰 하나씩 도착 (최신 알림이 위)
const notifSheet=()=>{if(!S.nopen)return '';
 const l=[...S.nlog].reverse();
 return `<div class="rs ns" role="dialog" aria-modal="true" aria-label="알림"><button class="rs-bg" data-nclose="1" aria-label="닫기"></button><div class="rs-p"><div class="ns-h"><h3>알림</h3><button class="ib sm" data-nclose="1" aria-label="알림 닫기">✕</button></div>
<div class="ns-b">${l.length?`<ul class="nl">${l.map(a=>`<li><b class="tm">${fms(a.at)}</b><span class="tx2"><b>${esc(a.t)}</b><span class="sub">${esc(a.s)}</span></span></li>`).join('')}</ul>`:'<div class="hint">아직 알림이 없어요.<br>코스를 시작하면 출발·웨이팅 시간에 맞춰 알림이 차례로 도착해요.</div>'}</div>
<p class="sub c mt">장소 출발 ${DEP_PRE}분 전 · 웨이팅 차례 ${WAIT_PRE}분 전에 알려드려요</p>${permRow()}</div></div>`};
function liveToast(m){toast(m);const r=document.getElementById('phone');if(!r)return;const o=r.querySelector('.toast');if(o)o.remove();const d=document.createElement('div');d.className='toast';d.setAttribute('role','status');d.textContent=m;r.appendChild(d)}
function fireAlert(a){const m=a.t+' · '+a.s;liveToast(m);
 try{if('Notification' in window&&Notification.permission=='granted')new Notification('0차',{body:m})}catch(e){}
 try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
function checkAlerts(){
 const now=Date.now();let n=0,add=0;
 alerts().forEach(a=>{const k=akey(a);if(now<a.at||S.nfired[k])return;
  S.nfired[k]=1;S.nlog.push({at:a.at,t:a.t,s:a.s});add++;
  if(a.at<=S.start+1000)return;          // 시작 직후 이미 지난 알림은 조용히 목록에만 추가
  n++;fireAlert(a)});
 if(!add)return;
 S.unread+=n;
 if(S.nopen){draw();return}
 const b=document.querySelector('[data-bell]');if(b)b.outerHTML=bellBtn()}

// 길찾기 앱 선택 시트 (진행 화면)
const routeSheet=()=>!S.rsheet||S.i!='prog'||!S.sel.length?'':`<div class="rs" role="dialog" aria-modal="true" aria-label="길찾기 앱 선택"><button class="rs-bg" data-rclose="1" aria-label="닫기"></button><div class="rs-p"><h3>길찾기 열기</h3><p class="sub">${esc(S.rest)} → ${S.sel.map(k=>esc(P[k].n)).join(' → ')} → 복귀<br>경로가 자동으로 입력돼요 (도보)</p>
<a class="rs-o" href="${esc(gUrl())}" target="_blank" rel="noopener noreferrer"><b>구글지도</b><span class="sub">PC·휴대폰 모두 가능 · 경유지 ${Math.min(S.sel.length,9)}곳 전체 입력</span></a>
<button class="rs-o" data-nav="1"><b>네이버지도 앱</b><span class="sub">휴대폰에서 열려요 · 경유지 최대 5곳</span></button>
<button class="btn g mt" data-rclose="1">닫기</button></div></div>`;
// v18 타임라인: [시각] ● [내용]. o.card='all' → 모든 장소를 연한 파란 카드로(코스 확인) / 숫자 → 그 순서 장소만 카드로 강조(진행 중) / o.hollow → 출발 점도 속 빈 원
const tline=(sel,stm,ar,w,o)=>{o=o||{};let t=base();
 const r=(tm,name,sub,cls,sty,ic)=>`<div class="t-r ${cls||''}"${sty?` style="${sty}"`:''}><b class="tm">${f2(tm)}</b><i class="t-d" aria-hidden="true"></i><div class="t-c">${ic||''}<span class="tx2"><b>${name}</b>${sub?`<span class="sub">${sub}</span>`:''}</span></div></div>`;
 let h=`<div class="tl2">`+r(t,'식당에서 출발','','s'+(o.hollow?' ho':''));
 sel.forEach((k,i)=>{const a=ttx(k,ar),st=sx(k,stm,w),cd=o.card==='all'||o.card===i;t+=a;
  h+=r(t,esc(P[k].n),`도보 ${a}분 이동 · 체류 ${st}분`,'pl'+(cd?' cd':'')+(o.card===i?' cur':''),'--pc:'+colr(i),o.card==='all'?cic(P[k].c):'');t+=st+a});   // 도보·체류는 한 줄
 const last=sel.length?ttx(sel[sel.length-1],ar):0;
 return [h+r(t,'식당 복귀',sel.length?`도보 ${last}분 이동`:'','m ho')+'</div>',t]};
// 코스 확인(수정): 어디서 왔는지(S.from)에 따라 '돌아가기'가 지도 / 진행 화면 / 코스 상세로 이어진다
const BK={prog:'진행 화면',mc:'코스 상세',map:'지도'};
const confirmScr=()=>{const [h]=tline(S.sel,S.stay,S.loc,null,{card:'all'}),r=rem(),ed=editing(),dis=r<0||!S.sel.length?'disabled':'',
 bf=(S.from=='prog'&&S.active)||(S.from=='mc'&&ed&&!S.active)?S.from:'map';
 return frame(`${ttl('오늘의 0차 코스','참고','⋮⋮로 순서를 바꾸고 체류 시간을 조절하세요. 이동시간은 도보 기준 참고값이에요.',{back:backBtn(bf,BK[bf]),})}${ringBar(`<button class="ibx rbx" data-go="map" aria-label="장소 더 담기 (지도)">${UI.plus}</button>`)}

<div id="order">${S.sel.map((k,j)=>`<div class="pc2"><button class="dh" data-drag="${j}" aria-label="${esc(P[k].n)} 순서 변경 (끌어서 이동, 위·아래 방향키도 가능)"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><g fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></g></svg></button><span class="dot" style="background:${colr(j)}">${j+1}</span>${cic(P[k].c)}<h3 class="nm">${esc(P[k].n)}</h3><div class="st"><button class="sb m" data-st="${k}:-10" ${stay(k)<=dstay()?'disabled':''} aria-label="체류 10분 줄이기">${UI.minus}</button><b>${stay(k)}분</b><button class="sb p" data-st="${k}:10" ${stay(k)>=240?'disabled':''} aria-label="체류 10분 늘리기">${UI.plus}</button></div>${S.sel.length>1?`<button class="rmx" data-rm="${k}" aria-label="${esc(P[k].n)} 빼기">${UI.x.replace(/width="22" height="22"/,'width="18" height="18"')}</button>`:''}</div>`).join('')||'<div class="box sub">담은 장소가 없어요</div>'}</div>
${h}<div class="rmb${r<0?' err':''}"><span class="rmb-ic">${UI.flag}</span><span>${r<0?`코스가 <b>${fm(-r)}</b> 초과됐어요 · 체류를 줄이거나 장소를 빼주세요`:`복귀 여유 <b>${fm(r)}</b>`}</span></div>`,
 S.active?`<button class="btn" data-apply="1" ${dis}>수정 완료 · 진행 화면으로</button>`
 :`<div class="ftr"><button class="btn" data-start="1" ${dis}>코스 시작하기</button><button class="btn g sv" data-later="1" ${S.sel.length?'':'disabled'} aria-label="코스 저장 (마이페이지 내 코스)" title="저장">${sv2('<path d="M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v15.5l-7-4.6-7 4.6V5a1.5 1.5 0 0 1 1.5-1.5z"/>',24,2)}</button></div>`)};   // v18.1: 저장 = 북마크 아이콘

/* ---------- 진행 / 완료 ---------- */
// v18 진행 화면: '지금' 카드의 사진 자리 (사진 데이터가 없어 단계에 맞는 카테고리 색 + 아이콘으로 표시)
const curIdx=()=>{const j=curStage();return j<S.sel.length*3&&j%3!=2?Math.floor(j/3):-1};   // 지금 이동·체류 중인 장소 순서 (복귀 중이면 -1)
const nowPh=()=>{const i=curIdx(),c=i>=0?P[S.sel[i]].c:null;return `<span class="nw-ph" style="--c:${c?CC[c]:'#4169E1'}">${c?ico(c):UI.fork}<span class="nw-pin">${UI.pin}</span></span>`};
const prog=()=>{
 if(!S.sel.length)return frame(`<h2>진행 중인 코스가 없어요</h2><div class="box sub c">지도에서 갈 곳을 담아 코스를 만들어보세요.</div>`,`<button class="btn" data-go="map">지도에서 코스 만들기</button>`);
 const [h]=tline(S.sel,S.stay,S.loc,null,{card:curIdx(),hollow:true}),b=banner(),si=stageInfo(),r=rem(),cur=curIdx();
 return frame(`<div class="pg-top">${backBtn('home','홈')}<div class="pg-t"><p class="pg-path">${esc(S.rest)} &gt; ${esc(S.area)}</p><p class="pg-rt"><b>${backAt()}까지 복귀</b><span data-cd="left">${leftTxt()}</span></p></div><button class="chipb" data-wadj="1" aria-expanded="${S.wadj}">대기시간 조정</button></div>
${S.wadj?`<div class="adj" role="group" aria-label="대기시간 조절"><button data-live="-10" aria-label="대기시간 10분 줄이기">−10분</button><span>대기시간</span><button data-live="10" aria-label="대기시간 10분 늘리기">+10분</button></div>`:''}
<div class="nowc2 ${b.c}" data-cd="hero"><span data-cd="ph" data-cur="${cur}" class="nw-phw">${nowPh()}</span><div class="nw-r"><span class="nk">지금</span><b class="nt" data-cd="st1">${esc(si.t)}</b><span class="ns">${UI.clock}<span data-cd="st2">${esc(si.s)}</span></span>
<button class="nw-go" data-route="1">${UI.planeO.replace(/width="22" height="22"/,'width="20" height="20"')}길찾기</button></div></div>
<div class="bn ${b.c}" data-cd="banner" role="status" ${b.c=='ok'?'hidden':''}>${esc(b.t)}</div>
<div class="slk2"><h3 class="sec3">복귀 여유</h3><span class="gpill${r<0?' err':''}">${UI.clock.replace(/width="18" height="18"/,'width="24" height="24"')}<b>${r<0?fm(-r)+' 초과':fm(r)}</b></span></div>
<h3 class="sec3">오늘의 코스</h3>
<div data-cd="tl" data-cur="${cur}">${h}</div>
<div class="duo2"><button class="obtn" data-go="confirm">${UI.shoe}순서 · 체류 수정</button><button class="obtn" data-go="map">${UI.plus}장소 더 담기</button></div>`)};
const done=()=>{const F=S.fin||{n:0,use:0,rest:0,names:[],cid:null,wait:0};
 return frame(`${ttl('0차 완료','안내','코스가 마이페이지 \'내 코스\'에 보관됐어요. 언제든 다시 시작하거나 수정할 수 있어요.')}<p class="sub">남은 대기 시간을 알차게 보냈어요.</p>
<div class="box"><div class="row stats"><div><span class="sub">방문</span><br><b>${F.n}곳</b></div><div><span class="sub">활용</span><br><b>${fm(F.use)}</b></div><div><span class="sub">복귀 여유</span><br><b>${fm(F.rest)}</b></div></div></div>
<div class="box"><h3 class="c">오늘의 코스</h3>${F.names.length?`<ol class="dcs">${F.names.map((n,i)=>`<li><span class="dot" style="background:${colr(i)}">${i+1}</span><b>${esc(n)}</b></li>`).join('')}</ol>`:'<p class="sub">—</p>'}</div>
<div class="box sat" role="group" aria-label="서비스 이용 만족도 조사"><h3 class="c">서비스 이용 만족도</h3><p class="sub c">0차 서비스는 어떠셨나요?</p><div class="satr"><button class="sbtn ${S.sat=='good'?'on':''}" data-sat="good" aria-pressed="${S.sat=='good'}">👍 좋아요</button><button class="sbtn ${S.sat=='bad'?'on':''}" data-sat="bad" aria-pressed="${S.sat=='bad'}">👎 별로에요</button></div>${S.sat?'<p class="sub c mt">의견 주셔서 감사해요. 더 좋은 0차를 만들게요.</p>':''}</div>
<button class="btn g mt" data-share="1">코스 공유하기</button>`,
 `<button class="btn" data-go="my">내 코스 보러가기</button><button class="btn g mt" data-go="home">홈으로</button>`)};

/* ---------- 마이페이지 ---------- */
// 마이페이지: 코스를 원형 타이머로 표시 (선택 순서별 색 호 + 가운데 코스 소요 시간, 남은 구간은 복귀 여유)
const cring=c=>{const R=48,C=2*Math.PI*R,w=c.wait,lc=locOf(c),cs=c.sel.map(k=>ttx(k,lc)*2+sx(k,c.stay,w)),tot=cs.reduce((a,b)=>a+b,0),over=tot>w;let acc=0;
 const segs=over?`<circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--err)" stroke-width="12"/>`:cs.map((m,j)=>{const len=Math.min(m/w*C,C-acc),g=len>4?1.5:0,o=-acc;acc+=len;return `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${colr(j)}" stroke-width="12" stroke-dasharray="${Math.max(len-g,0)} ${C}" stroke-dashoffset="${o}"/>`}).join('');
 return `<div class="rbc cr" role="img" aria-label="대기 ${fm(w)} 중 코스 ${fm(tot)}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--fill)" stroke-width="12"/><g transform="rotate(-90 60 60)">${segs}</g></svg><div class="rbt"><span class="sub">총</span><b class="${over?'ov':''}">${tot}<small>분</small></b></div></div>`};
// 마이페이지 코스 카드: 한 행에 [원형 타이머 | 제목·날짜·대기 | 장소 목록] — 공백 없이 한눈에 보이게
const ctitle=c=>String(c.rest||'').trim()||'웨이팅 중인 식당';   // 코스 제목 = 사용자가 정한 웨이팅 음식점 이름
const cdate=c=>{const d=new Date(c.id),n=new Date();return d.toDateString()==n.toDateString()?'오늘':(d.getMonth()+1)+'/'+d.getDate()};   // 저장한 날(코스 id = 저장 시각)
const cfilter=()=>{const q=S.cq.trim().toLowerCase(),day=86400000,t0=new Date().setHours(0,0,0,0),from=S.cdate=='today'?t0:S.cdate=='7'?t0-6*day:S.cdate=='30'?t0-29*day:0;
 const l=S.courses.filter(c=>c.id>=from&&(!q||ctitle(c).toLowerCase().includes(q)||c.sel.some(k=>P[k]&&P[k].n.toLowerCase().includes(q))));
 return l.sort(S.csort=='old'?(a,b)=>a.id-b.id:S.csort=='wait'?(a,b)=>b.wait-a.wait||b.id-a.id:(a,b)=>b.id-a.id)};
const clistHtml=()=>{const l=cfilter();return l.length?l.map(ccard).join(''):'<div class="box sub c">조건에 맞는 코스가 없어요.<br>검색어나 기간을 바꿔보세요.</div>'};
const cRow=()=>`<div class="flt"><input class="in" id="cq" type="search" placeholder="음식점·장소 이름 검색" value="${esc(S.cq)}" autocomplete="off" aria-label="코스 검색"></div>
<div class="flt" role="group" aria-label="코스 필터"><select class="srt l" id="cperiod" aria-label="기간">${[['all','전체 기간'],['today','오늘'],['7','최근 7일'],['30','최근 30일']].map(([v,t])=>`<option value="${v}" ${S.cdate==v?'selected':''}>${t}</option>`).join('')}</select><select class="srt" id="csort" aria-label="정렬">${[['new','최신순'],['old','오래된 순'],['wait','대기 긴 순']].map(([v,t])=>`<option value="${v}" ${S.csort==v?'selected':''}>${t}</option>`).join('')}</select></div>`;
// v18 코스 카드: [총 N분 링 | 제목 코스 · 🕘 날짜·동네 · 👣 대기·장소 수 | ① ② 장소 | >]
const ccard=c=>{const vis=c.sel.slice(0,3),more=c.sel.length-vis.length;
 return `<button class="cc3" data-cid="${c.id}" aria-label="${esc(ctitle(c))} 코스 상세 보기"><span class="cc3-ring">${cring(c)}</span><span class="cc3-info"><b class="cc3-t">${esc(ctitle(c))} 코스</b><span class="cc3-m">${UI.clock}${cdate(c)} · ${esc(c.area||'성수동')}</span><span class="cc3-m">${UI.feet}대기 ${fm(c.wait)} · ${c.sel.length}곳</span></span>`+
 `<span class="cc3-pl">${vis.map((k,j)=>`<span class="cc3-p"><i class="dot" style="background:${colr(j)}">${j+1}</i><span class="nm">${esc(P[k].n)}</span></span>`).join('')}${more>0?`<span class="cc3-more">외 ${more}곳</span>`:''}${missTxt(c)?`<span class="cc3-more">${missTxt(c)}</span>`:''}</span><span class="cc3-go">${UI.chev}</span></button>`};
const missTxt=c=>c._miss?(placesFinal?`장소 ${c._miss}곳을 찾지 못했어요`:`장소 ${c._miss}곳 불러오는 중`):'';
// 관심 공간: 간략 주소(구 + 도로명 + 번호) · 필터는 지도 아래 필터와 같은 형태 (상태는 지도와 별도)
const shortAddr=a=>String(a||'').replace(/\([^)]*\)/g,'').replace(/^서울(특별시|시)?\s*/,'').trim().split(/\s+/).slice(0,3).join(' ');
const favList=()=>{const b=S.favs.filter(k=>(!S.fcats.length||S.fcats.includes(P[k].c))&&(!S.fonow||isOpen(k)===true));
 b.sort(byDist);
 if(S.fsort=='def')b.sort((x,y)=>CAT_ORDER.indexOf(P[x].c)-CAT_ORDER.indexOf(P[y].c)||byDist(x,y));
 else if(S.fsort=='pop')b.sort((x,y)=>(P[y].pop||0)-(P[x].pop||0)||byDist(x,y));
 return b};
const fcatLbl=()=>!S.fcats.length?'장소':'장소 · '+S.fcats[0]+(S.fcats.length>1?' 외 '+(S.fcats.length-1):'');
const favRow=()=>`<div class="flt4" role="group" aria-label="관심 공간 필터"><button class="ddb${S.fcats.length?' on':''}" data-fcatmenu="1" aria-expanded="${S.fcatOpen}"><span>${esc(fcatLbl())}</span>${UI.down}</button>${dd('fonow','영업 여부',[['all','전체'],['on','영업중']],S.fonow?'on':'all')}<span class="sp"></span>${dd('fsort','정렬',[['def','기본순'],['near','거리 가까운 순'],['pop','인기순']],S.fsort)}</div>
${S.fcatOpen?`<div class="catp"><div class="row cats" role="group" aria-label="장소 카테고리 (여러 개 선택 가능)"><button class="chip ${S.fcats.length?'':'on'}" aria-pressed="${!S.fcats.length}" data-fcat="">전체</button>${CATS4.map(c=>`<button class="chip ${S.fcats.includes(c)?'on':''}" aria-pressed="${S.fcats.includes(c)}" data-fcat="${c}">${CE[c]} ${c}</button>`).join('')}</div></div>`:''}`;
// v18 관심 공간 카드: [카테고리 색 네모 아이콘] 이름 / 📍 분류 · 간략 주소 ........ [휴지통]
const favItem=k=>{const ad=shortAddr(P[k].addr),c=P[k].c;return `<div class="fv"><span class="fv-ic" style="--c:${CC[c]||'#E07B2E'}">${ico(c)}</span><div class="fv-tx"><h3>${esc(P[k].n)}</h3><p>${UI.pin}<span>${esc(c)}${ad?' · '+esc(ad):''}</span></p></div><button class="fv-del" data-fav="${k}" aria-label="${esc(P[k].n)} 관심 공간에서 삭제">${UI.trash}</button></div>`};
const newCourse=()=>`<button class="cc3 new" data-go="reg" aria-label="새 코스 만들기 · 웨이팅 등록하기"><span class="nw" aria-hidden="true">${UI.plus.replace(/width="22" height="22"/,'width="34" height="34"')}</span><span class="cc3-info"><b class="cc3-t">새 코스 만들기</b><span class="cc3-m">웨이팅 등록하기</span></span><span class="cc3-go">${UI.chev}</span></button>`;
const profile=()=>S.user?`<div class="prof"><span class="prof-av" aria-hidden="true">${IC.userF.replace(/width="22" height="22"/,'width="50" height="50"')}</span><div class="prof-tx"><b>${esc(S.user.id)}</b><span class="prof-lv">${UI.crown}일반 회원</span></div><button class="prof-lo" data-logout="1">로그아웃${UI.chev}</button></div>`:'';
const my=()=>frame(`${ttl('마이페이지','안내','만든 코스와 하트(♡)로 저장한 공간을 모아봐요. 코스를 눌러 수정하거나 다시 시작할 수 있어요.')}<p class="mysub">내가 만든 코스와 저장한 공간</p>${profile()}<div class="seg2${S.seg=='f'?' f':''}" role="tablist"><button role="tab" aria-selected="${S.seg=='c'}" class="${S.seg=='c'?'on':''}" data-seg="c">내 코스 ${S.courses.length}</button><button role="tab" aria-selected="${S.seg=='f'}" class="${S.seg=='f'?'on':''}" data-seg="f">관심 공간 ${S.favs.length}</button></div>`+
(S.seg=='c'?(S.courses.length?(S.courses.length>=3?cRow():'')+`<div class="clist"><div class="dc" id="cl">${clistHtml()}</div>${newCourse()}</div>`:`<div class="clist">${newCourse()}</div>`)   // 검색·기간·정렬은 코스가 3개 이상일 때만
:(favMiss.length&&!placesFinal?`<p class="sub c mt">저장한 관심 공간 ${favMiss.length}곳을 불러오는 중이에요</p>`:'')+(S.favs.length?favRow()+(favList().length?favList().map(favItem).join(''):'<div class="box sub c">조건에 맞는 관심 공간이 없어요.<br>필터를 바꿔보세요.</div>'):'<div class="box sub c">지도 장소 목록의 ♡를 눌러 저장해보세요.</div>')));
// 코스 상세: 하단은 '다시 시작(주) + 장소 바꾸기' 한 줄. 삭제는 자주 쓰지 않으므로 본문 맨 아래로
const mc=()=>{const c=S.courses.find(x=>x.id==S.cid);if(!c)return my();const [h]=tline(c.sel,c.stay,locOf(c),c.wait);
 return frame(`${ttl(esc(ctitle(c)),'참고','저장 당시 대기시간 기준이에요. 장소·순서·체류 시간을 수정하거나 이 코스로 다시 시작할 수 있어요.',{back:backBtn('my','내 코스')})}<p class="cs-r">${title(c)}</p><p class="sub">${cdate(c)} · ${esc(c.area||'성수동')}</p>${missTxt(c)?`<p class="sub err mt">${missTxt(c)}${placesFinal?' (데이터에서 빠진 장소예요. 수정하면 그 장소는 코스에서 빠져요)':' · 잠시 후 다시 확인해주세요'}</p>`:''}
<div class="row nowrap"><div class="box mini"><span class="sub">대기</span><br><b>${fm(c.wait)}</b></div><div class="box mini"><span class="sub">코스</span><br><b>${fm(ctot(c))}</b></div><div class="box mini"><span class="sub">도보 왕복</span><br><b>${fm(cwalk(c))}</b></div></div>${h}<button class="dl" data-del="${c.id}">이 코스 삭제</button>`,
 `<div class="duo w32"><button class="btn" data-redo="${c.id}">이 코스로 다시 시작</button><button class="btn g" data-edit="${c.id}">장소 바꾸기</button></div>`)};

/* ---------- 로그인 ---------- */
// 마이페이지 · 웨이팅 시간 등록(홈 버튼 · 하단 등록 버튼) 등 로그인이 필요한 화면은 로그인 후 원래 가려던 곳으로 이동
const NEED_LOGIN=['reg','map','confirm','prog','my','mc'];
const lsv=(p,w)=>`<svg viewBox="0 0 24 24" width="${w||22}" height="${w||22}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const LGI={
 user:lsv('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5"/>'),
 lock:lsv('<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.8"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.6v2.4"/>'),
 eye:lsv('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 eyeOff:lsv('<path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.6 3.6M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.9 0 3.6-.6 5.1-1.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
 check:lsv('<path d="m5.5 12.5 4 4 9-9"/>',14),
 arrow:lsv('<path d="M5 12h14M13 6l6 6-6 6"/>',22),
 apple:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#111" d="M16.37 12.62c-.03-2.7 2.2-4 2.3-4.06-1.26-1.83-3.2-2.08-3.89-2.11-1.65-.17-3.23.97-4.07.97-.85 0-2.14-.95-3.52-.92-1.8.03-3.47 1.05-4.4 2.67-1.88 3.26-.48 8.08 1.35 10.73.9 1.29 1.96 2.74 3.36 2.69 1.35-.05 1.86-.87 3.49-.87 1.63 0 2.09.87 3.51.84 1.45-.02 2.37-1.31 3.26-2.61 1.03-1.5 1.45-2.95 1.47-3.03-.03-.01-2.83-1.08-2.86-4.3zM13.7 4.71c.74-.9 1.24-2.15 1.1-3.4-1.07.04-2.36.71-3.13 1.61-.69.8-1.29 2.07-1.13 3.3 1.19.09 2.41-.61 3.16-1.51z"/></svg>',
 google:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29A11.99 11.99 0 0 0 0 12c0 1.94.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/></svg>',
 naver:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#03C75A" d="M16.27 12.85 7.38 0H0v24h7.73V11.16L16.62 24H24V0h-7.73z"/></svg>'};
// v18: 상단 [로그인 | 회원가입] 탭 · 로그인 상태 유지 + 비밀번호 찾기 한 줄 · 아래 '아직 회원이 아니신가요? 회원가입'
const lgTabs=a=>`<div class="lg-tabs" role="tablist" aria-label="로그인 · 회원가입"><button role="tab" aria-selected="${a=='login'}" class="${a=='login'?'on':''}" data-lnk="login">로그인</button><button role="tab" aria-selected="${a=='join'}" class="${a=='join'?'on':''}" data-lnk="join">회원가입</button></div>`;
const login=()=>`<div class="lg">
<div class="lg-top"><button class="logo" data-go="home" aria-label="0차 홈으로 이동">${LOGO}<span>차</span></button></div>
<div class="lg-main">
<h1 class="vh">0차 로그인</h1>
${lgTabs('login')}
<form id="lgf" class="lg-form" novalidate>
<div class="lg-f"><span class="lg-ic">${LGI.user}</span><input id="lid" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="아이디를 입력해주세요" value="${esc(S.lid)}" aria-label="아이디"></div>
<div class="lg-f"><span class="lg-ic">${LGI.lock}</span><input id="lpw" type="password" autocomplete="current-password" placeholder="비밀번호를 입력해주세요" value="${esc(S.lpw)}" aria-label="비밀번호"><button type="button" class="lg-eye" data-lgeye="lpw" aria-pressed="false" aria-label="비밀번호 보기">${LGI.eyeOff}</button></div>
${S.lerr?`<p class="lg-err" id="lgerr" role="alert">${esc(S.lerr)}</p>`:''}
<div class="lg-row"><label class="lg-keep"><input type="checkbox" id="lkeep" ${S.lkeep?'checked':''}><span class="lg-cb" aria-hidden="true">${LGI.check}</span>로그인 상태 유지</label><button type="button" class="lg-find" data-lnk="pw">비밀번호 찾기${UI.chevS}</button></div>
<button type="submit" class="lg-btn"${S.lbusy?' disabled':''}>${S.lbusy?'로그인 중…':'로그인 '+LGI.arrow}</button>
</form>
<div class="lg-or"><span>간편 로그인</span></div>
<div class="lg-sns"><button data-sns="apple" aria-label="Apple로 로그인">${LGI.apple}</button><button data-sns="google" aria-label="Google로 로그인">${LGI.google}</button><button data-sns="naver" aria-label="네이버로 로그인">${LGI.naver}</button></div>
</div>
<p class="lg-bot">아직 회원이 아니신가요?<button class="em" data-lnk="join">회원가입${UI.chevS}</button></p></div>${toastH()}`;
const joinScr=()=>`<div class="lg">
<div class="lg-top"><button class="logo" data-go="home" aria-label="0차 홈으로 이동">${LOGO}<span>차</span></button></div>
<div class="lg-main">
<h1 class="vh">0차 회원가입</h1>
${lgTabs('join')}
<form id="jf" class="lg-form" novalidate>
<div class="lg-f"><span class="lg-ic">${LGI.user}</span><input id="jid" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="20" placeholder="아이디 (영문·숫자·_ 4~20자)" value="${esc(S.jid)}" aria-label="아이디"></div>
<div class="lg-f"><span class="lg-ic">${LGI.lock}</span><input id="jpw" type="password" autocomplete="new-password" placeholder="비밀번호 (4자 이상)" value="${esc(S.jpw)}" aria-label="비밀번호"><button type="button" class="lg-eye" data-lgeye="jpw" aria-pressed="false" aria-label="비밀번호 보기">${LGI.eyeOff}</button></div>
<div class="lg-f"><span class="lg-ic">${LGI.lock}</span><input id="jpw2" type="password" autocomplete="new-password" placeholder="비밀번호를 한 번 더 입력해주세요" value="${esc(S.jpw2)}" aria-label="비밀번호 확인"><button type="button" class="lg-eye" data-lgeye="jpw2" aria-pressed="false" aria-label="비밀번호 확인 보기">${LGI.eyeOff}</button></div>
${S.jerr?`<p class="lg-err" id="jgerr" role="alert">${esc(S.jerr)}</p>`:''}
<button type="submit" class="lg-btn mt2"${S.lbusy?' disabled':''}>${S.lbusy?'가입 중…':'회원가입 '+LGI.arrow}</button>
</form>
</div>
<p class="lg-bot">이미 회원이신가요?<button class="em" data-lnk="login">로그인${UI.chevS}</button></p></div>${toastH()}`;
const SNS={apple:'Apple',google:'Google',naver:'네이버'};
function signIn(id,via){
 S.user={id,via};S.lpw='';S.lerr='';loadAccount();   // 이 계정의 관심 공간 · 코스 불러오기
 try{if(S.lkeep)localStorage.setItem(AUTH,JSON.stringify(S.user));else localStorage.removeItem(AUTH)}catch(e){}
 S.i=S.after&&S.after!='login'?S.after:'home';S.after=null;
 toast(`${id}님, 환영해요`);draw()}
function signOut(){
 saveFavs();saveCourses();   // 마지막 상태를 계정 저장소에 남긴 뒤
 S.user=null;S.lid='';S.lpw='';clearAccount();   // 화면에서만 지움 (다시 로그인하면 그대로 나옴)
 S.active=false;S.start=null;S.sel=[];S.stay={};S.focus=null;S.cid=null;S.editId=null;S.curId=null;S.fin=null;   // 진행·작성 중이던 코스도 정리
 S.nfired={};S.nlog=[];S.unread=0;S.nopen=false;S.rsheet=false;S.wadj=false;S.picked=false;S.wq='';S.sugg=[];S.res=[];S.rstat='';S.sgst='';S.seg='c';
 try{localStorage.removeItem(AUTH)}catch(e){}S.i='home';toast('로그아웃했어요')}

/* ---------- 렌더 ---------- */
const SC={home,reg,map,confirm:confirmScr,prog,done,my,mc,login,join:joinScr};
let lastScr=null;
function draw(){
 if(!S.user&&NEED_LOGIN.includes(S.i)){S.after=S.i;S.i='login';S.lerr=''}   // 로그인 전이면 로그인 화면으로 (로그인 후 원래 화면으로 이동)
 const root=document.getElementById('phone'),sc=root.querySelector('.body,.sheet,.lg');
 const keep=S.i===lastScr&&sc?sc.scrollTop:0,jump=S.top;          // 버튼을 눌러도 스크롤 위치 유지 (기존엔 맨 위로 튐)
 const mc0=S.i===lastScr&&root.querySelector('.mcats'),mcL=mc0?mc0.scrollLeft:0;   // 칩을 눌러도 가로 스크롤 위치 유지
 root.dataset.scr=S.i;   // 화면별 스타일 (홈 전용 디자인 등)
 root.innerHTML=SC[S.i]();if(S.i==='map')mountKakaoMap();
 {const mc=root.querySelector('.mcats');if(mc&&mcL)mc.scrollLeft=mcL}
 const n=root.querySelector('.body,.sheet,.lg');if(n)n.scrollTop=keep;
 if(S.i==='map'&&jump&&S.focus!=null){const r=root.querySelector('[data-row="'+S.focus+'"]');if(r)r.scrollIntoView({block:'nearest'})}
 if(S.i==='reg'&&S.swait){S.swait=false;const w=root.querySelector('#waitsec');if(w)w.scrollIntoView({block:'start',behavior:'smooth'})}   // 장소를 고르면 대기시간 입력이 보이게
 lastScr=S.i;S.top=0;save();saveCourses();
}
const clampWait=w=>Math.min(300,Math.max(10,w));   // v18: 10분 ~ 5시간
// 저장된 코스를 불러와 수정 모드로 (위치·대기시간·장소·체류 시간 복원)
function loadCourse(c){S.sel=[...c.sel];S.stay={...c.stay};S.wait=c.wait;{const l=locOf(c);S.loc={lat:l.lat,lng:l.lng};S.area=c.area||areaLabel(S.loc);GC.clear();recenter=true}S.rest=c.rest||'웨이팅 중인 식당';S.editId=c.id;S.cid=c.id;S.from='mc';S.picked=true}
const closeTips=keep=>document.querySelectorAll('.tipw.open').forEach(w=>{if(w===keep)return;w.classList.remove('open');const b=w.querySelector('[data-tip]');if(b)b.setAttribute('aria-expanded','false')});
document.addEventListener('keydown',e=>{if(e.key=='Escape')closeTips()});
// 대기시간이 모두 지나면 자동으로 코스 종료 → 완료 화면(만족도 조사)
function finishCourse(){
 S.rsheet=false;S.wadj=false;S.nopen=false;if(S.editId!=null)saveCourse();
 S.fin={n:S.sel.length,use:Math.min(total(),S.wait),rest:Math.max(rem(),0),names:nm(S.sel),cid:S.curId,wait:S.wait};
 S.active=false;S.start=null;S.nfired={};S.nlog=[];S.sat='';resetBuild();S.i='done';
 toast('대기시간이 끝나 코스를 종료했어요');draw()}
document.addEventListener('click',e=>{
 const tg=e.target.closest('[data-tip]'),tw=tg&&tg.closest('.tipw');closeTips(tw);   // ? 툴팁: 누르면 열고, 다시 누르거나 다른 곳을 누르면 닫음 (화면을 다시 그리지 않음)
 if(tg){const o=tw.classList.toggle('open');tg.setAttribute('aria-expanded',o);return}
 const c=e.target.closest('[data-cid]'),t=c||e.target.closest('button');
 if(!t||t.disabled)return;const d=t.dataset,has=k=>d[k]!==undefined;
 if(has('go')){S.rsheet=false;if(d.go=='reg'){S.editId=null;if(!S.active&&['home','my','mc','done'].includes(S.i)){S.picked=false;S.wq='';S.sugg=[];S.sgst='';S.res=[];S.rstat='';S.cand=null}}if(d.go=='map')S.mback=S.i;if(d.go=='confirm')S.from=S.i;S.i=(d.go=='prog'&&!S.active)?'home':d.go}
 else if(has('cid')){S.cid=+d.cid;S.i='mc'}
 else if(has('tog')){const k=+d.tog;if(S.sel.includes(k)){S.sel=S.sel.filter(x=>x!=k);delete S.stay[k]}else S.sel=[...S.sel,k]}
 else if(has('hcat')){if(S.active){toast('진행 중인 코스가 있어요. 먼저 종료해주세요');draw();return}S.cats=[d.hcat];S.i='reg';S.picked=false;S.wq='';S.sugg=[];S.sgst='';S.res=[];S.rstat='';S.cand=null}
 else if(has('pop')){S.mback=null;if(S.active){toast('진행 중인 코스가 있어요. 먼저 종료해주세요');draw();return}const[cs,w]=d.pop.split('|');S.wait=+w;S.from='map';S.picked=true;resetBuild();
  cs.split(',').forEach(cat=>{const k=P.map((p,i)=>i).filter(i=>P[i].c==cat&&!S.sel.includes(i)&&inRad(i)&&cost(i)<=rem()-BUF).sort(byDist)[0];if(k!=null)S.sel.push(k)});
  if(S.sel.length)S.i='confirm';else{S.i='map';toast('조건에 맞는 장소를 찾지 못했어요')}}
 else if(has('geo')){
  if(!navigator.geolocation){toast('이 브라우저에서는 위치를 지원하지 않아요');draw();return}
  navigator.geolocation.getCurrentPosition(p=>{S.picked=true;S.rest='웨이팅 중인 식당';S.swait=true;moveTo(p.coords.latitude,p.coords.longitude,true);draw()},()=>{toast('위치를 가져오지 못했어요. 지도를 눌러 직접 지정해주세요');draw()},{enableHighAccuracy:true,timeout:8000});
  return}
 else if(has('cat')){S.cats=(!d.cat||(S.cats.length==1&&S.cats[0]==d.cat))?[]:[d.cat]}   // 서점 → 서점만 / 같은 칩 다시 누르면 전체
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
 else if(has('focus')){if(S.focus===+d.focus&&t.closest('.lr2'))S.focus=null;else{S.focus=+d.focus;S.top=1;panNext=true}}   // 행을 다시 누르면 상세 접기
 else if(has('fav')&&!S.user){S.after=S.i;S.i='login';toast('로그인하면 관심 공간에 저장할 수 있어요')}   // 홈 하트 등 로그인 전
 else if(has('fav')){const k=+d.fav,had=S.favs.includes(k);S.favs=had?S.favs.filter(x=>x!=k):[...S.favs,k];saveFavs();toast(had?'관심 공간에서 삭제했어요':'관심 공간에 저장했어요 · 마이페이지에서 볼 수 있어요')}
 else if(has('st')){const[k,m]=d.st.split(':').map(Number);S.stay[k]=Math.min(240,Math.max(dstay(),stay(k)+m))}
 else if(has('rm'))S.sel=S.sel.filter(x=>x!=+d.rm);
 else if(has('start')){S.curId=saveCourse();S.active=true;S.start=Date.now();S.nfired={};S.nlog=[];S.i='prog'}
 else if(has('bell')){S.nopen=!S.nopen;S.unread=0;S.rsheet=false}
 else if(has('nclose'))S.nopen=false;
 else if(has('nperm')){try{Notification.requestPermission().then(()=>draw())}catch(e){}return}
 else if(has('pick')){const[w,n]=d.pick.split(':'),r=(w=='r'?S.res:S.sugg)[+n];if(!r||S.active)return;
  S.picked=true;S.rest=r.n;S.wq=r.n;S.sugg=[];S.sgst='';S.res=[];S.rstat='';S.swait=true;moveTo(r.lat,r.lng,true);toast(`${r.n}을(를) 웨이팅 장소로 선택했어요`)}
 else if(has('route'))S.rsheet=true;
 else if(has('rclose'))S.rsheet=false;
 else if(has('nav')){openNaver();return}
 else if(has('apply')){S.curId=saveCourse();S.i='prog';toast('코스를 수정했어요')}   // 진행 중 코스 수정 완료 → 진행 화면으로
 else if(has('later')){const ed=editing(),id=saveCourse();resetBuild();if(ed){S.cid=id;S.i='mc';toast('수정한 코스를 저장했어요')}else{S.seg='c';S.i='my';toast('내 코스에 저장했어요')}}
 else if(has('sat')){S.sat=d.sat;toast('소중한 의견 감사합니다')}
 else if(has('share')){const txt=`0차 코스 · ${(S.fin&&S.fin.names||[]).join(' → ')} (대기 ${fm(S.fin?S.fin.wait:0)})`;
  if(navigator.share)navigator.share({text:txt}).catch(()=>{});
  else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>{toast('코스를 복사했어요');draw()},()=>{});
  else toast('이 브라우저에서는 공유를 지원하지 않아요')}
 else if(has('lgeye')){const i=document.getElementById(d.lgeye);if(!i)return;const show=i.type=='password';i.type=show?'text':'password';t.innerHTML=show?LGI.eye:LGI.eyeOff;t.setAttribute('aria-pressed',show);t.setAttribute('aria-label',show?'비밀번호 숨기기':'비밀번호 보기');return}
 else if(has('lnk')){if(d.lnk=='join'){S.i='join';S.jerr='';S.jpw='';S.jpw2=''}else if(d.lnk=='login'){S.i='login';S.lerr=''}else toast({id:'아이디 찾기',pw:'비밀번호 찾기'}[d.lnk]+'은(는) 준비 중이에요')}
 else if(has('sns')){signIn(SNS[d.sns]+' 사용자',d.sns);return}
 else if(has('logout'))signOut();
 else if(has('shh')){if(e.detail===0)setSheet(S.sheetX==='e'?'c':'e');return}   // 키보드(Enter·Space)로 시트 전환 (마우스·터치는 pointerup에서 처리)
 else if(has('repick')){if(S.active)return;S.picked=false;S.wq='';S.sugg=[];S.sgst='';clearRes();draw();const i=document.getElementById('wq');if(i)i.focus();return}   // v18: 선택한 장소 카드 → 다시 검색
 else if(has('wqclr')){S.wq='';S.sugg=[];S.sgst='';clearRes();PL.seq++;draw();const i=document.getElementById('wq');if(i)i.focus();return}   // 검색어 지우기(✕)
 else if(has('mzoom')){if(KM.map)KM.map.setLevel(Math.min(14,Math.max(1,KM.map.getLevel()+ +d.mzoom)),{animate:true});return}   // 지도 확대·축소
 else if(has('mme')){if(KM.map){fitRadius()}return}   // 웨이팅 장소(반경 전체)로 이동
 else if(has('mroute')){if(!S.sel.length){toast('장소를 1곳 이상 담으면 코스 전체 길찾기를 열 수 있어요');draw();return}window.open(gUrl(),'_blank','noopener');return}
 else if(has('seg'))S.seg=d.seg;
 else if(has('redo')||has('edit')){if(S.active){toast('진행 중인 코스가 있어요. 먼저 종료해주세요');draw();return}
  const c=S.courses.find(x=>x.id==+(d.redo??d.edit));if(!c)return;
  if(c._miss&&!placesFinal){toast('코스 장소를 아직 불러오는 중이에요. 잠시 후 다시 눌러주세요');draw();return}
  loadCourse(c);S.mback=null;S.i=has('edit')?'map':'confirm'}   // 시작 → 코스 확인 / 장소 바꾸기 → 지도
 else if(has('del')){if(!confirm('이 코스를 삭제할까요?'))return;S.courses=S.courses.filter(x=>x.id!=+d.del);S.i='my'}
 else return;
 draw()});
document.addEventListener('submit',async e=>{   // 로그인 / 회원가입 (엔터 또는 버튼) → 구글 시트(member) 연동
 const fid=e.target.id;if(fid!='lgf'&&fid!='jf')return;e.preventDefault();
 if(S.lbusy)return;
 const err=(k,m,f)=>{S[k]=m;draw();const el=document.getElementById(f);if(el)el.focus()};
 if(fid=='lgf'){
  const id=S.lid.trim();
  if(!id)return err('lerr','아이디를 입력해주세요','lid');
  if(!S.lpw)return err('lerr','비밀번호를 입력해주세요','lpw');
  S.lbusy=true;S.lerr='';draw();
  const r=await memberApi({action:'login',userId:id,password:S.lpw});
  S.lbusy=false;
  if(r&&r.ok)return signIn(String(r.userId||id).slice(0,40),'id');
  return err('lerr',(r&&r.message)||'로그인하지 못했어요','lpw');
 }
 const id=S.jid.trim();
 if(!/^[A-Za-z0-9_]{4,20}$/.test(id))return err('jerr','아이디는 영문·숫자·_ 4~20자로 입력해주세요','jid');
 if(S.jpw.length<4)return err('jerr','비밀번호는 4자 이상 입력해주세요','jpw');
 if(S.jpw!==S.jpw2)return err('jerr','비밀번호가 서로 달라요','jpw2');
 S.lbusy=true;S.jerr='';draw();
 const r=await memberApi({action:'join',userId:id,password:S.jpw});
 S.lbusy=false;
 if(r&&r.ok){S.lid=id;S.lpw='';S.lerr='';S.jid='';S.jpw='';S.jpw2='';S.i='login';toast('회원가입이 완료됐어요. 로그인해주세요');return draw()}
 err('jerr',(r&&r.message)||'회원가입하지 못했어요','jid')});
document.addEventListener('input',e=>{
 if(e.target.id=='lid'||e.target.id=='lpw'){S[e.target.id]=e.target.value;if(S.lerr){S.lerr='';const el=document.getElementById('lgerr');if(el)el.remove()}}
 if(e.target.id=='jid'||e.target.id=='jpw'||e.target.id=='jpw2'){S[e.target.id]=e.target.value;if(S.jerr){S.jerr='';const el=document.getElementById('jgerr');if(el)el.remove()}}
 if(e.target.id=='q'){S.q=e.target.value;refreshSearch()}
 if(e.target.id=='cq'){S.cq=e.target.value;const el=document.getElementById('cl');if(el)el.innerHTML=clistHtml()}   // 입력창은 다시 그리지 않고 목록만 갱신
 if(e.target.id=='wq'){S.wq=e.target.value;if(S.res.length||S.rstat)clearRes();suggest()}   // 다시 입력하면 이전 검색 결과 마커를 지우고 관련 장소 목록으로
});
document.addEventListener('keydown',e=>{
 if(e.target.id=='wq'&&e.key=='Enter'){e.preventDefault();S.wq=e.target.value;runSearch()}   // 엔터(검색) → 지도에 표시
 else if(e.key=='Escape'&&S.nopen){S.nopen=false;draw()}
});
document.addEventListener('change',e=>{   // 입력을 마치면 범위(5~240)에 맞춰 표시값 정리
 if(e.target.id=='lkeep'){S.lkeep=e.target.checked;return}
 if(e.target.id=='sort'){S.sort=e.target.value;draw();return}
 if(e.target.id=='onow'){S.onow=e.target.value=='on';draw();return}
 if(e.target.id=='fonow'){S.fonow=e.target.value=='on';draw();return}
 if(e.target.id=='fsort'){S.fsort=e.target.value;draw();return}
 if(e.target.id=='cperiod'){S.cdate=e.target.value;draw();return}
 if(e.target.id=='csort'){S.csort=e.target.value;draw();return}
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

/* ---------- v18.1 장소 목록 시트: 손잡이를 끌어 높이 조절 (놓으면 작게/크게 중 가까운 쪽으로) · 누르면 전환 ---------- */
const SH={id:null,y0:0,h0:0,H:0,el:null,moved:false};
function setSheet(x){S.sheetX=x;const el=document.getElementById('bsheet');if(!el)return;el.style.height='';el.classList.toggle('ex',x==='e');
 const h=el.querySelector('.sh-h');if(h){h.setAttribute('aria-expanded',x==='e');h.setAttribute('aria-label',`장소 목록 ${x==='e'?'줄이기':'크게 보기'} (위아래로 끌어서 조절)`)}
 setTimeout(()=>{if(KM.map&&document.getElementById('kmap')){const c=KM.map.getCenter();KM.map.relayout();KM.map.setCenter(c);readView();refreshMap()}},260)}   // 시트 높이가 바뀌면 지도 크기 다시 계산
document.addEventListener('pointerdown',e=>{
 const h=e.target.closest&&e.target.closest('[data-shh]');if(!h)return;
 const el=document.getElementById('bsheet'),mb=el&&el.parentElement;if(!el)return;
 e.preventDefault();SH.id=e.pointerId;SH.y0=e.clientY;SH.h0=el.getBoundingClientRect().height;SH.H=mb.getBoundingClientRect().height;SH.el=el;SH.moved=false;
 el.classList.add('drg');try{h.setPointerCapture(e.pointerId)}catch(_){}});
document.addEventListener('pointermove',e=>{
 if(SH.id!==e.pointerId||!SH.el)return;const dy=e.clientY-SH.y0;if(!SH.moved&&Math.abs(dy)<4)return;SH.moved=true;
 SH.el.style.height=Math.min(SH.H*.8,Math.max(SH.H*.22,SH.h0-dy))+'px'});
const shEnd=e=>{
 if(SH.id!==e.pointerId||!SH.el)return;const el=SH.el;SH.el=null;SH.id=null;el.classList.remove('drg');
 if(!SH.moved){setSheet(S.sheetX==='e'?'c':'e');return}   // 그냥 누르면 전환
 const r=el.getBoundingClientRect().height/SH.H;setSheet(r>.47?'e':'c')};   // 놓은 높이에 따라 가까운 쪽으로
document.addEventListener('pointerup',shEnd);document.addEventListener('pointercancel',shEnd);
document.addEventListener('keydown',e=>{const h=e.target.closest&&e.target.closest('[data-shh]');if(!h)return;
 if(e.key==='ArrowUp'){e.preventDefault();setSheet('e')}else if(e.key==='ArrowDown'){e.preventDefault();setSheet('c')}});

/* ---------- 지도 위 칩 줄: 마우스로 끌어서 좌우로 넘기기 (터치는 손가락으로 밀면 기본 동작) ---------- */
const MC={el:null,x0:0,l0:0,id:null,moved:false};
document.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='mouse'||e.button!==0)return;
 const el=e.target.closest&&e.target.closest('.mcats');if(!el)return;
 MC.el=el;MC.x0=e.clientX;MC.l0=el.scrollLeft;MC.id=e.pointerId;MC.moved=false;
});
document.addEventListener('pointermove',e=>{
 if(!MC.el||e.pointerId!==MC.id)return;
 const dx=e.clientX-MC.x0;
 if(!MC.moved&&Math.abs(dx)<5)return;           // 5px 넘게 움직여야 드래그로 인정 (그 전엔 그냥 클릭)
 MC.moved=true;MC.el.classList.add('drg');MC.el.scrollLeft=MC.l0-dx;
});
const mcEnd=e=>{if(!MC.el||e.pointerId!==MC.id)return;MC.el.classList.remove('drg');MC.el=null;setTimeout(()=>{MC.moved=false},0)};
document.addEventListener('pointerup',mcEnd);document.addEventListener('pointercancel',mcEnd);
document.addEventListener('click',e=>{if(MC.moved){e.stopPropagation();e.preventDefault();MC.moved=false}},true);   // 끌고 놓을 때 칩이 눌리지 않게
document.addEventListener('keydown',e=>{   // 키보드: 핸들에서 ↑↓
 const h=e.target.closest&&e.target.closest('[data-drag]');if(!h||!['ArrowUp','ArrowDown'].includes(e.key))return;
 e.preventDefault();const j=+h.dataset.drag,n=j+(e.key=='ArrowUp'?-1:1);if(n<0||n>=S.sel.length)return;
 [S.sel[j],S.sel[n]]=[S.sel[n],S.sel[j]];draw();const nh=document.querySelector(`[data-drag="${n}"]`);if(nh)nh.focus();
});
draw();
loadPlaces();
setInterval(()=>{if(!S.active)return;if(S.start&&remSec()<=0){finishCourse();return}checkAlerts();document.querySelectorAll('[data-cd]').forEach(el=>{const k=el.dataset.cd;
 if(k=='stage')el.textContent=stageTxt();
 else if(k=='left')el.textContent=leftTxt();
 else if(k=='mpd')el.textContent=mpDest();
 else if(k=='mpbig')el.textContent=mpLeft();
 else if(k=='mpret')el.textContent=backAt()+'까지 복귀';
 else if(k=='mpc')el.className='mp '+banner().c;
 else if(k=='st1')el.textContent=stageInfo().t;
 else if(k=='st2')el.textContent=stageInfo().s;
 else if(k=='hero')el.className='nowc2 '+banner().c;
 else if(k=='ph'){const c=curIdx();if(+el.dataset.cur!==c){el.dataset.cur=c;el.innerHTML=nowPh()}}
 else if(k=='tl'){const c=curIdx();if(+el.dataset.cur!==c){el.dataset.cur=c;el.innerHTML=tline(S.sel,S.stay,S.loc,null,{card:c,hollow:true})[0]}}
 else if(k=='banner'){const b=banner();el.className='bn '+b.c;el.textContent=b.t;el.hidden=b.c=='ok'}})},1000);

/* ===== 비짓서울 API 연동 (v15) =====
 * 앱을 열면 비짓서울 API에서 장소를 받아 addPlaces()로 목록에 추가합니다 (JSON 파일 없음).
 * 받아온 장소는 서점·도서관·공원과 똑같이 지도 핀 · 장소 이름 검색 · 카테고리 버튼 · 담기에 쓰입니다.
 *   API로 받는 버튼: 카페 · 체험관광(공예체험·전통체험) — 박물관·미술관·쇼핑은 data/*.json (전시회는 삭제)
 * 순서: 카테고리 목록 → 카테고리별 콘텐츠 목록(좌표 없음) → 장소마다 상세 조회(좌표·주소·전화·시간 등) → 추가
 * 결과는 localStorage에 24시간 캐시 (카테고리 구성을 바꾸면 VS_CKEY 의 숫자를 올리세요)
 */
(function () {
  const API_KEY = '4f825688-9ac1-4d47-b040-38c7a4aadc07';
  const BASE = 'https://api-call.visitseoul.net/api/v1';
  const TTL = 24 * 3600 * 1000;
  const VS_CKEY = 'vs:places:v5';
  const CONC = 2;                    // 상세 조회 동시 호출 수 (호출 제한에 걸리면 더 줄이세요)

  // c = 앱 버튼 이름 / codes = 코드 직접 지정 / under·mid·name = 카테고리 경로(예: "문화관광 > 전시시설 > 박물관")에서
  // 최상위 이름이 under, (선택) 두 번째 이름이 mid, 마지막 이름이 name 에 맞는 카테고리를 자동 선택 / not = 제외 / max = 최대 개수(최신순)
  // ※ 경로가 한글인지 영어인지 확실치 않아 둘 다 맞게 써둠. 콘솔의 '[비짓서울] 선택된 카테고리' 로그를 보고 조정
  const CULT = /문화관광|culture/i, EXH = /전시시설|exhibition/i, FEST = /축제|공연|행사|festival|event/i;
  const PICK = [   // 카테고리 코드는 비짓서울 category/list 에서 확인한 값. 작은 카테고리부터 받아서 바로 뭔가 보이게 함
    // 박물관(Cr0q2v2)·미술관(Ct9t6m8)·쇼핑(전문매장·쇼핑몰/아울렛·전통시장·백화점)은 data/*.json 에서 읽음 (SOURCES 참고) · 마트/창고형(Ct1z4k9)은 안 씀
    { c: '체험관광', codes: ['Cq3m6s6', 'Cd0m9o0'], max: 500 },                               // Experience Programs > Craft Workshops(공예체험) · Traditional Experience(전통체험)
    { c: '카페', codes: ['Cx0t8m5'], max: 1000 },                                              // Cuisine > Cafes & Tea Shops
  ];

  const H = { 'Accept': 'application/json;charset=UTF-8', 'Content-Type': 'application/json;charset=UTF-8', 'VISITSEOUL-API-KEY': API_KEY };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function call(path, o) {
    const { method = 'POST', body, r500 = true } = o || {};
    let last = 0;
    for (let t = 0; t < 4; t++) {
      const r = await fetch(BASE + path, { method, headers: H, body: body && JSON.stringify(body) });
      if (r.ok) return r.json();
      last = r.status;
      const lk = method + ' ' + path.split('?')[0]; call.logged = call.logged || {};
      if (r.status >= 500 && !call.logged[lk]) { call.logged[lk] = 1; r.clone().text().then(t => console.warn('[비짓서울] 서버 오류 응답:', r.status, lk, t.slice(0, 300))).catch(() => {}); }   // 원인 확인용: 서버가 보낸 오류 내용을 1번만 출력
      if (r.status === 429 || (r500 && r.status >= 500)) {   // 호출 제한(429)·서버 오류는 점점 길게 쉬었다가 재시도. 상세 조회의 500은 그 콘텐츠 자체 오류라 재시도 안 함
        const ra = +r.headers.get('Retry-After');
        await sleep(ra > 0 ? Math.min(ra, 30) * 1000 : 1500 * 2 ** t);
        continue;
      }
      const e = new Error(r.status + ' ' + method + ' ' + path); e.status = r.status; throw e;
    }
    const e = new Error(`재시도 초과 (마지막 응답 ${last}) ${path}`); e.status = last; throw e;
  }

  async function listAll(code, limit) {
    const out = [];
    for (let p = 1; out.length < limit; p++) {
      const d = await call('/contents/list', { body: { com_ctgry_sn: code, lang_code_id: 'ko', sort_type: 'latest', page_no: p } });
      if (d.data[0] && !listAll.logged) { listAll.logged = 1; console.info('[비짓서울] 목록 항목 예시:', JSON.stringify(d.data[0]).slice(0, 500)); }
      out.push(...d.data);
      if (!d.data.length || out.length >= d.paging.total_count) break;
    }
    return out.slice(0, limit);
  }

  // 상세 조회는 POST 만 허용됨 (GET 은 서버가 405 로 거부)
  async function detail(cid) {
    return (await call('/contents/info', { body: { cid }, r500: false })).data;
  }

  // 날짜 → 숫자(YYYYMMDD). '2026.12.31' · '2026-12-31' · '20261231' 어떤 형식이든 같은 값 (예전엔 글자 비교라 '-' 형식이면 진행 중 전시도 끝난 것으로 빠졌음)
  const dnum = s => { const m = /(\d{4})\D?(\d{1,2})\D?(\d{1,2})/.exec(String(s || '')); return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : null; };
  const todayN = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };   // 한국 시간 기준 오늘
  // 좌표가 없는 전시·행사는 주소로 위치 찾기 (카카오 주소 검색 · 지도 SDK의 services 사용)
  const geocode = addr => new Promise(res => {
    const a = String(addr || '').replace(/\([^)]*\)/g, ' ').split(/[,·]/)[0].replace(/\s+/g, ' ').trim();   // 괄호(층·관 이름 등) 빼고 첫 주소만
    if (!a || typeof kLoad !== 'function') return res(null);
    const ok = kLoad(() => {
      try { new kakao.maps.services.Geocoder().addressSearch(a, (d, st) => res(st === kakao.maps.services.Status.OK && d[0] ? { lat: +d[0].y, lng: +d[0].x } : null)); }
      catch (e) { res(null); }
    });
    if (!ok) res(null);
  });
  const clean = (s, n) => String(s == null ? '' : s).replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().slice(0, n);
  const lines = (s, n) => String(s == null ? '' : s).replace(/\r/g, '').split('\n').map(v => v.trim()).filter(Boolean).join(' / ').slice(0, n);

  // 상세 응답 → 앱 장소 형식 (정보는 상세 패널에 전부 표시)
  function toPlace(c, d, cid) {
    const x = d.extra || {}, t = d.traffic || {}, lat = +t.map_position_y, lng = +t.map_position_x;
    const end = dnum(d.schdul_info_endde);
    if (end && end < todayN()) return { _skip: 'ended' };   // 이미 끝난 전시/행사
    const noXY = !lat || !lng, addr0 = t.new_adres || t.adres || '';
    if (noXY && !addr0) return { _skip: 'nocoord' };       // 좌표도 주소도 없음
    const fee = x.trrsrt_use_chrge === 'F' ? '무료' : x.trrsrt_use_chrge === 'C' ? '유료' : '';
    return {
      n: d.post_sj, c, e: CE[c], cid, lat: noXY ? null : lat, lng: noXY ? null : lng, _geo: noXY,
      addr: t.new_adres || t.adres || '', tel: x.cmmn_telno || '', site: x.cmmn_hmpg_url || '',
      hrsTxt: lines(x.cmmn_use_time, 200), closedTxt: lines(x.closed_days, 120), bizDays: lines(x.business_days, 80),
      period: d.schdul_info_bgnde ? d.schdul_info_bgnde + (d.schdul_info_endde ? ' ~ ' + d.schdul_info_endde : '') : '',
      fee: [fee, clean(x.trrsrt_use_chrge_guidance, 160)].filter(Boolean).join(' · '),
      subway: clean(t.subway_info, 120), important: clean(x.cmmn_important, 160),
      access: Array.isArray(x.disabled_facility) ? x.disabled_facility.join(', ') : '',
      desc: clean(d.post_desc || d.sumry, 240), tags: Array.isArray(d.tag) ? d.tag.slice(0, 8).map(v => '#' + v).join(' ') : '',
    };
  }

  const VS_FAIL = [];
  let gap = 200, streak = 0, halted = false;   // 요청 간격(자동 조절) · 연속 실패 수 · 서버가 계속 실패하면 중단

  // 받은 장소를 앱에 추가 (같은 장소는 한 번만). 입력창이 있는 화면은 다시 그리지 않음(타이핑 끊김 방지)
  function add(list) {
    const have = new Set(P.map(p => p.c + '|' + p.n + '|' + p.lat + '|' + p.lng));
    list = list.filter(p => { const k = p.c + '|' + String(p.n || '').trim() + '|' + p.lat + '|' + p.lng; if (have.has(k)) return false; have.add(k); return true; });
    if (!list.length) return;
    addPlaces(list, false);
    if (S.i === 'map') refreshMap(); else if (S.i === 'home' || (S.i === 'my' && courseDirty)) { courseDirty = false; draw(); }
  }

  // 카테고리별 캐시 (24시간). 받는 도중에도 주기적으로 저장 → 새로고침해도 받은 곳까지는 남고, 이어서 받음
  const ckey = c => VS_CKEY + ':' + c;
  const sigOf = p => p.codes.join(',') + (p.ver ? '#' + p.ver : '');
  const OLD_OK = new Set();   // sig 없이 저장된 예전 캐시는 쓰지 않음 (체험관광 코드가 바뀜)
  // JSON으로 옮긴 카테고리(미술관·박물관·쇼핑)의 예전 API 캐시는 지워서 저장 공간 확보
  try { ['미술관', '박물관', '쇼핑', '전시회'].forEach(c => localStorage.removeItem(VS_CKEY + ':' + c)); } catch (e) {}
  const readCache = p => { try { const v = JSON.parse(localStorage.getItem(ckey(p.c))); if (!v || Date.now() - v.t >= TTL || !Array.isArray(v.places)) return null; if (v.sig ? v.sig !== sigOf(p) : !OLD_OK.has(p.c)) return null; return { places: v.places, done: Array.isArray(v.done) ? v.done : [], complete: v.complete !== false }; } catch (e) { return null; } };
  const writeCache = (p, places, done, complete) => { try { localStorage.setItem(ckey(p.c), JSON.stringify({ t: Date.now(), sig: sigOf(p), places, done, complete })); } catch (e) { /* 용량 초과면 캐시 생략 */ } };

  async function run() {
    const jobs = [];
    for (const p of PICK) {
      const c = readCache(p);
      if (c) { add(c.places); if (c.complete) continue; }   // 다 받은 카테고리는 API를 부르지 않음
      jobs.push({ p, pr: c, skip: new Set(c ? c.done : []), items: [], i: 0, out: [], done: [], bad: [], pend: [], sinceSave: 0, lastAdd: Date.now(), err: null, why: { ended: 0, nocoord: 0, geo: 0 } });
    }
    if (!jobs.length) { if (typeof placesDone === 'function') placesDone(true); return; }   // 전부 캐시에 있으면 바로 완료
    if (typeof liveToast === 'function') liveToast('비짓서울 장소를 받는 중이에요. 처음엔 몇 분 걸리고, 받는 대로 지도에 나타나요');

    // 1) 카테고리별 콘텐츠 목록 (가벼운 호출)
    const seen = new Set();
    for (const j of jobs) {
      try {
        let items = [];
        for (const code of j.p.codes) { const got = await listAll(code, j.p.max - items.length); console.info('[비짓서울] 코드', code, '목록', got.length, '건'); items.push(...got); }
        j.items = items.filter(x => !seen.has(x.cid) && !j.skip.has(x.cid)); j.items.forEach(x => seen.add(x.cid));
      } catch (e) { j.err = e; console.error('[비짓서울] 목록 실패:', j.p.c, e.message); }
    }

    // 2) 상세 조회: 카테고리를 번갈아 가며 하나씩 → 모든 버튼에 골고루, 빨리 채워짐
    const save = (j, complete) => writeCache(j.p, (j.pr ? j.pr.places : []).concat(j.out), [...j.skip, ...j.done], complete);
    const flush = j => { if (j.pend.length) { add(j.pend); j.pend = []; } save(j, false); j.sinceSave = 0; };
    let rr = 0;
    const nextJob = () => { for (let k = 0; k < jobs.length; k++) { const j = jobs[(rr + k) % jobs.length]; if (j.i < j.items.length) { rr = (rr + k + 1) % jobs.length; return j; } } return null; };
    const attempt = async it => {   // 서버 500은 일시적인 경우가 많아서, 실패하면 점점 길게 쉬었다가 같은 요청(POST)을 다시 보냄
      for (let a = 0; a < 3; a++) {
        try { return { ok: true, r: toPlace(null, await detail(it.cid), it.cid) }; }
        catch (e) { await sleep(Math.min(8000, 800 * 2 ** a)); }
      }
      return { ok: false };
    };
    const one = async (j, it) => {
      const x = await attempt(it);
      if (x.ok) {
        j.done.push(it.cid); streak = 0; gap = Math.max(200, gap * 0.8);
        let r = x.r;
        if (r && r._skip) { j.why[r._skip]++; r = null; }
        if (r && r._geo) {                                          // 좌표 없음 → 주소로 위치 찾기
          const g = await geocode(r.addr);
          if (g) { r.lat = g.lat; r.lng = g.lng; j.why.geo++; } else { j.why.nocoord++; r = null; }
          if (r) delete r._geo;
        }
        if (r) { r.c = j.p.c; r.e = CE[j.p.c]; j.out.push(r); j.pend.push(r); }
        if (j.pend.length >= 8 || (j.pend.length && Date.now() - j.lastAdd > 4000)) { add(j.pend); j.pend = []; j.lastAdd = Date.now(); }   // 8개 모이거나 4초가 지나면 화면에 반영
        if (++j.sinceSave >= 25) flush(j);                         // 25개마다 저장 (새로고침해도 이어받기)
      } else {
        j.bad.push(it); streak++; gap = Math.min(3000, gap * 1.5);
        if (streak % 10 === 0) { if (streak >= 40) halted = true; else { console.warn('[비짓서울] 연속 실패 ' + streak + '건 → 20초 쉬었다가 계속'); await sleep(20000); } }
      }
    };
    await Promise.all(Array.from({ length: CONC }, async () => {
      for (let j; !halted && (j = nextJob());) { await one(j, j.items[j.i++]); await sleep(gap); }
    }));
    for (let round = 0; round < 2 && !halted && jobs.some(j => j.bad.length); round++) {   // 못 받은 콘텐츠는 잠시 쉬었다가 최대 2번 더 시도
      await sleep(5000 * (round + 1));
      for (const j of jobs) { const again = j.bad; j.bad = []; for (const it of again) { if (halted) { j.bad.push(it); continue; } await one(j, it); await sleep(gap); } }
    }

    // 3) 마무리: 저장 + 결과 로그
    const failed = [];
    for (const j of jobs) {
      flush(j);
      const nf = j.bad.length, complete = !j.err && !halted && nf <= Math.max(3, j.items.length * 0.05);   // 원래 500이 나는 콘텐츠 몇 개 때문에 매번 다시 받지 않도록 5%(최소 3건)까진 완료로 침
      save(j, complete);
      j.bad.forEach(it => VS_FAIL.push(it.cid));
      console.info(`[비짓서울] ${j.p.c}: 새로 받을 목록 ${j.items.length}건 → 표시 ${j.out.length}건 (상세 조회 실패 ${nf}건${halted ? ', 서버 불안정으로 중단' : ''}, 제외: 끝난 전시·행사 ${j.why.ended}건 · 좌표·주소 없음 ${j.why.nocoord}건 · 그 밖 ${Math.max(0, j.done.length - j.out.length - j.why.ended - j.why.nocoord)}건 / 주소로 위치를 찾은 곳 ${j.why.geo}건)`);
      if (!complete) failed.push(j.p.c);
    }
    if (VS_FAIL.length) console.info(`[비짓서울] 상세 정보를 못 받은 콘텐츠 ${VS_FAIL.length}건 (다음 새로고침 때 이어서 시도):`, VS_FAIL.join(', '));
    if (failed.length && typeof liveToast === 'function') liveToast(halted ? '비짓서울 서버가 불안정해요. 받은 장소까지만 표시했어요. 잠시 뒤 새로고침하면 이어서 받아요' : `비짓서울 ${failed.join('·')} 장소를 일부 못 불러왔어요. 새로고침하면 이어서 받아요`);
    else if (typeof liveToast === 'function') liveToast('비짓서울 장소를 모두 받았어요');
    if (typeof placesDone === 'function') placesDone(!failed.length && !halted);
  }

  run().catch(e => {
    console.error('[비짓서울]', e);
    if (typeof liveToast === 'function') liveToast('비짓서울 장소를 불러오지 못했어요');
    if (typeof placesDone === 'function') placesDone(false);
  });
})();
