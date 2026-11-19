// Nexo does not implement a native passkey prompt. Fail this unsupported
// request explicitly, so Microsoft's page can offer its allowed alternatives.
const { contextBridge } = require('electron');
contextBridge.executeInMainWorld({func:()=>{
 if(!['login.microsoft.com','login.microsoftonline.com','login.live.com'].includes(location.hostname)) return;
 const credentials=navigator.credentials;if(!credentials)return;
 const original=credentials.get.bind(credentials);
 Object.defineProperty(credentials,'get',{configurable:true,value:function(options){
  if(options?.publicKey)return Promise.reject(new DOMException('Passkey sign-in is unavailable in Nexo. Choose another sign-in method.','NotAllowedError'));
  return original(options);
 }});
}});

const {ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('nexoNotify',{send:title=>ipcRenderer.send('nexo-notification',{title:String(title).slice(0,180)})});
contextBridge.executeInMainWorld({func:()=>{
 const Original=window.Notification;if(!Original)return;
 class NexoNotification extends EventTarget {
  constructor(title,options={}){super();window.nexoNotify.send(String(title));this.title=String(title);this.body=options.body||'';}
  close(){} static get permission(){return 'granted'}
  static requestPermission(callback){callback?.('granted');return Promise.resolve('granted')}
 }
 Object.defineProperty(window,'Notification',{configurable:true,value:NexoNotification});
}});
