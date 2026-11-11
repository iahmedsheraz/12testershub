/* 12 Testers 14 Days Google– shared scripts (theme, menu, auto blog list, auto gallery + slider) */
const CFG={github:'iahmedsheraz/12testershub',branch:'main'}; // optional fallback only: the GitHub Action manifests are used first. Change branch to 'master' if your default branch is master
(()=>{
const $=s=>document.querySelector(s),root=document.documentElement,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* theme + menu */
const tb=$('#theme-toggle');
if(tb){const set=t=>{root.dataset.theme=t;tb.textContent=t==='dark'?'🌙':'☀️'};set(root.dataset.theme);
tb.onclick=()=>{const t=root.dataset.theme==='dark'?'light':'dark';set(t);try{localStorage.setItem('theme',t)}catch(e){}}}
const hb=$('#hamburger'),mm=$('#mobile-menu');
if(hb)hb.onclick=()=>{mm.hidden=!mm.hidden;hb.setAttribute('aria-expanded',!mm.hidden)};

/* folder listing: manifest json (auto-built by the GitHub Action) -> GitHub API -> list.php -> server directory index */
async function listDir(dir,type){
  const key='ls:'+dir+type;
  try{const c=JSON.parse(sessionStorage.getItem(key));if(c&&Date.now()-c.t<3e5)return c.v}catch(e){}
  const tries=[
    async()=>{const r=await fetch(`/${dir}/${type==='dir'?'posts':'images'}.json`);if(!r.ok)throw 0;return await r.json()},
    async()=>{if(!CFG.github)throw 0;const r=await fetch(`https://api.github.com/repos/${CFG.github}/contents/${dir}?ref=${CFG.branch}`);if(!r.ok)throw 0;return (await r.json()).filter(x=>x.type===type).map(x=>x.name)},
    async()=>{const r=await fetch(`/list.php?dir=${encodeURIComponent(dir)}`);if(!r.ok)throw 0;const j=await r.json();return j[type==='dir'?'dirs':'files']},
    async()=>{const r=await fetch(`/${dir}/`);const d=new DOMParser().parseFromString(await r.text(),'text/html');
      return [...d.querySelectorAll('a[href]')].map(a=>decodeURIComponent(a.getAttribute('href'))).filter(h=>!/^([?#\/.]|\w+:)/.test(h)&&(type==='dir'?h.endsWith('/'):!h.endsWith('/'))).map(h=>h.replace(/\/$/,''))}
  ];
  for(const t of tries){try{const v=await t();if(Array.isArray(v)&&v.length){try{sessionStorage.setItem(key,JSON.stringify({t:Date.now(),v}))}catch(e){}return v}}catch(e){}}
  return [];
}

/* BLOG: any new /blog/<folder>/index.html appears at the top automatically, with an auto-picked featured image from /blog-images/ */
const IMG=/\.(png|jpe?g|webp|avif|gif)$/i;
async function featuredPicker(){
  let map={};try{const r=await fetch('/blog/featured.json');if(r.ok)map=await r.json()}catch(e){}
  let imgs=null;
  return async slug=>{
    if(map[slug])return map[slug];
    if(imgs===null)imgs=(await listDir('blog-images','file')).filter(n=>IMG.test(n)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    if(!imgs.length)return '';
    let h=0;for(const c of slug)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0; // same slug always gets the same image
    return '/blog-images/'+encodeURIComponent(imgs[h%imgs.length]);
  };
}
async function initBlog(){
  const g=$('#post-grid');if(!g)return;
  const known=new Set([...g.querySelectorAll('a.pcard')].map(a=>a.getAttribute('href').replace(/\/$/,'').toLowerCase()));
  const dirs=(await listDir('blog','dir')).filter(d=>!/^[._]/.test(d)&&!known.has('/blog/'+d.toLowerCase()));
  const posts=(await Promise.all(dirs.map(async d=>{try{
    const r=await fetch(`/blog/${encodeURIComponent(d)}/`);if(!r.ok)return;
    const doc=new DOMParser().parseFromString(await r.text(),'text/html');
    const m=s=>doc.querySelector(s)?.getAttribute('content')||'';
    const date=m('meta[property="article:published_time"]')||((doc.documentElement.innerHTML.match(/"datePublished"\s*:\s*"([^"]+)"/)||[])[1])||r.headers.get('last-modified')||'';
    return{d,title:(doc.querySelector('h1')?.textContent||doc.title).trim(),desc:m('meta[name=description]'),tag:m('meta[property="article:section"]')||'New',img:m('meta[property="og:image"]'),t:Date.parse(date)||0};
  }catch(e){}}))).filter(Boolean).sort((a,b)=>b.t-a.t);
  const nodes=posts.map(p=>{const a=document.createElement('a');a.className='pcard';a.href=`/blog/${p.d}/`;if(p.img)a.dataset.img=p.img;
    a.innerHTML=`<span class="thumb" aria-hidden="true"></span><span class="badge">${esc(p.tag)}</span><h2>${esc(p.title)}</h2><p>${esc(p.desc)}</p><span class="more">Read article →</span>`;return a});
  if(nodes.length)g.prepend(...nodes);
  const pick=await featuredPicker();
  for(const a of g.querySelectorAll('a.pcard')){
    const t=a.querySelector('.thumb');if(!t)continue;
    const slug=decodeURIComponent(a.getAttribute('href').split('/').filter(Boolean).pop());
    const u=a.dataset.img||await pick(slug);
    if(u)t.innerHTML=`<img src="${esc(u)}" alt="" width="640" height="360" loading="lazy" decoding="async">`;else t.remove();
  }
}

/* SUCCESS STORIES: slider + gallery from /success-stories/images/ */
async function initStories(){
  const ga=$('#gallery');if(!ga)return;
  const base='/success-stories/images/';
  const files=(await listDir('success-stories/images','file')).filter(n=>/\.(png|jpe?g|webp|avif|gif)$/i.test(n)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  if(!files.length)return;
  const alt=n=>n.replace(/\.[^.]+$/,'').replace(/^(hero|banner)[-_]/i,'').replace(/[-_]+/g,' ').replace(/\s*\d+$/,'').trim().replace(/\b\w/g,c=>c.toUpperCase())+' app screenshot – Google Play closed testing';
  const src=n=>base+encodeURIComponent(n);
  document.querySelectorAll('.proof').forEach(e=>e.hidden=false);
  // gallery
  ga.innerHTML=files.map(n=>`<button type="button" data-n="${esc(n)}" aria-label="Open ${esc(alt(n))}"><img src="${src(n)}" alt="${esc(alt(n))}" loading="lazy" decoding="async"></button>`).join('');
  const lb=document.createElement('dialog');lb.className='lb';lb.innerHTML='<img alt=""><p></p>';document.body.append(lb);
  lb.onclick=()=>lb.close();
  ga.onclick=e=>{const b=e.target.closest('button');if(!b)return;const n=b.dataset.n;lb.firstChild.src=src(n);lb.firstChild.alt=alt(n);lb.lastChild.textContent=alt(n);lb.showModal()};
  // slider: files starting with hero- / banner-, otherwise the first 8 images
  let hero=files.filter(n=>/^(hero|banner)[-_]/i.test(n));if(!hero.length)hero=files.slice(0,8);
  const tr=$('#slider-track');
  tr.innerHTML=hero.map((n,i)=>`<figure class="slide"><img src="${src(n)}" alt="${esc(alt(n))}" ${i?'loading="lazy"':'fetchpriority="high"'} decoding="async"><figcaption>${esc(alt(n).split(' app screenshot')[0])}</figcaption></figure>`).join('');
  const go=d=>{const w=tr.clientWidth+16;const end=tr.scrollLeft+tr.clientWidth>=tr.scrollWidth-4;tr.scrollTo({left:d>0&&end?0:d<0&&tr.scrollLeft<4?tr.scrollWidth:tr.scrollLeft+d*w,behavior:'smooth'})};
  $('#sl-prev').onclick=()=>go(-1);$('#sl-next').onclick=()=>go(1);
  if(hero.length<2){$('#sl-prev').hidden=$('#sl-next').hidden=true;return}
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  let paused=false;const sl=$('#hero-slider');
  ['mouseenter','focusin','touchstart'].forEach(ev=>sl.addEventListener(ev,()=>paused=true,{passive:true}));
  ['mouseleave','focusout'].forEach(ev=>sl.addEventListener(ev,()=>paused=false));
  setInterval(()=>{if(!paused&&!document.hidden)go(1)},4500);
}

/* ORDER FORM (contact page) – same endpoint as the homepage */
const f=$('#hubOrderForm');
if(f)f.addEventListener('submit',function(e){
  e.preventDefault();
  const btn=$('#submit-btn'),html=btn.innerHTML;
  btn.innerHTML='⏳ Processing your order…';btn.disabled=true;
  const scriptURL='https://script.google.com/macros/s/AKfycbw3Ai_V-YfqQwsc_jxznhrYpu4J7NEaRu6rDrv1bLiUPxlkyQwhwy2cOgsUp-W-4OtVxA/exec';
  fetch(scriptURL,{method:'POST',body:new FormData(e.target)})
    .then(()=>{window.location.href='/thank-you.html'})
    .catch(err=>{console.error('Order submission error:',err);alert('Submission failed. Please try again or contact us via WhatsApp.');btn.innerHTML=html;btn.disabled=false});
});

initBlog();initStories();
})();
