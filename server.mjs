import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalStore} from './lib/store.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export function createApp({dataDirectory=process.env.ZHIXU_DATA_DIR||path.join(root,'data')}={}){
 const store=new LocalStore(dataDirectory);
 return http.createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   const requestHost=(req.headers.host||'').split(':')[0];if(!['127.0.0.1','localhost','['].includes(requestHost))return send(403,{error:'仅允许本机地址访问。'});
   const url=new URL(req.url,'http://'+req.headers.host);
   if(req.headers.origin&&req.headers.origin!==url.origin)return send(403,{error:'拒绝跨站访问本地题库。'});
   if(req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'拒绝跨站访问本地题库。'});
   if(url.pathname==='/api/health')return send(200,{ok:true,mode:'local-files',version:2});
   if(url.pathname==='/api/library'){
    if(req.method==='GET')return send(200,await store.read());
    if(req.method==='PUT'){
     if(req.headers['x-zhixu-local']!=='1'||!req.headers['content-type']?.startsWith('application/json'))return send(403,{error:'本地保存请求格式不正确。'});
     let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>10*1024*1024)return send(413,{error:'题库文件超过 10 MB。'});}
     let data;try{data=JSON.parse(body);}catch{return send(400,{error:'JSON 解析失败。'});}
     return send(200,await store.save(data,req.headers['if-match']));
    }
    return send(405,{error:'不支持的请求方法。'});
   }
   if(!['GET','HEAD'].includes(req.method))return send(405,{error:'不支持的请求方法。'});
   const relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const file=path.resolve(root,'dist','.'+relative);const publicDir=path.join(root,'dist');if(!file.startsWith(publicDir+path.sep))return send(403,{error:'路径不可访问。'});
   const ext=path.extname(file);const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
   const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'"});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(e){send(e.status|| (e.code==='ENOENT'?404:500),{error:e.status?e.message:e.code==='ENOENT'?'未找到本地文件。':'本地服务发生错误，请查看终端。'});if(!e.status&&e.code!=='ENOENT')console.error(e);}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const portArg=process.argv.indexOf('--port');const port=Number(portArg>=0?process.argv[portArg+1]:(process.env.PORT||4318));const server=createApp();server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已被占用。请关闭已有实例或设置 PORT。`:e.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>{console.log(`知序本地站已启动：http://127.0.0.1:${port}/`);console.log('题库文件：'+path.join(process.env.ZHIXU_DATA_DIR||path.join(root,'data'),'questions.json'));console.log('按 Ctrl+C 停止。公式与字体均从本机加载。');});
}
