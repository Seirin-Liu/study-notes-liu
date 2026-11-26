import http from 'node:http';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import {BlockList} from 'node:net';
import {networkInterfaces} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalStore} from './lib/store.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export function createApp({dataDirectory=process.env.ZHIXU_DATA_DIR||path.join(root,'data'),store=new LocalStore(dataDirectory),lan}={}){
 const subnet=lan?new BlockList():null;
 if(lan)subnet.addSubnet(lan.address,lan.prefix);
 return http.createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   const host=req.headers.host||'';
   if(lan){
    const port=req.socket.localPort;
    if((host!==lan.address+':'+port&&!(port===80&&host===lan.address))||!subnet.check(req.socket.remoteAddress||'')){
     return send(403,{error:'仅允许通过配置的局域网地址访问。'});
    }
   }else if(!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d{1,5})?$/i.test(host))return send(403,{error:'仅允许本机地址访问。'});
   const origin=new URL('http://'+host).origin;
   const url=new URL(req.url,origin);
   if(url.origin!==origin||(req.headers.origin&&req.headers.origin!==origin))return send(403,{error:'拒绝跨站访问本地题库。'});
   const pageNavigation=req.method==='GET'&&req.headers['sec-fetch-mode']==='navigate'&&req.headers['sec-fetch-dest']==='document'&&!url.pathname.startsWith('/api/');
   if(req.headers['sec-fetch-site']==='cross-site'&&!pageNavigation)return send(403,{error:'拒绝跨站访问本地题库。'});
   if(url.pathname==='/api/health')return send(200,{ok:true,mode:'local-files',version:2});
   const upload=url.pathname.match(/^\/api\/assets\/([-a-zA-Z0-9_]{1,80})$/);
   if(upload&&req.method==='POST'){
    if(req.headers['x-zhixu-local']!=='1')return send(403,{error:'本地图片上传请求格式不正确。'});
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024)return send(413,{error:'单张图片不能超过10 MB。'});chunks.push(chunk);}
    const bytes=Buffer.concat(chunks);
    const ext=bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))?'png':bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':bytes.length>=16&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'webp':null;
    if(!ext)return send(422,{error:'请选择有效的PNG、JPEG或WebP图片。'});
    const file='image-'+randomUUID()+'.'+ext,dir=path.join(dataDirectory,'assets',upload[1]);
    await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,file),bytes,{flag:'wx'});
    return send(201,{file});
   }
   if(url.pathname==='/api/library'){
    if(req.method==='GET')return send(200,url.searchParams.has('sync')?await store.readForSync(url.searchParams.get('sync')):await store.read());
    if(req.method==='PUT'||req.method==='PATCH'){
     if(req.headers['x-zhixu-local']!=='1'||!req.headers['content-type']?.startsWith('application/json'))return send(403,{error:'本地保存请求格式不正确。'});
     let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>10*1024*1024)return send(413,{error:'题库文件超过 10 MB。'});}
     let data;try{data=JSON.parse(body);}catch{return send(400,{error:'JSON 解析失败。'});}
     const revision=req.headers['if-match'];
     if(req.method==='PUT')return send(200,await store.save(data,revision));
     if(data?.question)return send(200,await store.saveQuestion(data.question,revision));
     if(data?.settings)return send(200,await store.saveSettings(data.settings,revision));
     return send(200,await store.saveMastery(data||{},revision));
    }
    return send(405,{error:'不支持的请求方法。'});
   }
   if(!['GET','HEAD'].includes(req.method))return send(405,{error:'不支持的请求方法。'});
   const pageRoutes={'/':'/index.html','/overview':'/index.html','/review':'/index.html','/chemistry':'/index.html','/biology':'/index.html','/math':'/index.html','/physics':'/index.html','/chinese':'/index.html','/english':'/index.html','/examples':'/format-guide.html'};const relative=decodeURIComponent(pageRoutes[url.pathname]||(/^\/(chemistry|biology|math|physics|chinese|english)\/edit\/(new|[-a-zA-Z0-9_]+)$/.test(url.pathname)?'/index.html':url.pathname));let file,publicDir;
   if(relative.startsWith('/assets/')){const parts=relative.split('/');if(parts.length!==4||!/^[-a-zA-Z0-9_]{1,80}$/.test(parts[2])||!/^[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/i.test(parts[3]))return send(403,{error:'题图路径不可访问。'});publicDir=path.resolve(dataDirectory,'assets');file=path.resolve(publicDir,parts[2],parts[3]);}
   else{publicDir=path.join(root,'dist');file=path.resolve(publicDir,'.'+relative);}
   if(!file.startsWith(publicDir+path.sep))return send(403,{error:'路径不可访问。'});
   const ext=path.extname(file).toLowerCase();const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
   const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'"});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(e){send(e.status|| (e.code==='ENOENT'?404:500),{error:e.status?e.message:e.code==='ENOENT'?'未找到本地文件。':'本地服务发生错误，请查看终端。'});if(!e.status&&e.code!=='ENOENT')console.error(e);}
 });
}
function pickLanInterface(address){
 const privateAddress=/^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/;
 const available=Object.values(networkInterfaces()).flat().filter(entry=>entry.family==='IPv4'&&!entry.internal&&entry.cidr&&privateAddress.test(entry.address));
 const selected=address?available.find(entry=>entry.address===address):available.length===1?available[0]:null;
 if(!selected)throw Error('请用 --lan 指定本机局域网 IPv4 地址。可选：'+(available.map(entry=>entry.address).join('、')||'无'));
 return {address:selected.address,prefix:Number(selected.cidr.split('/')[1])};
}
function listen(server,port,host){
 return new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(port,host,()=>{server.removeListener('error',reject);resolve();});
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const portArg=process.argv.indexOf('--port'),lanArg=process.argv.indexOf('--lan');
 const port=Number(portArg>=0?process.argv[portArg+1]:(process.env.PORT||4318));
 const dataDirectory=process.env.ZHIXU_DATA_DIR||path.join(root,'data');
 const listeners=[];
 try{
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('端口必须是 1 至 65535 之间的整数。');
  const requested=process.argv[lanArg+1];
  const lan=lanArg>=0?pickLanInterface(requested&&!requested.startsWith('--')?requested:undefined):null;
  const store=new LocalStore(dataDirectory);
  const localServer=createApp({store});
  await listen(localServer,port,'127.0.0.1');
  listeners.push(localServer);
  if(lan){
   const lanServer=createApp({store,lan});
   await listen(lanServer,port,lan.address);
   listeners.push(lanServer);
  }
  console.log(`本机访问：http://127.0.0.1:${port}/`);
  if(lan)console.log(`同一局域网访问：http://${lan.address}:${port}/`);
  console.log('题库目录：'+dataDirectory);
  console.log('按 Ctrl+C 停止。公式与字体均从本机加载。');
 }catch(error){
  for(const server of listeners)server.close();
  console.error(error.code==='EADDRINUSE'?`端口 ${port} 已被占用。请关闭已有实例或设置 PORT。`:error.message);
  process.exitCode=1;
 }
}
