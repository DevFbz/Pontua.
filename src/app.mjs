import { PUNCH_LABELS, calculateDay, calculateBalance, estimateDeparture, createPunch, parseLocalDateTime, formatClock, formatDuration } from './domain.mjs';
import { icon } from './icons.mjs';
import { prepareReceiptPhoto, putPunchPhoto, getPunchPhoto, deletePunchPhotos, clearPunchPhotos } from './photo-storage.mjs';
import { createCloudStore } from './cloud-store.mjs';
import { supabaseClient, supabaseConfigured } from './supabase-client.mjs';
import { LEGACY_STATE_KEY, stateKeyForUser } from './state-cache.mjs';
import { getHolidayForDate, getHolidaysForMonth } from './holidays.mjs';

const KEY = LEGACY_STATE_KEY;
const DEFAULTS = { punches: [], targetMinutes: 480, name: '', adjustments: [] };
const icons = { clock_in: 'login', break_start: 'pause', break_end: 'play', clock_out: 'logout' };
let state = loadState();
let viewedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let toastTimer;
let pendingReceiptPhoto = null;
let pendingReceiptUrl = null;
let viewedReceiptUrl = null;
let savingPunch = false;
let cloudStore = null;
let stateStorageKey = KEY;
let pendingSettingsKey = null;

