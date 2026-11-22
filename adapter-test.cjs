const vm=require('vm'),assert=require('assert/strict'),{observeServiceCounters}=require('./service-adapter');
function sample(host,fixture,title=''){const reports=[];const window={};window.top=window;const context={window,location:{hostname:host},document:{readyState:'complete',title,documentElement:{},querySelector:()=>fixture.one||null,querySelectorAll:selector=>fixture.many||[]},MutationObserver:class{observe(){}},setInterval:()=>{},setTimeout:()=>{},report:p=>reports.push(p)};vm.runInNewContext('('+observeServiceCounters.toString()+')(report)',context);return reports.at(-1)}
assert.equal(sample('mail.google.com',{one:{getAttribute:()=> 'Recibidos (12)'}}).count,12);
assert.equal(sample('outlook.cloud.microsoft',{many:[{getAttribute:()=> 'Bandeja de entrada 4 no leídos'}]}).count,4);
assert.equal(sample('web.whatsapp.com',{many:[{getAttribute:()=> '3 mensajes no leídos'},{getAttribute:()=> '2 unread messages'}]}).count,5);
assert.equal(sample('web.telegram.org',{many:[{getClientRects:()=>[1],textContent:'7'}]}).count,7);
assert.equal(sample('mail.google.com',{},'(9) Gmail').count,9);assert.equal(sample('mail.google.com',{},'Gmail').count,null);
console.log('PASS Gmail, Outlook, WhatsApp, Telegram, title fallback, unknown counter');
