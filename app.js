
/* ---- Configuration: edit here ---- */
const CONFIG={domain:'depper-store.myshopify.com'}; // public store domain only. The access token stays on the server (Netlify environment variable), never in this file.
const CONTENT={faq:[
 ['How can I place an order?','Choose a color, tap Add to cart, then check out on Shopify’s secure checkout page.'],
 ['What payment methods are accepted?','Available methods are shown at checkout and are set in your Shopify payment settings.'],
 ['How long does shipping take?','Delivery options and estimated times are shown at checkout for your address.'],
 ['How can I track my order?','Your confirmation email from Shopify includes a tracking link once the order ships.'],
 ['Can I return a product?','See the return policy linked in the footer for the conditions that apply.'],
 ['How can I contact support?','Use the contact details in the footer, or reply to your order confirmation email.']],
 social:[]};
const IMG=["images/photo-1.jpg", "images/photo-2.jpg", "images/photo-3.jpg", "images/photo-4.jpg", "images/photo-5.jpg", "images/photo-6.jpg"]; // 0 white, 1 trio, 2 pouring, 3 red, 4 detail collage, 5 brown with size labels
/* ---- Helpers ---- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const live=()=>true;
const money=(a,c)=>new Intl.NumberFormat(undefined,{style:'currency',currency:c||'USD'}).format(a);
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),4200)}
async function gql(q,v){const r=await fetch('/api/storefront',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,variables:v})});if(!r.ok){let m='';try{const j=await r.json();m=j.error||(typeof j.errors==='string'?j.errors:'')}catch(e){}throw new Error(m||'Shopify returned '+r.status)}const j=await r.json();if(j.errors)throw new Error(typeof j.errors==='string'?j.errors:j.errors[0].message);return j.data}
const fe=e=>{const m=String((e&&e.message)||e);return m==='not_configured'?'The store connection isn’t configured yet. Add the SHOPIFY_STOREFRONT_TOKEN environment variable in Netlify and redeploy.':e instanceof TypeError?'Couldn’t reach the store. Check your internet connection and try again.':/40[13]/.test(m)?'Shopify rejected the access token. Check the token and its Storefront API permissions.':/404/.test(m)?'Shopify couldn’t find this store or API version. Check SHOPIFY_STORE_DOMAIN and SHOPIFY_API_VERSION.':m};
const LOAD='<p class="muted"><span class="spin" style="border-color:#0003;border-top-color:#14264A"></span>Loading products…</p>';
const NONE='<div class="empty" style="margin:0;max-width:none"><h3>No products yet</h3><p>The store is connected, but Shopify returned no products. Make sure your products are active and published to the sales channel that owns this access token.</p></div>';
const ERR=m=>`<div class="empty" style="margin:0;max-width:none"><h3>We couldn’t load the products</h3><p>${esc(m)}</p><button class="btn" id="retry" style="margin-top:18px">Try again</button></div>`;
const store=(k,v)=>{try{return v===undefined?localStorage.getItem(k):v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){return null}};
/* ---- Data ---- */
const COLORS={Brown:5,White:0,Red:3};
const OFFLINE={id:'offline',title:'Chocolate Fondue Mug',description:'A ceramic fondue mug with a built-in chamber for a tea light, plus a dipping fork. Add chocolate to the mug, light the candle below and dip.',offline:true,
 options:[{name:'Color',values:['Brown','White','Red']}],images:IMG.map((u,i)=>({url:u,alt:'DEPPER fondue mug photo '+(i+1)})),
 variants:['Brown','White','Red'].map(c=>({id:null,title:c,availableForSale:true,price:null,selectedOptions:[{name:'Color',value:c}]}))};
