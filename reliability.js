const crypto = require('crypto');
function quietNow(schedule, date = new Date()) {
  if (!schedule?.enabled || !/^\d{2}:\d{2}$/.test(schedule.start) || !/^\d{2}:\d{2}$/.test(schedule.end)) return false;
  const parse = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const minute = date.getHours() * 60 + date.getMinutes();
  const start = parse(schedule.start), end = parse(schedule.end), day = date.getDay();
  const days = Array.isArray(schedule.days) ? schedule.days : [0,1,2,3,4,5,6];
  if (start === end) return days.includes(day);
  if (start < end) return days.includes(day) && minute >= start && minute < end;
  return (minute >= start && days.includes(day)) || (minute < end && days.includes((day + 6) % 7));
}
function validateSchedule(value) {
  const validTime = t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  if (!value || typeof value.enabled !== 'boolean' || !validTime(value.start) || !validTime(value.end) || !Array.isArray(value.days) || value.days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw Error('Horario no válido.');
  return {enabled:value.enabled, start:value.start, end:value.end, days:[...new Set(value.days)]};
}
const booleans = ['restore','dnd'];
function exportConfiguration(config) {
  return {format:'nexo-settings',version:1,exportedAt:new Date().toISOString(),accounts:config.accounts.map(a=>({name:a.name,url:a.url,color:a.color,icon:a.icon,...Object.fromEntries(['muted','favorite','notifications','sound','keepAwake'].filter(k=>typeof a[k]==='boolean').map(k=>[k,a[k]]))})),settings:{...Object.fromEntries(booleans.filter(k=>typeof config.settings[k]==='boolean').map(k=>[k,config.settings[k]])),suspendMinutes:config.settings.suspendMinutes,quietSchedule:config.settings.quietSchedule}};
}
function importConfiguration(data, existing) {
  if(data?.format!=='nexo-settings'||data.version!==1||!Array.isArray(data.accounts)||data.accounts.length>100) throw Error('Este archivo no es una copia de configuración compatible.');
  const used = new Set();
  const accounts = data.accounts.map(a=>{
    let url;try{url=new URL(a.url)}catch{throw Error('Una cuenta contiene una dirección no válida.')}
    if(url.protocol!=='https:'||url.username||url.password||typeof a.name!=='string'||!a.name.trim()||a.name.length>60)throw Error('Una cuenta contiene un nombre o dirección no válido.');
    // Reuse only matching local entries; never trust imported partition identifiers.
    const match=existing.find(e=>!used.has(e.id)&&e.name===a.name&&new URL(e.url).href===url.href);const id=match?.id||crypto.randomUUID();used.add(id);
    return {id,name:a.name,url:url.href,color:/^#[0-9a-f]{6}$/i.test(a.color)?a.color:'#8a79e6',icon:typeof a.icon==='string'?[...a.icon].slice(0,2).join(''):a.name[0],...Object.fromEntries(['muted','favorite','notifications','sound','keepAwake'].filter(k=>typeof a[k]==='boolean').map(k=>[k,a[k]]))};
  });
  const settings={...Object.fromEntries(booleans.filter(k=>typeof data.settings?.[k]==='boolean').map(k=>[k,data.settings[k]]))};
  if([0,1,5,15,30,60].includes(data.settings?.suspendMinutes))settings.suspendMinutes=data.settings.suspendMinutes;
  if(data.settings?.quietSchedule)settings.quietSchedule=validateSchedule(data.settings.quietSchedule);
  return {accounts,settings};
}
module.exports={quietNow,validateSchedule,exportConfiguration,importConfiguration};
