/* SMASHZONE demo data: 데이터베이스 연동 시 아래 배열을 테이블 데이터로 옮기면 됩니다. */
const PRODUCTS = [
  {id:1,name:"아스트록스 88D 프로",category:"라켓",price:279000,stock:12,image:"img/product-racket.svg",tag:"BEST",description:"강력한 스매시와 안정적인 컨트롤을 위한 공격형 라켓"},
  {id:2,name:"나노플레어 700 플레이",category:"라켓",price:89000,stock:20,image:"img/product-racket2.svg",tag:"인기",description:"가볍고 빠른 스윙을 돕는 올라운드 라켓"},
  {id:3,name:"프리미엄 셔틀콕 12입",category:"셔틀콕",price:24000,stock:35,image:"img/product-shuttle.svg",tag:"추천",description:"안정적인 비행과 일관된 타구감을 위한 셔틀콕"},
  {id:4,name:"트레이닝 셔틀콕 6입",category:"셔틀콕",price:12500,stock:40,image:"img/product-shuttle2.svg",tag:"실속",description:"반복 연습에 부담 없이 사용하는 연습용 콕"},
  {id:5,name:"오버그립 3개 세트",category:"그립·스트링",price:6500,stock:60,image:"img/product-grip.svg",tag:"BEST",description:"땀 흡수와 밀착감이 좋은 쿠션 오버그립"},
  {id:6,name:"BG 파워 스트링 10m",category:"그립·스트링",price:22000,stock:25,image:"img/product-string.svg",tag:"인기",description:"선명한 타구음과 반발력을 위한 라켓 스트링"},
  {id:7,name:"스매시 스포츠 백",category:"가방·용품",price:59000,stock:15,image:"img/product-bag.svg",tag:"NEW",description:"라켓과 운동 용품을 깔끔하게 수납하는 가방"},
  {id:8,name:"프로 손목밴드 2개",category:"가방·용품",price:9000,stock:50,image:"img/product-wristband.svg",tag:"추천",description:"운동 중 땀을 빠르게 흡수하는 손목밴드"}
];
const MEMBER_LEVELS = [
  {name:"브론즈",min:0,rate:0.01},
  {name:"실버",min:100000,rate:0.03},
  {name:"골드",min:300000,rate:0.05},
  {name:"플래티넘",min:700000,rate:0.07}
];
const CATEGORIES = ["전체","라켓","셔틀콕","그립·스트링","가방·용품"];
const STORAGE_KEY = "smashzone-demo-v1";
let state = loadState();
let activeCategory = "전체";
let searchTerm = "";
let currentSlide = 0;
let slideTimer;
let toastTimer;

function loadState(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {users:[],currentUser:null,cart:[],orders:[]};}
  catch{return {users:[],currentUser:null,cart:[],orders:[]};}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function money(n){return Number(n).toLocaleString("ko-KR")+"원";}