const PQ=`id handle title description availableForSale images(first:10){nodes{url altText}} options{name values} variants(first:50){nodes{id title availableForSale price{amount currencyCode} compareAtPrice{amount} selectedOptions{name value}}}`;
const CF=`id checkoutUrl totalQuantity cost{subtotalAmount{amount currencyCode}} lines(first:50){nodes{id quantity merchandise{... on ProductVariant{id title product{title} image{url} price{amount currencyCode}}}}}`;
const S={products:[OFFLINE],p:OFFLINE,sel:{Color:'White'},qty:1,img:0,cart:null,busy:false,wl:JSON.parse(store('dp_wl')||'[]')};
const norm=p=>({...p,images:p.images.nodes.map(i=>({url:i.url,alt:i.altText||p.title})),variants:p.variants.nodes});
const variant=()=>S.p.variants.find(v=>Object.entries(S.sel).every(([k,x])=>v.selectedOptions.some(o=>o.name===k&&o.value===x)))||S.p.variants[0];
const minPrice=p=>{const v=p.variants.filter(x=>x.price);return v.length?money(Math.min(...v.map(x=>+x.price.amount)),v[0].price.currencyCode):'Price syncs from Shopify'};
function pick(p){S.p=p;S.qty=1;S.img=0;S.sel={};p.options.forEach(o=>S.sel[o.name]=(p.variants.find(v=>v.availableForSale)||p.variants[0]).selectedOptions.find(x=>x.name===o.name)?.value||o.values[0]);renderDetail();renderGrid()}
/* ---- Render ---- */
function renderDetail(){
 if(!S.p){$('#pd').innerHTML=S.msg||'';return}
 const p=S.p,v=variant(),imgs=p.images.length?p.images:OFFLINE.images;
 if(p.offline&&COLORS[S.sel.Color]!==undefined&&S.imgAuto!==false)S.img=Math.min(S.img,imgs.length-1);
 const price=v.price?`<div class="price">${money(v.price.amount,v.price.currencyCode)}${v.compareAtPrice&&+v.compareAtPrice.amount>+v.price.amount?`<s>${money(v.compareAtPrice.amount,v.price.currencyCode)}</s></div><span class="tag">Save ${Math.round(100-100*v.price.amount/v.compareAtPrice.amount)}%</span>`:'</div>'}`:'<div class="price muted" style="font-size:1.1rem">Price syncs from Shopify</div>';
 const opts=p.options.filter(o=>!(o.name==='Title'&&o.values.length===1&&o.values[0]==='Default Title')).map(o=>`<div class="opt"><b>${esc(o.name)}: ${esc(S.sel[o.name])}</b><div class="chips">${o.values.map(x=>`<button class="chip" data-o="${esc(o.name)}" data-v="${esc(x)}" aria-pressed="${S.sel[o.name]===x}">${esc(x)}</button>`).join('')}</div></div>`).join('');
 const av=p.offline?'':v.availableForSale?'<span class="tag">In stock</span>':'<span class="tag">Sold out</span>';
 $('#pd').innerHTML=`<div class="gal"><div class="main" id="gm"><img id="gi" src="${esc(imgs[S.img].url)}" alt="${esc(imgs[S.img].alt)}" width="900" height="900"${p.offline&&S.img===5?' style="object-fit:contain;background:#fff"':''}></div><div class="thumbs">${imgs.slice(0,6).map((i,n)=>`<button data-i="${n}" aria-label="Photo ${n+1}" aria-current="${n===S.img}"><img src="${esc(i.url)}" alt="" loading="lazy"></button>`).join('')}</div></div>
 <div><h2>${esc(p.title)}</h2>${price}${av}<p class="muted" style="margin-top:14px">${esc(p.description)}</p>${opts}
 <div class="buy"><div class="qty" aria-label="Quantity"><button id="qm" aria-label="Decrease quantity">−</button><span id="qv">${S.qty}</span><button id="qp" aria-label="Increase quantity">+</button></div>
 <div class="row"><button class="btn" id="add" ${!p.offline&&!v.availableForSale?'disabled':''}>Add to cart</button><button class="heart" id="hb" aria-label="Save to wishlist" aria-pressed="${S.wl.includes(p.id)}"><svg viewBox="0 0 24 24"><path d="M12 20s-7.500-4.500-7.500-10A4.300 4.300 0 0 1 12 7.500 4.300 4.300 0 0 1 19.500 10c0 5.500-7.500 10-7.500 10z"/></svg></button></div>
 <button class="btn ghost" id="now" style="color:var(--navy)" ${!p.offline&&!v.availableForSale?'disabled':''}>Buy now</button></div>
 <div style="margin-top:28px">${p.offline?'<details open><summary>Specifications</summary><ul><li>Size: 8.3 cm wide × 11 cm tall (3.27 × 4.3 in)</li><li>Tea light chamber in the base</li><li>Dipping fork included</li></ul></details>':''}
 <details><summary>Shipping</summary><p>Delivery options and rates are calculated at checkout for your address.</p></details>
 <details><summary>Returns</summary><p>See the return policy linked in the footer for the conditions that apply.</p></details>
 <details><summary>Customer reviews</summary><p>No reviews yet. Be the first to share your experience.</p></details></div></div>`;
}
function renderGrid(){
 const many=S.products.length>1;$('#grid').hidden=!many;$('#sortw').hidden=!many;
 const val=p=>p.variants[0].price?+p.variants[0].price.amount:0,s=$('#sort').value;
 const list=[...S.products].sort((a,b)=>s==='lo'?val(a)-val(b):s==='hi'?val(b)-val(a):s==='az'?a.title.localeCompare(b.title):0);
 $('#grid').innerHTML=list.map(p=>`<button class="card" data-p="${esc(p.id)}"><div><img src="${esc((p.images[0]||OFFLINE.images[0]).url)}" alt="${esc(p.title)}" loading="lazy" width="400" height="400"></div><b style="display:block;margin-top:10px">${esc(p.title)}</b><span class="muted">${minPrice(p)}</span></button>`).join('');
 const rel=S.products.filter(p=>p.id!==S.p.id).slice(0,4);$('#rel').hidden=!rel.length;
 $('#relg').innerHTML=rel.map(p=>`<button class="card" data-p="${esc(p.id)}"><div><img src="${esc((p.images[0]||OFFLINE.images[0]).url)}" alt="${esc(p.title)}" loading="lazy"></div><b style="display:block;margin-top:10px">${esc(p.title)}</b><span class="muted">${minPrice(p)}</span></button>`).join('');
}
function renderCart(){
 const c=S.cart,n=c?c.totalQuantity:0;$('#cc').textContent=n||'';
 const L=$('#lines'),M=$('#sum');
 if(!live()){L.innerHTML='<div style="padding:32px 0"><h3>Store not connected yet</h3><p class="muted">Open Store setup in the footer and paste your Storefront access token to turn on the cart and checkout.</p></div>';M.innerHTML='';return}
 if(!c||!c.lines.nodes.length){L.innerHTML='<div style="padding:32px 0"><h3>Your cart is empty</h3><p class="muted">Add a mug to get started.</p></div>';M.innerHTML='<a class="btn" href="#shop" id="cs">Continue shopping</a>';return}
 L.innerHTML=c.lines.nodes.map(l=>{const m=l.merchandise;return`<div class="line"><img src="${esc(m.image?.url||IMG[0])}" alt=""><div><b>${esc(m.product.title)}</b><div class="muted">${esc(m.title==='Default Title'?'':m.title)}</div><div>${money(m.price.amount,m.price.currencyCode)}</div><div class="qty"><button data-l="${l.id}" data-d="-1" aria-label="Decrease">−</button><span>${l.quantity}</span><button data-l="${l.id}" data-d="1" aria-label="Increase">+</button></div><button class="rm" data-r="${l.id}">Remove</button></div></div>`}).join('');
 const t=c.cost.subtotalAmount;M.innerHTML=`<div class="tot"><span>Subtotal</span><span>${money(t.amount,t.currencyCode)}</span></div><p class="muted" style="margin:4px 0 0;font-size:.85rem">Shipping and taxes are calculated at checkout.</p><a class="btn" href="${esc(c.checkoutUrl)}">Checkout</a>`;
}
/* ---- Cart (Shopify Storefront Cart API) ---- */
function drawer(o){$('#drawer').classList.toggle('on',o);$('#ov').classList.toggle('on',o);$('#drawer').setAttribute('aria-hidden',!o)}
async function cartOp(q,v,key){S.busy=true;$('#sum').insertAdjacentHTML('afterbegin','<p class="muted"><span class="spin" style="border-color:#0003;border-top-color:#14264A"></span>Updating…</p>');
 try{const d=await gql(q,v),r=d[key];if(r.userErrors?.length)throw new Error(r.userErrors[0].message);S.cart=r.cart;store('dp_cart',S.cart?S.cart.id:null);return r.cart}
 catch(e){toast(fe(e))}finally{S.busy=false;renderCart()}}