function loadState(storageKey=stateStorageKey) {
  try { const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null'); return { ...DEFAULTS, ...(parsed || {}) }; }
  catch { return { ...DEFAULTS }; }
}
function saveState() { localStorage.setItem(stateStorageKey, JSON.stringify(state)); }
async function saveCloudSettings() {
  if (!cloudStore) return;
  try {
    await cloudStore.saveSettings(state);
    if (pendingSettingsKey) localStorage.removeItem(pendingSettingsKey);
  } catch (error) {
    if (pendingSettingsKey) localStorage.setItem(pendingSettingsKey, '1');
    throw error;
  }
}
async function saveCloudPunch(punch) {
  if (!cloudStore) return;
  const photo = punch.photoId ? await getPunchPhoto(punch.photoId) : null;
  punch.photoPath = await cloudStore.savePunch(punch, photo);
}
async function getStoredPhoto(punch) {
  const local = punch.photoId ? await getPunchPhoto(punch.photoId) : null;
  return local || (cloudStore ? cloudStore.getReceiptPhoto(punch) : null);
}
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
function dayData(key) { return calculateDay(dayPunches(key), state.targetMinutes, key<=todayKey()?getHolidayForDate(key):null); }
function showToast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.classList.remove('show'),2600); }
function weekStart(date) { const d = new Date(date); const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d; }
function escapeCsv(value) { return `"${String(value).replaceAll('"','""')}"`; }
function download(name, content, type) { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function photoAttachment(punch) { return punch.photoId?`<button type="button" class="photo-attachment" data-view-photo="${esc(punch.photoId)}" aria-label="Ver foto do comprovante">${icon('camera')}<span>Ver foto</span></button>`:''; }
function clearPendingReceiptPhoto() {
  if(pendingReceiptUrl)URL.revokeObjectURL(pendingReceiptUrl);
  pendingReceiptUrl=null;pendingReceiptPhoto=null;
  const preview=document.querySelector('#receipt-photo-preview');if(preview)preview.hidden=true;
  const image=document.querySelector('#receipt-photo-image');if(image)image.removeAttribute('src');
  const label=document.querySelector('#receipt-photo-label');if(label)label.textContent='Tirar foto do comprovante';
  const input=document.querySelector('#receipt-photo-input');if(input)input.value='';
}
function clearViewedReceiptPhoto() { if(viewedReceiptUrl)URL.revokeObjectURL(viewedReceiptUrl);viewedReceiptUrl=null; }
function blobToDataUrl(blob) { return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||new Error('Não foi possível incluir a foto no backup.'));reader.readAsDataURL(blob);}); }
function renderClock() { const now=new Date(); document.querySelector('#live-clock').textContent=localDateLabel(now,{hour:'2-digit',minute:'2-digit'}); document.querySelector('#top-date').textContent=localDateLabel(now,{weekday:'short',day:'2-digit',month:'short'}); document.querySelector('#timezone-label').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_',' '); }
function renderHome() {
  const now=new Date(); const greeting=now.getHours()<12?'Bom dia':now.getHours()<18?'Boa tarde':'Boa noite';
  document.querySelector('#hello-title').innerHTML=`${greeting}<span class="hello-period">.</span>`;
  document.querySelector('#full-date').textContent=localDateLabel(now,{weekday:'long',day:'numeric',month:'long'});
  document.querySelector('#today-label').textContent=state.name?`OLÁ, ${state.name.toLocaleUpperCase('pt-BR')}`:'SEU DIA, EM UM SÓ LUGAR';
  const today=dayPunches(todayKey()); const kind=nextKind(today);
  document.querySelector('#punch-button-label').textContent='Incluir batida';
  document.querySelector('#today-punch-count').textContent=`${today.length} ${today.length===1?'registro':'registros'}`;
  const estimate=estimateDeparture(today,state.targetMinutes); const estimateEl=document.querySelector('#departure-estimate');
  estimateEl.textContent=estimate?`Previsão de saída: ${formatClock(estimate)}${today.some(p=>p.kind==='break_start')?' (considerando os intervalos registrados)':' (sem considerar intervalos futuros)'}`:'';
  const last=today.at(-1); document.querySelector('#clock-message').textContent=last?`${PUNCH_LABELS[last.kind]} registrada às ${formatClock(last.at)}. Próximo passo no seu ritmo.`:'Quando começar, registre sua primeira entrada.';
  const day=dayData(todayKey()); const displayedBalance=today.length||day.holidayName?day.balanceMinutes:0; document.querySelector('#worked-today').textContent=minsToClock(day.workedMinutes); document.querySelector('#daily-target').textContent=minsToClock(state.targetMinutes); document.querySelector('#today-balance').textContent=formatDuration(displayedBalance);
  document.querySelector('#today-balance').style.color=displayedBalance<0?'#b75046':'#244b43';
  const pct=Math.min(100, state.targetMinutes?Math.round(day.workedMinutes/state.targetMinutes*100):0);
  document.querySelector('#progress-ring').style.background=`conic-gradient(#a9d766 ${pct*3.6}deg,#edf1eb ${pct*3.6}deg 360deg)`;
  document.querySelector('#progress-caption').textContent=day.open?'Jornada em andamento. Seu tempo está sendo contado até a última marcação.':day.holidayName&&!today.length?`Crédito de feriado: ${day.holidayName}.`:day.workedMinutes?`${pct>=100?'Meta diária alcançada.':`${pct}% da sua meta diária.`}`:'Sua jornada começa com a primeira batida.';
  const list=document.querySelector('#today-punches');
  list.innerHTML=today.length?today.slice().reverse().map(p=>`<div class="punch-row"><span class="punch-row-icon">${icon(icons[p.kind])}</span><span class="punch-row-text"><b>${esc(PUNCH_LABELS[p.kind])}</b><small>${p.manual?'Adicionada manualmente':'Registro pessoal'}</small>${photoAttachment(p)}</span><time>${formatClock(p.at)}</time></div>`).join(''):`<div class="empty-state"><div class="empty-mark">${icon('clock')}</div>Nenhuma marcação por aqui ainda.<br>Seu dia começa quando você quiser.</div>`;
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
  for(const key of getHolidaysForMonth(viewedMonth.getFullYear(),viewedMonth.getMonth()).keys())if(key<=todayKey()&&!grouped.has(key))grouped.set(key,[]);
  const dayRows=[...grouped.entries()].sort((a,b)=>b[0].localeCompare(a[0])); const summaries=dayRows.map(([key,p])=>({key,data:dayData(key)}));
  const worked=summaries.reduce((n,r)=>n+r.data.workedMinutes,0); const balance=summaries.reduce((n,r)=>n+r.data.balanceMinutes,0);
  document.querySelector('#history-summary').innerHTML=`<div class="history-stat"><span>Dias contabilizados</span><b>${dayRows.length}</b></div><div class="history-stat"><span>Horas registradas</span><b>${minsToClock(worked)}</b></div><div class="history-stat"><span>Saldo do período</span><b style="color:${balance<0?'#b75046':'#334c3e'}">${formatDuration(balance)}</b></div>`;
  const history=document.querySelector('#history-list');
  if(!dayRows.length){history.innerHTML='<div class="history-empty">Nenhum registro neste mês. Quando adicionar marcações, elas aparecem aqui.</div>';return;}
  history.innerHTML=dayRows.map(([key,p])=>{const date=new Date(`${key}T12:00:00`);const day=dayData(key);const chips=p.sort((a,b)=>new Date(a.at)-new Date(b.at)).map(x=>`<span class="history-chip">${esc(PUNCH_LABELS[x.kind])}<b>${formatClock(x.at)}</b>${photoAttachment(x)}</span>`).join('');const holidayNote=day.holidayName?`<span class="holiday-note">Feriado: ${esc(day.holidayName)}${p.length?'':` · crédito de ${minsToClock(state.targetMinutes)}`}</span>`:'';return `<article class="history-day"><div class="history-day-head"><div class="history-day-title"><b>${localDateLabel(date,{weekday:'short',day:'numeric',month:'short'})}</b><span>${p.length} ${p.length===1?'marcação':'marcações'}${day.open?' · em andamento':''}</span></div><span class="day-total">Trabalhadas <b>${minsToClock(day.workedMinutes)}</b></span></div><div class="history-punches">${holidayNote}${chips}</div><div class="history-actions"><button data-edit-day="${key}">+ Adicionar marcação</button><button data-delete-day="${key}">Apagar dia</button></div></article>`}).join('');
}
function renderSettings() { document.querySelector('#settings-target').value=minsToClock(state.targetMinutes);document.querySelector('#name-input').value=state.name||''; }
function render() { renderClock();renderHome();renderHistory();renderSettings(); }
function navigate(view) { const safe=['inicio','historico','ajustes'].includes(view)?view:'inicio';document.querySelectorAll('.view-section').forEach(s=>s.classList.toggle('active',s.id===`view-${safe}`));document.querySelectorAll('[data-view]').forEach(a=>a.classList.toggle('active',a.dataset.view===safe));if(location.hash!==`#${safe}`)history.replaceState(null,'',`#${safe}`);window.scrollTo(0,0); }
function modal(title, body, buttons) { const dlg=document.querySelector('#modal');dlg.classList.remove('photo-modal');document.querySelector('#modal-eyebrow').textContent=title;document.querySelector('#modal-content').innerHTML=body+`<div class="modal-actions">${buttons}</div>`;dlg.showModal(); }
function closeModal(){const dlg=document.querySelector('#modal');if(dlg.open)dlg.close();clearPendingReceiptPhoto();clearViewedReceiptPhoto();}
function manualModal(key=todayKey(), currentKind=null) {
  clearPendingReceiptPhoto();
  const now=new Date();const time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const kindOptions=Object.entries(PUNCH_LABELS).map(([k,v])=>`<option value="${k}" ${k===currentKind?'selected':''}>${v}</option>`).join('');
  modal('INCLUIR BATIDA',`<h2>Incluir batida</h2><p>Escolha o tipo de registro e confira a data e o horário antes de salvar.</p><div class="modal-field"><label for="manual-date">Data</label><input id="manual-date" type="date" value="${key}" required></div><div class="modal-field"><label for="manual-kind">Tipo de marcação</label><select id="manual-kind">${kindOptions}</select></div><div class="modal-field"><label for="manual-time">Horário</label><input id="manual-time" type="time" value="${time}" required></div><section class="photo-capture"><input id="receipt-photo-input" class="visually-hidden-input" type="file" accept="image/*" capture="environment" tabindex="-1" aria-label="Foto do comprovante"><button type="button" class="photo-capture-button" data-action="choose-photo">${icon('camera')}<span id="receipt-photo-label">Tirar foto do comprovante</span></button><div id="receipt-photo-preview" class="photo-preview" hidden><img id="receipt-photo-image" alt="Prévia do comprovante"><div class="photo-preview-meta"><span>A foto será anexada a esta batida.</span><button type="button" data-action="remove-photo">Remover</button></div></div><p class="photo-capture-note">A foto fica guardada neste navegador junto com o registro.</p></section><div class="modal-note">O horário será salvo neste navegador. Você pode completar ou apagar registros pelo histórico.</div>`,`<button class="modal-cancel" data-action="close-modal">Cancelar</button><button class="modal-confirm" data-action="save-manual">Incluir batida</button>`);
}
async function showReceiptPhoto(photoId) {
  try {
    const punch=state.punches.find(item=>item.photoId===photoId);
    const blob=await getStoredPhoto(punch);
    if(!blob){showToast('A foto deste comprovante não foi encontrada.');return;}
    const label=punch?`${esc(PUNCH_LABELS[punch.kind])} · ${formatClock(punch.at)}`:'Foto do comprovante';
    clearViewedReceiptPhoto();viewedReceiptUrl=URL.createObjectURL(blob);
    modal('FOTO DO COMPROVANTE',`<figure class="receipt-viewer"><img src="${viewedReceiptUrl}" alt="Foto do comprovante de ${label}"><figcaption>${label}</figcaption></figure>`,`<button class="modal-confirm" data-action="close-modal">Fechar</button>`);
    document.querySelector('#modal').classList.add('photo-modal');
  } catch {
    showToast('Não foi possível abrir a foto neste navegador.');
  }
}
function exportCsv() {
  const rows=[['Data','Horário','Tipo','Origem','Comprovante']];for(const p of [...state.punches].sort((a,b)=>new Date(a.at)-new Date(b.at)))rows.push([dateKey(p.at),formatClock(p.at),PUNCH_LABELS[p.kind],p.manual?'Manual':'Registro',p.photoId?'Foto anexada':'Sem foto']);
  download(`pontua-registros-${dateKey(new Date()).slice(0,7)}.csv`,'\ufeff'+rows.map(r=>r.map(escapeCsv).join(';')).join('\r\n'),'text/csv;charset=utf-8');showToast('Seu histórico foi exportado.');
}
async function backup() {
  try {
    const receiptPhotos=await Promise.all(state.punches.filter(punch=>punch.photoId).map(async punch=>{
      const blob=await getStoredPhoto(punch);
      if(!blob)throw new Error('Uma foto de comprovante não foi encontrada; o backup foi cancelado.');
      return {punchId:punch.id,mimeType:blob.type,dataUrl:await blobToDataUrl(blob)};
    }));
    download(`pontua-backup-${todayKey()}.json`,JSON.stringify({app:'Pontua',version:1,exportedAt:new Date().toISOString(),...state,receiptPhotos},null,2),'application/json');
    showToast('Backup com fotos salvo no dispositivo.');
  } catch(error) {
    showToast(error.message||'Não foi possível criar o backup.');
  }
}

function showAuth(message='') {
  document.querySelector('#auth-screen').hidden=false;
  document.querySelector('.app-shell').hidden=true;
  document.querySelector('#auth-status').textContent=message;
}

async function activateSession(session) {
  const screen=document.querySelector('#auth-screen');
  document.querySelector('#auth-status').textContent='Carregando seus registros seguros…';
  try {
    stateStorageKey=stateKeyForUser(session.user.id);
    pendingSettingsKey=`${stateStorageKey}.pending-settings`;
    cloudStore=createCloudStore(supabaseClient,session.user.id);
    const cached=loadState(localStorage.getItem(stateStorageKey)?stateStorageKey:KEY);
    const remote=await cloudStore.load();
    const remoteIds=new Set(remote.punches.map(punch=>punch.id));
    const pending=cached.punches.filter(punch=>!remoteIds.has(punch.id));
    const localSettingsPending=Boolean(localStorage.getItem(pendingSettingsKey));
    const settings=remote.settings&&!localSettingsPending?remote.settings:cached;
    state={...DEFAULTS,...settings,punches:[...remote.punches]};
    if(!remote.settings||localSettingsPending)await saveCloudSettings();
    for(const punch of pending){
      const photo=punch.photoId?await getPunchPhoto(punch.photoId):null;
      punch.photoPath=await cloudStore.savePunch(punch,photo);
      state.punches.push(punch);
    }
    state.punches.sort((a,b)=>new Date(a.at)-new Date(b.at));
    localStorage.setItem(stateStorageKey,JSON.stringify(state));
    localStorage.removeItem(KEY);
    screen.hidden=true;
    document.querySelector('.app-shell').hidden=false;
    render();navigate(location.hash.slice(1));
  } catch(error) {
    cloudStore=null;
    showAuth(`Não foi possível carregar os dados na nuvem. ${error.message||'Tente novamente.'}`);
  }
}

async function startCloudApp() {
  if(!supabaseConfigured){showAuth('A configuração do Supabase ainda não foi adicionada ao ambiente.');document.querySelector('#auth-submit').disabled=true;return;}
  document.querySelector('#auth-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const button=document.querySelector('#auth-submit');
    const status=document.querySelector('#auth-status');
    button.disabled=true;status.textContent='Enviando link de acesso…';
    try {
      const {error}=await supabaseClient.auth.signInWithOtp({email:document.querySelector('#auth-email').value.trim(),options:{emailRedirectTo:window.location.origin}});
      status.textContent=error?`Não foi possível enviar o link. ${error.message}`:'Confira sua caixa de entrada e abra o link neste dispositivo.';
    } catch {
      status.textContent='Não foi possível enviar o link agora. Verifique sua conexão e tente novamente.';
    } finally {
      button.disabled=false;
    }
  });
  const {data,error}=await supabaseClient.auth.getSession();
  if(error){showAuth('Não foi possível verificar sua sessão. Recarregue a página.');return;}
  if(data.session)await activateSession(data.session);else showAuth();
  supabaseClient.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){cloudStore=null;stateStorageKey=KEY;pendingSettingsKey=null;state={...DEFAULTS};localStorage.removeItem(KEY);showAuth('Você saiu da sua conta.');return;}
    if(session&&event==='SIGNED_IN')void activateSession(session);
  });
}

