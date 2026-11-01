/* ============================================================
   Snowman — storefront connected to the SnowmanBot (Telegram)
   ------------------------------------------------------------
   • Products load LIVE from SnowmanBot's API (anything you
     publish in the bot appears here automatically).
   • Ordering: the customer picks a product, enters their
     Telegram @ and drops a map pin; we POST it to the bot,
     which DMs the admin to close the deal on Telegram.

   SET TWO THINGS BELOW:
     1) API_BASE      — your SnowmanBot public URL (Render)
     2) TELEGRAM_BOT  — your customer bot @username (no @)
   ============================================================ */

const API_BASE     = "https://snowmanbot.onrender.com";  // SnowmanBot public URL (Render)
const TELEGRAM_BOT = "qrservice1bot";                    // customer bot username, no @
const BRAND        = "Snowman";
const MAP_DEFAULT  = [25.2048, 55.2708];                 // default map centre (customers drop their own pin)

/* ---- Demo catalog (shown only when API_BASE is empty) ----- */
const DEFAULT_PRODUCTS = [
  { id:"d1", name:"Red Rose Bouquet",     price:29.99, desc:"A dozen fresh red roses, hand-tied.", hue:345 },
  { id:"d2", name:"Sunflower Bunch",      price:19.99, desc:"Bright seasonal sunflowers.",         hue:45  },
  { id:"d3", name:"Pink Peony Paradise",  price:59.99, desc:"Lush peonies for a special day.",      hue:330 },
  { id:"d4", name:"White Lily Elegance",  price:39.99, desc:"Classic calla lilies.",               hue:200 },
  { id:"d5", name:"Lavender Dream",       price:24.99, desc:"Fragrant lavender arrangement.",       hue:270 },
  { id:"d6", name:"Tulip Collection",     price:34.99, desc:"A mix of spring tulips.",              hue:10  },
];

/* ---- State ------------------------------------------------ */
let PRODUCTS = [];
let USING_API = false;

const money  = n => "$" + (Number(n)||0).toFixed(2);
const esc    = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hueFor = s => { let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))%360; return h; };
const byId   = id => PRODUCTS.find(p => String(p.id) === String(id));
const apiConfigured = () => API_BASE && /^https?:\/\//.test(API_BASE);
const BOT_SET = TELEGRAM_BOT && !/^your/i.test(TELEGRAM_BOT);
const tgHome  = () => BOT_SET ? `https://t.me/${TELEGRAM_BOT}` : "#";

/* ---- Load products from SnowmanBot ------------------------ */
const grid = document.getElementById("product-grid");

async function loadProducts(){
  if(!apiConfigured()){
    console.info("[Snowman] API_BASE not set — showing demo products.");
    PRODUCTS = DEFAULT_PRODUCTS.slice(); USING_API = false;
    renderCatalog(); paintCounts(); return;
  }
  grid.innerHTML = `<div class="grid-empty"><p>Loading the collection…</p></div>`;
  try{
    const res = await fetch(`${API_BASE.replace(/\/$/,"")}/api/products`, { mode:"cors" });
    if(!res.ok) throw new Error("HTTP "+res.status);
    const data = await res.json();
    PRODUCTS = (data.products||[]).map(p=>({
      id:p.id, name:p.name, price:Number(p.price)||0, desc:p.description||"",
      image:p.image ? API_BASE.replace(/\/$/,"") + p.image : null,
      hue:hueFor(p.name||String(p.id)),
    }));
    USING_API = true;
    renderCatalog(); paintCounts();
  }catch(err){
    console.warn("[Snowman] product API failed — showing demo catalog.", err);
    PRODUCTS = DEFAULT_PRODUCTS.slice(); USING_API = false;
    renderCatalog(); paintCounts();
  }
}