const line=()=>({merchandiseId:variant().id,quantity:S.qty});
async function add(){if(!live())return toast('Shopify isn’t connected yet. Open Store setup in the footer to add your Storefront token.');
 const q=S.cart?`mutation($id:ID!,$l:[CartLineInput!]!){cartLinesAdd(cartId:$id,lines:$l){cart{${CF}}userErrors{message}}}`:`mutation($l:[CartLineInput!]){cartCreate(input:{lines:$l}){cart{${CF}}userErrors{message}}}`;
 drawer(true);const c=await cartOp(q,S.cart?{id:S.cart.id,l:[line()]}:{l:[line()]},S.cart?'cartLinesAdd':'cartCreate');if(c)toast('Added to cart')}
async function now(){if(!live())return toast('Shopify isn’t connected yet. Open Store setup in the footer to add your Storefront token.');
 const b=$('#now');b.innerHTML='<span class="spin" style="border-color:#0003;border-top-color:#14264A"></span>Redirecting…';
 try{const d=await gql(`mutation($l:[CartLineInput!]){cartCreate(input:{lines:$l}){cart{checkoutUrl}userErrors{message}}}`,{l:[line()]});const r=d.cartCreate;if(r.userErrors.length)throw new Error(r.userErrors[0].message);location.href=r.cart.checkoutUrl}
 catch(e){toast(fe(e));b.textContent='Buy now'}}