// Events

document.addEventListener('change', async e=>{
  const input=e.target;
  if(input.id==='settings-target'){
    const match=/^(\d{2}):(\d{2})$/.exec(input.value);
    if(!match){renderSettings();return;}
    const minutes=Number(match[1])*60+Number(match[2]);
    if(minutes<60||minutes>960){renderSettings();showToast('A jornada deve ficar entre 01:00 e 16:00.');return;}
    state.targetMinutes=minutes;saveState();
    try{await saveCloudSettings();showToast('Meta diária atualizada.');}catch{showToast('Meta salva neste dispositivo; falha ao sincronizar.');}
    render();return;
  }
  if(input.id!=='receipt-photo-input')return;
  const file=input.files?.[0];
  if(!file)return;
  const button=document.querySelector('.photo-capture-button');
  if(button)button.disabled=true;
  try {
    const photo=await prepareReceiptPhoto(file);
    clearPendingReceiptPhoto();
    pendingReceiptPhoto=photo;
    pendingReceiptUrl=URL.createObjectURL(photo);
    document.querySelector('#receipt-photo-image').src=pendingReceiptUrl;
    document.querySelector('#receipt-photo-preview').hidden=false;
    document.querySelector('#receipt-photo-label').textContent='Trocar foto do comprovante';
  } catch(error) {
    showToast(error.message||'Não foi possível preparar a foto.');
  } finally {
    input.value='';
    if(button)button.disabled=false;
  }
});

