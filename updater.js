const {app,dialog}=require('electron');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFile,spawn}=require('child_process');
const run=(cmd,args)=>new Promise((resolve,reject)=>execFile(cmd,args,(err,out)=>err?reject(err):resolve(out.trim())));
const repository='https://github.com/gcolino21-boop/nexo-desktop';
function newer(a,b){const aa=a.split('.').map(Number),bb=b.split('.').map(Number);for(let i=0;i<3;i++){if(aa[i]!==bb[i])return aa[i]>bb[i]}return false}
function acknowledge(){
 try {const p=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'update-pending.json'),'utf8'));
 if(p.version===app.getVersion()&&p.destination===app.getPath('exe').split('/Contents/')[0]&&typeof p.token==='string'&&p.receipt.startsWith(app.getPath('userData')+path.sep))fs.writeFileSync(p.receipt,p.token,{mode:0o600});
 }catch{}
}
function setup(api){let busy=false;let state={phase:'idle',percent:0,message:''};const set=(phase,percent,message)=>{state={phase,percent,message};api.update()};
async function install(source){
 if(!source.endsWith('.app'))throw Error('Selecciona una aplicación Nexo.app.');
 const plist=path.join(source,'Contents/Info.plist');if(await run('/usr/libexec/PlistBuddy',['-c','Print :CFBundleIdentifier',plist])!=='local.nexo.desktop')throw Error('El archivo no es Nexo.');
 const version=await run('/usr/libexec/PlistBuddy',['-c','Print :CFBundleShortVersionString',plist]);if(!/^\d+\.\d+\.\d+$/.test(version)||!newer(version,app.getVersion()))throw Error('Selecciona una versión más reciente.');
 await run('/usr/bin/codesign',['--verify','--deep','--strict',source]);
 const destination=app.getPath('exe').split('/Contents/')[0];if(!destination.endsWith('.app'))throw Error('Instala esta actualización desde Nexo.app.');
 const answer=await dialog.showMessageBox(api.window(),{message:'Instalar Nexo '+version+' y reiniciar',detail:'Se conservarán tus cuentas y una copia de la versión anterior. Si la nueva versión no inicia en 60 segundos, se restaurará la anterior. Firma local sin certificación de editor de Apple.',buttons:['Cancelar','Instalar'],defaultId:0,cancelId:0});if(answer.response!==1)return;
 set('staging',0,'Preparando una copia verificada…');
 const id=Date.now()+'-'+crypto.randomBytes(4).toString('hex'),stage=destination+'.update-'+id,previous=destination+'.previous-'+id;
 const job=path.join(app.getPath('userData'),'updates',id);fs.mkdirSync(job,{recursive:true,mode:0o700});
 await run('/usr/bin/ditto',[source,stage]);await run('/usr/bin/codesign',['--verify','--deep','--strict',stage]);
 const receipt=path.join(job,'ready'),result=path.join(job,'result'),token=crypto.randomBytes(24).toString('hex');
 fs.writeFileSync(path.join(app.getPath('userData'),'update-pending.json'),JSON.stringify({version,destination,receipt,result,previous,token}),{mode:0o600});
 const helper=path.join(job,'install.sh');fs.copyFileSync(path.join(__dirname,'update-helper.sh'),helper);fs.chmodSync(helper,0o700);
 set('restarting',100,'Reiniciando; se comprobará el arranque…');
 spawn('/bin/sh',[helper,String(process.pid),destination,stage,previous,receipt,result,token],{detached:true,stdio:'ignore'}).unref();app.quit();
}
async function command(cmd,p={}){
 if(!['online-update','install-update'].includes(cmd))return false;if(busy)throw Error('Ya hay una actualización en curso.');busy=true;
 try{
 if(cmd==='install-update'){const r=await dialog.showOpenDialog(api.window(),{title:'Selecciona Nexo.app',properties:['openFile','openDirectory'],filters:[{name:'Aplicación',extensions:['app']}]});if(!r.canceled)await install(r.filePaths[0]);return true;}
 set('checking',0,'Consultando la última versión…');const response=await fetch(repository+'/releases/latest/download/latest.json',{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('No se pudo consultar la actualización.');const manifest=await response.json();
 if(!/^\d+\.\d+\.\d+$/.test(manifest.version)||!(/^[a-f0-9]{64}$/i.test(manifest.sha256)))throw Error('Manifiesto no válido.');
 if(!newer(manifest.version,app.getVersion())){set('current',100,'Ya tienes la última versión: '+app.getVersion());return true;}
 const r=await dialog.showMessageBox(api.window(),{message:'Nexo '+manifest.version+' disponible',buttons:['Cancelar','Descargar'],cancelId:0,defaultId:0});if(r.response!==1){set('idle',0,'Descarga cancelada');return true;}
 const url=repository+'/releases/download/v'+manifest.version+'/Nexo-arm64.zip';const res=await fetch(url,{signal:AbortSignal.timeout(180000)});if(!res.ok)throw Error('No se pudo descargar la actualización.');
 const total=Number(res.headers.get('content-length'))||0;const dir=fs.mkdtempSync(path.join(app.getPath('temp'),'nexo-download-')),zip=path.join(dir,'update.zip'),handle=fs.openSync(zip,'wx',0o600);const hash=crypto.createHash('sha256');let bytes=0,last=-1;
 try{for await(const chunk of res.body){bytes+=chunk.length;if(bytes>450000000)throw Error('La descarga supera el tamaño permitido.');fs.writeSync(handle,chunk);hash.update(chunk);const percent=total?Math.min(99,Math.floor(bytes/total*100)):0;if(percent!==last){last=percent;set('downloading',percent,'Descargando '+Math.round(bytes/1048576)+' MB…')}}}finally{fs.closeSync(handle)}
 set('verifying',100,'Comprobando la descarga…');if(hash.digest('hex')!==manifest.sha256)throw Error('La descarga no supera la verificación SHA-256.');await run('/usr/bin/ditto',['-x','-k',zip,dir]);await install(path.join(dir,'Nexo.app'));if(state.phase!=='restarting')set('idle',0,'Instalación cancelada');return true;
 }catch(e){set('error',0,e.message);throw e}finally{busy=false}
}
return {command,snapshot:()=>state};}
module.exports={setup,acknowledge,newer};