function currentUser(){return state.users.find(u=>u.id===state.currentUser)||null;}
function totalSpent(user){return state.orders.filter(o=>o.userId===user.id).reduce((s,o)=>s+o.total,0);}
function getLevel(user){
  const spent=totalSpent(user);
  return [...MEMBER_LEVELS].reverse().find(l=>spent>=l.min)||MEMBER_LEVELS[0];
}
function toast(message){
  const el=document.querySelector("#toast");el.textContent=message;el.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200);
}
function updateHeader(){
  const user=currentUser();
  document.querySelector("#account-button").textContent=user?user.name+"님":"로그인";
  document.querySelector("#cart-count").textContent=state.cart.reduce((s,x)=>s+x.qty,0);
}
function renderFilters(){
  document.querySelector("#category-filters").innerHTML=CATEGORIES.map(c=>`<button class="filter-chip ${activeCategory===c?"active":""}" data-filter="${c}">${c}</button>`).join("");
}
function renderProducts(){
  const list=PRODUCTS.filter(p=>(activeCategory==="전체"||p.category===activeCategory)&&(`${p.name} ${p.category} ${p.description}`).toLowerCase().includes(searchTerm.toLowerCase()));
  const sort=document.querySelector("#sort-select").value;
  if(sort==="low")list.sort((a,b)=>a.price-b.price);
  if(sort==="high")list.sort((a,b)=>b.price-a.price);
  document.querySelector("#product-total").textContent=`총 ${list.length}개 상품`;
  document.querySelector("#product-grid").innerHTML=list.length?list.map(p=>`
    <article class="product-card">
      <button class="product-image" data-detail="${p.id}" aria-label="${p.name} 상세 보기"><span class="tag">${p.tag}</span><img src="${p.image}" alt="${p.name}"></button>
      <div class="product-info"><span class="category-label">${p.category}</span><h3>${p.name}</h3><p class="product-desc">${p.description}</p>
        <div class="price-row"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${p.id}">담기 +</button></div>
      </div>
    </article>`).join(""):`<div class="empty-state">검색 결과가 없습니다.<br>다른 검색어나 분류를 선택해보세요.</div>`;
}
function renderAll(){renderFilters();renderProducts();updateHeader();}
function addToCart(id){
  const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
  const item=state.cart.find(x=>x.productId===id);
  if(item){if(item.qty>=p.stock)return toast("재고 수량을 초과할 수 없습니다.");item.qty++;}
  else state.cart.push({productId:id,qty:1});
  saveState();updateHeader();toast("장바구니에 담았습니다.");
}
function openModal(content,wide=false){
  const root=document.querySelector("#modal-root");
  root.innerHTML=`<div class="modal ${wide?"wide":""}" role="dialog" aria-modal="true">${content}<button class="modal-close" data-close aria-label="닫기">×</button></div>`;
}
function closeModal(){document.querySelector("#modal-root").innerHTML="";}
function openAuth(mode="login"){
  const signup=mode==="signup";
  openModal(`<h2>${signup?"SMASHZONE 회원가입":"다시 만나 반가워요!"}</h2>
    <form id="auth-form" class="form-stack">
      ${signup?`<label class="field">이름<input name="name" required maxlength="20" placeholder="이름"></label>`:""}
      <label class="field">이메일<input name="email" type="email" required placeholder="example@email.com"></label>
      <label class="field">비밀번호<input name="password" type="password" required minlength="4" placeholder="4자 이상 입력"></label>
      ${signup?`<label class="field">비밀번호 확인<input name="confirm" type="password" required minlength="4" placeholder="비밀번호 다시 입력"></label>`:""}
      <button class="full-btn">${signup?"가입하고 3,000P 받기":"로그인"}</button>
      <p class="switch-auth">${signup?"이미 회원이신가요?":"아직 회원이 아니신가요?"} <button type="button" class="link-btn" data-auth-switch="${signup?"login":"signup"}">${signup?"로그인":"회원가입"}</button></p>
      <div class="modal-note">수업 과제용 체험 사이트입니다. 계정 정보는 현재 브라우저의 로컬 저장소에만 저장되며 실제 서버로 전송되지 않습니다.</div>
    </form>`);
  document.querySelector("#auth-form").addEventListener("submit",e=>{
    e.preventDefault();const f=new FormData(e.currentTarget),email=String(f.get("email")).trim().toLowerCase(),password=String(f.get("password"));
    if(signup){
      if(password!==f.get("confirm"))return toast("비밀번호가 일치하지 않습니다.");
      if(state.users.some(u=>u.email===email))return toast("이미 가입된 이메일입니다.");
      const user={id:"u"+Date.now(),name:String(f.get("name")).trim(),email,password,points:3000,createdAt:new Date().toISOString()};
      state.users.push(user);state.currentUser=user.id;saveState();closeModal();updateHeader();toast("가입 완료! 3,000P가 지급됐습니다.");
    }else{
      const user=state.users.find(u=>u.email===email&&u.password===password);
      if(!user)return toast("이메일 또는 비밀번호를 확인해주세요.");
      state.currentUser=user.id;saveState();closeModal();updateHeader();toast(user.name+"님, 환영합니다!");
    }
  });
}
function openDetail(id){
  const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
  openModal(`<div class="detail-layout"><img src="${p.image}" alt="${p.name}"><div><span class="category-label">${p.category}</span><h3>${p.name}</h3><div class="price">${money(p.price)}</div><p>${p.description}</p><p>재고 ${p.stock}개</p><button class="full-btn" data-add="${p.id}">장바구니 담기</button></div></div>`,true);
}
function openCart(){
  const rows=state.cart.map(item=>{const p=PRODUCTS.find(x=>x.id===item.productId);return p?{...item,product:p}:null;}).filter(Boolean);
  const total=rows.reduce((s,x)=>s+x.product.price*x.qty,0);
  openModal(`<h2>장바구니 <span class="muted">(${rows.reduce((s,x)=>s+x.qty,0)}개)</span></h2>
    ${rows.length?rows.map(x=>`<div class="cart-line"><img src="${x.product.image}" alt=""><div><h4>${x.product.name}</h4><small>${money(x.product.price)}</small><div class="qty-control"><button data-qty="${x.productId}" data-delta="-1">−</button><b>${x.qty}</b><button data-qty="${x.productId}" data-delta="1">+</button><button class="remove-btn" data-remove="${x.productId}">삭제</button></div></div><span class="line-price">${money(x.product.price*x.qty)}</span></div>`).join(""):`<div class="empty-state">장바구니가 비어 있습니다.</div>`}
    <div class="cart-total"><span>총 결제 예정 금액</span><b>${money(total)}</b></div>
    <button class="full-btn" data-checkout ${rows.length?"":"disabled"}>체험 결제하기</button>
    <p class="modal-note">체험 결제는 실제 돈이 결제되지 않으며, 주문 내역과 포인트 적립만 기록됩니다.</p>`,true);
}
function changeQty(id,delta){
  const item=state.cart.find(x=>x.productId===id),p=PRODUCTS.find(x=>x.id===id);if(!item||!p)return;
  item.qty+=delta;if(item.qty<=0)state.cart=state.cart.filter(x=>x.productId!==id);
  else if(item.qty>p.stock){item.qty=p.stock;toast("재고 수량까지만 담을 수 있습니다.");}
  saveState();updateHeader();openCart();
}
function checkout(){
  const user=currentUser();if(!user){closeModal();openAuth("login");return toast("주문하려면 먼저 로그인해주세요.");}
  if(!state.cart.length)return;
  const total=state.cart.reduce((s,x)=>{const p=PRODUCTS.find(y=>y.id===x.productId);return s+(p?p.price*x.qty:0);},0);
  const rate=getLevel(user).rate,earned=Math.floor(total*rate);
  const order={id:"SZ"+Date.now(),userId:user.id,items:state.cart.map(x=>({...x})),total,earned,date:new Date().toISOString()};
  state.orders.unshift(order);user.points+=earned;state.cart=[];saveState();closeModal();renderAll();
  toast(`주문 완료! ${earned.toLocaleString("ko-KR")}P 적립`);
}
function openMypage(){
  const user=currentUser();if(!user)return openAuth("login");
  const level=getLevel(user),orders=state.orders.filter(o=>o.userId===user.id);
  openModal(`<h2>마이페이지</h2><div class="profile-head"><h3>${user.name}님, 반갑습니다!</h3><span class="category-label">${level.name} 회원 · 구매 금액 ${money(totalSpent(user))}</span></div>
    <div class="profile-stats"><div><small>보유 포인트</small><b>${user.points.toLocaleString("ko-KR")}P</b></div><div><small>현재 등급</small><b>${level.name}</b></div><div><small>다음 적립률</small><b>${Math.round(level.rate*100)}%</b></div></div>
    <div class="modal-note">등급별 적립률: ${MEMBER_LEVELS.map(l=>`${l.name} ${Math.round(l.rate*100)}%`).join(" · ")}<br>등급은 누적 구매 금액 기준으로 자동 산정됩니다. 가입 축하 포인트 3,000P는 최초 1회 지급됩니다.</div>
    <h3>주문 내역 (${orders.length})</h3>${orders.length?orders.map(o=>`<div class="order-item"><b>${o.id}</b> · ${new Date(o.date).toLocaleString("ko-KR")}<br>${o.items.map(i=>{const p=PRODUCTS.find(x=>x.id===i.productId);return p?p.name+" × "+i.qty:"삭제 상품";}).join(", ")}<br>결제 금액 ${money(o.total)} · 적립 ${o.earned.toLocaleString("ko-KR")}P</div>`).join(""):`<p class="muted">아직 주문 내역이 없습니다.</p>`}
    <button class="full-btn" style="margin-top:18px" data-logout>로그아웃</button>`,true);
}
function setCategory(category){
  activeCategory=category;renderAll();document.querySelector("#products").scrollIntoView({behavior:"smooth"});
}
function showSlide(index){
  const slides=[...document.querySelectorAll(".hero-slide")],dots=[...document.querySelectorAll(".slide-dots button")];
  currentSlide=(index+slides.length)%slides.length;slides.forEach((s,i)=>s.classList.toggle("active",i===currentSlide));dots.forEach((d,i)=>d.classList.toggle("active",i===currentSlide));
}
function startSlider(){
  const dots=document.querySelector(".slide-dots");dots.innerHTML=[0,1,2,3].map(i=>`<button aria-label="${i+1}번 배너" data-slide="${i}"></button>`).join("");
  showSlide(0);slideTimer=setInterval(()=>showSlide(currentSlide+1),6000);
}
function resetSlider(){clearInterval(slideTimer);slideTimer=setInterval(()=>showSlide(currentSlide+1),6000);}