document.addEventListener('click', async e=>{
  const receipt=e.target.closest('[data-view-photo]');if(receipt){await showReceiptPhoto(receipt.dataset.viewPhoto);return;}
  const nav=e.target.closest('[data-view],[data-view-link]');if(nav){e.preventDefault();navigate(nav.dataset.view||nav.dataset.viewLink);return;}
  const editDay=e.target.closest('[data-edit-day]');if(editDay){manualModal(editDay.dataset.editDay);return;}
  const deleteDay=e.target.closest('[data-delete-day]');if(deleteDay){const key=deleteDay.dataset.deleteDay;modal('APAGAR REGISTROS',`<h2>Apagar este dia?</h2><p>Os registros e fotos de ${key.split('-').reverse().join('/')} serão removidos da sua conta e deste dispositivo. Essa ação não pode ser desfeita.</p>`,`<button class="modal-cancel" data-action="close-modal">Cancelar</button><button class="modal-danger" data-action="confirm-delete-day" data-key="${key}">Apagar dia</button>`);return;}
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='choose-photo'){document.querySelector('#receipt-photo-input')?.click();return;}
  if(action==='remove-photo'){clearPendingReceiptPhoto();return;}
  if(action==='settings'){navigate('ajustes');return;}
  if(action==='help'){modal('COMO FUNCIONA',`<h2>Seu registro, do seu jeito.</h2><p>Toque no botão para abrir o registro da próxima etapa. O horário atual vem sugerido, mas você pode alterá-lo antes de confirmar. Também pode adicionar marcações de outros dias pelo histórico. Seus registros são salvos na sua conta e sincronizados pela nuvem.</p><div class="modal-note">Este app é um controle pessoal. Não substitui o sistema oficial de ponto da sua empresa.</div>`,`<button class="modal-confirm" data-action="close-modal">Entendi</button>`);return;}
  if(action==='export'){exportCsv();return;}
  if(action==='backup'){await backup();return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='prev-month'){viewedMonth.setMonth(viewedMonth.getMonth()-1);renderHistory();return;}
  if(action==='next-month'){viewedMonth.setMonth(viewedMonth.getMonth()+1);renderHistory();return;}
  if(action==='target-down'||action==='target-up'){state.targetMinutes=Math.max(60,Math.min(960,state.targetMinutes+(action==='target-up'?1:-1)));saveState();try{await saveCloudSettings();showToast('Meta diária atualizada.');}catch{showToast('Meta salva neste dispositivo; falha ao sincronizar.');}render();return;}
  if(action==='save-name'){state.name=document.querySelector('#name-input').value.trim();saveState();try{await saveCloudSettings();showToast('Preferência salva.');}catch{showToast('Nome salvo neste dispositivo; falha ao sincronizar.');}render();return;}
  if(action==='signout'){await supabaseClient.auth.signOut();return;}
  if(action==='save-manual'){
    if(savingPunch)return;
    const date=document.querySelector('#manual-date').value;const time=document.querySelector('#manual-time').value;const kind=document.querySelector('#manual-kind').value;
    if(!date||!time){showToast('Preencha a data e o horário.');return;}
    let at;try{at=parseLocalDateTime(date,time)}catch{showToast('Confira a data e o horário.');return;}
    const button=document.querySelector('[data-action="save-manual"]');let entry;let photoStored=false;savingPunch=true;if(button)button.disabled=true;
    try {
      entry={...createPunch(kind,at),manual:true};
      if(pendingReceiptPhoto){await putPunchPhoto(entry.id,pendingReceiptPhoto);photoStored=true;entry.photoId=entry.id;}
      state.punches.push(entry);
      try{saveState();}catch(error){state.punches=state.punches.filter(punch=>punch.id!==entry.id);throw error;}
    } catch {
      if(photoStored&&entry)await deletePunchPhotos([entry.id]).catch(()=>{});
      if(button){button.disabled=false;button.textContent='Tentar novamente';}
      showToast(pendingReceiptPhoto?'Não foi possível guardar a foto. Verifique o espaço do navegador e tente novamente.':'Não foi possível guardar a marcação.');
      return;
    } finally {
      savingPunch=false;
    }
    let syncFailed=false;
    try{await saveCloudPunch(entry);}catch{syncFailed=true;}
    closeModal();render();showToast(syncFailed?'Batida guardada neste dispositivo; sincronização pendente.':`${PUNCH_LABELS[kind]} registrada às ${formatClock(at)}.`);return;
  }
  if(action==='confirm-delete-day'){
    const key=e.target.closest('[data-action]').dataset.key;
    const removed=state.punches.filter(punch=>dateKey(punch.at)===key);
    try{if(cloudStore)await cloudStore.deletePunches(removed);await deletePunchPhotos(removed.map(punch=>punch.photoId));}catch{showToast('Não foi possível apagar os registros e fotos. Seus dados locais foram mantidos.');return;}
    state.punches=state.punches.filter(punch=>dateKey(punch.at)!==key);saveState();closeModal();render();showToast('Registros do dia apagados.');return;
  }
  if(action==='reset'){modal('APAGAR DADOS',`<h2>Começar do zero?</h2><p>Todos os seus registros, fotos e preferências serão apagados da sua conta e deste navegador.</p>`,`<button class="modal-cancel" data-action="close-modal">Manter dados</button><button class="modal-danger" data-action="confirm-reset">Apagar tudo</button>`);return;}
  if(action==='confirm-reset'){
    try{if(cloudStore){await cloudStore.deletePunches(state.punches);await cloudStore.deleteSettings();}}catch{showToast('Não foi possível apagar os dados da nuvem. Seus dados foram mantidos.');return;}
    if(state.punches.some(punch=>punch.photoId)){
      try{await clearPunchPhotos();}catch{showToast('Não foi possível apagar as fotos. Seus dados foram mantidos.');return;}
    }
    localStorage.removeItem(stateStorageKey);if(pendingSettingsKey)localStorage.removeItem(pendingSettingsKey);state={...DEFAULTS};closeModal();render();showToast('Seus dados locais foram apagados.');return;
  }
});

document.querySelector('#punch-button').addEventListener('click',()=>{const punches=dayPunches(todayKey());manualModal(todayKey(),nextKind(punches));});
document.querySelector('#modal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});
document.querySelector('#modal').addEventListener('close',()=>{clearPendingReceiptPhoto();clearViewedReceiptPhoto();});
window.addEventListener('hashchange',()=>{if(!document.querySelector('.app-shell').hidden)navigate(location.hash.slice(1));});
void startCloudApp();
setInterval(()=>{if(!document.querySelector('.app-shell').hidden)renderClock();},15000);
