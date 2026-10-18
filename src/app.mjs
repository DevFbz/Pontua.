import { PUNCH_LABELS, calculateDay, calculateBalance, createPunch, parseLocalDateTime, formatClock, formatDuration } from './domain.mjs';

const KEY = 'pontua.personal.v1';
const DEFAULTS = { punches: [], targetMinutes: 480, name: '', adjustments: [] };
const icons = { clock_in: '↗', break_start: 'Ⅱ', break_end: '▷', clock_out: '↙' };
let state = loadState();
let viewedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let toastTimer;

function loadState() {
  try { const parsed = JSON.parse(localStorage.getItem(KEY) || 'null'); return { ...DEFAULTS, ...(parsed || {}) }; }
  catch { return { ...DEFAULTS }; }
}
function saveState() { localStorage.setItem(KEY, JSON.stringify(state)); }
function esc(value) { return String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch])); }
function dateKey(date) { const d = date instanceof Date ? date : new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function todayKey() { return dateKey(new Date()); }
function dayPunches(key) { return state.punches.filter(p => dateKey(p.at) === key).sort((a,b) => new Date(a.at)-new Date(b.at)); }
function minsToClock(minutes) { const value = Math.max(0, Math.trunc(minutes)); return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`; }
function localDateLabel(date, options) { return new Intl.DateTimeFormat('pt-BR', options).format(date); }
function nextKind(punches) {
  const last = punches.at(-1)?.kind;
  if (!last || last === 'clock_out') return 'clock_in';
  if (last === 'clock_in') return 'break_start';
  if (last === 'break_start') return 'break_end';
  return 'clock_out';
}
function dayData(key) { return calculateDay(dayPunches(key), state.targetMinutes); }
function showToast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.classList.remove('show'),2600); }
function weekStart(date) { const d = new Date(date); const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d; }
function escapeCsv(value) { return `"${String(value).replaceAll('"','""')}"`; }
function download(name, content, type) { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function renderClock() { const now=new Date(); document.querySelector('#live-clock').textContent=localDateLabel(now,{hour:'2-digit',minute:'2-digit'}); document.querySelector('#top-date').textContent=localDateLabel(now,{weekday:'short',day:'2-digit',month:'short'}); document.querySelector('#timezone-label').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_',' '); }
function renderHome() {
  const now=new Date(); const greeting=now.getHours()<12?'Bom dia':now.getHours()<18?'Boa tarde':'Boa noite';
  document.querySelector('#hello-title').innerHTML=`${greeting}<span class="hello-period">.</span>`;
  document.querySelector('#full-date').textContent=localDateLabel(now,{weekday:'long',day:'numeric',month:'long'});
  document.querySelector('#today-label').textContent=state.name?`OLÁ, ${state.name.toLocaleUpperCase('pt-BR')}`:'SEU DIA, EM UM SÓ LUGAR';
  const today=dayPunches(todayKey()); const kind=nextKind(today);
  const buttonNames={clock_in:today.length?'Registrar nova entrada':'Registrar entrada',break_start:'Iniciar intervalo',break_end:'Voltar do intervalo',clock_out:'Registrar saída'};
  document.querySelector('#punch-button-label').textContent=buttonNames[kind];
  document.querySelector('#today-punch-count').textContent=`${today.length} ${today.length===1?'registro':'registros'}`;
  const last=today.at(-1); document.querySelector('#clock-message').textContent=last?`${PUNCH_LABELS[last.kind]} registrada às ${formatClock(last.at)}. Próximo passo no seu ritmo.`:'Quando começar, registre sua primeira entrada.';
  const day=dayData(todayKey()); const displayedBalance=today.length?day.balanceMinutes:0; document.querySelector('#worked-today').textContent=minsToClock(day.workedMinutes); document.querySelector('#daily-target').textContent=minsToClock(state.targetMinutes); document.querySelector('#today-balance').textContent=formatDuration(displayedBalance);
  document.querySelector('#today-balance').style.color=displayedBalance<0?'#b75046':'#244b43';
  const pct=Math.min(100, state.targetMinutes?Math.round(day.workedMinutes/state.targetMinutes*100):0);
  document.querySelector('#progress-ring').style.background=`conic-gradient(#a9d766 ${pct*3.6}deg,#edf1eb ${pct*3.6}deg 360deg)`;
  document.querySelector('#progress-caption').textContent=day.open?'Jornada em andamento. Seu tempo está sendo contado até a última marcação.':day.workedMinutes?`${pct>=100?'Meta diária alcançada.':`${pct}% da sua meta diária.`}`:'Sua jornada começa com a primeira batida.';
  const list=document.querySelector('#today-punches');
  list.innerHTML=today.length?today.slice().reverse().map(p=>`<div class="punch-row"><span class="punch-row-icon">${icons[p.kind]}</span><span class="punch-row-text"><b>${esc(PUNCH_LABELS[p.kind])}</b><small>${p.manual?'Adicionada manualmente':'Registro pessoal'}</small></span><time>${formatClock(p.at)}</time></div>`).join(''):'<div class="empty-state"><div class="empty-mark">◷</div>Nenhuma marcação por aqui ainda.<br>Seu dia começa quando você quiser.</div>';
  renderWeek();
}
function renderWeek() {
  const start=weekStart(new Date()); const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);const key=dateKey(d);return {date:d,key,data:dayData(key)}});
  const completed=days.filter(d=>d.key<=todayKey()&&dayPunches(d.key).length).length;
  document.querySelector('#week-count').textContent=`${completed} ${completed===1?'dia':'dias'}`;
  document.querySelector('#week-range').textContent=`${localDateLabel(start,{day:'numeric'})} – ${localDateLabel(days[6].date,{day:'numeric',month:'short'})}`;
  const max=Math.max(state.targetMinutes,...days.map(d=>d.data.workedMinutes),1);
  document.querySelector('#week-bars').innerHTML=days.map(d=>{const future=d.key>todayKey();const h=future?3:Math.max(d.data.workedMinutes?6:3,Math.round(d.data.workedMinutes/max*78));return `<div class="bar-column"><div class="bar-track"><div class="bar-fill ${d.key===todayKey()?'today':''} ${future?'future':''}" style="height:${h}px" title="${minsToClock(d.data.workedMinutes)}"></div></div><span>${'DSTQQSS'[d.date.getDay()]}</span></div>`}).join('');
  const sum=calculateBalance(days.filter(d=>d.key<=todayKey()).map(d=>({balanceMinutes:d.data.workedMinutes}))); document.querySelector('#week-total').textContent=`${Math.floor(sum/60)}h${sum%60?String(sum%60).padStart(2,'0'):''} esta semana`;
}
function renderHistory() {
  const monthLabel=localDateLabel(viewedMonth,{month:'long',year:'numeric'}); document.querySelector('#history-month').textContent=monthLabel.charAt(0).toUpperCase()+monthLabel.slice(1);
  const prefix=dateKey(viewedMonth).slice(0,7); const items=state.punches.filter(p=>dateKey(p.at).startsWith(prefix));
  const grouped=new Map(); for(const p of items){const key=dateKey(p.at);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(p)}
  const dayRows=[...grouped.entries()].sort((a,b)=>b[0].localeCompare(a[0])); const summaries=dayRows.map(([key,p])=>({key,data:calculateDay(p,state.targetMinutes)}));
  const worked=summaries.reduce((n,r)=>n+r.data.workedMinutes,0); const balance=summaries.reduce((n,r)=>n+r.data.balanceMinutes,0);
  document.querySelector('#history-summary').innerHTML=`<div class="history-stat"><span>Dias registrados</span><b>${dayRows.length}</b></div><div class="history-stat"><span>Horas registradas</span><b>${minsToClock(worked)}</b></div><div class="history-stat"><span>Saldo do período</span><b style="color:${balance<0?'#b75046':'#334c3e'}">${formatDuration(balance)}</b></div>`;
  const history=document.querySelector('#history-list');
  if(!dayRows.length){history.innerHTML='<div class="history-empty">Nenhum registro neste mês. Quando adicionar marcações, elas aparecem aqui.</div>';return;}
  history.innerHTML=dayRows.map(([key,p])=>{const date=new Date(`${key}T12:00:00`);const day=calculateDay(p,state.targetMinutes);const chips=p.sort((a,b)=>new Date(a.at)-new Date(b.at)).map(x=>`<span class="history-chip">${esc(PUNCH_LABELS[x.kind])}<b>${formatClock(x.at)}</b></span>`).join('');return `<article class="history-day"><div class="history-day-head"><div class="history-day-title"><b>${localDateLabel(date,{weekday:'short',day:'numeric',month:'short'})}</b><span>${p.length} ${p.length===1?'marcação':'marcações'}${day.open?' · em andamento':''}</span></div><span class="day-total">Trabalhadas <b>${minsToClock(day.workedMinutes)}</b></span></div><div class="history-punches">${chips}</div><div class="history-actions"><button data-edit-day="${key}">+ Adicionar marcação</button><button data-delete-day="${key}">Apagar dia</button></div></article>`}).join('');
}
function renderSettings() { document.querySelector('#settings-target').textContent=minsToClock(state.targetMinutes);document.querySelector('#name-input').value=state.name||''; }
function render() { renderClock();renderHome();renderHistory();renderSettings(); }
function navigate(view) { const safe=['inicio','historico','ajustes'].includes(view)?view:'inicio';document.querySelectorAll('.view-section').forEach(s=>s.classList.toggle('active',s.id===`view-${safe}`));document.querySelectorAll('[data-view]').forEach(a=>a.classList.toggle('active',a.dataset.view===safe));if(location.hash!==`#${safe}`)history.replaceState(null,'',`#${safe}`);window.scrollTo(0,0); }
function modal(title, body, buttons) { const dlg=document.querySelector('#modal');document.querySelector('#modal-eyebrow').textContent=title;document.querySelector('#modal-content').innerHTML=body+`<div class="modal-actions">${buttons}</div>`;dlg.showModal(); }
function closeModal(){document.querySelector('#modal').close();}
function manualModal(key=todayKey(), currentKind=null) {
  const now=new Date();const time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const quick=Boolean(currentKind);
  const kindOptions=Object.entries(PUNCH_LABELS).map(([k,v])=>`<option value="${k}" ${k===currentKind?'selected':''}>${v}</option>`).join('');
  modal(quick?'REGISTRAR BATIDA':'MARCAÇÃO MANUAL',`<h2>${quick?esc(PUNCH_LABELS[currentKind]):'Adicionar um registro'}</h2><p>${quick?'Confira o horário sugerido e altere para o horário que deseja registrar.':'Use para completar seu histórico. A marcação ficará identificada como manual.'}</p><div class="modal-field"><label for="manual-date">Data</label><input id="manual-date" type="date" value="${key}" ${quick?'readonly':''} required></div><div class="modal-field"><label for="manual-kind">Tipo de marcação</label><select id="manual-kind" ${quick?'disabled':''}>${kindOptions}</select></div><div class="modal-field"><label for="manual-time">Horário</label><input id="manual-time" type="time" value="${time}" required></div><div class="modal-note">O horário será salvo neste navegador. Você pode completar ou apagar registros pelo histórico.</div>`,`<button class="modal-cancel" data-action="close-modal">Cancelar</button><button class="modal-confirm" data-action="save-manual">${quick?'Registrar batida':'Adicionar registro'}</button>`);
}
function exportCsv() {
  const rows=[['Data','Horário','Tipo','Origem']];for(const p of [...state.punches].sort((a,b)=>new Date(a.at)-new Date(b.at)))rows.push([dateKey(p.at),formatClock(p.at),PUNCH_LABELS[p.kind],p.manual?'Manual':'Registro']);
  download(`pontua-registros-${dateKey(new Date()).slice(0,7)}.csv`,'\ufeff'+rows.map(r=>r.map(escapeCsv).join(';')).join('\r\n'),'text/csv;charset=utf-8');showToast('Seu histórico foi exportado.');
}
function backup() { download(`pontua-backup-${todayKey()}.json`,JSON.stringify({app:'Pontua',version:1,exportedAt:new Date().toISOString(),...state},null,2),'application/json');showToast('Backup salvo no dispositivo.'); }

// Events

document.addEventListener('click', e=>{
  const nav=e.target.closest('[data-view],[data-view-link]');if(nav){e.preventDefault();navigate(nav.dataset.view||nav.dataset.viewLink);return;}
  const editDay=e.target.closest('[data-edit-day]');if(editDay){manualModal(editDay.dataset.editDay);return;}
  const deleteDay=e.target.closest('[data-delete-day]');if(deleteDay){const key=deleteDay.dataset.deleteDay;modal('APAGAR REGISTROS',`<h2>Apagar este dia?</h2><p>Todos os registros de ${key.split('-').reverse().join('/')} serão removidos deste dispositivo. Essa ação não pode ser desfeita.</p>`,`<button class="modal-cancel" data-action="close-modal">Cancelar</button><button class="modal-danger" data-action="confirm-delete-day" data-key="${key}">Apagar dia</button>`);return;}
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='settings'){navigate('ajustes');return;}
  if(action==='help'){modal('COMO FUNCIONA',`<h2>Seu registro, do seu jeito.</h2><p>Toque no botão para abrir o registro da próxima etapa. O horário atual vem sugerido, mas você pode alterá-lo antes de confirmar. Também pode adicionar marcações de outros dias pelo histórico. O Pontua salva os dados neste navegador, sem conta ou sincronização com outros dispositivos.</p><div class="modal-note">Este app é um controle pessoal. Não substitui o sistema oficial de ponto da sua empresa.</div>`,`<button class="modal-confirm" data-action="close-modal">Entendi</button>`);return;}
  if(action==='export'){exportCsv();return;}
  if(action==='backup'){backup();return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='prev-month'){viewedMonth.setMonth(viewedMonth.getMonth()-1);renderHistory();return;}
  if(action==='next-month'){viewedMonth.setMonth(viewedMonth.getMonth()+1);renderHistory();return;}
  if(action==='target-down'||action==='target-up'){state.targetMinutes=Math.max(60,Math.min(960,state.targetMinutes+(action==='target-up'?30:-30)));saveState();render();showToast('Meta diária atualizada.');return;}
  if(action==='save-name'){state.name=document.querySelector('#name-input').value.trim();saveState();render();showToast('Preferência salva.');return;}
  if(action==='save-manual'){const date=document.querySelector('#manual-date').value;const time=document.querySelector('#manual-time').value;const kind=document.querySelector('#manual-kind').value;if(!date||!time){showToast('Preencha a data e o horário.');return;}let at;try{at=parseLocalDateTime(date,time)}catch{showToast('Confira a data e o horário.');return;}state.punches.push({...createPunch(kind,at),manual:true});saveState();closeModal();render();showToast(`${PUNCH_LABELS[kind]} registrada às ${formatClock(at)}.`);return;}
  if(action==='confirm-delete-day'){const key=e.target.closest('[data-action]').dataset.key;state.punches=state.punches.filter(p=>dateKey(p.at)!==key);saveState();closeModal();render();showToast('Registros do dia apagados.');return;}
  if(action==='reset'){modal('APAGAR DADOS',`<h2>Começar do zero?</h2><p>Todos os seus registros e preferências serão apagados deste navegador.</p>`,`<button class="modal-cancel" data-action="close-modal">Manter dados</button><button class="modal-danger" data-action="confirm-reset">Apagar tudo</button>`);return;}
  if(action==='confirm-reset'){localStorage.removeItem(KEY);state={...DEFAULTS};closeModal();render();showToast('Seus dados locais foram apagados.');return;}
});

document.querySelector('#punch-button').addEventListener('click',()=>{const punches=dayPunches(todayKey());manualModal(todayKey(),nextKind(punches));});
document.querySelector('#modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
render();navigate(location.hash.slice(1));setInterval(renderClock,15000);