document.addEventListener("click",e=>{
  if(e.target.id==="modal-root"){closeModal();return;}
  const t=e.target.closest("button,a");if(!t)return;
  if(t.matches("[data-filter]")){activeCategory=t.dataset.filter;renderAll();}
  if(t.matches("[data-add]")){addToCart(Number(t.dataset.add));if(t.closest(".modal"))openCart();}
  if(t.matches("[data-detail]"))openDetail(Number(t.dataset.detail));
  if(t.matches("[data-category]")){e.preventDefault();setCategory(t.dataset.category);}
  if(t.matches("[data-page='home']")){e.preventDefault();activeCategory="전체";searchTerm="";document.querySelector("#search-input").value="";renderAll();window.scrollTo({top:0,behavior:"smooth"});}
  if(t.matches("[data-scroll-products]"))document.querySelector("#products").scrollIntoView({behavior:"smooth"});
  if(t.matches("[data-open-auth]"))openAuth(t.dataset.openAuth);
  if(t.matches("[data-auth-switch]"))openAuth(t.dataset.authSwitch);
  if(t.matches("[data-close]"))closeModal();
  if(t.matches("[data-qty]"))changeQty(Number(t.dataset.qty),Number(t.dataset.delta));
  if(t.matches("[data-remove]")){state.cart=state.cart.filter(x=>x.productId!==Number(t.dataset.remove));saveState();updateHeader();openCart();}
  if(t.matches("[data-checkout]"))checkout();
  if(t.matches("[data-logout]")){state.currentUser=null;saveState();closeModal();updateHeader();toast("로그아웃했습니다.");}
  if(t.matches("#cart-button"))openCart();
  if(t.matches("#account-button"))currentUser()?openMypage():openAuth("login");
  if(t.matches("[data-slide]")){showSlide(Number(t.dataset.slide));resetSlider();}
  if(t.matches(".slide-arrow")){showSlide(currentSlide+(t.classList.contains("next")?1:-1));resetSlider();}
});
document.querySelector("#search-form").addEventListener("submit",e=>{e.preventDefault();searchTerm=document.querySelector("#search-input").value.trim();activeCategory="전체";renderAll();document.querySelector("#products").scrollIntoView({behavior:"smooth"});});
document.querySelector("#sort-select").addEventListener("change",renderProducts);
renderAll();startSlider();
