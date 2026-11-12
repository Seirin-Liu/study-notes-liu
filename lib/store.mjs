import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {Schema,formulaErrors} from './formula-engine.mjs';

const digest=s=>createHash('sha256').update(s).digest('hex');
const subjects=Schema.subjects;

export class LocalStore {
  constructor(directory){this.directory=directory;this.file=path.join(directory,'questions.json');this.subjectDirectory=path.join(directory,'subjects');this.settingsFile=path.join(directory,'settings.json');this.marker=path.join(directory,'storage-v1.json');this.queue=Promise.resolve();}
  subjectFile(subject){return path.join(this.subjectDirectory,subject+'.json');}
  async checkImages(q){for(const image of q.images||[]){const filename=path.resolve(this.directory,'assets',q.id,image.file);const base=path.resolve(this.directory,'assets',q.id);if(!filename.startsWith(base+path.sep))throw Object.assign(Error('题图路径不可访问'),{status:422});try{const stat=await fs.stat(filename);if(!stat.isFile()||stat.size>10*1024*1024)throw Error('题图过大');}catch{throw Object.assign(Error(q.id+' 缺少题图：'+image.file),{status:422});}}}
  async migrate(){
    await fs.mkdir(this.subjectDirectory,{recursive:true});
    let legacy;try{legacy=JSON.parse(await fs.readFile(this.file,'utf8'));}catch{throw Object.assign(Error('data/questions.json 不是有效 JSON；请修正文件，原数据未覆盖。'),{status:422});}
    if(!legacy||![1,2].includes(legacy.version)||!Array.isArray(legacy.questions)||legacy.questions.length>3000)throw Object.assign(Error('题库格式不正确，需 version: 2 和 questions 数组（最多 3000 题）。'),{status:422});
    for(const subject of subjects){const questions=legacy.questions.filter(q=>q.subject===subject).map(Schema.normalize);await fs.writeFile(this.subjectFile(subject),JSON.stringify({version:2,subject,questions},null,2)+'\n',{flag:'wx'}).catch(async error=>{if(error.code==='EEXIST')throw Object.assign(Error('学科分文件已存在但迁移标记缺失，请先检查 data/subjects。'),{status:422});throw error;});}
    await fs.writeFile(this.settingsFile,JSON.stringify(Schema.settings(legacy.settings),null,2)+'\n',{flag:'wx'});
    await fs.writeFile(this.marker,JSON.stringify({version:1,source:'questions.json',migratedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
  }
  async ensureSplit(){try{await fs.access(this.marker);}catch{await this.migrate();}}
  async read(){
    await this.ensureSplit();
    const questions=[];const ids=new Set();
    for(const subject of subjects){let parsed;try{parsed=JSON.parse(await fs.readFile(this.subjectFile(subject),'utf8'));}catch{throw Object.assign(Error('data/subjects/'+subject+'.json 不是有效 JSON。'),{status:422});}
      if(!parsed||parsed.version!==2||parsed.subject!==subject||!Array.isArray(parsed.questions))throw Object.assign(Error(subject+' 学科题库格式不正确。'),{status:422});
      for(const q of parsed.questions){const errors=Schema.errors(q);if(q.subject!==subject)errors.push('题目学科与分文件不一致');if(ids.has(q.id))errors.push('题目 id 重复');if(errors.length)throw Object.assign(Error((q?.id||'未知题目')+'：'+errors.join('；')),{status:422});ids.add(q.id);await this.checkImages(q);questions.push(Schema.normalize(q));}
    }
    let settings;try{settings=Schema.settings(JSON.parse(await fs.readFile(this.settingsFile,'utf8')));}catch{throw Object.assign(Error('data/settings.json 不是有效 JSON。'),{status:422});}
    const canonical=JSON.stringify({version:2,questions,settings});
    return {version:2,questions,settings,revision:digest(canonical),formulaIssues:questions.flatMap(formulaErrors)};
  }
  save(payload,expectedRevision){
    const task=this.queue.then(async()=>{
      const before=await this.read();if(expectedRevision!==before.revision)throw Object.assign(Error('题库已被其他窗口或 Codex 更新。请先同步本地文件，再保存。'),{status:409});
      if(!Array.isArray(payload?.questions)||payload.questions.length>3000)throw Object.assign(Error('题库格式不正确或超过 3000 题。'),{status:422});
      const seen=new Set();for(const q of payload.questions){const errors=Schema.errors(q);if(seen.has(q.id))errors.push('id 重复');seen.add(q.id);if(errors.length)throw Object.assign(Error(errors.join('；')),{status:422});await this.checkImages(q);const formula=formulaErrors(q);if(formula.length)throw Object.assign(Error(q.topic+' 公式语法错误：'+formula[0].message),{status:422});}
      const next={version:2,questions:payload.questions.map(Schema.normalize),settings:Schema.settings(payload.settings)};
      const history=path.join(this.directory,'history');await fs.mkdir(history,{recursive:true});
      if(JSON.stringify(before.questions)!==JSON.stringify(next.questions))await fs.writeFile(path.join(history,Date.now()+'-'+randomUUID()+'.json'),JSON.stringify({version:2,questions:before.questions,settings:before.settings},null,2)+'\n',{flag:'wx'});
      const files=subjects.map(subject=>[this.subjectFile(subject),JSON.stringify({version:2,subject,questions:next.questions.filter(q=>q.subject===subject)},null,2)+'\n']);files.push([this.settingsFile,JSON.stringify(next.settings,null,2)+'\n']);
      const originals=new Map();for(const [file] of files){try{originals.set(file,await fs.readFile(file));}catch(error){if(error.code!=='ENOENT')throw error;originals.set(file,null);}}
      const staged=[];
      try{for(const [file,content] of files){const temp=file+'.'+randomUUID()+'.tmp';await fs.writeFile(temp,content,{flag:'wx'});staged.push([file,temp]);}
        const current=await this.read();if(current.revision!==before.revision)throw Object.assign(Error('写入期间本地文件发生变化，已停止保存，请同步后重试。'),{status:409});
        for(const [file,temp] of staged)await fs.rename(temp,file);
      }catch(error){for(const [file,bytes] of originals){if(bytes===null)await fs.rm(file,{force:true});else await fs.writeFile(file,bytes);}throw error;}
      finally{for(const [,temp] of staged)await fs.rm(temp,{force:true});}
      return this.read();
    });this.queue=task.catch(()=>{});return task;
  }
}
