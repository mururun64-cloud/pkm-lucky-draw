const A={token:localStorage.getItem('ldToken')||'',current:null,data:null,events:[]};
const app=document.getElementById('app');
const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function api(url,opt={}){opt.headers={...(opt.headers||{}),...(A.token?{Authorization:'Bearer '+A.token}:{})};const r=await fetch(url,opt);let j={};try{j=await r.json()}catch{}if(!r.ok){const e=new Error(j.error||'Request failed');e.data=j;throw e}return j}
async function downloadFile(url, fallbackName='download'){
  try{
    const r=await fetch(url,{headers:{...(A.token?{Authorization:'Bearer '+A.token}:{})}});
    if(!r.ok){
      let msg='Download failed';
      try{const j=await r.json();msg=j.error||msg}catch{}
      if(r.status===401){A.token='';localStorage.removeItem('ldToken');renderLogin();}
      throw new Error(msg);
    }
    const blob=await r.blob();
    let name=fallbackName;
    const cd=r.headers.get('Content-Disposition')||'';
    const m=cd.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^;\"]+)/i);
    if(m) name=decodeURIComponent(m[1]||m[2]).trim();
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
  }catch(e){toast(e.message,'error')}
}
function toast(t,type='info'){const x=document.createElement('div');x.className='toast '+type;x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),3500)}
function logo(){return '<img src="/pkm-logo.png" class="brand-logo" alt="PKM DUN Sentosa N48">'}
function renderLogin(){app.innerHTML=`<div class="login-shell"><div class="login-card"><div class="login-logo-only">${logo()}</div><div class="login-heading"><small>PUSAT KHIDMAT MASYARAKAT</small><h2> DUN SENTOSA N48 </h2><h1>LUCKY DRAW SYSTEM</h1><span>Bersama Rakyat • Untuk Sentosa</span></div><div class="login-divider"></div><form id="lf" class="form"><label>Username<input name="username" value="admin" required></label><label>Password<input name="password" type="password" value="admin123" required></label><button class="btn primary" type="submit">LOGIN →</button></form><div class="offline-line"><i></i> LOCAL SQLITE DATABASE • OFFLINE</div></div></div>`;document.getElementById('lf').onsubmit=async e=>{e.preventDefault();try{const j=await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});A.token=j.token;localStorage.setItem('ldToken',A.token);render()}catch(x){toast(x.message,'error')}}}
async function render(){if(!A.token)return renderLogin();try{A.events=await api('/api/events');app.innerHTML=layout('dashboard');dashboard()}catch(e){A.token='';localStorage.removeItem('ldToken');renderLogin()}}
const labels={dashboard:'Dashboard',events:'Event Management',prizes:'Prize Management',register:'Participant Registration',qr:'QR Registration',participants:'Participant List',draw:'Lucky Draw',winners:'Winner History',reports:'Reports & Export',settings:'Settings',tools:'Backup & Reset'};
function layout(active){return `<div class="shell"><aside class="sidebar"><div class="side-brand">${logo()}<div><b>PKM DUN SENTOSA</b><small>N48 • LUCKY DRAW</small></div></div><div class="side-offline"><i></i> OFFLINE MODE</div><nav>${Object.keys(labels).map((k,i)=>`<button class="nav ${active===k?'active':''}" onclick="go('${k}')"><span>${['⌂','▣','🎁','♙','⌗','♟','★','🏆','▤','⚙','↻'][i]}</span>${labels[k]}</button>`).join('')}</nav><div class="side-footer"><b>YB. DR. GUNARAJ.G</b><span>Pusat Khidmat Masyarakat<br>DUN Sentosa</span></div></aside><section class="main"><header class="topbar"><div class="crumb"><span>LUCKY DRAW SYSTEM</span><b>${labels[active]}</b></div><div class="top-actions"><span class="offline-pill">● OFFLINE</span><button class="top-btn" onclick="systemInfo()">Network</button><button class="top-btn gold" onclick="newEvent()">＋ New Event</button><button class="avatar" onclick="logout()">A</button></div></header><div id="page" class="page"></div></section></div>`}
function go(x){if(!A.token)return renderLogin();if(x==='dashboard'){app.innerHTML=layout(x);dashboard();return}if(['events','reports','settings','tools'].includes(x)){app.innerHTML=layout(x);modulePage(x);return}if(!A.current){const e=A.events[0];if(!e){app.innerHTML=layout('events');modulePage('events');return}openEvent(e.id,x)}else openEvent(A.current,x)}
function dashboard(){
  const p=document.getElementById('page');
  const e=A.events[0];
  const logoLarge=()=>'<img src="/pkm-logo.png" class="dashboard-logo" alt="PKM DUN Sentosa N48">';
  if(!e){
    p.innerHTML=`
      <div class="pkm-hero">
        <div class="pkm-hero-logo">${logoLarge()}</div>
        <div class="pkm-hero-copy">
          <div class="eyebrow">PUSAT KHIDMAT MASYARAKAT</div>
          <h1>DUN SENTOSA</h1>
          <div class="hero-line"></div>
          <h2>LUCKY DRAW SYSTEM</h2>
          <p>Bersama Rakyat&nbsp;&nbsp;•&nbsp;&nbsp;Untuk Sentosa</p>
        </div>
        <div class="hero-slogan">Bersama Rakyat<br><em>Untuk Sentosa</em></div>
      </div>
      <div class="empty-dashboard-card">
        <div class="empty-icon">▦</div>
        <h2>No events found</h2>
        <p>Create your first event to get started.</p>
        <button class="btn primary" onclick="newEvent()">＋ CREATE FIRST EVENT</button>
      </div>`;
    return;
  }

  api('/api/events/'+e.id+'/data').then(d=>{
    A.current=e.id; A.data=d;
    const totalPrizes=d.prizes.reduce((n,x)=>n+x.quantity,0);
    const recent=A.events.slice(0,6);
    const eventRows=recent.map((x,i)=>`
      <tr>
        <td>${i+1}</td>
        <td><b>${esc(x.title)}</b></td>
        <td>${esc(x.date||'—')}</td>
        <td><span class="table-status ${x.status==='OPEN'?'open':'closed'}">${esc(x.status)}</span></td>
        <td>${x.id===e.id?d.participants.length:'—'}</td>
        <td><button class="table-link" onclick="openEvent('${x.id}','register')">View →</button></td>
      </tr>`).join('');

    p.innerHTML=`
      <div class="pkm-hero">
        <div class="pkm-hero-logo">${logoLarge()}</div>
        <div class="pkm-hero-copy">
          <div class="eyebrow">PUSAT KHIDMAT MASYARAKAT</div>
          <h1>DUN SENTOSA</h1>
          <div class="hero-line"></div>
          <h2>LUCKY DRAW SYSTEM</h2>
          <p>B e r s a m a&nbsp;&nbsp;R a k y a t&nbsp;&nbsp; • &nbsp;&nbsp;U n t u k&nbsp;&nbsp;S e n t o s a</p>
        </div>
        <div class="hero-slogan">Bersama Rakyat<br><em>Untuk Sentosa</em></div>
      </div>

      <div class="dashboard-stats">
        <div class="dashboard-stat red"><div class="stat-icon">▣</div><div><span>Total Events</span><b>${A.events.length}</b><button onclick="go('events')">View Events&nbsp; →</button></div></div>
        <div class="dashboard-stat blue"><div class="stat-icon">♟</div><div><span>Total Participants</span><b>${d.participants.length}</b><button onclick="openEvent('${e.id}','participants')">View Participants&nbsp; →</button></div></div>
        <div class="dashboard-stat gold"><div class="stat-icon">🎁</div><div><span>Total Prizes</span><b>${totalPrizes}</b><button onclick="openEvent('${e.id}','prizes')">View Prizes&nbsp; →</button></div></div>
        <div class="dashboard-stat green"><div class="stat-icon">🏆</div><div><span>Total Winners</span><b>${d.draws.length}</b><button onclick="openEvent('${e.id}','winners')">View Winners&nbsp; →</button></div></div>
      </div>

      <div class="dashboard-lower">
        <section class="recent-events-card">
          <div class="section-title"><h2><span>▥</span> Recent Events</h2><button onclick="go('events')">View All</button></div>
          <div class="table-wrap">
            <table class="dashboard-table">
              <thead><tr><th>No.</th><th>Event Name</th><th>Event Date</th><th>Status</th><th>Total Participants</th><th>Action</th></tr></thead>
              <tbody>${eventRows || `<tr><td colspan="6" class="no-events"><div class="empty-icon">▦</div><b>No events found</b><span>Create your first event to get started.</span><button class="btn primary" onclick="newEvent()">＋ Create First Event</button></td></tr>`}</tbody>
            </table>
          </div>
        </section>

        <aside class="system-info-card">
          <div class="section-title"><h2><span>●</span> System Information</h2></div>
          <div class="system-row"><span>◉ &nbsp; Mode</span><b class="offline-tag">Offline Mode</b></div>
          <div class="system-row"><span>▤ &nbsp; Database</span><b>Local (SQLite)</b></div>
          <div class="system-row"><span>◆ &nbsp; Version</span><b>v2.5.0</b></div>
          <div class="system-row"><span>◷ &nbsp; Last Backup</span><b>Not available</b></div>
          <div class="system-row"><span>♟ &nbsp; Current User</span><b>Admin</b></div>
          <div class="system-row"><span>◷ &nbsp; Login Time</span><b>${new Date().toLocaleString('en-MY',{dateStyle:'medium',timeStyle:'short'})}</b></div>
        </aside>
      </div>
      <footer class="dashboard-footer"><span>© ${new Date().getFullYear()} Pusat Khidmat Masyarakat DUN Sentosa. All rights reserved.</span><span>B e r s a m a&nbsp;&nbsp;R a k y a t&nbsp;&nbsp; • &nbsp;&nbsp;U n t u k&nbsp;&nbsp;S e n t o s a</span></footer>`;
  }).catch(()=>toast('Unable to load event','error'))
}
function stat(icon,v,l,c){return `<div class="stat ${c}"><span>${icon}</span><div><b>${v}</b><small>${l}</small></div></div>`}function quick(icon,title,text,fn){return `<button class="quick" onclick="${fn}"><span>${icon}</span><b>${title}</b><small>${text}</small></button>`}
function modulePage(x){const p=document.getElementById('page');if(x==='events')p.innerHTML=`<div class="page-head"><div><div class="eyebrow">EVENT MANAGEMENT</div><h1>Events</h1><p>Create and manage multiple events in the local database.</p></div><div class="row"><button class="btn secondary" onclick="printCurrentList('events')">PRINT EVENTS</button><button class="btn gold" onclick="newEvent()">＋ CREATE EVENT</button></div></div><div class="event-grid">${A.events.map(eventCard).join('')||'<div class="empty-card">No events yet. Create your first event.</div>'}</div>`;if(x==='reports')p.innerHTML=`<div class="page-head"><div><div class="eyebrow">REPORTS & EXPORT</div><h1>Reports & Export</h1><p>Download professional Excel reports directly from the offline database.</p></div><div class="row"><button class="btn gold" onclick="downloadFile('/api/reports/events/excel','all-events-report.xlsx')">DOWNLOAD ALL EVENTS EXCEL</button><button class="btn secondary" onclick="printCurrentList('events')">PRINT EVENTS</button></div></div><div class="report-grid">${A.events.map(e=>`<div class="side-card"><h3>${esc(e.title)}</h3><p>${esc(e.date||'')} • ${esc(e.venue||'')}</p><div class="row"><button class="btn gold" onclick="downloadFile('/api/events/${e.id}/report/excel','full-event-report-${e.id}.xlsx')">FULL EVENT EXCEL</button><button class="btn secondary" onclick="printEventReport('${e.id}')">PRINT FULL REPORT</button><button class="btn secondary" onclick="downloadFile('/api/events/${e.id}/participants/excel','participants-${e.id}.xlsx')">PARTICIPANTS EXCEL</button><button class="btn secondary" onclick="downloadFile('/api/events/${e.id}/prizes/excel','prizes-${e.id}.xlsx')">PRIZES EXCEL</button><button class="btn secondary" onclick="downloadFile('/api/events/${e.id}/winners/excel','winners-${e.id}.xlsx')">WINNERS EXCEL</button><button class="btn secondary" onclick="downloadFile('/api/events/${e.id}/backup','lucky-draw-${e.id}.json')">EVENT BACKUP</button></div></div>`).join('')||'<div class="empty-card">No events available.</div>'}</div>`;if(x==='settings')p.innerHTML=`<div class="page-head"><div><div class="eyebrow">SYSTEM SETTINGS</div><h1>Settings</h1><p>Branding and offline operating rules.</p></div></div><div class="settings-grid"><div class="panel"><h3>Organisation Branding</h3><div class="setting-brand">${logo()}<div><b>PKM DUN SENTOSA N48</b><span>Pusat Khidmat Masyarakat<br>YB. DR. GUNARAJ.G</span></div></div></div><div class="panel"><h3>Registration Rules</h3><ul><li>Name duplicate checking: <b>ON</b></li><li>NRIC duplicate checking: <b>ON</b></li><li>Contact duplicate checking: <b>ON</b></li><li>Winner cannot win twice: <b>ON</b></li><li>External Internet services: <b>OFF</b></li></ul></div><div class="panel"><h3>System</h3><p>Database: SQLite Local</p><p>Operation: 100% Offline</p><p>QR: Local LAN</p></div></div>`;if(x==='tools')p.innerHTML=`<div class="page-head"><div><div class="eyebrow">DATA SAFETY</div><h1>Backup & Reset</h1><p>Protect your event data before starting another event.</p></div></div><div class="settings-grid"><div class="panel"><h3>Database Backup</h3><p>Create a complete SQLite backup.</p><button class="btn" onclick="backupDb()">BACKUP DATABASE</button></div><div class="panel"><h3>Event Reset</h3><select id="toolEvent" class="select">${A.events.map(e=>`<option value="${e.id}">${esc(e.title)}</option>`).join('')}</select><p>Export and permanently remove the selected event.</p><button class="btn danger" onclick="resetSelected()">EXPORT & RESET EVENT</button></div></div>`}
function eventCard(e){return `<div class="event-card"><div class="event-cover">${e.background&&e.backgroundType!=='application/pdf'?`<img src="${e.background}">`:''}<div class="event-cover-overlay"></div><div class="event-logo-wrap">${e.logo?`<img src="${e.logo}">`:logo()}</div><span class="status-badge ${e.status==='OPEN'?'open':'closed'}">● ${e.status}</span></div><div class="event-body"><div class="eyebrow">EVENT</div><h2>${esc(e.title)}</h2><p>▣ ${esc(e.date||'No date')}<br>⌖ ${esc(e.venue||'No venue')}</p><div class="event-actions"><button class="btn" onclick="openEvent('${e.id}','register')">OPEN</button><button class="btn gold" onclick="drawScreen('${e.id}')"> LIVE DRAW</button><button class="btn secondary" onclick="editEvent('${e.id}')">EDIT EVENT</button><button class="btn secondary" onclick="openEvent('${e.id}','qr')">⌗ QR</button></div></div></div>`}
function logout(){localStorage.removeItem('ldToken');A.token='';A.current=null;render()}
function modal(html,wide=false){document.getElementById('modal')?.remove();const m=document.createElement('div');m.className='modal';m.id='modal';m.innerHTML=`<div class="modal-card ${wide?'wide':''}">${html}</div>`;document.body.appendChild(m)}function closeModal(){document.getElementById('modal')?.remove()}
function newEvent(){modal(`<div class="modal-head"><div><div class="eyebrow">EVENT SETUP</div><h2>Create New Event</h2></div><button class="icon-btn" onclick="closeModal()">×</button></div><form id="ef" class="form"><label>Event Title *<input name="title" required></label><div class="two"><label>Event Date<input name="date" type="date"></label><label>Total Lucky Draws<input name="totalDraws" type="number" min="1"></label></div><div class="two"><label>Venue<input name="venue"></label><label>Organizer<input name="organizer"></label></div><label>Background JPEG / PNG / PDF<input name="background" type="file" accept="image/jpeg,image/png,application/pdf"></label><label>Event Logo<input name="logo" type="file" accept="image/*"></label><div class="form-note">PKM DUN Sentosa N48 branding is included in the application.</div><button class="btn gold" type="submit">CREATE EVENT</button></form>`);document.getElementById('ef').onsubmit=async e=>{e.preventDefault();try{const n=await api('/api/events',{method:'POST',body:new FormData(e.target)});closeModal();A.events=await api('/api/events');openEvent(n.id,'register');toast('Event created','success')}catch(x){toast(x.message,'error')}}}
function editEvent(id){
  const e=A.events.find(x=>x.id===id); if(!e)return;
  modal(`<div class="modal-head"><div><div class="eyebrow">EVENT MANAGEMENT</div><h2>Edit Event</h2><p class="muted">Event details remain editable while the event is open.</p></div><button class="icon-btn" onclick="closeModal()">×</button></div><form id="eef" class="form">
  <label>Event Title *<input name="title" required value="${esc(e.title)}"></label>
  <div class="two"><label>Event Date<input name="date" type="date" value="${esc(e.date||'')}"></label><label>Total Lucky Draws<input name="totalDraws" type="number" min="1" value="${Number(e.totalDraws||0)}"></label></div>
  <div class="two"><label>Venue<input name="venue" value="${esc(e.venue||'')}"></label><label>Organizer<input name="organizer" value="${esc(e.organizer||'')}"></label></div><label>Event Status<select name="status"><option value="OPEN" ${e.status==='OPEN'?'selected':''}>OPEN</option><option value="CLOSED" ${e.status==='CLOSED'?'selected':''}>CLOSED</option></select></label>
  <label>Replace Background JPEG / PNG / PDF<input name="background" type="file" accept="image/jpeg,image/png,application/pdf"></label>
  <label>Replace Event Logo<input name="logo" type="file" accept="image/*"></label>
  <div class="form-note">Existing background/logo stay unchanged when no replacement file is selected.</div>
  <button class="btn gold" type="submit">SAVE EVENT CHANGES</button></form>`);
  document.getElementById('eef').onsubmit=async ev=>{ev.preventDefault();try{await api('/api/events/'+id,{method:'PUT',body:new FormData(ev.target)});A.events=await api('/api/events');closeModal();if(A.current===id)A.data=await api('/api/events/'+id+'/data');modulePage('events');toast('Event updated successfully','success')}catch(x){toast(x.message,'error')}};
}
async function openEvent(id,t='register'){A.current=id;A.data=await api('/api/events/'+id+'/data');app.innerHTML=layout(t);renderEvent(t)}
function renderEvent(active){const p=document.getElementById('page'),d=A.data,total=d.prizes.reduce((n,x)=>n+x.quantity,0);p.innerHTML=`<div class="event-header"><div><div class="eyebrow">CURRENT EVENT</div><h1>${esc(d.event.title)}</h1><p>${esc(d.event.date||'')} ${d.event.venue?'• '+esc(d.event.venue):''}</p></div><div class="header-buttons"><button class="btn gold" onclick="drawScreen('${d.event.id}')"> START LIVE DRAW</button><button class="btn secondary" onclick="editEvent('${d.event.id}')">EDIT EVENT</button><button class="btn secondary" onclick="render()">← Events</button></div></div><div class="mini-stats"><div><b>${d.participants.length}</b><span>Participants</span></div><div><b>${total}</b><span>Prize Units</span></div><div><b>${d.draws.length}</b><span>Winners</span></div><div><b>${d.participants.filter(x=>x.status==='ELIGIBLE').length}</b><span>Eligible</span></div></div><div class="tabs">${['register','prizes','participants','winners','qr','tools'].map(x=>`<button class="tab ${active===x?'active':''}" onclick="eventTab('${x}')">${({register:'♙ Register',prizes:'🎁 Prizes',participants:'♟ Participants',winners:'🏆 Winners',qr:'⌗ QR Registration',tools:'⚙ Event Tools'})[x]}</button>`).join('')}</div><div id="event-panel"></div>`;eventTab(active)}
function eventTab(x){
  const p=document.getElementById('event-panel');
  if(x==='register'){
    p.innerHTML=`<div class="content-grid"><div class="panel"><div class="panel-head"><div><div class="eyebrow">STAFF REGISTRATION</div><h2>Register Participant</h2><p>Duplicate checking is automatic for Name, NRIC and Contact.</p></div><span class="pill green">100% OFFLINE</span></div><form id="rf" class="form"><label>Full Name as per NRIC *<input name="fullName" autocomplete="off" required></label><div class="two"><label>NRIC Number *<input name="nric" autocomplete="off" required></label><label>Contact Number *<input name="contact" autocomplete="off" required></label></div><button class="btn success" type="submit">✓ REGISTER PARTICIPANT</button></form><div id="regResult"></div></div><div class="panel rule-card"><h3>Duplicate Protection</h3><div class="rule"><b>NAME</b><span>Same name is rejected</span></div><div class="rule"><b>NRIC</b><span>Same NRIC is rejected</span></div><div class="rule"><b>PHONE</b><span>Same contact is rejected</span></div><div class="rule"><b>WINNER</b><span>Winner cannot win again</span></div></div></div>`;
    document.getElementById('rf').onsubmit=staffRegister;
    return;
  }
  if(x==='prizes'){
    const prizes=[...A.data.prizes].sort((a,b)=>a.drawOrder-b.drawOrder || String(a.level).localeCompare(String(b.level)));
    p.innerHTML=`<div class="panel"><div class="panel-head"><div><div class="eyebrow">PRIZE MANAGEMENT</div><h2>Prizes</h2><p>Edit prize information anytime. Admin controls the Draw Order. No fixed or consecutive prize sequence is required; live draw always uses the largest Draw Order remaining, then the next lower number.</p></div><div class="row"><button class="btn secondary" onclick="downloadFile('/api/events/${A.current}/prizes/excel','prizes-${A.current}.xlsx')">DOWNLOAD EXCEL</button><button class="btn secondary" onclick="printCurrentList('prizes')">PRINT</button><button class="btn gold" onclick="newPrize()">＋ ADD PRIZE</button></div></div><div class="prize-grid">${prizes.map(pr=>`<div class="prize-card">${pr.image?`<img src="${pr.image}">`:'<div class="prize-placeholder">🎁</div>'}<div class="prize-info"><span class="eyebrow">${esc(pr.level)}</span><h3>${esc(pr.name)}</h3><p>${esc(pr.description||'No description')}</p><div class="prize-meta"><b>Qty ${pr.quantity}</b><span>Draw ${pr.drawOrder}</span></div><div class="row"><button class="btn small" onclick="editPrize('${pr.id}')">EDIT</button><button class="btn danger small" onclick="delPrize('${pr.id}')">DELETE</button></div></div></div>`).join('')||'<div class="empty-card">No prizes added yet.</div>'}</div></div>`;
    return;
  }
  if(x==='participants'){
    p.innerHTML=`<div class="panel"><div class="panel-head"><div><div class="eyebrow">REGISTRATION DATABASE</div><h2>Participants</h2><p>${A.data.participants.length} registered. Full NRIC is for authorised staff only.</p></div><div class="row"><button class="btn secondary" onclick="downloadFile('/api/events/${A.current}/participants/excel','participants-${A.current}.xlsx')">DOWNLOAD EXCEL</button><button class="btn secondary" onclick="printCurrentList('participants')">PRINT</button><button class="btn" onclick="eventTab('participants')">REFRESH</button></div></div><div class="table-wrap"><table class="table"><thead><tr><th>REG NO</th><th>FULL NAME</th><th>NRIC</th><th>CONTACT</th><th>STATUS</th><th></th></tr></thead><tbody>${A.data.participants.map(q=>`<tr><td><b>${q.registrationNo}</b></td><td>${esc(q.fullName)}</td><td>${esc(q.nric)}</td><td>${esc(q.contact)}</td><td><span class="status-text ${q.status==='WINNER'?'winner':'open'}">● ${q.status}</span></td><td>${q.status==='ELIGIBLE'?`<button class="btn danger small" onclick="deleteParticipant('${q.id}')">DELETE</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">No participants.</td></tr>'}</tbody></table></div></div>`;
    return;
  }
  if(x==='winners'){
    p.innerHTML=`<div class="panel"><div class="panel-head"><div><div class="eyebrow">DRAW RESULTS</div><h2>Winner History</h2></div><div class="row"><button class="btn secondary" onclick="downloadFile('/api/events/${A.current}/winners/excel','winners-${A.current}.xlsx')">DOWNLOAD EXCEL</button><button class="btn secondary" onclick="printCurrentList('winners')">PRINT</button></div></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>PRIZE</th><th>WINNER</th><th>NRIC</th><th>TIME</th></tr></thead><tbody>${A.data.draws.map(d=>{const pr=A.data.prizes.find(z=>z.id===d.prize_id),pa=A.data.participants.find(z=>z.id===d.participant_id);return `<tr><td>${d.sequence}</td><td><b>${esc(pr?.level)}</b><br>${esc(pr?.name)}</td><td>${esc(pa?.fullName)}</td><td>XXXX${esc(pa?.nric?.slice(-4))}</td><td>${new Date(d.drawn_at).toLocaleString()}</td></tr>`}).join('')||'<tr><td colspan="5" class="muted">No winners yet.</td></tr>'}</tbody></table></div></div>`;
    return;
  }
  if(x==='qr'){qrPanel(p);return;}
  if(x==='tools'){toolsPanel(p);return;}
}

async function staffRegister(e){e.preventDefault();try{const j=await api('/api/events/'+A.current+'/participants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});document.getElementById('regResult').innerHTML=`<div class="alert success">✓ ${esc(j.message)}<br><strong>Registration No: ${esc(j.participant.registrationNo)}</strong></div>`;e.target.reset();A.data=await api('/api/events/'+A.current+'/data')}catch(x){const d=x.data?.duplicate;document.getElementById('regResult').innerHTML=`<div class="alert error">⚠ ${esc(x.message)}${d?`<br><small>Matched: <b>${esc(d.reasons.join(', '))}</b> • Existing: <b>${esc(d.registrationNo)}</b></small>`:''}</div>`}}
function printCurrentList(type){
  const d=A.data;
  let title='',head='',rows='';
  if(type==='events'){
    title='Event Management';
    head='<th>Event</th><th>Date</th><th>Venue</th><th>Organizer</th><th>Status</th>';
    rows=A.events.map(e=>`<tr><td>${esc(e.title)}</td><td>${esc(e.date||'')}</td><td>${esc(e.venue||'')}</td><td>${esc(e.organizer||'')}</td><td>${esc(e.status||'')}</td></tr>`).join('');
  } else {
    if(!d)return;
    title=type==='prizes'?'Prize Management':type==='participants'?'Participant List':'Winner History';
    rows=type==='prizes'?d.prizes.map(p=>`<tr><td>${esc(p.level)}</td><td>${esc(p.name)}</td><td>${esc(p.description||'')}</td><td>${p.quantity}</td><td>${p.drawOrder}</td></tr>`).join(''):type==='participants'?d.participants.map(p=>`<tr><td>${esc(p.registrationNo)}</td><td>${esc(p.fullName)}</td><td>${esc(p.nric)}</td><td>${esc(p.contact)}</td><td>${esc(p.status)}</td></tr>`).join(''):d.draws.map(x=>{const pr=d.prizes.find(z=>z.id===x.prize_id),pa=d.participants.find(z=>z.id===x.participant_id);return `<tr><td>${x.sequence}</td><td>${esc(pr?.level||'')}</td><td>${esc(pr?.name||'')}</td><td>${esc(pa?.fullName||'')}</td><td>XXXX${esc(pa?.nric?.slice(-4)||'')}</td><td>${new Date(x.drawn_at).toLocaleString()}</td></tr>`}).join('');
    head=type==='prizes'?'<th>Prize Level</th><th>Prize Name</th><th>Description</th><th>Qty</th><th>Draw Order</th>':type==='participants'?'<th>Reg No</th><th>Full Name</th><th>NRIC</th><th>Contact</th><th>Status</th>':'<th>#</th><th>Prize Level</th><th>Prize Name</th><th>Winner</th><th>NRIC</th><th>Drawn At</th>';
  }
  const w=window.open('','_blank','width=1200,height=800');
  if(!w){toast('Please allow pop-ups to print.','error');return;}
  w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{margin:0 0 6px}p{color:#555}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #bbb;padding:8px;text-align:left;font-size:12px}th{background:#eee}@media print{body{padding:0}}</style></head><body><h1>${esc(title)}</h1><p>${esc(d?.event?.title||'PKM DUN SENTOSA Lucky Draw')}</p><table><thead><tr>${head}</tr></thead><tbody>${rows||'<tr><td colspan="6">No data</td></tr>'}</tbody></table><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\\/script></body></html>`);
  w.document.close();
}
async function printEventReport(id){
  try{
    const d=await api('/api/events/'+id+'/data');
    const rows=[
      `<tr><th>Event Title</th><td>${esc(d.event.title)}</td></tr>`,
      `<tr><th>Date</th><td>${esc(d.event.date||'')}</td></tr>`,
      `<tr><th>Venue</th><td>${esc(d.event.venue||'')}</td></tr>`,
      `<tr><th>Organizer</th><td>${esc(d.event.organizer||'')}</td></tr>`,
      `<tr><th>Status</th><td>${esc(d.event.status||'')}</td></tr>`,
      `<tr><th>Participants</th><td>${d.participants.length}</td></tr>`,
      `<tr><th>Prize Units</th><td>${d.prizes.reduce((n,p)=>n+p.quantity,0)}</td></tr>`,
      `<tr><th>Winners</th><td>${d.draws.length}</td></tr>`
    ].join('');
    const w=window.open('','_blank','width=1200,height=900'); if(!w){toast('Please allow pop-ups to print.','error');return;}
    w.document.write(`<!doctype html><html><head><title>Full Event Report</title><style>body{font-family:Arial;padding:28px;color:#111}h1{margin-bottom:4px}h2{margin-top:28px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #bbb;padding:8px;text-align:left;font-size:12px}th{background:#eee}.winner{page-break-inside:avoid}</style></head><body><h1>PKM DUN SENTOSA Lucky Draw</h1><h2>Event Summary</h2><table>${rows}</table><h2>Prize List</h2><table><thead><tr><th>Prize</th><th>Name</th><th>Qty</th><th>Draw Order</th></tr></thead><tbody>${d.prizes.map(p=>`<tr><td>${esc(p.level)}</td><td>${esc(p.name)}</td><td>${p.quantity}</td><td>${p.drawOrder}</td></tr>`).join('')}</tbody></table><h2>Winner List</h2><table><thead><tr><th>#</th><th>Prize</th><th>Winner</th><th>NRIC</th><th>Drawn At</th></tr></thead><tbody>${d.draws.map(x=>{const pr=d.prizes.find(z=>z.id===x.prize_id),pa=d.participants.find(z=>z.id===x.participant_id);return `<tr class="winner"><td>${x.sequence}</td><td>${esc(pr?.level||'')} - ${esc(pr?.name||'')}</td><td>${esc(pa?.fullName||'')}</td><td>XXXX${esc(pa?.nric?.slice(-4)||'')}</td><td>${new Date(x.drawn_at).toLocaleString()}</td></tr>`}).join('')}</tbody></table><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\\/script></body></html>`);w.document.close();
  }catch(e){toast(e.message,'error')}
}

function prizeForm(pr,title,id){return `<div class="modal-head"><div><div class="eyebrow">PRIZE MANAGEMENT</div><h2>${title}</h2></div><button class="icon-btn" onclick="closeModal()">×</button></div><form id="pf" class="form"><label>Prize Level *<input name="level" value="${esc(pr?.level||'')}" placeholder="1st Prize" required></label><label>Prize Name *<input name="name" value="${esc(pr?.name||'')}" required></label><label>Description<textarea name="description">${esc(pr?.description||'')}</textarea></label><div class="two"><label>Quantity *<input name="quantity" type="number" min="1" value="${pr?.quantity||1}" required></label><label>Draw Order *<input name="drawOrder" type="number" min="1" value="${pr?.drawOrder||1}" required></label></div><label>Prize Picture<input name="image" type="file" accept="image/*"></label><small class="muted">Draw Order is fully controlled by the admin. Numbers do not need to be consecutive. During Live Draw, the largest remaining Draw Order is given first, then the next lower number.</small><button class="btn gold" type="submit">${id?'UPDATE PRIZE':'SAVE PRIZE'}</button></form>`}
function newPrize(){modal(prizeForm(null,'Add Prize',''));document.getElementById('pf').onsubmit=async e=>{e.preventDefault();try{await api('/api/events/'+A.current+'/prizes',{method:'POST',body:new FormData(e.target)});closeModal();A.data=await api('/api/events/'+A.current+'/data');eventTab('prizes');toast('Prize added','success')}catch(x){toast(x.message,'error')}}}
function editPrize(id){const pr=A.data.prizes.find(x=>x.id===id);if(!pr)return;modal(prizeForm(pr,'Edit Prize',id));document.getElementById('pf').onsubmit=async e=>{e.preventDefault();try{await api('/api/prizes/'+id,{method:'PUT',body:new FormData(e.target)});closeModal();A.data=await api('/api/events/'+A.current+'/data');eventTab('prizes');toast('Prize updated','success')}catch(x){toast(x.message,'error')}}}
async function delPrize(id){if(!confirm('Delete this prize?'))return;try{await api('/api/prizes/'+id,{method:'DELETE'});A.data=await api('/api/events/'+A.current+'/data');eventTab('prizes')}catch(x){toast(x.message,'error')}}
async function deleteParticipant(id){if(!confirm('Delete this participant?'))return;try{await api('/api/participants/'+id,{method:'DELETE'});A.data=await api('/api/events/'+A.current+'/data');eventTab('participants')}catch(x){toast(x.message,'error')}}
function qrPanel(p){p.innerHTML=`<div class="content-grid"><div class="panel qr-panel"><div class="eyebrow">MOBILE REGISTRATION</div><h2>Offline QR Registration</h2><p>Phones connect to the same local Wi-Fi/LAN. Internet is not required.</p><div id="qrc" class="qr-center"><div class="spinner">Generating QR…</div></div></div><div class="panel"><h3>Registration Flow</h3><ol class="steps"><li>Connect phone and event computer to the same Wi-Fi.</li><li>Display or print this event QR.</li><li>Participant enters Full Name, NRIC and Contact.</li><li>Data is saved directly to local SQLite.</li></ol><div class="alert info">The QR uses the computer's local LAN address, not the Internet.</div></div></div>`;api('/api/events/'+A.current+'/qr').then(j=>document.getElementById('qrc').innerHTML=`<img class="qr-image" src="${j.dataUrl}" alt="Offline registration QR"><div class="qr-url">${esc(j.url)}</div><button class="btn gold" onclick="window.print()">PRINT QR</button>`).catch(e=>toast(e.message,'error'))}
function toolsPanel(p){p.innerHTML=`<div class="settings-grid"><div class="panel"><div class="eyebrow">REGISTRATION CONTROL</div><h2>Registration Status</h2><p>Allow or stop new QR and staff registrations.</p><button class="btn ${A.data.event.status==='OPEN'?'danger':'success'}" onclick="toggleRegistration()">${A.data.event.status==='OPEN'?'CLOSE REGISTRATION':'OPEN REGISTRATION'}</button></div><div class="panel"><div class="eyebrow">DATABASE</div><h2>Backup</h2><p>Create a complete local SQLite backup.</p><button class="btn" onclick="backupDb()">BACKUP DATABASE</button></div><div class="panel"><div class="eyebrow">EVENT EXPORT</div><h2>Export</h2><p>Download all event data.</p><button class="btn secondary" onclick="downloadFile('/api/events/${A.current}/backup','lucky-draw-${A.current}.json')">DOWNLOAD JSON</button></div><div class="panel danger-panel"><div class="eyebrow">CAUTION</div><h2>Reset Event</h2><p>Creates a backup, then permanently removes the event records.</p><button class="btn danger" onclick="resetEvent()">EXPORT & RESET</button></div></div>`}
async function toggleRegistration(){const s=A.data.event.status==='OPEN'?'CLOSED':'OPEN';await api('/api/events/'+A.current+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})});A.data=await api('/api/events/'+A.current+'/data');eventTab('tools');toast('Registration '+s,'success')}
async function backupDb(){try{const j=await api('/api/backup/database',{method:'POST'});toast('Backup created: '+j.file,'success')}catch(e){toast(e.message,'error')}}
async function resetEvent(){if(!confirm('Export and permanently remove this event, participants, prizes and winners?'))return;try{await api('/api/events/'+A.current+'/reset',{method:'POST'});A.current=null;A.events=await api('/api/events');render();toast('Event reset complete','success')}catch(e){toast(e.message,'error')}}
async function resetSelected(){const id=document.getElementById('toolEvent')?.value;if(!id)return;A.current=id;resetEvent()}
async function systemInfo(){const j=await api('/api/network');modal(`<div class="modal-head"><div><div class="eyebrow">LOCAL NETWORK</div><h2>Offline Registration Network</h2></div><button class="icon-btn" onclick="closeModal()">×</button></div><div class="network-box"><div><span>LAN IP</span><b>${esc(j.ip)}</b></div><div><span>PORT</span><b>${j.port}</b></div><div><span>QR URL</span><b>${esc(j.registerUrl)}</b></div></div><div class="alert info">Phones must use the same Wi-Fi/LAN. Allow Node.js through Windows Firewall on the Private network.</div>`)}
function prizeNumber(level){const m=String(level||'').match(/\d+/);return m?Number(m[0]):0;}
async function drawScreen(id,autoSpin=false){
  const data=await api('/api/events/'+id+'/data');
  // Draw order is ALWAYS highest/last prize first, then down to 1st.
  // For a prize with multiple quantities, all units are completed before moving to the next lower draw order.
  const prizes=data.prizes.map(p=>({...p,
    drawn:data.draws.filter(d=>d.prize_id===p.id).length,
    remaining:p.quantity-data.draws.filter(d=>d.prize_id===p.id).length
  })).filter(p=>p.remaining>0).sort((a,b)=>b.drawOrder-a.drawOrder || prizeNumber(b.level)-prizeNumber(a.level) || String(b.level).localeCompare(String(a.level)));
  if(!prizes.length)return toast('All prize quantities have been drawn.','success');

  // The server is authoritative: it always draws the highest remaining Draw Order first.
  // This UI mirrors that order and does not expose a manual prize selector.
  const activePrize=prizes[0];
  const eligible=data.participants.filter(p=>p.status==='ELIGIBLE').sort((a,b)=>{const na=Number(String(a.registrationNo||'').replace(/\D/g,''))||0;const nb=Number(String(b.registrationNo||'').replace(/\D/g,''))||0;return na-nb || String(a.fullName).localeCompare(String(b.fullName));});
  const prizePosition=`${prizes.length ? prizes.length : 1} PRIZE LEVEL${prizes.length===1?'':'S'} REMAINING`;

  document.body.innerHTML=`<div class="draw-screen">
    <div class="draw-bg" id="draw-bg"></div>
    <div class="draw-top">
      <div class="draw-brand">${logo()}<div><b>${esc(data.event.title)}</b><span>PKM DUN SENTOSA N48 • OFFLINE LUCKY DRAW</span></div></div>
      <div class="draw-top-actions">
        <span class="draw-order-badge">START: LAST PRIZE → 1ST PRIZE</span>
        <button class="btn secondary fullscreen-btn" id="fullscreen-btn">⛶ FULL SCREEN</button>
        <button class="btn secondary exit-btn" onclick="location.reload()">EXIT</button>
      </div>
    </div>

    <main class="draw-main">
      <section class="draw-layout">
        <div class="draw-left">
          <div class="draw-heading"><div class="eyebrow">OFFICIAL LUCKY DRAW</div><h1>GOOD LUCK!</h1></div>
          <div class="wheel-stage">
            <div class="wheel-glow"></div>
            <div class="wheel-pointer" aria-hidden="true">▼</div>
            <div class="wheel" id="wheel"></div>
          </div>
          <div id="rolling" class="rolling">READY</div>
          <div id="winner-nric" class="winner-nric"></div>
          <div id="draw-status" class="draw-status">${eligible.length?`Eligible participants: <b>${eligible.length}</b>`:'No eligible participants remain.'}</div>
        </div>

        <aside class="draw-right">
          <div class="prize-kicker">CURRENT PRIZE • ${esc(prizePosition)}</div>
          <div class="draw-level" id="draw-level">${esc(activePrize.level)}</div>
          <div class="prize-remaining">PRIZE ${activePrize.drawn+1} OF ${activePrize.quantity}</div>
          <div class="draw-prize-showcase">
            ${activePrize.image?`<img id="draw-prize-image" src="${activePrize.image}" alt="${esc(activePrize.name)}">`:`<div id="draw-prize-image" class="draw-prize-placeholder">🎁</div>`}
          </div>
          <div id="winner-prize" class="winner-prize">${esc(activePrize.name)}</div>
          <div class="prize-description">${esc(activePrize.description||'Prize for this lucky draw.')}</div>
          <div class="draw-divider"></div>
          <div class="winner-caption">WINNER</div>
          <div class="winner-card"><div id="winner-name" class="winner-name">READY TO SPIN</div></div>
          <div class="draw-controls">
            <button id="spin" class="btn gold draw-spin" ${eligible.length?'':'disabled'}>🎡 SPIN WHEEL</button>
            <button id="remove-spin" class="btn danger draw-action" style="display:none">REMOVE NAME &amp; SPIN AGAIN</button>
            <button id="again" class="btn secondary draw-action" style="display:none">↻ SPIN AGAIN</button>
            <button id="collect" class="btn success draw-collect" style="display:none">✓ PRIZE COLLECTED — NEXT PRIZE</button>
          </div>
          <div class="draw-sequence">ADMIN DRAW ORDER: <b>LARGEST NUMBER → LOWEST NUMBER</b></div>
        </aside>
      </section>
    </main>
  </div>`;

  if(data.event.background){
    const bg=document.getElementById('draw-bg');
    if(data.event.backgroundType==='application/pdf')bg.innerHTML=`<embed src="${data.event.background}" type="application/pdf">`;
    else bg.style.backgroundImage=`url('${data.event.background}')`;
  }

  const wheel=document.getElementById('wheel');
  const rolling=document.getElementById('rolling');
  const winnerName=document.getElementById('winner-name');
  const spin=document.getElementById('spin');
  const removeSpin=document.getElementById('remove-spin');
  const again=document.getElementById('again');
  const collect=document.getElementById('collect');
  const status=document.getElementById('draw-status');
  const fullscreenBtn=document.getElementById('fullscreen-btn');
  const names=eligible.map(p=>p.fullName);
  let currentRotation=0, spinning=false, pendingDrawId=null;

  fullscreenBtn.onclick=async()=>{
    try{
      if(!document.fullscreenElement){await document.documentElement.requestFullscreen();fullscreenBtn.textContent='⛶ EXIT FULL SCREEN';}
      else{await document.exitFullscreen();fullscreenBtn.textContent='⛶ FULL SCREEN';}
    }catch(e){toast('Browser full screen is not available. Press F11 to enlarge the display.','error')}
  };
  document.addEventListener('fullscreenchange',()=>{
    if(!document.fullscreenElement)fullscreenBtn.textContent='⛶ FULL SCREEN';
    else fullscreenBtn.textContent='⛶ EXIT FULL SCREEN';
  });

  function buildWheel(){
    const count=Math.max(names.length,1);
    const step=360/count;
    wheel.style.setProperty('--segments',count);
    wheel.style.setProperty('--step',`${step}deg`);
    if(!names.length){wheel.style.background='conic-gradient(#30394f 0 360deg)';wheel.innerHTML='';return;}
    wheel.style.background=`conic-gradient(${names.map((_,i)=>`hsl(${(i*360/count)},65%,${i%2?34:42}%) ${i*step}deg ${(i+1)*step}deg`).join(',')})`;
    wheel.innerHTML=names.map((name,i)=>{
      const angle=i*step+step/2;
      const size=Math.max(9,Math.min(18,270/count));
      return `<span class="wheel-label" style="--angle:${angle}deg;--label-size:${size}px"><b>${esc(name)}</b></span>`;
    }).join('');
  }
  buildWheel();

  function showWinnerActions(){
    spin.style.display='none';
    removeSpin.style.display='inline-flex';
    again.style.display='inline-flex';
    collect.style.display='inline-flex';
  }

  const pending=data.draws.slice().reverse().find(d=>d.collected_at==null);
  if(pending){
    const pendingParticipant=data.participants.find(p=>p.id===pending.participant_id);
    const pendingPrize=data.prizes.find(p=>p.id===pending.prize_id);
    spin.disabled=true;
    rolling.textContent=pendingParticipant?.fullName||'WINNER SELECTED';
    winnerName.textContent=pendingParticipant?.fullName||'WINNER SELECTED';
    document.getElementById('winner-nric').textContent=pendingParticipant?`NRIC: XXXX${pendingParticipant.nric.slice(-4)}`:'';
    document.getElementById('winner-prize').textContent=pendingPrize?.name||'';
    status.innerHTML=`🏆 <b>Winner selected.</b> Choose an action below, or collect the prize to continue.`;
    pendingDrawId=pending.id;
    showWinnerActions();
  }

  async function spinWheel(){
    if(spinning)return;
    if(!eligible.length){toast('No eligible participants remain.','error');return;}
    spinning=true;spin.disabled=true;removeSpin.style.display='none';again.style.display='none';collect.style.display='none';status.textContent='Selecting a random winner…';
    rolling.textContent='SPINNING…';winnerName.textContent='SPINNING…';document.getElementById('winner-nric').textContent='';
    try{
      const w=await api('/api/events/'+id+'/draw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});
      pendingDrawId=w.drawId;
      const winnerIndex=eligible.findIndex(p=>p.id===w.participantId);
      const count=names.length, step=360/count;
      const idx=winnerIndex>=0?winnerIndex:Math.floor(Math.random()*count);
      const targetCenter=idx*step+step/2;
      const extra=360*8;
      const desired=((360-(targetCenter%360))+360)%360;
      currentRotation+=extra+desired;
      wheel.style.setProperty('--wheel-rotation',`${currentRotation}deg`);
      wheel.classList.add('spinning');
      setTimeout(()=>{
        wheel.classList.remove('spinning');
        rolling.textContent=w.fullName;
        winnerName.textContent=w.fullName;
        document.getElementById('winner-nric').textContent='NRIC: XXXX'+w.nricLast4;
        document.getElementById('winner-prize').textContent=w.name;
        status.innerHTML=`🏆 <b>Winner selected.</b> Remove the name, spin again, or collect the prize.`;
        showWinnerActions();
        celebrate(w.fullName);
        spinning=false;
      },5200);
    }catch(e){
      spinning=false;spin.disabled=false;status.textContent=e.message;toast(e.message,'error');
    }
  }

  async function reroll(removeCurrent){
    if(spinning || !pendingDrawId)return;
    removeSpin.disabled=true;again.disabled=true;collect.disabled=true;
    try{
      await api('/api/events/'+id+'/draw/'+pendingDrawId+'/reroll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({removeCurrent})});
      await drawScreen(id,true);
    }catch(e){removeSpin.disabled=false;again.disabled=false;collect.disabled=false;toast(e.message,'error')}
  }

  spin.onclick=spinWheel;
  // Start the draw with Enter or Spacebar when the live draw screen is active.
  const keyHandler=(ev)=>{
    if(ev.key!=='Enter' && ev.code!=='Space') return;
    if(ev.target && ['INPUT','TEXTAREA','SELECT','BUTTON'].includes(ev.target.tagName) && ev.target!==spin) return;
    if(spin.style.display==='none' || spin.disabled || spinning || pendingDrawId) return;
    ev.preventDefault();
    spinWheel();
  };
  document.addEventListener('keydown',keyHandler);
  removeSpin.onclick=()=>reroll(true);
  again.onclick=()=>reroll(false);
  collect.onclick=async()=>{
    if(!pendingDrawId)return;
    collect.disabled=true;removeSpin.disabled=true;again.disabled=true;
    try{
      await api('/api/events/'+id+'/draw/'+pendingDrawId+'/collect',{method:'POST'});
      status.textContent='Prize collected. Loading the next prize…';
      setTimeout(()=>drawScreen(id),700);
    }catch(e){collect.disabled=false;removeSpin.disabled=false;again.disabled=false;toast(e.message,'error')}
  };

  if(autoSpin && eligible.length) setTimeout(()=>spin.click(),250);
}

function celebrate(name){const l=document.createElement('div');l.className='celebrate';l.innerHTML=`<div class="win-celebration"><div class="win-burst">🎉 WINNER! 🎉</div><div class="win-celebration-name">${esc(name||'')}</div></div>`;document.body.appendChild(l);for(let i=0;i<100;i++){const s=document.createElement('span');s.textContent=['🎉','🎊','⭐','🏆','✨'][Math.floor(Math.random()*5)];s.style.left=Math.random()*100+'%';s.style.animationDelay=Math.random()*.8+'s';l.appendChild(s)}setTimeout(()=>l.remove(),5000)}
render();