/* ---- Bloom illustration (fallback when a product has no photo) */
function bloomSVG(hue){
  const a=`hsl(${hue} 85% 82%)`, b=`hsl(${hue} 80% 62%)`, c=`hsl(${hue} 70% 48%)`;
  return `<svg viewBox="0 0 120 120" class="card__vial" aria-hidden="true">
    <defs><radialGradient id="b${hue}" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs>
    <g fill="url(#b${hue})">
      <ellipse cx="60" cy="34" rx="13" ry="22"/>
      <ellipse cx="60" cy="34" rx="13" ry="22" transform="rotate(60 60 58)"/>
      <ellipse cx="60" cy="34" rx="13" ry="22" transform="rotate(120 60 58)"/>
      <ellipse cx="60" cy="34" rx="13" ry="22" transform="rotate(180 60 58)"/>
      <ellipse cx="60" cy="34" rx="13" ry="22" transform="rotate(240 60 58)"/>
      <ellipse cx="60" cy="34" rx="13" ry="22" transform="rotate(300 60 58)"/>
    </g>
    <circle cx="60" cy="58" r="12" fill="#ffd36e"/><circle cx="60" cy="58" r="12" fill="#f3a93c" opacity=".4"/>
    <path d="M60 70v34" stroke="#2f8f57" stroke-width="3"/>
  </svg>`;
}

/* ---- Render catalog --------------------------------------- */
function renderCatalog(){
  if(USING_API && PRODUCTS.length === 0){
    grid.innerHTML = `<div class="grid-empty"><p>No products yet.</p><p class="small">Publish a product in your Telegram bot and it appears here.</p></div>`;
    return;
  }
  grid.innerHTML = PRODUCTS.map(p=>{
    const media = p.image
      ? `<img class="card__img" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()">`
      : bloomSVG(p.hue);
    const meta = p.desc
      ? `<span class="card__meta">${esc(p.desc.slice(0,90))}${p.desc.length>90?"…":""}</span>`
      : `<span class="card__meta">Tap to order</span>`;
    return `<article class="card">
      <div class="card__media">${media}</div>
      <div class="card__body">
        <h3 class="card__name">${esc(p.name)}</h3>
        ${meta}
        <span class="card__price">${money(p.price)}</span>
        <div class="card__actions">
          <button class="btn btn--primary btn--sm card__order" data-order="${esc(p.id)}">Order now</button>
        </div>
      </div>
    </article>`;
  }).join("");
}

function paintCounts(){
  const el = document.getElementById("stat-total");
  if(el) el.textContent = PRODUCTS.length || "—";
}

/* ---- Order modal + map ------------------------------------ */
const modal = document.getElementById("order-modal");
let orderProduct = null;
let map = null, marker = null, pin = null;

function initMap(){
  const box = document.getElementById("order-map");
  if(typeof L === "undefined" || !box){
    if(box) box.innerHTML = `<div class="map-fallback">Map unavailable — we'll confirm your address with you on Telegram.</div>`;
    return;
  }
  if(map){ setTimeout(()=>map.invalidateSize(), 60); return; }
  map = L.map(box, { zoomControl:true, scrollWheelZoom:false }).setView(MAP_DEFAULT, 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom:19, attribution:"© OpenStreetMap contributors"
  }).addTo(map);
  const icon = L.divIcon({ className:"map-pin", html:"📍", iconSize:[30,30], iconAnchor:[15,28] });
  marker = L.marker(MAP_DEFAULT, { draggable:true, icon }).addTo(map);
  pin = { lat:MAP_DEFAULT[0], lng:MAP_DEFAULT[1] };
  const sync = ll => { pin = { lat:ll.lat, lng:ll.lng }; };
  marker.on("dragend", ()=>sync(marker.getLatLng()));
  map.on("click", e=>{ marker.setLatLng(e.latlng); sync(e.latlng); });
  setTimeout(()=>map.invalidateSize(), 80);
}

function locateMe(){
  if(!navigator.geolocation){ toast("Location isn't available on this device"); return; }
  toast("Finding your location…");
  navigator.geolocation.getCurrentPosition(pos=>{
    const ll = [pos.coords.latitude, pos.coords.longitude];
    pin = { lat:ll[0], lng:ll[1] };
    if(map && marker){ map.setView(ll, 15); marker.setLatLng(ll); }
    toast("Location set");
  }, ()=>toast("Couldn't get location — drag the pin instead"), { enableHighAccuracy:true, timeout:8000 });
}