const upd=(id,q)=>cartOp(`mutation($c:ID!,$l:[CartLineUpdateInput!]!){cartLinesUpdate(cartId:$c,lines:$l){cart{${CF}}userErrors{message}}}`,{c:S.cart.id,l:[{id,quantity:q}]},'cartLinesUpdate');
const rem=id=>cartOp(`mutation($c:ID!,$i:[ID!]!){cartLinesRemove(cartId:$c,lineIds:$i){cart{${CF}}userErrors{message}}}`,{c:S.cart.id,i:[id]},'cartLinesRemove');
/* ---- Events ---- */
document.addEventListener('click',e=>{
 const t=e.target.closest('button,a');if(!t)return;
 if(t.dataset.o){S.sel[t.dataset.o]=t.dataset.v;if(S.p.offline&&COLORS[t.dataset.v]!==undefined)S.img=COLORS[t.dataset.v];renderDetail()}
 else if(t.dataset.i){S.img=+t.dataset.i;renderDetail()}
 else if(t.dataset.p){pick(S.products.find(p=>p.id===t.dataset.p));$('#sbar').hidden=true;$('#pd').scrollIntoView()}
 else if(t.dataset.l){const l=S.cart.lines.nodes.find(x=>x.id===t.dataset.l),q=l.quantity+ +t.dataset.d;q<1?rem(l.id):upd(l.id,q)}
 else if(t.dataset.r)rem(t.dataset.r);
 else if(t.id==='qm'){S.qty=Math.max(1,S.qty-1);$('#qv').textContent=S.qty}
 else if(t.id==='qp'){S.qty=Math.min(99,S.qty+1);$('#qv').textContent=S.qty}
 else if(t.id==='add')add();else if(t.id==='now')now();else if(t.id==='retry')window.dpLoad();
 else if(t.id==='hb'){const i=S.wl.indexOf(S.p.id);i<0?S.wl.push(S.p.id):S.wl.splice(i,1);store('dp_wl',JSON.stringify(S.wl));$('#hb').setAttribute('aria-pressed',S.wl.includes(S.p.id));$('#wlc').textContent=S.wl.length||''}
 else if(t.id==='wl'){toast(S.wl.length?`${S.wl.length} saved item${S.wl.length>1?'s':''}`:'Your wishlist is empty. Tap the heart on a product to save it.')}
 else if(t.id==='ct')drawer(true);else if(t.id==='cx'||t.id==='cs')drawer(false);
 else if(t.id==='sb'){const b=$('#sbar');b.hidden=!b.hidden;if(!b.hidden)$('#sq').focus()}
 else if(t.id==='bg'){const n=$('#nav').classList.toggle('open');t.setAttribute('aria-expanded',n)}
 else if(t.closest('nav'))$('#nav').classList.remove('open');
 else if(t.id==='rw')toast('Reviews need a moderated review service, which isn’t connected yet.');
 if(t.closest('#sres')&&t.dataset.p)$('#sres').hidden=true;
 const m=e.target.closest('#gm');if(m){m.classList.toggle('z');}
});
document.addEventListener('mousemove',e=>{const m=e.target.closest('#gm');if(m&&m.classList.contains('z')){const r=m.getBoundingClientRect();m.firstElementChild.style.transformOrigin=`${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`}});
$('#ov').onclick=()=>drawer(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer(false)});
$('#sort').onchange=renderGrid;
$('#sq').oninput=e=>{const q=e.target.value.trim().toLowerCase(),r=$('#sres');if(!q){r.hidden=true;return}
 const m=S.products.filter(p=>p.title.toLowerCase().includes(q));r.hidden=false;r.innerHTML=m.length?m.map(p=>`<button data-p="${esc(p.id)}">${esc(p.title)}</button>`).join(''):'<button disabled>No products found. Try another word.</button>'};
