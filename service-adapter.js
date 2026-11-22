// Runs in the isolated preload, only reads counters/accessible navigation labels.
// Never scans message contents or exports message text.
function observeServiceCounters(report) {
  const host = location.hostname;
  const supported = ['web.whatsapp.com','web.telegram.org','mail.google.com','outlook.cloud.microsoft','outlook.office.com','outlook.live.com'].includes(host);
  if (!supported || window.top !== window) return;
  function number(s) {if(!s)return null;const m=String(s).replace(/[\u200e\u200f]/g,'').match(/^\s*(\d[\d.,\s]*)(\+)?\s*$/);return m?Math.min(99999,Number(m[1].replace(/\D/g,''))):null;}
  function titleCount(){const m=document.title.match(/^\s*\((\d+)\)|(?:Inbox|Recibidos|Bandeja de entrada)\s*\((\d+)\)/i);return m?Number(m[1]||m[2]):null;}
  let previous='';
  function sample() {
    let count=null,unit='messages',source='title';
    if(host==='mail.google.com') {
      const inbox=document.querySelector('a[href$="#inbox"][title]');
      const m=inbox?.getAttribute('title')?.match(/(?:Inbox|Recibidos|Bandeja de entrada)\s*\((\d+)\)/i);
      if(m){count=Number(m[1]);source='Gmail'}
    } else if(host.startsWith('outlook.')) {
      const nodes=[...document.querySelectorAll('[role="treeitem"][aria-label], [role="treeitem"][title]')];
      const inbox=nodes.find(n=>/^(Bandeja de entrada|Inbox)\b/i.test(n.getAttribute('aria-label')||n.getAttribute('title')||''));
      const label=inbox?.getAttribute('aria-label')||inbox?.getAttribute('title')||'';
      const m=label.match(/(\d+)\s*(?:no le[ií]dos|unread)/i);
      if(m){count=Number(m[1]);source='Outlook'}
    } else if(host==='web.whatsapp.com') {
      const badges=[...document.querySelectorAll('#pane-side [aria-label]')].filter(n=>/^\d+ (?:mensajes? no le[ií]dos?|unread messages?)$/i.test(n.getAttribute('aria-label')||''));
      if(badges.length){count=badges.reduce((sum,n)=>sum+parseInt(n.getAttribute('aria-label'),10),0);source='WhatsApp'}
    } else if(host==='web.telegram.org') {
      const candidates=[...document.querySelectorAll('.chatlist .badge.unread, .chat-list .badge.unread')].filter(n=>n.getClientRects().length);
      const values=candidates.map(n=>number(n.textContent)).filter(n=>n!==null);
      if(values.length){count=values.reduce((a,b)=>a+b,0);source='Telegram'}
    }
    if(count===null)count=titleCount();
    if(count===null){report({count:null,source:'unavailable',unit});previous='';return;}
    count=Math.min(99999,count);const key=count+'|'+source;if(key!==previous){previous=key;report({count,source,unit})}
  }
  let timer;const observer=new MutationObserver(()=>{if(!timer)timer=setTimeout(()=>{timer=null;sample()},1500)});
  const start=()=>{observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-label','title']});sample();setInterval(sample,20000)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
module.exports={observeServiceCounters};