function openOrder(id){
  const p = byId(id); if(!p) return;
  orderProduct = p;
  document.getElementById("order-item").innerHTML =
    `<div class="order-item__media">${p.image?`<img src="${esc(p.image)}" alt="" onerror="this.remove()">`:bloomSVG(p.hue)}</div>
     <div class="order-item__info"><strong>${esc(p.name)}</strong><span>${money(p.price)}</span></div>`;
  document.getElementById("order-step-form").hidden = false;
  document.getElementById("order-step-done").hidden = true;
  const btn = document.getElementById("send-order-btn"); btn.disabled=false; btn.textContent="Send order";
  modal.hidden = false; document.body.classList.add("drawer-open");
  initMap();
}
function closeOrder(){ modal.hidden = true; document.body.classList.remove("drawer-open"); }

async function submitOrder(){
  const username = document.getElementById("od-user").value.trim();
  const note = document.getElementById("od-note").value.trim();
  if(!username){ toast("Enter your Telegram username so we can reach you"); return; }
  const btn = document.getElementById("send-order-btn");
  btn.disabled = true; btn.textContent = "Sending…";
  const payload = {
    username,
    product_id: orderProduct && typeof orderProduct.id === "number" ? orderProduct.id : null,
    product_name: orderProduct ? orderProduct.name : "",
    price: orderProduct ? money(orderProduct.price) : "",
    note,
    lat: pin ? pin.lat : null,
    lng: pin ? pin.lng : null,
  };
  try{
    if(apiConfigured()){
      const res = await fetch(`${API_BASE.replace(/\/$/,"")}/api/order`, {
        method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error("HTTP "+res.status);
    }else{
      await new Promise(r=>setTimeout(r,400)); // demo mode
    }
  }catch(err){
    console.warn("[Snowman] order submit failed", err);
    toast("Couldn't send — please try again, or chat with us on Telegram");
    btn.disabled=false; btn.textContent="Send order"; return;
  }
  document.getElementById("order-done-msg").textContent =
    `Thank you! We'll message you on Telegram at @${username.replace(/^@/,"")} to confirm and arrange same-day delivery.`;
  document.getElementById("order-step-form").hidden = true;
  document.getElementById("order-step-done").hidden = false;
  btn.disabled=false; btn.textContent="Send order";
}

/* ---- Toast ------------------------------------------------ */
let toastTimer;
function toast(msg){
  const t=document.getElementById("toast"); if(!t) return;
  t.innerHTML=`<span class="tick">✓</span> ${esc(msg)}`;
  t.classList.add("show"); clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove("show"),2600);
}

/* ---- Mobile nav ------------------------------------------- */
function initNav(){
  const toggle=document.getElementById("nav-toggle"), nav=document.getElementById("nav");
  if(!toggle||!nav) return;
  let backdrop;
  const close=()=>{ nav.classList.remove("open"); toggle.setAttribute("aria-expanded","false"); if(backdrop){backdrop.remove();backdrop=null;} };
  toggle.addEventListener("click",()=>{
    const open=nav.classList.toggle("open"); toggle.setAttribute("aria-expanded",open);
    if(open){ backdrop=document.createElement("div"); backdrop.className="nav-backdrop"; backdrop.addEventListener("click",close); document.body.appendChild(backdrop); } else close();
  });
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
}

/* ---- Listeners -------------------------------------------- */
document.addEventListener("click", e=>{
  const ord = e.target.closest("[data-order]");
  if(ord){ e.preventDefault(); openOrder(ord.dataset.order); return; }
  if(e.target.closest("[data-close-order]")){ closeOrder(); return; }
  const tg = e.target.closest(".tg-open");
  if(tg && !BOT_SET){ e.preventDefault(); toast("Set TELEGRAM_BOT (your bot @username) in app.js"); }
});
document.getElementById("od-locate").addEventListener("click", locateMe);
document.getElementById("send-order-btn").addEventListener("click", submitOrder);
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeOrder(); });

document.getElementById("news-form")?.addEventListener("submit", e=>{
  e.preventDefault();
  const email=document.getElementById("news-email");
  if(!email.value||!email.value.includes("@")){ toast("Enter a valid email"); return; }
  email.value=""; toast("Subscribed — thank you!");
});

const header=document.getElementById("header");
addEventListener("scroll",()=>{ header.classList.toggle("scrolled", scrollY>20); }, {passive:true});
document.getElementById("year").textContent=new Date().getFullYear();

/* ---- Init ------------------------------------------------- */
document.querySelectorAll('[data-tg="home"]').forEach(a=>{ a.href = tgHome(); });
initNav();
loadProducts();