$('#nl').onsubmit=e=>{e.preventDefault();const v=$('#em').value.trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))return toast('Enter a valid email address.');toast('Newsletter sign-up isn’t connected yet. Nothing was submitted.')};
/* ---- Init ---- */
$('#himg').src=IMG[1];$('#aimg').src=IMG[2];
$('#acc').href=`https://${CONFIG.domain}/account`;
document.querySelectorAll('[data-pol]').forEach(a=>a.href=`https://${CONFIG.domain}/policies/${a.dataset.pol}`);
$('#faqs').innerHTML=CONTENT.faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
$('#wlc').textContent=S.wl.length||'';
renderDetail();renderGrid();renderCart();
(window.dpLoad=async()=>{if(!live())return;S.products=[];S.p=null;S.msg=LOAD;renderDetail();renderGrid();
 try{const d=await gql(`{products(first:24){nodes{${PQ}}}}`);const ps=d.products.nodes.map(norm);if(ps.length){S.products=ps;pick(ps[0])}else{S.msg=NONE;renderDetail()}}
 catch(e){S.msg=ERR(fe(e));renderDetail();toast(fe(e))}
 const id=store('dp_cart');if(id)try{const d=await gql(`query($id:ID!){cart(id:$id){${CF}}}`,{id});S.cart=d.cart;if(!d.cart)store('dp_cart',null);renderCart()}catch(e){}
})();
