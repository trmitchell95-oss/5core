const CK_CONFIG = window.CK_CONFIG;

const cloudReady = Boolean(CK_CONFIG.supabaseUrl && CK_CONFIG.supabasePublishableKey);
const localHost = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const buildMode = localHost ? 'Demo · local fake data' : (cloudReady ? (CK_CONFIG.sandboxMode ? 'Sandbox · secure cloud' : 'Live · secure cloud') : 'Not connected');
const buildCloud = cloudReady ? 'Connected' : 'Not connected';
const buildInfoText = [
  `ChairKeeper v${CK_CONFIG.version || 'unknown'}`,
  `Release: ${CK_CONFIG.releaseName || 'unknown'}`,
  `Mode: ${buildMode}`,
  `Cloud: ${buildCloud}`,
  `Schema: ${CK_CONFIG.schemaVersion || 'unknown'}`,
  `Build date: ${CK_CONFIG.buildDate || 'unknown'}`,
  `Build ID: ${CK_CONFIG.buildId || 'unknown'}`
].join('\n');
function showBuildInfo(){
  const values={
    buildVersion:`v${CK_CONFIG.version || 'unknown'}`,
    buildRelease:CK_CONFIG.releaseName || '—',
    buildMode,
    buildCloud,
    buildSchema:CK_CONFIG.schemaVersion || '—',
    buildDate:CK_CONFIG.buildDate || '—',
    buildId:CK_CONFIG.buildId || '—',
    buildVersionPill:`v${CK_CONFIG.version || '—'}`
  };
  Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value;});
  const banner=document.getElementById('buildBanner');
  if(banner && localHost) banner.textContent=`CHAIRKEEPER v${CK_CONFIG.version} · LOCAL DEMO — fake information only.`;
  if(banner && !localHost && cloudReady && CK_CONFIG.sandboxMode) banner.textContent=`CHAIRKEEPER v${CK_CONFIG.version} · FULL-PLAY SANDBOX — practice data only. Upload, edit, delete, test AI, and experiment freely.`;
  const copy=document.getElementById('copyBuildInfo');
  if(copy) copy.onclick=async()=>{try{await navigator.clipboard.writeText(buildInfoText);copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy build info',1400)}catch{prompt('Copy build info',buildInfoText)}};
}
showBuildInfo();
if (!cloudReady) {
  const isLocal = localHost;
  if (document.body.dataset.page === 'public' && !isLocal) {
    await import('./app-public-live-fallback.js');
  } else if (document.body.dataset.page === 'owner' && !isLocal) {
    const gate = document.querySelector('#ownerGate');
    const app = document.querySelector('#ownerApp');
    if (app) app.classList.add('hidden');
    if (gate) {
      gate.classList.remove('hidden');
      gate.innerHTML = `<div class="login-card"><div class="eyebrow">SECURE CLOUD SETUP</div><h1>Owner dashboard is not connected yet.</h1><p>The public website is live, but real cross-device client data stays disabled until Supabase owner authentication and storage are connected.</p><a class="btn primary" href="./">View customer website</a></div>`;
    }
  } else {
    document.querySelector('#ownerApp')?.classList.remove('hidden');
    document.querySelector('#ownerGate')?.classList.add('hidden');
    await import('./app-local.js');
  }
} else {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/+esm');
  const sb = createClient(CK_CONFIG.supabaseUrl, CK_CONFIG.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const today = () => new Date().toISOString().slice(0, 10);
  const plus = n => { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
  const money = n => Number(n || 0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0});
  // These format STUDIO WALL-CLOCK date/time strings (appointment_date, start_time,
  // end_time) directly, never by parsing them as UTC and converting to the
  // viewer's browser timezone. That's intentional: a one-chair studio's
  // calendar should always read in the studio's own local time regardless of
  // what device/timezone the owner's phone happens to be set to, and it's
  // exactly the kind of casual local-string-to-Date conversion that creates
  // DST/date bugs if done the other way.
  const fmtDate = v => { if(!v) return ''; const d = new Date(`${v}T12:00:00`); return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}); };
  const fmtDateLong = v => { if(!v) return ''; const d = new Date(`${v}T12:00:00`); return d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}); };
  const fmtTime = v => { if(!v) return ''; const [h,m] = String(v).slice(0,5).split(':').map(Number); const d = new Date(); d.setHours(h,m,0,0); return d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); };
  const addMinutesToTime = (t,mins) => { const [h,m]=String(t).slice(0,5).split(':').map(Number); const total=h*60+m+mins; const hh=Math.floor(((total%1440)+1440)%1440/60),mm=((total%1440)+1440)%1440%60; return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; };
  const minutesBetween = (a,b) => { const [ah,am]=String(a).slice(0,5).split(':').map(Number),[bh,bm]=String(b).slice(0,5).split(':').map(Number); return (bh*60+bm)-(ah*60+am); };
  const addDaysStr = (dateStr,n) => { const d=new Date(`${dateStr}T12:00:00`); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
  const weekdayIdx = dateStr => new Date(`${dateStr}T12:00:00`).getDay();
  const startOfWeek = dateStr => addDaysStr(dateStr, -weekdayIdx(dateStr));
  const uid = () => crypto.randomUUID();
  function toast(t){const e=$('#toast'); if(!e) return; e.textContent=t; e.classList.add('show'); setTimeout(()=>e.classList.remove('show'),2600)}
  function confirmationCode(id){return ('CK-'+String(id||'').replace(/-/g,'').slice(0,8)).toUpperCase();}
  function friendlyDbError(e){
    const msg = e?.message || String(e || '');
    if (e?.code === '23P01' || /exclusion/i.test(msg)) return 'That time overlaps another appointment or blocked time. Pick a different time.';
    if (e?.code === '23505' || /duplicate key/i.test(msg)) return 'That was already saved — no need to try again.';
    if (e?.code === '42501' || /row-level security/i.test(msg)) return 'Only the studio owner can make this change.';
    return msg || 'Something went wrong.';
  }
  async function fnFetch(name,{method='GET',query='',body,auth=false,headers={}}={}){
    const h={apikey:CK_CONFIG.supabasePublishableKey,...headers};
    if(auth){const {data:{session}}=await sb.auth.getSession(); if(session?.access_token) h.Authorization=`Bearer ${session.access_token}`;}
    const r=await fetch(`${CK_CONFIG.supabaseUrl}/functions/v1/${name}${query}`,{method,headers:h,body});
    const text=await r.text(); let data={}; try{data=text?JSON.parse(text):{}}catch{data={error:text||`HTTP ${r.status}`}}
    if(!r.ok) throw new Error(data.error||data.message||`HTTP ${r.status}`); return data;
  }
  function wordsToNumber(text=''){
    const ones={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19};
    const tens={twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
    const s=String(text).toLowerCase().replace(/-/g,' ').trim(); if(/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
    let total=0,seen=false; for(const w of s.split(/\s+/)){if(w in ones){total+=ones[w];seen=true}else if(w in tens){total+=tens[w];seen=true}else if(w==='hundred'&&seen){total*=100}else if(w==='and'){}else return null} return seen?total:null;
  }
  function parseNote(t='',services=[]){
    const l=t.toLowerCase(); const p={service:'',shape:'',length:'',color:'',design:'',products:'',price:'',weeks:'',issue:''};
    for(const x of ['almond','square','coffin','round','stiletto']) if(l.includes(x)) p.shape=x[0].toUpperCase()+x.slice(1);
    for(const x of ['natural','short','medium','long','xl','extra long']) if(l.includes(x)) p.length=x.startsWith('xl')||x==='extra long'?'XL+':x[0].toUpperCase()+x.slice(1);
    const priceMatch=t.match(/(?:charged|charge|price|total|was|cost)\s*(?:her\s*)?\$?([\d]+(?:\.\d{1,2})?|[a-z]+(?:[-\s][a-z]+){0,3})\s*(?:dollars?)?/i)||t.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
    if(priceMatch){const n=wordsToNumber(priceMatch[1]); if(n!==null && n>=1 && n<=999) p.price=n;}
    const weekMatch=t.match(/(one|two|three|four|five|six|1|2|3|4|5|6)\s*weeks?/i); if(weekMatch) p.weeks=wordsToNumber(weekMatch[1]);
    for(const x of ['pink','red','black','white','blue','purple','nude','chrome','green','gold','silver','brown','orange']) if(l.includes(x)) p.color+=(p.color?', ':'')+x;
    for(const x of ['french tip','french','flowers','flower','glitter','ombre','cat eye','chrome','swirl','marble','rhinestone','gem']) if(l.includes(x) && !p.design.toLowerCase().includes(x)) p.design+=(p.design?', ':'')+x;
    const service=(services||[]).find(s=>l.includes(String(s.name||'').toLowerCase())); if(service) p.service=service.name;
    else if(l.includes('fill')) p.service='Fill'; else if(l.includes('acrylic')) p.service='Acrylic'; else if(l.includes('pedicure')||l.includes('pedi')) p.service='Pedicure'; else if(l.includes('manicure')||l.includes('mani')) p.service='Manicure';
    const used=t.match(/(?:used|use|base(?: was)?|color(?: was)?|polish(?: was)?)\s+([^.!?]{2,70})/i); if(used) p.products=used[1].trim().replace(/\s+(?:charged|price|total|and she|she loved).*$/i,'').trim();
    if(/split|lift|lifting|crack|broken|damage|bleed|sore|cut|tear/.test(l)) p.issue=t;
    return p;
  }

  async function publicPage(){
    let cfg; try{cfg=await fnFetch('public-intake',{query:`?slug=${encodeURIComponent(CK_CONFIG.studioSlug)}`});}catch(e){toast('Booking desk could not load'); console.error(e); return;}
    const studio=cfg.studio||{},services=cfg.services||[];
    const bookableServices=services.filter(s=>s.status!=='temporarily_unavailable');
    let inspo=null,selectedService=bookableServices[0]?.name||'';
    // One idempotency key per "attempt" — it stays the same across a double
    // tap or a manual retry after a dropped connection, and is only replaced
    // once a request has actually succeeded or the person starts a fresh one.
    let idemKey=uid();
    const brand=$('#brand'),publicLocation=$('#publicLocation'); if(brand) brand.textContent=studio.name||'Simply Hope Designs'; if(publicLocation) publicLocation.textContent=studio.location||'Lubbock, Texas · By appointment';
    const priceNote=$('#pricingNote'); if(priceNote) priceNote.textContent=studio.pricing_confirmed?'Current starting prices. Art, removal, repairs, or special requests can change the final total.':'Starter prices shown for booking guidance. Final price is confirmed before the appointment.';
    // Price text is now price-type aware (fixed/starting_at/range/consultation)
    // instead of always appending "+" — everything else about this compact
    // price-pill grid is left exactly as approved; this is a text-accuracy
    // fix, not a redesign.
    function publicPriceText(x){
      if(x.price_type==='consultation') return 'Consult';
      if(x.price_type==='starting_at') return `From ${money(x.price)}`;
      if(x.price_type==='range') return `${money(x.price)}\u2013${money(x.price_max)}`;
      return money(x.price);
    }
    $('#quickPrices').innerHTML=services.map(x=>`<span class="${x.status==='temporarily_unavailable'?'service-unavailable':''}"><b>${esc(x.name)}</b> ${esc(publicPriceText(x))}${x.status==='temporarily_unavailable'?' · Unavailable':''}</span>`).join('');
    const opts=bookableServices.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
    $('#serviceSelect').innerHTML=opts||'<option value="">No services available right now</option>';
    $('#serviceSelect').disabled=!bookableServices.length;
    const callbackOpts=services.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}${x.status==='temporarily_unavailable'?' (currently unavailable)':''}</option>`).join('');
    $('#callbackService').innerHTML=`<option>Not sure yet</option>${callbackOpts}`;
    $('#serviceCards').innerHTML=services.map((x,i)=>`<button class="service-choice ${bookableServices[0]?.id===x.id?'active':''}" type="button" data-service="${esc(x.name)}" ${x.status==='temporarily_unavailable'?'disabled aria-disabled="true"':''}><b>${esc(x.name)}</b><small>${x.status==='temporarily_unavailable'?'Not bookable right now':(x.duration?`Usually about ${x.duration} min`:'Time confirmed with appointment')}</small><strong>${esc(publicPriceText(x))}</strong></button>`).join('');
    const galleryImages=services.flatMap(s=>(s.images||[]).filter(Boolean).map(img=>({...img,serviceName:s.name,featured:!!s.featured})))
      .sort((a,b)=>Number(b.featured)-Number(a.featured)||Number(b.isPrimary)-Number(a.isPrimary)).slice(0,6);
    const gallery=$('#galleryGrid');
    if(gallery&&galleryImages.length){
      gallery.innerHTML=galleryImages.map(img=>`<figure><img src="${esc(img.url)}" alt="${esc(img.alt||`${img.serviceName} by Simply Hope Designs`)}" style="object-position:${Number(img.focalX??50)}% ${Number(img.focalY??50)}%"></figure>`).join('');
    }
    $$('[data-service]').forEach(b=>b.onclick=()=>{selectedService=b.dataset.service; $('#serviceSelect').value=selectedService; $$('[data-service]').forEach(x=>x.classList.toggle('active',x===b)); loadSlots();});
    $('#serviceSelect').value=selectedService; $('#serviceSelect').onchange=()=>{selectedService=$('#serviceSelect').value; loadSlots();};
    const date=$('[name=date]'); date.min=today(); date.value=plus(1); date.addEventListener('change',loadSlots);
    const slotWrap=$('#slotPicker'),timeInput=$('[name=time]'),bookingSubmit=$('#bookingForm button[type=submit]');
    const setBookingSubmitReady=ready=>{if(bookingSubmit)bookingSubmit.disabled=!ready;};
    async function loadSlots(){
      if(!slotWrap||!date.value) return;
      if(!selectedService){timeInput.value='';timeInput.classList.add('hidden');setBookingSubmitReady(false);slotWrap.innerHTML='<div class="slot-note">No services are available to book online right now. Use “Help me choose” and Mary can follow up.</div>';return;}
      timeInput.value=''; setBookingSubmitReady(false); slotWrap.innerHTML='<div class="hint">Checking openings…</div>';
      try{
        const data=await fnFetch('public-intake',{query:`?slug=${encodeURIComponent(CK_CONFIG.studioSlug)}&action=slots&date=${encodeURIComponent(date.value)}&service=${encodeURIComponent(selectedService)}`});
        const slots=data.slots||[];
        if(data.closed){timeInput.value=''; timeInput.classList.add('hidden'); setBookingSubmitReady(false); const closedMsg=(data.reason&&data.reason!=='Closed this day')?data.reason:"She isn't available this day. Pick another date."; slotWrap.innerHTML=`<div class="slot-note closed-day">${esc(closedMsg)}</div>`; return;}
        if(!data.hoursConfigured){slotWrap.innerHTML='<div class="slot-note">Her working hours are still being finalized. Pick your preferred time below and she will personally confirm it.</div>'; timeInput.classList.remove('hidden'); setBookingSubmitReady(true); return;}
        timeInput.classList.add('hidden');
        slotWrap.innerHTML=slots.length?`<div class="slot-grid">${slots.map(s=>`<button type="button" class="slot" data-slot="${esc(s)}">${fmtTime(s)}</button>`).join('')}</div>`:'<div class="slot-note">No clean openings showed for this day. Pick another day or use “Help me choose.”</div>';
        setBookingSubmitReady(false);
        $$('[data-slot]').forEach(b=>b.onclick=()=>{timeInput.value=b.dataset.slot; setBookingSubmitReady(true); $$('[data-slot]').forEach(x=>x.classList.toggle('active',x===b));});
      }catch{slotWrap.innerHTML='<div class="slot-note">Could not check live openings. You can still request a preferred time.</div>'; timeInput.classList.remove('hidden'); setBookingSubmitReady(true);}
    }
    await loadSlots();
    let intent='booking'; function setIntent(x){intent=x; $('#bookingChoice').classList.toggle('active',x==='booking'); $('#callbackChoice').classList.toggle('active',x==='callback'); $('#bookingForm').classList.toggle('hidden',x!=='booking'); $('#callbackForm').classList.toggle('hidden',x!=='callback'); $('#success').classList.add('hidden'); $('#request').scrollIntoView({behavior:'smooth',block:'start'});}
    $('#bookingChoice').onclick=()=>setIntent('booking'); $('#callbackChoice').onclick=()=>setIntent('callback'); $$('[data-intent]').forEach(b=>b.onclick=()=>setIntent(b.dataset.intent));
    $('#inspo').onchange=e=>{const f=e.target.files[0]; if(!f)return; if(f.size>8*1024*1024){toast('Choose an image under 8 MB');e.target.value='';return;} inspo=f; $('#inspoPreview').innerHTML=`<img src="${URL.createObjectURL(f)}" alt="Inspiration preview">`;};
    async function submit(kind,form){
      const fd=new FormData(form);
      if(String(fd.get('website')||'').trim()!==''){ return; } // honeypot: bots fill this, real people never see it
      const payload={kind,studioSlug:CK_CONFIG.studioSlug,idempotencyKey:idemKey,name:fd.get('name'),phone:fd.get('phone'),email:fd.get('email')||'',service:fd.get('service')||'Not sure yet',note:fd.get('note')||'',contactMethod:fd.get('contactMethod')||'Text'};
      if(kind==='booking') Object.assign(payload,{date:fd.get('date'),time:fd.get('time'),shape:fd.get('shape'),length:fd.get('length'),currentNails:fd.get('currentNails'),flexibility:fd.get('flexibility')}); else Object.assign(payload,{callTime:fd.get('callTime')});
      const body=new FormData(); body.append('payload',JSON.stringify(payload)); if(inspo&&kind==='booking') body.append('inspiration',inspo,inspo.name||'inspiration.jpg');
      const btn=form.querySelector('button[type=submit],.public-submit'); if(btn){btn.disabled=true;btn.dataset.old=btn.innerHTML;btn.textContent='Sending…';}
      try{
        const result=await fnFetch('public-intake',{method:'POST',body});
        form.classList.add('hidden'); $('#success').classList.remove('hidden'); $('#confirmationNumber').textContent=confirmationCode(result.id); form.reset(); inspo=null; $('#inspoPreview').innerHTML=''; date.value=plus(1);
        idemKey=uid(); // this attempt is done — a genuinely new request gets a new key
        await loadSlots(); $('#success').scrollIntoView({behavior:'smooth',block:'center'});
      }catch(e){
        toast(e.message||'Could not send request. If you tap Send again, it will not create a duplicate.');
        // idemKey intentionally NOT rotated here — a retry of the same tap is still the same request.
      }
      finally{if(btn){btn.innerHTML=btn.dataset.old||'Send request';btn.disabled=(kind==='booking'&&timeInput.classList.contains('hidden')&&!timeInput.value);}}
    }
    $('#bookingForm').onsubmit=e=>{e.preventDefault();submit('booking',e.currentTarget)}; $('#callbackForm').onsubmit=e=>{e.preventDefault();submit('callback',e.currentTarget)}; $('#another').onclick=()=>setIntent(intent);
  }

  async function ownerPage(){
    const gate=$('#ownerGate'),app=$('#ownerApp'),loginForm=$('#loginForm'),loginEmail=$('#loginEmail'),signOut=$('#signOut');
    async function session(){return (await sb.auth.getSession()).data.session;}
    async function showAuth(){const s=await session(); gate?.classList.toggle('hidden',!!s); app?.classList.toggle('hidden',!s); if(s){await startOwner(s);} }
    if(loginForm) loginForm.onsubmit=async e=>{e.preventDefault(); const email=loginEmail.value.trim(); const password=$('#loginPassword')?.value||''; if(!email||!password)return; const btn=loginForm.querySelector('button'); btn.disabled=true; btn.textContent='Opening sandbox…'; const {error}=await sb.auth.signInWithPassword({email,password}); btn.disabled=false; btn.textContent='Enter ChairKeeper sandbox'; if(error)toast(error.message); else {$('#loginSent')?.classList.remove('hidden'); await showAuth();}};
    if(signOut) signOut.onclick=async()=>{await sb.auth.signOut();location.reload();};
    sb.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_IN'&&s)showAuth(); if(event==='SIGNED_OUT')showAuth();}); await showAuth();
  }

  let ownerStarted=false;
  async function startOwner(session){
    if(ownerStarted)return; ownerStarted=true;
    let studio,services=[],clients=[],bookings=[],callbacks=[],appointments=[],visits=[],media=[],extras=[],exceptions=[],categories=[],catalogAll=[],serviceImages=[],aiIntakes=[],aiIntakeMedia=[];
    let calView='day', calDate=today();
    let visitLinkedApptId=null;
    const close=id=>$('#'+id)?.classList.remove('open');
    $$('[data-close]').forEach(b=>b.onclick=()=>close(b.dataset.close));
    async function getStudio(){
      const {data,error}=await sb.from('studios').select('*').eq('slug',CK_CONFIG.studioSlug).single(); if(error)throw error; studio=data;
      // `services` stays the narrow "real, published, bookable" list used by
      // Setup's quick editor, the Calendar's manual-appointment picker, and
      // anywhere else the app treats a service as a real, sellable thing.
      // Draft (not-yet-published) items are deliberately excluded here so
      // they can never be silently offered for a real appointment.
      const svc=await sb.from('services').select('*').eq('studio_id',studio.id).eq('active',true).eq('draft',false).order('sort_order'); if(svc.error)throw svc.error; services=svc.data||[];
      // `catalogAll` is the Catalog tab's own broader view: every service
      // regardless of draft/active state, so the owner can see, edit,
      // un-archive, or publish anything that belongs to her studio.
      const all=await sb.from('services').select('*').eq('studio_id',studio.id).order('sort_order'); if(all.error)throw all.error; catalogAll=all.data||[];
      const cats=await sb.from('service_categories').select('*').eq('studio_id',studio.id).order('sort_order'); if(cats.error)throw cats.error; categories=cats.data||[];
      const imgs=await sb.from('service_images').select('*').eq('studio_id',studio.id).order('sort_order'); if(imgs.error)throw imgs.error; serviceImages=imgs.data||[];
      const ex=await sb.from('service_extras').select('*').eq('studio_id',studio.id).order('sort_order'); if(ex.error)throw ex.error; extras=ex.data||[];
      const de=await sb.from('date_exceptions').select('*').eq('studio_id',studio.id).order('exception_date'); if(de.error)throw de.error; exceptions=de.data||[];
    }
    async function loadAll(){
      await getStudio();
      const [c,b,cb,a,v,m,ai,aim]=await Promise.all([
        sb.from('clients').select('*').eq('studio_id',studio.id).order('name'),
        sb.from('bookings').select('*').eq('studio_id',studio.id).order('created_at',{ascending:false}).limit(200),
        sb.from('callbacks').select('*').eq('studio_id',studio.id).order('created_at',{ascending:false}).limit(200),
        sb.from('appointments').select('*').eq('studio_id',studio.id).gte('appointment_date',plus(-45)).order('appointment_date').order('start_time').limit(1000),
        sb.from('visits').select('*').eq('studio_id',studio.id).order('created_at',{ascending:false}).limit(300),
        sb.from('media_assets').select('*').eq('studio_id',studio.id).order('created_at',{ascending:false}).limit(500),
        sb.from('ai_intakes').select('*').eq('studio_id',studio.id).order('created_at',{ascending:false}).limit(200),
        sb.from('ai_intake_media').select('*').eq('studio_id',studio.id).order('created_at',{ascending:false}).limit(500)
      ]);
      for(const r of [c,b,cb,a,v,m,ai,aim]) if(r.error)throw r.error;
      [clients,bookings,callbacks,appointments,visits,media,aiIntakes,aiIntakeMedia]=[c.data||[],b.data||[],cb.data||[],a.data||[],v.data||[],m.data||[],ai.data||[],aim.data||[]];
    }
    try{await loadAll();}catch(e){console.error(e); $('#ownerApp').innerHTML=`<div class="shell"><div class="banner">Signed in, but ChairKeeper could not find an owner profile for this email yet. ${esc(e.message||'')}</div></div>`;return;}
    $('#studioLine').textContent=`${studio.name} · ${studio.tech_name||'Owner'}`; $('#cloudBadge').textContent='Secure cloud mode';
    const demoBanner=document.querySelector('.banner'); if(demoBanner){demoBanner.textContent=CK_CONFIG.sandboxMode ? `ChairKeeper v${CK_CONFIG.version} · FULL-PLAY SANDBOX — practice data only. Everything here is safe to experiment with.` : `ChairKeeper v${CK_CONFIG.version} · Secure cloud mode — real client data, shared across your devices.`; demoBanner.style.background='#eef7f1'; demoBanner.style.borderColor='#bfe0cc'; demoBanner.style.color='#1f5c3e';} const lightbox=$('#imageLightbox'),lightboxImg=$('#imageLightboxImg'); const openLightbox=url=>{if(!lightbox||!lightboxImg||!url)return;lightboxImg.src=url;lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false')}; const closeLightbox=()=>{if(!lightbox)return;lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');if(lightboxImg)lightboxImg.src=''}; $('#imageLightboxClose')?.addEventListener('click',closeLightbox); lightbox?.addEventListener('click',e=>{if(e.target===lightbox)closeLightbox()}); document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox()});
    $$('[data-view]').forEach(b=>b.onclick=()=>{$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b)); $$('.section').forEach(x=>x.classList.toggle('active',x.id===b.dataset.view)); if(b.dataset.view==='trash')renderTrash(); if(b.dataset.view==='calendar')renderCalendar(); if(b.dataset.view==='catalog')renderCatalog();});
    async function reload(){await loadAll(); await render();}
    function isNew(x){return x.status==='new'||x.status==='pending';}
    function clientForBooking(b){return clients.find(c=>c.id===b.client_id)||clients.find(c=>c.phone&&b.phone&&c.phone.replace(/\D/g,'')===b.phone.replace(/\D/g,''));}
    async function render(){
      const nb=bookings.filter(isNew),nc=callbacks.filter(isNew),due=clients.filter(x=>x.next_due&&x.next_due<=plus(7));
      const pendingAI=aiIntakes.filter(x=>['processing','ready','needs_review','failed'].includes(x.status));
      $('#requestCount').textContent=nb.length+nc.length?`(${nb.length+nc.length})`:'';
      const needs=[]; if(nb.length)needs.push([`${nb.length} appointment request${nb.length>1?'s':''}`,'Review and confirm.','requests']); if(nc.length)needs.push([`${nc.length} callback${nc.length>1?'s':''}`,'They asked for a human.','requests']); if(pendingAI.length)needs.push([`${pendingAI.length} note/photo item${pendingAI.length>1?'s':''}`,'ChairKeeper needs you to file or confirm them.','ai-review']); if(due.length)needs.push([`${due.length} client${due.length>1?'s':''} due soon`,'Potential rebooks.','clients']);
      $('#headline').textContent=needs.length?`${needs.length} thing${needs.length>1?'s':''} need you.`:'You’re pretty set.'; $('#needs').innerHTML=needs.length?needs.map(n=>`<div class="need"><div><b>${esc(n[0])}</b><small>${esc(n[1])}</small></div><button class="btn alt sm" data-jump="${n[2]}">Open</button></div>`).join(''):`<div class="need"><div><b>Nothing urgent.</b><small>Close the app. It can call you back later.</small></div><span class="badge">done</span></div>`;
      $$('[data-jump]').forEach(b=>b.onclick=()=>{if(b.dataset.jump==='ai-review'){const first=pendingAI[0]; if(first)openIntakeReview(first.id);}else document.querySelector(`[data-view="${b.dataset.jump}"]`)?.click();});
      const todayAppts=appointments.filter(a=>a.appointment_date===today()&&a.status!=='blocked'); $('#metrics').innerHTML=`<div class="card metric"><span>Today</span><strong>${todayAppts.length}</strong><div class="hint">appointments</div></div><div class="card metric"><span>New</span><strong>${nb.length+nc.length+pendingAI.length}</strong><div class="hint">needs attention</div></div><div class="card metric"><span>Due</span><strong>${due.length}</strong><div class="hint">soon</div></div><div class="card metric"><span>Clients</span><strong>${clients.length}</strong><div class="hint">remembered</div></div>`;
      $('#today').innerHTML=todayAppts.length?todayAppts.map(a=>`<div class="listcard"><div class="row between"><div><b>${esc(a.client_name||'Client')}</b><div class="hint">${fmtTime(a.start_time)} · ${esc(a.service||'Appointment')} ${a.status!=='confirmed'?`· <span class="badge">${esc(a.status)}</span>`:''}</div></div><button class="btn primary sm" data-finish-client="${a.client_id||''}" data-finish-appt="${a.id}">Finish visit</button></div></div>`).join(''):'<div class="empty">No appointments today.</div>';
      $$('[data-finish-client]').forEach(b=>b.onclick=()=>openVisit(b.dataset.finishClient,b.dataset.finishAppt));
      renderRequests(); renderClients(); renderIntakeQueue(); renderSetup(); renderCalendar(); renderCatalog();
    }
    function extraKeywordNegated(note,keyword){
      const l=String(note||'').toLowerCase(),kw=String(keyword||'').toLowerCase().trim(); if(!l||!kw)return false;
      let from=0,found=false; while(true){const i=l.indexOf(kw,from); if(i<0)return found; found=true; const prefix=l.slice(Math.max(0,i-42),i); if(!/\b(no|not|without|skip|dont|don't|do not|doesnt|doesn't|does not|no need for)\b[^,.!?;]{0,28}$/.test(prefix)) return false; from=i+kw.length;}
    }
    function suggestedExtrasFor(b){
      const note=String(b.note||'').toLowerCase(); if(!note)return[];
      return extras.filter(x=>x.active&&(x.keywords||[]).some(k=>note.includes(String(k).toLowerCase())&&!extraKeywordNegated(note,k)));
    }
    async function hydrateInspirationThumbs(){
      for(const btn of $$('[data-inspo-booking]')){
        if(btn.dataset.loaded==='1') continue;
        btn.dataset.loaded='1';
        try{
          const data=await fnFetch('owner-action',{method:'POST',auth:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'inspiration_url',bookingId:btn.dataset.inspoBooking})});
          if(data.signedUrl){btn.innerHTML=`<img src="${esc(data.signedUrl)}" alt="Customer inspiration"><span>Tap to enlarge</span>`;btn.onclick=()=>openLightbox(data.signedUrl);}
        }catch{btn.innerHTML='<span>Inspiration photo attached</span><small>Could not preview right now</small>';}
      }
    }
    function renderRequests(){
      const newB=bookings.filter(isNew),handled=bookings.filter(x=>!isNew(x)).slice(0,20);
      $('#bookingInbox').innerHTML=newB.length?newB.map(b=>{const sug=suggestedExtrasFor(b);return `<div class="listcard"><div class="row between"><div><b>${esc(b.name)}</b><div class="hint">${esc(b.service)} · ${fmtDate(b.requested_date)} ${fmtTime(b.requested_time)}</div></div><span class="badge">new</span></div>${b.note?`<p>${esc(b.note)}</p>`:''}${b.inspiration_path?`<button class="booking-inspo-thumb" type="button" data-inspo-booking="${b.id}"><span>Inspiration photo</span><small>Tap to enlarge</small></button>`:''}${sug.length?`<div class="extra-suggestions"><b>ChairKeeper noticed possible extra time. You decide:</b><div class="extra-suggestion-row">${sug.map(x=>`<label><input type="checkbox" data-extra-for="${b.id}" value="${esc(x.key)}"> ${esc(x.label)} +${Number(x.extra_minutes||0)} min</label>`).join('')}</div></div>`:''}<div class="row actions"><a class="btn alt sm" href="tel:${esc(b.phone)}">Call</a><button class="btn alt sm" data-alt="${b.id}">Offer another time</button><button class="btn danger sm" data-decline="${b.id}">Decline</button><button class="btn primary sm" data-confirm="${b.id}">Confirm</button></div></div>`}).join(''):'<div class="empty">No new appointment requests.</div>';
      const handledSummary=$('#handledSummary'),handledBox=$('#handledBox'); if(handledSummary)handledSummary.textContent=`Handled requests${handled.length?` (${handled.length})`:''}`; if(handledBox&&!handled.length)handledBox.open=false; $('#handledBookings').innerHTML=handled.length?handled.map(b=>`<div class="handled-row"><span>${esc(b.name)} · ${esc(b.service)}</span><span class="badge">${esc(b.status)}</span></div>`).join(''):'<div class="hint">Nothing handled yet. Confirmed requests will move here automatically.</div>';
      $('#callbackInbox').innerHTML=callbacks.filter(isNew).length?callbacks.filter(isNew).map(c=>`<div class="listcard"><div class="row between"><div><b>${esc(c.name)}</b><div class="hint">${esc(c.service||'Not sure')} · ${esc(c.call_time||'')}</div></div><span class="badge">callback</span></div>${c.note?`<p>${esc(c.note)}</p>`:''}<div class="row actions"><a class="btn primary sm" href="tel:${esc(c.phone)}">Call now</a><button class="btn alt sm" data-contacted="${c.id}">Mark contacted</button></div></div>`).join(''):'<div class="empty">No callbacks waiting.</div>';
      $$('[data-confirm]').forEach(b=>b.onclick=()=>confirmBooking(b.dataset.confirm)); $$('[data-alt]').forEach(b=>b.onclick=()=>offerAnother(b.dataset.alt)); $$('[data-contacted]').forEach(b=>b.onclick=()=>markContacted(b.dataset.contacted)); $$('[data-decline]').forEach(b=>b.onclick=()=>declineBooking(b.dataset.decline));
      hydrateInspirationThumbs();
    }
    async function confirmBooking(id){
      const btn=document.querySelector(`[data-confirm="${id}"]`); if(btn){btn.disabled=true;btn.textContent='Checking…';}
      const extraKeys=$$('[data-extra-for]').filter(x=>x.dataset.extraFor===id&&x.checked).map(x=>x.value);
      try{const data=await fnFetch('owner-action',{method:'POST',auth:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'confirm_booking',bookingId:id,extraKeys})}); toast(data.alreadyConfirmed?'Already confirmed — nothing duplicated.':(data.message||'Appointment confirmed')); await reload();}
      catch(e){if((e.message||'').includes('conflict')) toast('That time now conflicts with another appointment. Offer another time.'); else toast(e.message||'Could not confirm'); if(btn){btn.disabled=false;btn.textContent='Confirm';}}
    }
    async function declineBooking(id){
      if(!confirm('Decline this request? The customer keeps their spot in nothing — you may want to text them first.'))return;
      try{await fnFetch('owner-action',{method:'POST',auth:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'decline_booking',bookingId:id})}); toast('Request declined'); await reload();}
      catch(e){toast(e.message||'Could not decline');}
    }
    async function offerAnother(id){
      const b=bookings.find(x=>x.id===id); if(!b)return; let data; try{data=await fnFetch('public-intake',{query:`?slug=${encodeURIComponent(CK_CONFIG.studioSlug)}&action=alternates&date=${encodeURIComponent(b.requested_date)}&service=${encodeURIComponent(b.service)}`});}catch(e){toast('Could not find alternate slots');return;}
      const slots=(data.slots||[]).slice(0,3); if(!slots.length){toast('No obvious alternate slots. Call or text manually.');return;}
      const first=b.name.split(/\s+/)[0]; const choices=slots.map(x=>`${fmtDate(x.date)} at ${fmtTime(x.time)}`).join(' or '); const msg=`Hey ${first}! Your first ChairKeeper time isn't open, but I can do ${choices}. Want one of those? — ${studio.name}`; location.href=`sms:${b.phone}?&body=${encodeURIComponent(msg)}`;
    }
    async function markContacted(id){const {error}=await sb.from('callbacks').update({status:'handled',handled_at:new Date().toISOString()}).eq('id',id).eq('studio_id',studio.id); if(error)toast(error.message); else{toast('Callback cleared');await reload();}}
    function clientSearchText(c){
      const p=c.preferences||{};
      return [c.name,c.phone,c.email,c.service,...prefList(p,'likes'),...prefList(p,'avoid'),...prefList(p,'future_ideas'),...prefList(p,'tags')].filter(Boolean).join(' ').toLowerCase();
    }
    function renderClients(){
      const q=String($('#clientSearch')?.value||'').trim().toLowerCase();
      const shown=q?clients.filter(c=>clientSearchText(c).includes(q)):clients;
      $('#clientGrid').innerHTML=shown.length?shown.map(c=>{
        const next=appointments.filter(a=>a.client_id===c.id&&a.status==='confirmed'&&a.appointment_date>=today()).sort((a,b)=>a.appointment_date.localeCompare(b.appointment_date)||a.start_time.localeCompare(b.start_time))[0];
        const tags=prefList(c.preferences||{},'tags').slice(0,3);
        return `<button class="clientcard" data-client="${c.id}"><div class="row between"><b>${esc(c.name)}</b><span class="badge">${Number(c.visits||0)} visits</span></div><div class="hint">${esc(c.service||'Client')}${next?` · next ${fmtDate(next.appointment_date)}`:c.next_due?` · due ${fmtDate(c.next_due)}`:''}</div>${tags.length?`<div style="margin-top:5px">${tags.map(t=>`<span class="memory-chip subtle">${esc(t)}</span>`).join('')}</div>`:''}</button>`;
      }).join(''):q?'<div class="empty">No client card matches that search.</div>':'<div class="empty">No clients yet.</div>';
      $$('[data-client]').forEach(b=>b.onclick=()=>openClient(b.dataset.client));
    }
    $('#clientSearch')?.addEventListener('input',renderClients);
    async function signedUrl(path){if(!path)return''; const {data}=await sb.storage.from('chairkeeper-private').createSignedUrl(path,300); return data?.signedUrl||'';}
    function prefList(prefs,key){return Array.isArray(prefs?.[key])?prefs[key].filter(Boolean):[];}
    function parsedLine(p={}){
      const bits=[];
      if(p.shape)bits.push(p.shape); if(p.length)bits.push(p.length);
      const colors=Array.isArray(p.colors)?p.colors:(p.color?String(p.color).split(',').map(x=>x.trim()):[]); if(colors.length)bits.push(colors.join(', '));
      if(p.design)bits.push(p.design); if(p.price)bits.push(money(p.price));
      return bits.filter(Boolean).join(' · ');
    }
    async function openClient(id){
      const c=clients.find(x=>x.id===id); if(!c)return;
      $('#clientTitle').textContent=c.name;
      const v=visits.filter(x=>x.client_id===id).slice(0,20);
      const activeMedia=media.filter(x=>x.client_id===id&&!x.trashed_at&&['portfolio','work','private_record'].includes(x.kind)).slice(0,40);
      const signedPairs=await Promise.all(activeMedia.map(async m=>[m.id,await signedUrl(m.storage_path)]));
      const urlById=new Map(signedPairs);
      const recent=activeMedia.slice(0,6);
      const clientAppts=appointments.filter(a=>a.client_id===id&&a.status!=='blocked').sort((a,b)=>b.appointment_date.localeCompare(a.appointment_date)||b.start_time.localeCompare(a.start_time));
      const next=clientAppts.filter(a=>a.status==='confirmed'&&a.appointment_date>=today()).sort((a,b)=>a.appointment_date.localeCompare(b.appointment_date)||a.start_time.localeCompare(b.start_time))[0];
      const last=clientAppts.find(a=>a.status==='completed')||null;
      const prefs=c.preferences||{},likes=prefList(prefs,'likes'),avoid=prefList(prefs,'avoid'),future=prefList(prefs,'future_ideas'),tags=prefList(prefs,'tags');
      const chips=(arr,cls='')=>arr.map(x=>`<span class="memory-chip ${cls}">${esc(x)}</span>`).join('');
      const visitHtml=v.map(x=>{
        const vm=activeMedia.filter(m=>m.visit_id===x.id).slice(0,4);
        const thumbs=vm.length?`<div class="intake-review-photos" style="margin-top:9px">${vm.map(m=>`<div class="history-photo"><img src="${urlById.get(m.id)||''}" alt="Visit nail work" data-photo-src="${urlById.get(m.id)||''}"></div>`).join('')}</div>`:'';
        return `<div class="visit-card"><div class="visit-top"><div><b>${new Date(x.created_at).toLocaleDateString()}</b><div>${esc(x.parsed?.service||'Visit')}</div></div>${x.parsed?.price?`<span class="badge">${money(x.parsed.price)}</span>`:''}</div>${parsedLine(x.parsed)?`<div class="hint">${esc(parsedLine(x.parsed))}</div>`:''}${x.narration?`<p>${esc(x.narration)}</p>`:''}${thumbs}${vm.length?`<small>${vm.length} photo${vm.length>1?'s':''} filed with this visit</small>`:''}</div>`;
      }).join('');
      $('#clientDetail').innerHTML=`
        <div class="client-hero-card">
          <div><div class="eyebrow" style="color:#a14f69">Client card</div><h2>${esc(c.name)}</h2><div class="hint">${c.phone?`<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`:''}${c.email?` · ${esc(c.email)}`:''}</div></div>
          <div class="client-hero-actions"><button class="btn alt sm" data-client-intake="${c.id}">+ Note / photo</button><button class="btn primary sm" data-book-again="${c.id}">Book again</button></div>
        </div>
        <div class="client-facts"><div class="client-fact"><small>Usual service</small><b>${esc(c.service||'—')}</b></div><div class="client-fact"><small>Next appointment</small><b>${next?`${fmtDate(next.appointment_date)} ${fmtTime(next.start_time)}`:'—'}</b></div><div class="client-fact"><small>Last visit</small><b>${last?fmtDate(last.appointment_date):(c.last_visit_at?new Date(c.last_visit_at).toLocaleDateString():'—')}</b></div><div class="client-fact"><small>Visits</small><b>${Number(c.visits||0)}</b></div></div>
        <h3>Recent work</h3><div class="history-photos">${recent.map(m=>`<div class="history-photo"><img src="${urlById.get(m.id)||''}" alt="Saved nail work" data-client-photo="${m.id}" data-photo-src="${urlById.get(m.id)||''}"><button class="tiny-save ${m.human_saved?'saved':''}" data-human="${m.id}">${m.human_saved?'HUMAN SAVED':'HUMAN SAVE'}</button></div>`).join('')||'<div class="empty">No saved photos yet.</div>'}</div>
        <h3>What ChairKeeper remembers</h3>
        <div class="preference-grid">
          <div class="preference-box"><h4>Likes</h4>${likes.length?chips(likes):'<small>Nothing saved yet.</small>'}</div>
          <div class="preference-box"><h4>Avoid / change</h4>${avoid.length?chips(avoid,'warning'):'<small>Nothing saved yet.</small>'}</div>
          <div class="preference-box"><h4>Future ideas</h4>${future.length?chips(future):'<small>Nothing saved yet.</small>'}</div>
          <div class="preference-box"><h4>Search tags</h4>${tags.length?chips(tags.slice(0,20),'subtle'):'<small>No tags yet.</small>'}</div>
        </div>
        <h3>Visit history</h3>${visitHtml||'<div class="empty">No visits yet.</div>'}
        <h3>Appointments</h3>${clientAppts.slice(0,8).map(a=>`<div class="visitline"><b>${fmtDate(a.appointment_date)}</b><span>${esc(a.service)}</span><small>${fmtTime(a.start_time)} · ${esc(a.status)}</small></div>`).join('')||'<div class="empty">No appointments yet.</div>'}`;
      $('#clientSheet').classList.add('open');
      $$('[data-photo-src]').forEach(img=>img.onclick=()=>openLightbox(img.dataset.photoSrc||img.src));
      $$('[data-human]').forEach(b=>b.onclick=async()=>{const m=media.find(x=>x.id===b.dataset.human); const {error}=await sb.from('media_assets').update({human_saved:!m.human_saved,trashed_at:null,purge_after:null}).eq('id',m.id).eq('studio_id',studio.id); if(!error){m.human_saved=!m.human_saved;await openClient(id)}});
      $$('[data-client-intake]').forEach(b=>b.onclick=()=>{close('clientSheet');openIntake(b.dataset.clientIntake,'')});
      $$('[data-book-again]').forEach(b=>b.onclick=()=>{const cc=clients.find(x=>x.id===b.dataset.bookAgain); close('clientSheet'); openApptForm(null); populateApptClientSelect(cc.id); if(services.some(s=>s.name===cc.service)){$('#apptService').value=cc.service;$('#apptDuration').value=serviceDuration(cc.service);}});
    }

    // ================= AI INTAKE + ROUTING (v0.9.0) =================
    let intakeFiles=[],intakeAudioBlob=null,intakeRecorder=null,intakeChunks=[],intakeRecording=false,currentReviewIntakeId=null;
    function intakeClientOptions(selected=''){
      $('#intakeClient').innerHTML='<option value="">Auto-match safely</option>'+clients.map(c=>`<option value="${c.id}">${esc(c.name)}${c.phone?` · ${esc(c.phone)}`:''}</option>`).join('');
      $('#intakeClient').value=selected||'';
    }
    function fillIntakeAppointments(clientId='',selected=''){
      const pool=appointments.filter(a=>a.status!=='blocked'&&a.status!=='cancelled'&&(!clientId||a.client_id===clientId)).sort((a,b)=>b.appointment_date.localeCompare(a.appointment_date)).slice(0,30);
      $('#intakeAppointment').innerHTML='<option value="">No appointment link</option>'+pool.map(a=>`<option value="${a.id}">${fmtDate(a.appointment_date)} · ${esc(a.client_name||'Client')} · ${esc(a.service)}</option>`).join('');
      $('#intakeAppointment').value=selected||'';
    }
    function openIntake(clientId='',apptId=''){
      intakeFiles=[];intakeAudioBlob=null;intakeRecording=false;
      intakeClientOptions(clientId);
      fillIntakeAppointments(clientId,apptId);
      $('#intakePhotos').value='';$('#intakePreview').innerHTML='';$('#intakeText').value='';$('#intakePhotoKind').value='portfolio';
      $('#intakeMicStatus').textContent='Or type below.';$('#intakeStatus').textContent='';$('#intakeMic').textContent='🎙 Talk';
      $('#intakeTitle').textContent=clientId?`Add to ${clients.find(c=>c.id===clientId)?.name||'client'}`:'Add note / photo';
      $('#intakeSheet').classList.add('open');
    }
    $('#addIntakeBtn').onclick=()=>openIntake(); $('#addIntakeHomeBtn').onclick=()=>openIntake(); $('#addIntakeClientsBtn').onclick=()=>openIntake();
    $('#intakeClient').onchange=()=>fillIntakeAppointments($('#intakeClient').value,'');
    $('#intakePhotos').onchange=e=>{
      const files=[...e.target.files]; if(files.length>6)toast('Keeping the first 6 photos.');
      intakeFiles=files.slice(0,6).filter(f=>{if(f.size>8*1024*1024){toast(`${f.name||'A photo'} is over 8 MB and was skipped.`);return false;}if(!/^image\/(jpeg|png|webp)$/i.test(f.type)){toast(`${f.name||'A file'} is not a supported photo.`);return false;}return true;});
      $('#intakePreview').innerHTML=intakeFiles.map(f=>`<img src="${URL.createObjectURL(f)}" alt="Intake preview">`).join('');
    };
    $('#intakeMic').onclick=async()=>{
      if(intakeRecording&&intakeRecorder){intakeRecorder.stop();return;}
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});intakeChunks=[];intakeRecorder=new MediaRecorder(stream);
        intakeRecorder.ondataavailable=e=>{if(e.data.size)intakeChunks.push(e.data)};
        intakeRecorder.onstop=async()=>{intakeRecording=false;$('#intakeMic').textContent='🎙 Talk';stream.getTracks().forEach(t=>t.stop());intakeAudioBlob=new Blob(intakeChunks,{type:intakeRecorder.mimeType||'audio/webm'});$('#intakeMicStatus').textContent='Transcribing…';try{const fd=new FormData();fd.append('audio',intakeAudioBlob,'chairkeeper-note.webm');const data=await fnFetch('transcribe',{method:'POST',auth:true,body:fd});const old=$('#intakeText').value.trim();$('#intakeText').value=[old,data.text||''].filter(Boolean).join(old?'\n':'');$('#intakeMicStatus').textContent='Transcribed. You can edit it before routing.';}catch(e){$('#intakeMicStatus').textContent='Audio kept, but transcription failed. Type a quick note instead.';toast(e.message||'Transcription unavailable');}};
        intakeRecorder.start();intakeRecording=true;$('#intakeMic').textContent='■ Stop';$('#intakeMicStatus').textContent='Recording…';
      }catch{toast('Microphone permission unavailable');}
    };
    async function uploadIntakeMedia(intakeId){
      const kind=$('#intakePhotoKind').value;
      const uploaded=[]; let i=0;
      try{
        for(const f of intakeFiles){
          // Re-encode owner intake photos before cloud upload. This keeps enough
          // detail for nail work while stripping EXIF/location metadata and
          // avoiding needlessly huge phone-camera originals.
          const clean=await resizeImage(f,2400,0.90);
          const base=String(f.name||'photo').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9._-]/g,'_')||'photo';
          const path=`${studio.id}/intake/${intakeId}/${uid()}-${base}.jpg`;
          await uploadPrivate(clean,path); uploaded.push(path);
          const r=await sb.from('ai_intake_media').insert({studio_id:studio.id,intake_id:intakeId,storage_path:path,kind,mime_type:'image/jpeg',byte_size:clean.size,sort_order:i++}).select().single(); if(r.error)throw r.error;
        }
        if(intakeAudioBlob){
          const path=`${studio.id}/intake/${intakeId}/${uid()}-note.webm`;await uploadPrivate(intakeAudioBlob,path); uploaded.push(path);
          const r=await sb.from('ai_intake_media').insert({studio_id:studio.id,intake_id:intakeId,storage_path:path,kind:'raw_audio',mime_type:intakeAudioBlob.type,byte_size:intakeAudioBlob.size,sort_order:i}).select().single(); if(r.error)throw r.error;
        }
      }catch(e){
        if(uploaded.length)await sb.storage.from('chairkeeper-private').remove(uploaded);
        await sb.from('ai_intake_media').delete().eq('intake_id',intakeId).eq('studio_id',studio.id);
        await sb.from('ai_intakes').update({status:'failed',error_message:'A photo/audio upload did not finish. Please retry.'}).eq('id',intakeId).eq('studio_id',studio.id);
        throw e;
      }
    }
    async function fileIntake(intakeId,clientId,appointmentId='',humanSave=false,applyMemory=true){
      const {data,error}=await sb.rpc('file_ai_intake',{p_intake_id:intakeId,p_client_id:clientId,p_appointment_id:appointmentId||null,p_human_save:!!humanSave,p_apply_memory:!!applyMemory});
      if(error)throw error; await reload(); await applyRetention(clientId); await reload(); return data;
    }
    $('#analyzeIntakeBtn').onclick=async()=>{
      const btn=$('#analyzeIntakeBtn'),text=$('#intakeText').value.trim();
      if(!text&&!intakeFiles.length&&!intakeAudioBlob){toast('Add a note, photo, or voice note first.');return;}
      btn.disabled=true;$('#intakeStatus').textContent='Saving safely, then analyzing…';
      try{
        const selected=$('#intakeClient').value||null,appt=$('#intakeAppointment').value||null;
        const sourceType=intakeAudioBlob?(intakeFiles.length?'mixed':'voice'):(intakeFiles.length?(text?'mixed':'photo'):'note');
        const {data:intake,error}=await sb.from('ai_intakes').insert({studio_id:studio.id,created_by:session.user.id,source_type:sourceType,raw_text:text||null,selected_client_id:selected,appointment_id:appt,status:'processing'}).select().single();if(error)throw error;
        await uploadIntakeMedia(intake.id);
        let result;
        try{result=await fnFetch('ai-intake',{method:'POST',auth:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({intakeId:intake.id})});}
        catch(e){await reload();close('intakeSheet');const saved=aiIntakes.find(x=>x.id===intake.id);if(saved)await openIntakeReview(saved.id);toast(e.message||'Saved to Needs Me for manual review.');return;}
        await reload();
        if(result.status==='ready'&&['owner_selected','linked_appointment'].includes(result.matchMethod)&&result.proposedClientId){
          await fileIntake(intake.id,result.proposedClientId,appt||'',false);close('intakeSheet');toast(`Filed to ${result.proposedClientName||'client'} — done.`);
        }else{close('intakeSheet');await openIntakeReview(intake.id);toast(result.proposedClientName?`I think this is ${result.proposedClientName}. Please confirm.`:'I need you to choose the client.');}
      }catch(e){toast(friendlyDbError(e));}
      finally{btn.disabled=false;$('#intakeStatus').textContent='';}
    };
    function intakeStatusLabel(x){return x.status==='needs_review'?'Needs client':x.status==='ready'?'Match ready':x.status==='processing'?'Analyzing':x.status==='failed'?'Needs review':x.status;}
    function renderIntakeQueue(){
      const q=aiIntakes.filter(x=>['processing','ready','needs_review','failed'].includes(x.status));
      $('#intakeQueue').innerHTML=q.length?q.map(x=>{const c=clients.find(c=>c.id===x.proposed_client_id),summary=x.parsed?.summary||x.raw_text||'Photo/note intake';return `<div class="listcard intake-queue-row"><div><div class="row"><span class="badge">${esc(intakeStatusLabel(x))}</span>${c?`<b>${esc(c.name)}</b>`:''}</div><div>${esc(String(summary).slice(0,180))}</div><div class="hint">${new Date(x.created_at).toLocaleString()}</div></div><button class="btn primary sm" data-review-intake="${x.id}">Review</button></div>`}).join(''):'<div class="empty">Nothing waiting. Add a note or photo whenever you need it.</div>';
      $$('[data-review-intake]').forEach(b=>b.onclick=()=>openIntakeReview(b.dataset.reviewIntake));
    }
    function reviewAppointmentOptions(clientId,selected=''){
      const pool=appointments.filter(a=>a.client_id===clientId&&a.status!=='blocked'&&a.status!=='cancelled').sort((a,b)=>b.appointment_date.localeCompare(a.appointment_date)).slice(0,20);
      $('#reviewAppointment').innerHTML='<option value="">No appointment link</option>'+pool.map(a=>`<option value="${a.id}">${fmtDate(a.appointment_date)} · ${esc(a.service)} · ${esc(a.status)}</option>`).join('');
      $('#reviewAppointment').value=selected||'';
    }
    async function openIntakeReview(id){
      const x=aiIntakes.find(v=>v.id===id);if(!x)return;currentReviewIntakeId=id;
      const p=x.parsed||{},m=aiIntakeMedia.filter(m=>m.intake_id===id&&m.kind!=='raw_audio'),urls=await Promise.all(m.map(async a=>({...a,url:await signedUrl(a.storage_path)})));
      const proposed=clients.find(c=>c.id===x.proposed_client_id);
      const rememberGroups=[['Likes',p.preferences_add||[],''],['Avoid / change',p.avoid_add||[],'warning'],['Future ideas',p.future_ideas||[],''],['Search tags',p.photo_tags||[],'subtle']].filter(g=>g[1].length);
      const memoryHtml=rememberGroups.length?`<div class="preference-grid" style="margin-top:10px">${rememberGroups.map(g=>`<div class="preference-box"><h4>${esc(g[0])}</h4>${g[1].map(t=>`<span class="memory-chip ${g[2]}">${esc(t)}</span>`).join('')}</div>`).join('')}</div>`:'';
      $('#intakeReviewBody').innerHTML=`${urls.length?`<div class="history-photos intake-review-photos">${urls.map(a=>`<div class="history-photo"><img src="${a.url}" alt="Intake photo"></div>`).join('')}</div>`:''}<div class="ai-proposal"><div class="eyebrow" style="color:#a14f69">ChairKeeper found</div><h3>${esc(p.summary||'Review this note/photo')}</h3>${parsedLine(p)?`<p>${esc(parsedLine(p))}</p>`:''}${p.service?`<span class="memory-chip">${esc(p.service)}</span>`:''}${memoryHtml}${x.raw_text?`<details><summary>Original note</summary><p>${esc(x.raw_text)}</p></details>`:''}<div class="note" style="margin-top:10px">${proposed?`Suggested client: <b>${esc(proposed.name)}</b> (${esc(x.match_method||'match')})`:'No safe client match yet. Choose one below.'}</div></div>`;
      $$('#intakeReviewBody img').forEach(img=>img.onclick=()=>openLightbox(img.src));
      $('#reviewClient').innerHTML='<option value="">Choose client…</option>'+clients.map(c=>`<option value="${c.id}">${esc(c.name)}${c.phone?` · ${esc(c.phone)}`:''}</option>`).join('');
      $('#reviewClient').value=x.proposed_client_id||x.selected_client_id||'';reviewAppointmentOptions($('#reviewClient').value,x.appointment_id||'');
      $('#reviewClient').onchange=()=>reviewAppointmentOptions($('#reviewClient').value,'');$('#intakeRemember').checked=true;$('#intakeHumanSave').checked=false;
      $('#intakeReviewSheet').classList.add('open');
    }
    $('#fileIntakeBtn').onclick=async()=>{const clientId=$('#reviewClient').value;if(!currentReviewIntakeId||!clientId){toast('Choose the client first.');return;}const btn=$('#fileIntakeBtn');btn.disabled=true;try{await fileIntake(currentReviewIntakeId,clientId,$('#reviewAppointment').value,$('#intakeHumanSave').checked,$('#intakeRemember').checked);close('intakeReviewSheet');toast('Filed to the client card.');}catch(e){toast(friendlyDbError(e));}finally{btn.disabled=false;}};
    $('#dismissIntakeBtn').onclick=async()=>{if(!currentReviewIntakeId||!confirm('Dismiss this intake? The note stays in the audit record, but unfiled photos will be removed.'))return;const paths=aiIntakeMedia.filter(m=>m.intake_id===currentReviewIntakeId).map(m=>m.storage_path);if(paths.length)await sb.storage.from('chairkeeper-private').remove(paths);await sb.from('ai_intake_media').delete().eq('intake_id',currentReviewIntakeId).eq('studio_id',studio.id);const {error}=await sb.rpc('dismiss_ai_intake',{p_intake_id:currentReviewIntakeId});if(error){toast(friendlyDbError(error));return;}close('intakeReviewSheet');await reload();toast('Dismissed.');};

    // ================= CALENDAR =================
    function apptsOn(dateStr){return appointments.filter(a=>a.appointment_date===dateStr).sort((a,b)=>a.start_time.localeCompare(b.start_time));}
    function statusBadge(a){return a.status==='blocked'?'Blocked':a.status==='cancelled'?'Cancelled':a.status==='no_show'?'No-show':a.status==='completed'?'Completed':'Confirmed';}
    function renderCalendar(){
      $('#calDay').classList.toggle('hidden',calView!=='day');
      $('#calWeek').classList.toggle('hidden',calView!=='week');
      $('#calMonth').classList.toggle('hidden',calView!=='month');
      $$('[data-calview]').forEach(b=>b.classList.toggle('active',b.dataset.calview===calView));
      if(calView==='day'){
        $('#calDateLabel').textContent=fmtDateLong(calDate);
        const list=apptsOn(calDate);
        $('#calDay').innerHTML=list.length?list.map(a=>`<div class="cal-appt ${a.status}" data-appt="${a.id}"><div class="cal-appt-time">${fmtTime(a.start_time)}–${fmtTime(a.end_time)}</div><div class="cal-appt-main"><b>${esc(a.client_name||a.block_reason||'Blocked time')}</b><small>${esc(a.status==='blocked'?(a.block_reason||'Blocked'):a.service)}${a.note?' · has note':''}</small></div><span class="badge">${statusBadge(a)}</span></div>`).join(''):'<div class="empty">Nothing on the calendar this day.</div>';
        $$('[data-appt]').forEach(b=>b.onclick=()=>openApptDetail(b.dataset.appt));
      } else if(calView==='week'){
        const start=startOfWeek(calDate);
        $('#calDateLabel').textContent=`${fmtDate(start)} – ${fmtDate(addDaysStr(start,6))}`;
        let html='';
        for(let i=0;i<7;i++){
          const d=addDaysStr(start,i),list=apptsOn(d);
          html+=`<div class="cal-week-day" data-jumpday="${d}"><h4>${fmtDate(d)}</h4>${list.map(a=>`<div class="cal-week-chip ${a.status==='blocked'?'blocked':''}" data-appt="${a.id}">${fmtTime(a.start_time)} ${esc((a.client_name||a.block_reason||'Blocked').split(' ')[0])}</div>`).join('')||'<div class="hint" style="font-size:11px">Open</div>'}</div>`;
        }
        $('#calWeek').innerHTML=html;
        $$('#calWeek [data-appt]').forEach(b=>b.onclick=e=>{e.stopPropagation();openApptDetail(b.dataset.appt);});
        $$('#calWeek [data-jumpday]').forEach(b=>b.onclick=()=>{calDate=b.dataset.jumpday;calView='day';renderCalendar();});
      } else {
        const first=calDate.slice(0,8)+'01', monthStart=startOfWeek(first);
        const monthNum=Number(calDate.slice(5,7));
        $('#calDateLabel').textContent=new Date(`${first}T12:00:00`).toLocaleDateString(undefined,{month:'long',year:'numeric'});
        let html='';
        for(let i=0;i<42;i++){
          const d=addDaysStr(monthStart,i), inMonth=Number(d.slice(5,7))===monthNum, list=apptsOn(d).filter(a=>a.status!=='cancelled');
          html+=`<div class="cal-month-cell ${inMonth?'':'other-month'}" data-jumpday="${d}"><div class="dnum">${Number(d.slice(8,10))}</div>${list.slice(0,4).map(()=>'<span class="cal-month-dot"></span>').join('')}</div>`;
          if(i===41)break;
        }
        $('#calMonth').innerHTML=html;
        $$('#calMonth [data-jumpday]').forEach(b=>b.onclick=()=>{calDate=b.dataset.jumpday;calView='day';renderCalendar();});
      }
    }
    $$('[data-calview]').forEach(b=>b.onclick=()=>{calView=b.dataset.calview;renderCalendar();});
    $('#calPrev').onclick=()=>{calDate=addDaysStr(calDate, calView==='month'?-30:calView==='week'?-7:-1);renderCalendar();};
    $('#calNext').onclick=()=>{calDate=addDaysStr(calDate, calView==='month'?30:calView==='week'?7:1);renderCalendar();};
    $('#calToday').onclick=()=>{calDate=today();renderCalendar();};

    function openApptDetail(id){
      const a=appointments.find(x=>x.id===id); if(!a)return;
      $('#apptDetailTitle').textContent=a.status==='blocked'?(a.block_reason||'Blocked time'):(a.client_name||'Appointment');
      $('#apptDetailBody').innerHTML=`<div class="client-summary"><b>${fmtDate(a.appointment_date)} · ${fmtTime(a.start_time)}–${fmtTime(a.end_time)}</b><div>${esc(a.status==='blocked'?'':a.service)}</div><div class="hint">Status: ${statusBadge(a)}</div>${a.note?`<p>${esc(a.note)}</p>`:''}${(a.extras&&a.extras.length)?`<div class="hint">Extras: ${a.extras.map(x=>esc(x.label)).join(', ')}</div>`:''}</div>`;
      const actions=[];
      if(a.status!=='cancelled'&&a.status!=='blocked'){
        actions.push(`<button class="btn alt sm" data-act="reschedule">Reschedule</button>`);
        if(a.status==='confirmed'){actions.push(`<button class="btn alt sm" data-act="no_show">No-show</button>`);actions.push(`<button class="btn primary sm" data-act="finish">Finish visit</button>`);}
        actions.push(`<button class="btn danger sm" data-act="cancel">Cancel</button>`);
      } else if(a.status==='blocked'){
        actions.push(`<button class="btn danger sm" data-act="cancel">Remove block</button>`);
      }
      $('#apptDetailActions').innerHTML=actions.join('');
      $('#apptDetailActions [data-act="cancel"]')?.addEventListener('click',async()=>{
        const {error}=await sb.from('appointments').update({status:'cancelled'}).eq('id',a.id).eq('studio_id',studio.id);
        if(error)toast(friendlyDbError(error)); else{toast('Cancelled');close('apptDetailSheet');await reload();}
      });
      $('#apptDetailActions [data-act="no_show"]')?.addEventListener('click',async()=>{
        const {error}=await sb.from('appointments').update({status:'no_show'}).eq('id',a.id).eq('studio_id',studio.id);
        if(error)toast(friendlyDbError(error)); else{toast('Marked no-show');close('apptDetailSheet');await reload();}
      });
      $('#apptDetailActions [data-act="finish"]')?.addEventListener('click',()=>{close('apptDetailSheet');openVisit(a.client_id,a.id);});
      $('#apptDetailActions [data-act="reschedule"]')?.addEventListener('click',()=>{close('apptDetailSheet');openApptForm(a);});
      $('#apptDetailSheet').classList.add('open');
    }

    function populateApptClientSelect(preselect){
      $('#apptClient').innerHTML=`<option value="">+ New client…</option>`+clients.map(c=>`<option value="${c.id}">${esc(c.name)}${c.phone?` · ${esc(c.phone)}`:''}</option>`).join('');
      $('#apptClient').value=preselect||'';
      $('#apptNewClientFields').classList.toggle('hidden',!!preselect);
    }
    $('#apptClient').onchange=()=>{$('#apptNewClientFields').classList.toggle('hidden',!!$('#apptClient').value);};
    function serviceDuration(name){const s=services.find(x=>x.name===name); return s?Number(s.duration_minutes||60):60;}
    function renderApptExtrasChoices(noteGuess=''){
      $('#apptExtrasChoices').innerHTML=extras.filter(x=>x.active).map(x=>`<label class="badge" style="cursor:pointer"><input type="checkbox" data-extra="${x.id}" data-minutes="${x.extra_minutes}" style="margin-right:4px">${esc(x.label)} (+${x.extra_minutes}m)</label>`).join('');
    }
    let editingApptId=null, apptFormIdemKey=null;
    function openApptForm(existing){
      editingApptId=existing?existing.id:null;
      apptFormIdemKey=uid();
      $('#apptFormTitle').textContent=existing?'Reschedule appointment':'New appointment';
      $('#apptService').innerHTML=services.map(s=>`<option value="${esc(s.name)}">${esc(s.name)} (${s.duration_minutes}m)</option>`).join('');
      renderApptExtrasChoices();
      populateApptClientSelect(existing?existing.client_id:'');
      $('#apptNewName').value=''; $('#apptNewPhone').value='';
      if(existing){
        $('#apptService').value=existing.service; $('#apptDate').value=existing.appointment_date; $('#apptTime').value=existing.start_time.slice(0,5);
        $('#apptDuration').value=minutesBetween(existing.start_time,existing.end_time); $('#apptNote').value=existing.note||'';
      } else {
        $('#apptDate').value=calDate; $('#apptTime').value='09:00'; $('#apptDuration').value=serviceDuration(services[0]?.name); $('#apptNote').value='';
      }
      $('#apptConflictHint').textContent='';
      $('#apptFormSheet').classList.add('open');
    }
    $('#apptService').onchange=()=>{ if(!editingApptId) $('#apptDuration').value=serviceDuration($('#apptService').value); };
    $('#addApptBtn').onclick=()=>openApptForm(null);
    $('#apptForm').onsubmit=async e=>{
      e.preventDefault();
      const btn=e.currentTarget.querySelector('button[type=submit]'); if(btn)btn.disabled=true;
      try{
        let clientId=$('#apptClient').value, clientName;
        if(!clientId){
          const name=$('#apptNewName').value.trim(); if(!name){toast('Enter a client name or pick an existing client');return;}
          const phone=$('#apptNewPhone').value.trim();
          const {data:newC,error:ce}=await sb.from('clients').insert({studio_id:studio.id,name,phone,phone_normalized:phone.replace(/\D/g,'')||null,service:$('#apptService').value}).select().single();
          if(ce)throw ce; clientId=newC.id; clientName=newC.name; clients.push(newC);
        } else { clientName=clients.find(c=>c.id===clientId)?.name||'Client'; }
        const start=$('#apptTime').value, dur=Number($('#apptDuration').value||60), end=addMinutesToTime(start,dur);
        const chosenExtras=$$('[data-extra]').filter(i=>i.checked).map(i=>({key:i.dataset.extra,label:i.closest('label').textContent.trim(),extra_minutes:Number(i.dataset.minutes)}));
        const serviceName=$('#apptService').value;
        const selectedSvc=services.find(s=>s.name===serviceName);
        const row={studio_id:studio.id,client_id:clientId,client_name:clientName,service:serviceName,appointment_date:$('#apptDate').value,start_time:start,end_time:end,status:'confirmed',source:'owner_manual',note:$('#apptNote').value.trim()||null,extras:chosenExtras};
        if(editingApptId){
          const {error}=await sb.from('appointments').update(row).eq('id',editingApptId).eq('studio_id',studio.id);
          if(error)throw error; toast('Appointment updated');
        } else {
          row.idempotency_key=apptFormIdemKey;
          row.price_at_booking=selectedSvc?.price??null;
          row.price_type_at_booking=selectedSvc?.price_type||null;
          const {error}=await sb.from('appointments').insert(row);
          if(error)throw error; toast('Appointment added');
        }
        close('apptFormSheet'); await reload();
      }catch(err){
        const msg=friendlyDbError(err); $('#apptConflictHint').textContent=msg; toast(msg);
      } finally { if(btn)btn.disabled=false; }
    };

    $('#blockTimeBtn').onclick=()=>{ $('#blockDate').value=calDate; $('#blockStart').value='12:00'; $('#blockEnd').value='12:30'; $('#blockFormSheet').classList.add('open'); };
    $('#blockForm').onsubmit=async e=>{
      e.preventDefault();
      const row={studio_id:studio.id,client_name:null,service:'Blocked time',appointment_date:$('#blockDate').value,start_time:$('#blockStart').value,end_time:$('#blockEnd').value,status:'blocked',source:'owner_manual',block_reason:$('#blockReason').value};
      const {error}=await sb.from('appointments').insert(row);
      if(error){toast(friendlyDbError(error));return;}
      toast('Time blocked'); close('blockFormSheet'); await reload();
    };

    function renderExceptions(){
      $('#exceptionsList').innerHTML=exceptions.length?exceptions.map(x=>`<div class="listcard"><div class="row between"><div><b>${fmtDate(x.exception_date)}</b><div class="hint">${x.is_closed?'Closed':`Open ${fmtTime(x.start_time)}–${fmtTime(x.end_time)}`}${x.reason?` · ${esc(x.reason)}`:''}</div></div><button class="btn danger sm" data-del-exc="${x.id}">Remove</button></div></div>`).join(''):'<div class="empty">No closures or special hours set.</div>';
      $$('[data-del-exc]').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('date_exceptions').delete().eq('id',b.dataset.delExc).eq('studio_id',studio.id); if(error)toast(error.message); else{toast('Removed');await reload();}});
    }
    $('#addExceptionBtn').onclick=()=>{ $('#excDate').value=plus(1); $('#excClosed').checked=true; $('#excHoursFields').classList.add('hidden'); $('#excReason').value=''; $('#exceptionFormSheet').classList.add('open'); };
    $('#excClosed').onchange=()=>{$('#excHoursFields').classList.toggle('hidden',$('#excClosed').checked);};
    $('#exceptionForm').onsubmit=async e=>{
      e.preventDefault();
      const closed=$('#excClosed').checked;
      const row={studio_id:studio.id,exception_date:$('#excDate').value,is_closed:closed,start_time:closed?null:$('#excStart').value,end_time:closed?null:$('#excEnd').value,reason:$('#excReason').value.trim()||null};
      const {error}=await sb.from('date_exceptions').upsert(row,{onConflict:'studio_id,exception_date'});
      if(error){toast(error.message);return;}
      toast('Saved'); close('exceptionFormSheet'); await reload();
    };

    function renderExtrasEditor(){
      $('#extrasEditor').innerHTML=extras.map(x=>`<div class="extra-edit-row" data-extra-id="${x.id}"><input class="field ex-label" value="${esc(x.label)}" placeholder="Label"><input class="field ex-keywords" value="${esc((x.keywords||[]).join(', '))}" placeholder="keywords, comma, separated"><input class="field ex-minutes" type="number" min="0" step="5" value="${Number(x.extra_minutes||0)}" title="Extra minutes"><input class="field ex-price" type="number" min="0" step="1" value="${Number(x.extra_price||0)}" title="Extra price"><button class="btn danger sm ex-remove" type="button">Remove</button></div>`).join('');
      $$('.ex-remove').forEach(btn=>btn.onclick=()=>btn.closest('.extra-edit-row').remove());
    }
    $('#addExtraRow').onclick=()=>{$('#extrasEditor').insertAdjacentHTML('beforeend',`<div class="extra-edit-row"><input class="field ex-label" value="New extra" placeholder="Label"><input class="field ex-keywords" value="" placeholder="keywords, comma, separated"><input class="field ex-minutes" type="number" min="0" step="5" value="15"><input class="field ex-price" type="number" min="0" step="1" value="0"><button class="btn danger sm ex-remove" type="button">Remove</button></div>`); $$('.ex-remove').forEach(btn=>btn.onclick=()=>btn.closest('.extra-edit-row').remove());};
    $('#saveExtras').onclick=async()=>{
      const rows=$$('.extra-edit-row'); const keep=[];
      for(const [i,row] of rows.entries()){
        const id=row.dataset.extraId, label=row.querySelector('.ex-label').value.trim()||'Extra';
        const keywords=row.querySelector('.ex-keywords').value.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
        const minutes=Number(row.querySelector('.ex-minutes').value||0), price=Number(row.querySelector('.ex-price').value||0);
        const key=(id?extras.find(x=>x.id===id)?.key:null)||label.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,40)||`extra_${i}`;
        const payload={studio_id:studio.id,key,label,keywords,extra_minutes:minutes,extra_price:price,sort_order:i,active:true};
        if(id){const r=await sb.from('service_extras').update(payload).eq('id',id).eq('studio_id',studio.id); if(r.error){toast(r.error.message);return;} keep.push(id);}
        else{const r=await sb.from('service_extras').insert(payload).select().single(); if(r.error){toast(r.error.message);return;} keep.push(r.data.id);}
      }
      const removed=extras.filter(x=>!keep.includes(x.id));
      for(const r of removed) await sb.from('service_extras').update({active:false}).eq('id',r.id).eq('studio_id',studio.id);
      await reload(); toast('Extras saved');
    };

    function exportRows(){
      return {
        clients: clients.map(c=>({name:c.name,phone:c.phone,email:c.email,service:c.service,visits:c.visits,next_due:c.next_due,last_visit_at:c.last_visit_at})),
        appointments: appointments.map(a=>({date:a.appointment_date,start:a.start_time,end:a.end_time,client:a.client_name,service:a.service,status:a.status})),
        bookings: bookings.map(b=>({name:b.name,phone:b.phone,service:b.service,requested_date:b.requested_date,requested_time:b.requested_time,status:b.status})),
      };
    }
    function downloadFile(filename,content,mime){
      const blob=new Blob([content],{type:mime}); const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
    function toCsv(rows){
      if(!rows.length)return '';
      const headers=Object.keys(rows[0]);
      const esc2=v=>`"${String(v??'').replace(/"/g,'""')}"`;
      return [headers.join(','),...rows.map(r=>headers.map(h=>esc2(r[h])).join(','))].join('\n');
    }
    $('#exportJson').onclick=()=>downloadFile(`chairkeeper-backup-${today()}.json`,JSON.stringify(exportRows(),null,2),'application/json');
    $('#exportCsv').onclick=()=>{
      const data=exportRows();
      const parts=Object.entries(data).map(([k,rows])=>`# ${k}\n${toCsv(rows)}`);
      downloadFile(`chairkeeper-backup-${today()}.csv`,parts.join('\n\n'),'text/csv');
    };

    // ================= FINISH VISIT =================
    function openVisit(clientId='',apptId=''){photoFiles=[];audioBlob=null;recording=false; $('#visitClient').innerHTML=clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join(''); if(clientId)$('#visitClient').value=clientId; $('#visitPhotos').value=''; $('#visitPreview').innerHTML=''; $('#narration').value=''; $('#humanSave').checked=false; $('#micStatus').textContent='Tap once to record. Tap again to stop and transcribe.'; showParsed(parseNote('',services)); visitLinkedApptId=apptId||null; $('#visitSheet').classList.add('open');}
    $('#finishQuick').onclick=()=>openVisit();
    let photoFiles=[],audioBlob=null,recorder=null,chunks=[],recording=false;
    $('#visitPhotos').onchange=e=>{const files=[...e.target.files]; if(files.length>4)toast('ChairKeeper keeps up to 4 photos per visit.'); photoFiles=files.slice(0,4).filter(f=>{if(f.size>8*1024*1024){toast(`${f.name||'A photo'} is over 8 MB and was not added.`);return false;}return true;}); $('#visitPreview').innerHTML=photoFiles.map(f=>`<img src="${URL.createObjectURL(f)}" alt="Visit preview">`).join('');};
    function showParsed(p){$('#parsed').innerHTML=`<div><span>Service</span><b>${esc(p.service||'—')}</b></div><div><span>Shape</span><b>${esc(p.shape||'—')}</b></div><div><span>Length</span><b>${esc(p.length||'—')}</b></div><div><span>Color</span><b>${esc(p.color||'—')}</b></div><div><span>Design</span><b>${esc(p.design||'—')}</b></div><div><span>Products</span><b>${esc(p.products||'—')}</b></div><div><span>Price</span><b>${p.price?money(p.price):'—'}</b></div><div><span>Return</span><b>${p.weeks?`${p.weeks} weeks`:'—'}</b></div>`;}
    $('#parse').onclick=()=>showParsed(parseNote($('#narration').value,services));
    $('#mic').onclick=async()=>{
      if(recording&&recorder){recorder.stop();return;}
      try{const stream=await navigator.mediaDevices.getUserMedia({audio:true}); chunks=[]; recorder=new MediaRecorder(stream); recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}; recorder.onstop=async()=>{recording=false; $('#mic').textContent='🎙 Tap and talk naturally'; stream.getTracks().forEach(t=>t.stop()); audioBlob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'}); $('#micStatus').textContent='Transcribing…'; try{const fd=new FormData();fd.append('audio',audioBlob,'visit-note.webm'); const data=await fnFetch('transcribe',{method:'POST',auth:true,body:fd}); $('#narration').value=data.text||''; showParsed(parseNote(data.text||'',services)); $('#micStatus').textContent='Transcribed. Original audio is still separate.';}catch(e){$('#micStatus').textContent='Audio saved, but transcription did not succeed — nothing was silently faked. You can type the note instead.'; toast(e.message||'Transcription unavailable');}}; recorder.start(); recording=true; $('#mic').textContent='■ Stop and transcribe'; $('#micStatus').textContent='Recording… talk naturally.';}catch{toast('Microphone permission unavailable');}
    };
    async function uploadPrivate(blob,path){const {error}=await sb.storage.from('chairkeeper-private').upload(path,blob,{contentType:blob.type,upsert:false}); if(error)throw error; return path;}
    async function applyRetention(clientId){
      const cv=visits.filter(v=>v.client_id===clientId).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)); const keep=new Set(cv.slice(0,studio.portfolio_visits||6).map(v=>v.id)); const now=new Date(),purge=new Date(Date.now()+30*86400000).toISOString();
      for(const m of media.filter(m=>m.client_id===clientId&&!m.human_saved&&!m.trashed_at)){
        const rawShouldGo=m.kind==='raw_audio'&&cv.length>1&&m.visit_id===cv[1].id; const oldPortfolio=m.kind==='portfolio'&&!keep.has(m.visit_id); if(rawShouldGo||oldPortfolio) await sb.from('media_assets').update({trashed_at:now.toISOString(),purge_after:purge}).eq('id',m.id).eq('studio_id',studio.id);
      }
    }
    $('#saveVisit').onclick=async()=>{const clientId=$('#visitClient').value,c=clients.find(x=>x.id===clientId); if(!c)return; const narration=$('#narration').value.trim(),parsed=parseNote(narration,services),start=Date.now(); const {data:v,error}=await sb.from('visits').insert({studio_id:studio.id,client_id:clientId,narration,parsed}).select().single(); if(error){toast(error.message);return;} const hs=$('#humanSave').checked,kind=$('#photoKind').value,uploaded=[]; try{for(const f of photoFiles){const path=`${studio.id}/${clientId}/${v.id}/${uid()}-${String(f.name||'photo.jpg').replace(/[^a-zA-Z0-9._-]/g,'_')}`; await uploadPrivate(f,path); const row={studio_id:studio.id,client_id:clientId,visit_id:v.id,kind,storage_path:path,mime_type:f.type,byte_size:f.size,human_saved:hs}; const r=await sb.from('media_assets').insert(row).select().single(); if(r.error)throw r.error; uploaded.push(r.data);} if(audioBlob){const path=`${studio.id}/${clientId}/${v.id}/${uid()}-visit-note.webm`; await uploadPrivate(audioBlob,path); const r=await sb.from('media_assets').insert({studio_id:studio.id,client_id:clientId,visit_id:v.id,kind:'raw_audio',storage_path:path,mime_type:audioBlob.type,byte_size:audioBlob.size,human_saved:hs}).select().single(); if(r.error)throw r.error; uploaded.push(r.data);}}catch(e){toast(`Visit saved, but media had a problem: ${e.message}`);}
      const weeks=parsed.weeks||3,next=new Date();next.setDate(next.getDate()+weeks*7); await sb.from('clients').update({visits:Number(c.visits||0)+1,next_due:next.toISOString().slice(0,10),service:parsed.service||c.service,last_visit_at:new Date().toISOString()}).eq('id',clientId).eq('studio_id',studio.id); visits.unshift(v);media.unshift(...uploaded);
      if(visitLinkedApptId){ const nowIso=new Date().toISOString(); await sb.from('appointments').update({status:'completed',completed_at:nowIso}).eq('id',visitLinkedApptId).eq('studio_id',studio.id); }
      await applyRetention(clientId); close('visitSheet'); await reload(); toast(`Visit saved in ${Math.max(1,Math.round((Date.now()-start)/1000))} sec. You’re done.`);};
    $('#openDate').value=plus(1); $('#fillBtn').onclick=()=>{const openDate=$('#openDate').value,openTime=$('#openTime').value; const od=new Date(`${openDate}T12:00:00`).getTime(),windowMs=14*86400000; const cs=clients.filter(c=>c.next_due&&Math.abs(new Date(`${c.next_due}T12:00:00`).getTime()-od)<=windowMs).sort((a,b)=>Math.abs(new Date(a.next_due)-od)-Math.abs(new Date(b.next_due)-od)).slice(0,5); $('#fillResults').innerHTML=cs.length?cs.map(c=>{const first=c.name.split(/\s+/)[0],msg=`Hey ${first}! I had an opening come up ${fmtDate(openDate)} at ${fmtTime(openTime)}. Want me to save it for you? — ${studio.name}`;return `<div class="listcard"><div class="row between"><div><b>${esc(c.name)}</b><div class="hint">${c.next_due<=today()?'Due now':`Due ${fmtDate(c.next_due)}`}</div></div><a class="btn primary sm" href="sms:${esc(c.phone)}?&body=${encodeURIComponent(msg)}">Offer spot</a></div></div>`}).join(''):'<div class="empty">No obvious candidates. Better to say that than text the wrong person.</div>';};
    $('#addClient').onclick=()=>{$('#clientFormSheet').classList.add('open');}; $('#clientForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const {error}=await sb.from('clients').insert({studio_id:studio.id,name:fd.get('name'),phone:fd.get('phone')||'',email:fd.get('email')||'',service:fd.get('service')||'Client'});if(error)toast(error.message);else{close('clientFormSheet');e.currentTarget.reset();await reload();toast('Client added')}};
    async function renderTrash(){const expired=media.filter(m=>m.trashed_at&&m.purge_after&&new Date(m.purge_after)<new Date()&&!m.human_saved);for(const m of expired){await sb.storage.from('chairkeeper-private').remove([m.storage_path]);await sb.from('media_assets').delete().eq('id',m.id).eq('studio_id',studio.id);} if(expired.length)await loadAll(); const tr=media.filter(m=>m.trashed_at); $('#trashList').innerHTML=tr.length?tr.map(m=>`<div class="listcard"><div class="row between"><div><b>${esc(m.kind)}</b><div class="hint">Deletes ${new Date(m.purge_after).toLocaleDateString()}</div></div><button class="btn alt sm" data-restore="${m.id}">Restore</button></div></div>`).join(''):'<div class="empty">Trash is empty.</div>'; $$('[data-restore]').forEach(b=>b.onclick=async()=>{await sb.from('media_assets').update({trashed_at:null,purge_after:null}).eq('id',b.dataset.restore).eq('studio_id',studio.id);await reload();renderTrash();});}
    let aiStatusChecked=false;
    async function checkAiSetup(){
      if(aiStatusChecked)return; aiStatusChecked=true;
      const el=$('#aiSetupStatus'); if(!el)return;
      try{const data=await fnFetch('ai-intake',{auth:true}); el.textContent=data.configured?'On · server key connected':'Off · add OpenAI key during deploy'; el.classList.toggle('ok',!!data.configured);}catch{el.textContent='Not connected yet';}
    }
    function renderSetup(){
      $('#setupStudio').value=studio.name||''; $('#setupTech').value=studio.tech_name||''; $('#setupLocation').value=studio.location||''; $('#setupPhone').value=studio.phone||''; $('#setupEmail').value=studio.owner_email||''; $('#setupPushover').value=studio.pushover_user_key||''; $('#setupBuffer').value=Number(studio.buffer_minutes||0);
      $('#serviceEditor').innerHTML=services.map((x,i)=>`<div class="service-edit-row" data-service-id="${x.id}"><input class="field svc-name" value="${esc(x.name)}"><div class="money-field"><span>$</span><input class="field svc-price" type="number" min="0" step="1" value="${Number(x.price||0)}" ${x.price_type==='consultation'?'disabled title="Use Catalog to edit consultation pricing"':''}></div><div class="duration-field"><input class="field svc-duration" type="number" min="15" step="5" value="${Number(x.duration_minutes||60)}"><span>min</span></div><span class="hint">${x.price_type==='fixed'?'fixed':x.price_type==='starting_at'?'starting at':x.price_type==='range'?'range · edit max in Catalog':'consultation · edit in Catalog'}</span></div>`).join('') || '<div class="empty">No published services yet. Add them in Catalog.</div>';
      const hours=studio.business_hours||{}; $$('[data-hours-day]').forEach(row=>{const d=row.dataset.hoursDay,v=hours[d]||null; row.querySelector('.hours-on').checked=!!v; row.querySelector('.hours-start').value=v?.start||'09:00'; row.querySelector('.hours-end').value=v?.end||'17:00';});
      renderExceptions(); checkAiSetup();
    }
    $('#saveSetup').onclick=async()=>{const hours={};$$('[data-hours-day]').forEach(row=>{if(row.querySelector('.hours-on').checked)hours[row.dataset.hoursDay]={start:row.querySelector('.hours-start').value,end:row.querySelector('.hours-end').value};}); const patch={name:$('#setupStudio').value.trim()||'Simply Hope Designs',tech_name:$('#setupTech').value.trim()||'Owner',location:$('#setupLocation').value.trim()||'Lubbock, Texas · By appointment',phone:$('#setupPhone').value.trim(),pushover_user_key:$('#setupPushover').value.trim(),business_hours:hours,schedule_configured:true,buffer_minutes:Math.max(0,Math.min(120,Number($('#setupBuffer').value||0)))}; const {error}=await sb.from('studios').update(patch).eq('id',studio.id); if(error)toast(friendlyDbError(error));else{Object.assign(studio,patch);toast('Business setup saved');renderSetup();}};
    $('#saveServices').onclick=async()=>{
      const rows=$$('.service-edit-row');
      for(const row of rows){
        const id=row.dataset.serviceId;
        if(!id){toast('New services belong in Catalog so they stay private until you publish them.');return;}
        const original=services.find(s=>s.id===id);
        const name=row.querySelector('.svc-name').value.trim();
        const priceInput=row.querySelector('.svc-price');
        const duration=Math.max(15,Number(row.querySelector('.svc-duration').value||60));
        if(!name){toast('Every service needs a name.');return;}
        const patch={name,duration_minutes:duration};
        if(original?.price_type!=='consultation'){
          if(!priceInput.value.trim()||Number(priceInput.value)<=0){toast(`Enter a price above $0 for ${name}, or edit its pricing type in Catalog.`);return;}
          patch.price=Number(priceInput.value);
        }
        const r=await sb.from('services').update(patch).eq('id',id).eq('studio_id',studio.id);
        if(r.error){toast(friendlyDbError(r.error));return;}
      }
      await reload();toast('Existing service details saved');
    };
    // ================= CATALOG MANAGER (v0.8.2) =================
    function catalogImageUrl(path){ if(!path) return ''; const {data}=sb.storage.from('chairkeeper-catalog').getPublicUrl(path); return data?.publicUrl||''; }
    function formatServicePrice(s){
      if(s.price_type==='consultation') return 'Consultation';
      if(s.price_type==='starting_at') return `From ${money(s.price)}`;
      if(s.price_type==='range') return `${money(s.price)}\u2013${money(s.price_max)}`;
      return money(s.price);
    }
    function serviceBadges(s){
      const b=[];
      if(s.draft) b.push(['draft','Draft']);
      if(s.status==='temporarily_unavailable') b.push(['unavailable','Not bookable now']);
      if(s.status==='hidden') b.push(['hidden','Hidden']);
      if(s.featured) b.push(['featured','Featured']);
      if(s.seasonal) b.push(['seasonal','Seasonal']);
      if(!s.active) b.push(['archived','Archived']);
      return b.map(([cls,label])=>`<span class="catalog-badge ${cls}">${esc(label)}</span>`).join('');
    }
    function primaryImageFor(serviceId){
      const imgs=serviceImages.filter(i=>i.service_id===serviceId&&!i.archived_at);
      return imgs.find(i=>i.is_primary)||imgs[0]||null;
    }
    function renderCatalog(){
      const draftCount=catalogAll.filter(s=>s.draft&&s.active).length;
      $('#draftCountBadge').textContent=draftCount?`(${draftCount})`:'';
      $('#catalogNote').textContent=draftCount
        ? `You have ${draftCount} new item${draftCount>1?'s':''} saved as a draft. Customers can't see ${draftCount>1?'them':'it'} yet — tap "Publish new items" when ready.`
        : 'Everything below is already live for customers.';
      renderCategoryEditor();
      renderCatalogServiceList();
      renderExtrasEditor();
    }
    function bindCategoryRowHandlers(){
      $$('.cat-up').forEach(b=>b.onclick=()=>{const row=b.closest('.category-edit-row'),prev=row.previousElementSibling; if(prev)row.parentNode.insertBefore(row,prev);});
      $$('.cat-down').forEach(b=>b.onclick=()=>{const row=b.closest('.category-edit-row'),next=row.nextElementSibling; if(next)row.parentNode.insertBefore(next,row);});
      $$('.cat-archive').forEach(b=>b.onclick=async()=>{
        const id=b.closest('.category-edit-row').dataset.categoryId;
        if(!id){ b.closest('.category-edit-row').remove(); return; } // never-saved row: just drop it
        const {error}=await sb.from('service_categories').update({active:false}).eq('id',id).eq('studio_id',studio.id);
        if(error)toast(friendlyDbError(error)); else{toast('Category archived'); await reload(); renderCatalog();}
      });
    }
    function renderCategoryEditor(){
      const active=categories.filter(c=>c.active);
      $('#categoryEditor').innerHTML=active.map(c=>`<div class="category-edit-row" data-category-id="${c.id}"><input class="field cat-name" value="${esc(c.name)}"><button class="btn alt sm cat-up" type="button">\u2191</button><button class="btn alt sm cat-down" type="button">\u2193</button><button class="btn danger sm cat-archive" type="button">Archive</button></div>`).join('')
        || '<div class="empty">No categories yet — optional, add one if it helps customers browse.</div>';
      bindCategoryRowHandlers();
    }
    $('#addCategoryBtn').onclick=()=>{
      if($('#categoryEditor').querySelector('.empty')) $('#categoryEditor').innerHTML='';
      $('#categoryEditor').insertAdjacentHTML('beforeend','<div class="category-edit-row"><input class="field cat-name" value="New category"><button class="btn alt sm cat-up" type="button">\u2191</button><button class="btn alt sm cat-down" type="button">\u2193</button><button class="btn danger sm cat-archive" type="button">Archive</button></div>');
      bindCategoryRowHandlers();
    };
    $('#saveCategories').onclick=async()=>{
      const rows=$$('.category-edit-row');
      for(const [i,row] of rows.entries()){
        const id=row.dataset.categoryId, name=row.querySelector('.cat-name').value.trim()||'Category';
        if(id){const r=await sb.from('service_categories').update({name,sort_order:i}).eq('id',id).eq('studio_id',studio.id); if(r.error){toast(friendlyDbError(r.error));return;}}
        else{const r=await sb.from('service_categories').insert({studio_id:studio.id,name,sort_order:i}).select().single(); if(r.error){toast(friendlyDbError(r.error));return;} row.dataset.categoryId=r.data.id;}
      }
      await reload(); renderCatalog(); toast('Categories saved');
    };
    function renderCatalogServiceList(){
      const live=catalogAll.filter(s=>s.active);
      const archived=catalogAll.filter(s=>!s.active);
      const catMap=new Map(categories.map(c=>[c.id,c.name]));
      const activeCatIds=new Set(categories.filter(c=>c.active).map(c=>c.id));
      const groups=new Map();
      for(const s of live){ const key=s.category_id&&activeCatIds.has(s.category_id)?s.category_id:'__none'; if(!groups.has(key))groups.set(key,[]); groups.get(key).push(s); }
      const orderedKeys=[...categories.filter(c=>c.active).map(c=>c.id).filter(id=>groups.has(id)), ...(groups.has('__none')?['__none']:[])];
      function serviceRow(s){
        const img=primaryImageFor(s.id), thumb=img?catalogImageUrl(img.storage_path):'';
        const archivedCategory=s.category_id&&!activeCatIds.has(s.category_id)&&catMap.has(s.category_id)?` · archived category: ${esc(catMap.get(s.category_id))}`:'';
        return `<div class="catalog-service-card" data-edit-service="${s.id}">${thumb?`<img class="catalog-service-thumb" src="${thumb}" alt="">`:'<div class="catalog-service-thumb"></div>'}<div class="catalog-service-main"><b>${esc(s.name)}</b><div class="hint">${esc(formatServicePrice(s))} \u00b7 ${s.duration_minutes||60} min${archivedCategory}</div><div class="catalog-badges">${serviceBadges(s)}</div></div></div>`;
      }
      let html=orderedKeys.map(key=>`<div class="catalog-category-group"><h3>${key==='__none'?'No category':esc(catMap.get(key))}</h3>${groups.get(key).map(serviceRow).join('')}</div>`).join('')
        || '<div class="empty">No services yet. Tap "+ Service" to add your first one.</div>';
      if(archived.length){
        html+=`<details class="handled-box" style="margin-top:14px"><summary>Archived services (${archived.length})</summary><div class="handled-explain">Archived items keep their history on past appointments — restoring one does not affect anything already booked.</div>${archived.map(s=>`<div class="catalog-service-card" data-edit-service="${s.id}"><div class="catalog-service-thumb"></div><div class="catalog-service-main"><b>${esc(s.name)}</b><div class="catalog-badges">${serviceBadges(s)}</div></div></div>`).join('')}</details>`;
      }
      $('#catalogServiceList').innerHTML=html;
      $$('[data-edit-service]').forEach(el=>el.onclick=()=>openCatalogServiceSheet(catalogAll.find(s=>s.id===el.dataset.editService)));
    }
    $('#addCatalogServiceBtn').onclick=()=>openCatalogServiceSheet(null);

    let editingCatalogServiceId=null;
    function populateCategorySelect(existingCategoryId=null){
      const currentArchived=existingCategoryId?categories.find(c=>c.id===existingCategoryId&&!c.active):null;
      $('#csCategory').innerHTML='<option value="">No category</option>'+categories.filter(c=>c.active).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')+(currentArchived?`<option value="${currentArchived.id}">${esc(currentArchived.name)} (archived category)</option>`:'');
    }
    function updatePriceFieldVisibility(){
      const t=$('#csPriceType').value;
      $('#csPriceMinWrap').classList.toggle('hidden', t==='consultation');
      $('#csPriceMaxWrap').classList.toggle('hidden', t!=='range');
      $('#csPriceMinLabel').textContent = t==='starting_at'?'Starting price':t==='range'?'From':'Price';
    }
    $('#csPriceType').onchange=updatePriceFieldVisibility;
    function renderCatalogImageGrid(){
      const serviceId=editingCatalogServiceId;
      const imgs=serviceId?serviceImages.filter(i=>i.service_id===serviceId&&!i.archived_at).sort((a,b)=>a.sort_order-b.sort_order):[];
      $('#csImageGrid').innerHTML=imgs.map(img=>{
        const url=catalogImageUrl(img.storage_path);
        const focalBtns=[[0,0],[50,0],[100,0],[0,50],[50,50],[100,50],[0,100],[50,100],[100,100]]
          .map(([fx,fy])=>`<button type="button" class="ci-focal ${Number(img.focal_x)===fx&&Number(img.focal_y)===fy?'on':''}" data-img="${img.id}" data-fx="${fx}" data-fy="${fy}" title="Position"></button>`).join('');
        return `<div class="catalog-image-tile"><img src="${url}" alt="${esc(img.alt_text||'')}" style="object-position:${img.focal_x}% ${img.focal_y}%"><div class="ci-controls">
          <button type="button" class="ci-primary ${img.is_primary?'on':''}" data-img="${img.id}">${img.is_primary?'\u2605 Primary':'Make primary'}</button>
          <button type="button" class="ci-archive" data-img="${img.id}">Remove</button>
          </div><div class="focal-grid">${focalBtns}</div><input class="field ci-alt" data-img="${img.id}" placeholder="Alt text (for accessibility)" value="${esc(img.alt_text||'')}" style="margin:4px 5px 5px"></div>`;
      }).join('') || (serviceId?'<div class="empty">No pictures yet.</div>':'<div class="hint">Save this service first, then add pictures.</div>');
      $$('.ci-primary').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('service_images').update({is_primary:true}).eq('id',b.dataset.img).eq('studio_id',studio.id); if(error)toast(friendlyDbError(error)); else{await refreshImages(); renderCatalogImageGrid();}});
      $$('.ci-archive').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('service_images').update({archived_at:new Date().toISOString()}).eq('id',b.dataset.img).eq('studio_id',studio.id); if(error)toast(friendlyDbError(error)); else{await refreshImages(); renderCatalogImageGrid();}});
      $$('.ci-focal').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('service_images').update({focal_x:b.dataset.fx,focal_y:b.dataset.fy}).eq('id',b.dataset.img).eq('studio_id',studio.id); if(error)toast(friendlyDbError(error)); else{await refreshImages(); renderCatalogImageGrid();}});
      $$('.ci-alt').forEach(inp=>inp.onblur=async()=>{const {error}=await sb.from('service_images').update({alt_text:inp.value.trim()||null}).eq('id',inp.dataset.img).eq('studio_id',studio.id); if(error)toast(friendlyDbError(error));});
    }
    async function refreshImages(){ const imgs=await sb.from('service_images').select('*').eq('studio_id',studio.id).order('sort_order'); if(!imgs.error) serviceImages=imgs.data||[]; }

    // Client-side compression: resize to a max dimension via canvas, which
    // also strips EXIF metadata (canvas re-encoding never carries it
    // forward) — this is what makes the "display copy" AND the
    // higher-quality "original" both metadata-clean, without needing a
    // server-side image pipeline.
    async function resizeImage(file,maxDim,quality){
      const bitmap=await createImageBitmap(file);
      const scale=Math.min(1, maxDim/Math.max(bitmap.width,bitmap.height));
      const w=Math.max(1,Math.round(bitmap.width*scale)), h=Math.max(1,Math.round(bitmap.height*scale));
      const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d'); ctx.drawImage(bitmap,0,0,w,h);
      return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not process that image')), 'image/jpeg', quality));
    }
    $('#csImageInput').onchange=async e=>{
      const file=e.target.files[0]; e.target.value=''; if(!file) return;
      const status=$('#csUploadStatus');
      if(!editingCatalogServiceId){ toast('Save this service first, then add pictures.'); return; }
      if(file.size>15*1024*1024){ status.textContent='That photo is very large. Try a smaller one.'; return; }
      status.textContent='Checking photo\u2026';
      let bitmapOk=true; try{ await createImageBitmap(file); }catch{ bitmapOk=false; }
      if(!bitmapOk){ status.textContent="That file doesn't look like a real image. Try a JPG, PNG, or WEBP photo."; return; }
      try{
        status.textContent='Resizing\u2026';
        const [display,original]=await Promise.all([resizeImage(file,1600,0.82), resizeImage(file,2400,0.92)]);
        status.textContent='Uploading\u2026';
        const base=`${studio.id}/${editingCatalogServiceId}`;
        const displayPath=`${base}/${uid()}.jpg`, originalPath=`${base}/${uid()}-orig.jpg`;
        const up1=await sb.storage.from('chairkeeper-catalog').upload(displayPath,display,{contentType:'image/jpeg',upsert:false});
        if(up1.error) throw up1.error;
        const up2=await sb.storage.from('chairkeeper-catalog').upload(originalPath,original,{contentType:'image/jpeg',upsert:false});
        if(up2.error){await sb.storage.from('chairkeeper-catalog').remove([displayPath]).catch(()=>{});throw up2.error;}
        const existingCount=serviceImages.filter(i=>i.service_id===editingCatalogServiceId&&!i.archived_at).length;
        const ins=await sb.from('service_images').insert({studio_id:studio.id,service_id:editingCatalogServiceId,storage_path:displayPath,original_path:originalPath,is_primary:existingCount===0,sort_order:existingCount}).select().single();
        if(ins.error){await sb.storage.from('chairkeeper-catalog').remove([displayPath,originalPath]).catch(()=>{});throw ins.error;}
        await refreshImages(); renderCatalogImageGrid();
        status.textContent='Photo added.';
      }catch(err){ status.textContent=friendlyDbError(err) || 'Could not upload that photo. Please try again.'; }
    };

    function openCatalogServiceSheet(existing){
      editingCatalogServiceId=existing?existing.id:null;
      populateCategorySelect(existing?.category_id||null);
      $('#catalogServiceTitle').textContent=existing?(existing.active?'Edit service':'Archived service'):'New service';
      $('#catalogDraftNote').classList.toggle('hidden', !!existing && !existing.draft);
      $('#csName').value=existing?.name||'';
      $('#csCategory').value=existing?.category_id||'';
      $('#csDuration').value=existing?.duration_minutes||60;
      $('#csDescription').value=existing?.description||'';
      $('#csPriceType').value=existing?.price_type||'fixed';
      $('#csPrice').value=existing?existing.price:'';
      $('#csPriceMax').value=existing?.price_max||'';
      $('#csStatus').value=existing?.status||'visible';
      $('#csFeatured').checked=!!existing?.featured;
      $('#csSeasonal').checked=!!existing?.seasonal;
      $('#csArchiveBtn').classList.toggle('hidden', !existing);
      $('#csArchiveBtn').textContent=existing&&!existing.active?'Restore this service':'Archive this service';
      $('#csArchiveBtn').classList.toggle('primary',!!existing&&!existing.active);
      $('#csArchiveBtn').classList.toggle('danger',!existing||existing.active);
      $('#csUploadStatus').textContent='';
      updatePriceFieldVisibility();
      renderCatalogImageGrid();
      $('#catalogServiceSheet').classList.add('open');
    }
    $('#csArchiveBtn').onclick=async()=>{
      if(!editingCatalogServiceId) return;
      const current=catalogAll.find(s=>s.id===editingCatalogServiceId);
      const restoring=current&&!current.active;
      if(restoring){
        if(!confirm(`Restore "${current.name}"? ${current.draft?'It will return as a private draft until you publish it.':'It will return to the customer catalog immediately.'}`)) return;
        const {error}=await sb.from('services').update({active:true}).eq('id',editingCatalogServiceId).eq('studio_id',studio.id);
        if(error){toast(friendlyDbError(error));return;}
        close('catalogServiceSheet'); await reload(); renderCatalog(); toast(current.draft?'Service restored as a draft':'Service restored');
      }else{
        if(!confirm('Archive this service? It will disappear from the customer site and cannot be booked, but stays on any past appointments.')) return;
        const {error}=await sb.from('services').update({active:false}).eq('id',editingCatalogServiceId).eq('studio_id',studio.id);
        if(error){toast(friendlyDbError(error));return;}
        close('catalogServiceSheet'); await reload(); renderCatalog(); toast('Service archived');
      }
    };
    $('#catalogServiceForm').onsubmit=async e=>{
      e.preventDefault();
      const name=$('#csName').value.trim(); if(!name){toast('Give this service a name.');return;}
      const priceType=$('#csPriceType').value;
      const price=Number($('#csPrice').value||0);
      const priceMax=$('#csPriceMax').value===''?null:Number($('#csPriceMax').value);
      if(priceType==='range'&&(priceMax===null||priceMax<price)){toast('The "up to" price must be at or above the starting price.');return;}
      if(priceType!=='consultation'&&(!$('#csPrice').value.trim()||price<=0)){toast('Enter a price above $0, or choose "Consultation required" if there truly isn\'t one.');return;}
      const patch={
        name, category_id:$('#csCategory').value||null, duration_minutes:Math.max(15,Number($('#csDuration').value||60)),
        description:$('#csDescription').value.trim()||null, price_type:priceType, price, price_max:priceType==='range'?priceMax:null,
        status:$('#csStatus').value, featured:$('#csFeatured').checked, seasonal:$('#csSeasonal').checked,
      };
      const btn=$('#csSaveBtn'); btn.disabled=true;
      try{
        if(editingCatalogServiceId){
          const {error}=await sb.from('services').update(patch).eq('id',editingCatalogServiceId).eq('studio_id',studio.id);
          if(error)throw error;
          toast('Saved');
        } else {
          const maxSort=catalogAll.reduce((m,s)=>Math.max(m,s.sort_order||0),0);
          const {data,error}=await sb.from('services').insert({...patch,studio_id:studio.id,active:true,draft:true,sort_order:maxSort+1}).select().single();
          if(error)throw error;
          editingCatalogServiceId=data.id;
          toast('Saved as a draft — add pictures, then Publish when ready.');
          $('#catalogDraftNote').classList.remove('hidden');
          $('#csArchiveBtn').classList.remove('hidden');
          await reload(); renderCatalogImageGrid();
          btn.disabled=false;
          return; // stay open so she can add pictures right away
        }
        close('catalogServiceSheet'); await reload(); renderCatalog();
      }catch(err){ toast(friendlyDbError(err)); }
      finally{ btn.disabled=false; }
    };

    $('#publishCatalogBtn').onclick=async()=>{
      const drafts=catalogAll.filter(s=>s.draft&&s.active);
      if(!drafts.length){ toast('Nothing new to publish right now.'); return; }
      if(!confirm(`Publish ${drafts.length} new item${drafts.length>1?'s':''}?\n\n${drafts.map(s=>'\u2022 '+s.name).join('\n')}\n\nThese will become visible and bookable on the customer site.`)) return;
      const {data,error}=await sb.rpc('publish_catalog',{p_studio_id:studio.id});
      if(error){toast(friendlyDbError(error));return;}
      toast(`Published ${data.published} item${data.published===1?'':'s'}.`); await reload(); renderCatalog();
    };
    $('#undoPublishBtn').onclick=async()=>{
      if(!confirm('Undo the most recent publish? Anything made live in that batch goes back to a private draft (nothing is deleted).')) return;
      const {data,error}=await sb.rpc('restore_last_published_catalog',{p_studio_id:studio.id});
      if(error){ toast(error.message&&error.message.includes('No published batch')?'Nothing to undo yet.':friendlyDbError(error)); return; }
      toast(`Un-published ${data.unpublished} item${data.unpublished===1?'':'s'}.`); await reload(); renderCatalog();
    };
    $('#previewCatalogBtn').onclick=()=>{
      const catMap=new Map(categories.map(c=>[c.id,c.name]));
      const visible=catalogAll.filter(s=>s.active);
      $('#catalogPreviewBody').innerHTML=visible.map(s=>{
        const img=primaryImageFor(s.id), url=img?catalogImageUrl(img.storage_path):'';
        return `<div class="catalog-preview-card">${url?`<img src="${url}" alt="${esc(img.alt_text||'')}" style="object-position:${img.focal_x}% ${img.focal_y}%">`:''}<div class="row between"><b>${esc(s.name)}</b><span>${esc(formatServicePrice(s))}</span></div>${s.category_id&&catMap.has(s.category_id)?`<div class="hint">${esc(catMap.get(s.category_id))}</div>`:''}${s.description?`<p>${esc(s.description)}</p>`:''}<div class="catalog-badges">${serviceBadges(s)}</div></div>`;
      }).join('') || '<div class="empty">Nothing to preview yet.</div>';
      $('#catalogPreviewSheet').classList.add('open');
    };

    $('#copyBookingLink').onclick=async()=>{const u=new URL('./',location.href).href;try{await navigator.clipboard.writeText(u);toast('Booking link copied')}catch{prompt('Copy this booking link',u)}};
    await render(); setInterval(()=>{if(document.visibilityState==='visible')reload().catch(console.error)},30000);
  }

  const page=document.body.dataset.page; if(page==='public')publicPage(); if(page==='owner')ownerPage(); if('serviceWorker'in navigator && location.hostname!=='html-preview.github.io')navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
