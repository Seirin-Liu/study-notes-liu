import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {Schema,formulaErrors} from './formula-engine.mjs';

const digest=s=>createHash('sha256').update(s).digest('hex');
const libraryRevision=(questions,settings)=>digest(JSON.stringify({version:2,questions,settings}));
// Review-state fields: they change often but never alter question content.
const STATE_FIELDS=['mastered','updatedAt'];
const SNAPSHOT_WINDOW_MS=10*60*1000;
const contentKey=questions=>JSON.stringify(questions.map(q=>{const copy={...q};for(const field of STATE_FIELDS)delete copy[field];return copy;}));
// True when two libraries hold the same questions with the same content and
// differ only by review state.
export const isStateOnlyChange=(a,b)=>a.length===b.length&&contentKey(a)===contentKey(b);
const subjects=Schema.subjects;
const editableQuestionFields=new Set(['subject','topic','kind','question','answer','answerType','options','explanation','notes','source','originalNumber','images','mastered','demo']);
const printSettingFields=new Set(Object.keys(Schema.settings()));
const invalidPatch=message=>Object.assign(Error(message),{status:422});
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

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
  async syncToken(){
    const files=[this.marker,this.settingsFile,...subjects.map(subject=>this.subjectFile(subject))];
    const stamps=await Promise.all(files.map(file=>fs.stat(file,{bigint:true}))).catch(()=>null);
    return stamps?digest(stamps.map(stat=>[stat.dev,stat.ino,stat.size,stat.mtimeNs,stat.ctimeNs].join(':')).join('|')):null;
  }
  async readStable(options){
    const before=await this.syncToken();
    const library=await this.read(options);
    const after=await this.syncToken();
    return {...library,syncToken:before===after?after:null};
  }
  async readForSync(previousToken){
    await this.queue;
    const current=await this.syncToken();
    if(current&&current===this.validatedSync?.token&&current===previousToken)return {unchanged:true};
    const library=await this.readStable();
    if(library.syncToken)this.validatedSync={token:library.syncToken,formulaIssues:library.formulaIssues};
    return library;
  }
  async confirmSavedSync(library,formulaIssues){
    if(!formulaIssues)return {...library,syncToken:null};
    // A file written by Codex during this save must still be sent on the next poll.
    const persisted=await this.readStable({inspect:false}).catch(()=>null);
    if(!persisted?.syncToken||persisted.revision!==library.revision)return {...library,syncToken:null};
    this.validatedSync={token:persisted.syncToken,formulaIssues};
    return {...library,syncToken:persisted.syncToken,formulaIssues};
  }
  async read({inspect=true}={}){
    await this.ensureSplit();
    const questions=[];const ids=new Set();
    for(const subject of subjects){let parsed;try{parsed=JSON.parse(await fs.readFile(this.subjectFile(subject),'utf8'));}catch{throw Object.assign(Error('data/subjects/'+subject+'.json 不是有效 JSON。'),{status:422});}
      if(!parsed||parsed.version!==2||parsed.subject!==subject||!Array.isArray(parsed.questions))throw Object.assign(Error(subject+' 学科题库格式不正确。'),{status:422});
      for(const q of parsed.questions){const errors=Schema.errors(q);if(q.subject!==subject)errors.push('题目学科与分文件不一致');if(ids.has(q.id))errors.push('题目 id 重复');if(errors.length)throw Object.assign(Error((q?.id||'未知题目')+'：'+errors.join('；')),{status:422});ids.add(q.id);if(inspect)await this.checkImages(q);questions.push(Schema.normalize(q));}
    }
    let settings;try{settings=Schema.settings(JSON.parse(await fs.readFile(this.settingsFile,'utf8')));}catch{throw Object.assign(Error('data/settings.json 不是有效 JSON。'),{status:422});}
    return {version:2,questions,settings,revision:libraryRevision(questions,settings),formulaIssues:inspect?questions.flatMap(formulaErrors):[]};
  }
  // Snapshot policy: content edits always keep the previous library; a save that
  // only flips mastered/updatedAt reuses the snapshot taken minutes ago, so
  // toggling review state never piles up near-identical copies.
  async writeSnapshot(history,before,next){
    const changed=JSON.stringify(before.questions)!==JSON.stringify(next.questions);
    if(!changed)return null;
    const files=await fs.readdir(history).catch(()=>[]);
    let latest=null;
    for(const file of files){if(!file.endsWith('.json'))continue;const m=file.match(/^(\d{10,})-/);if(!m)continue;if(!latest||Number(m[1])>latest.time)latest={file,time:Number(m[1])};}
    if(latest&&isStateOnlyChange(before.questions,next.questions)){
      const recent=await fs.readFile(path.join(history,latest.file),'utf8').then(JSON.parse).catch(()=>null);
      if(recent&&isStateOnlyChange(recent.questions,before.questions)&&Date.now()-latest.time<SNAPSHOT_WINDOW_MS)return null;
    }
    const target=path.join(history,Date.now()+'-'+randomUUID()+'.json');
    await fs.writeFile(target,JSON.stringify({version:2,questions:before.questions,settings:before.settings},null,2)+'\n',{flag:'wx'});
    return target;
  }
  save(payload,expectedRevision){
    return this.saveWith(()=>payload,expectedRevision);
  }
  async saveMastery({ids,mastered}={},expectedRevision){
    if(!Array.isArray(ids)||!ids.length||ids.length>3000||ids.some(id=>typeof id!=='string')||typeof mastered!=='boolean'){
      throw Object.assign(Error('请提供要标记的题目 ID 和掌握状态。'),{status:422});
    }
    const targets=new Set(ids);
    const result=await this.saveWith(before=>{
      const matches=before.questions.filter(question=>targets.has(question.id));
      if(matches.length!==targets.size)throw Object.assign(Error('部分题目已不存在，请同步后重试。'),{status:422});
      const updatedAt=new Date().toISOString();
      return {...before,questions:before.questions.map(question=>targets.has(question.id)&&!!question.mastered!==mastered?{...question,mastered,updatedAt}:question)};
    },expectedRevision,{partial:true});
    return {revision:result.revision,syncToken:result.syncToken,formulaIssues:result.formulaIssues,updates:result.questions.filter(question=>targets.has(question.id)).map(({id,mastered,updatedAt})=>({id,mastered,updatedAt}))};
  }
  async saveQuestion({id,changes}={},expectedRevision){
    if(typeof id!=='string'||!isRecord(changes)||Object.keys(changes).some(key=>!editableQuestionFields.has(key))||
      (Object.hasOwn(changes,'demo')&&typeof changes.demo!=='boolean')){
      throw invalidPatch('请提供题目 ID 和可编辑的变动字段。');
    }
    const result=await this.saveWith(before=>{
      const original=before.questions.find(question=>question.id===id);
      if(!original)throw invalidPatch('这道题已不存在，请同步后重试。');
      if(Object.keys(changes).length===0)return before;
      const updated={...original,...changes,updatedAt:new Date().toISOString()};
      return {...before,questions:before.questions.map(question=>question===original?updated:question)};
    },expectedRevision,{partial:true});
    return {revision:result.revision,syncToken:result.syncToken,formulaIssues:result.formulaIssues,question:result.questions.find(question=>question.id===id)};
  }
  async saveSettings(changes,expectedRevision){
    if(!isRecord(changes)||Object.keys(changes).some(key=>!printSettingFields.has(key))){
      throw invalidPatch('请提供可修改的打印设置。');
    }
    const result=await this.saveWith(before=>{
      const settings={...before.settings,...changes};
      const normalized=Schema.settings(settings);
      if(Object.keys(changes).some(key=>changes[key]!==normalized[key])){
        throw invalidPatch('打印设置的值不正确。');
      }
      return {...before,settings:normalized};
    },expectedRevision,{partial:true});
    return {revision:result.revision,syncToken:result.syncToken,formulaIssues:result.formulaIssues,settings:result.settings};
  }
  saveWith(makePayload,expectedRevision,{partial=false}={}){
    const task=this.queue.then(async()=>{
      const readOptions={inspect:!partial};
      const before=await this.readStable(readOptions);
      const previousIssues=partial&&before.syncToken&&before.syncToken===this.validatedSync?.token
        ?this.validatedSync.formulaIssues:null;
      if(expectedRevision!==before.revision)throw Object.assign(Error('题库已被其他窗口或 Codex 更新。请先同步本地文件，再保存。'),{status:409});
      const payload=makePayload(before);
      if(!Array.isArray(payload?.questions)||payload.questions.length>3000)throw invalidPatch('题库格式不正确或超过 3000 题。');

      const changedSubjects=new Set();
      const recordsToCheck=partial?payload.questions.filter((question,index)=>{
        const original=before.questions[index];
        if(question===original)return false;
        changedSubjects.add(original.subject);
        changedSubjects.add(question.subject);
        return true;
      }):payload.questions;
      const seen=new Set();
      for(const q of recordsToCheck){
        const errors=Schema.errors(q);
        if(seen.has(q.id))errors.push('id 重复');
        seen.add(q.id);
        if(errors.length)throw invalidPatch('题目 '+(q?.id||'未知')+'：'+errors.join('；'));
        await this.checkImages(q);
        const formula=formulaErrors(q);
        if(formula.length)throw invalidPatch(Schema.topicName(q.subject,q.topic)+' 公式语法错误：'+formula[0].message);
      }
      const next={version:2,questions:payload.questions.map(Schema.normalize),settings:Schema.settings(payload.settings)};
      const files=subjects.filter(subject=>!partial||changedSubjects.has(subject)).map(subject=>[this.subjectFile(subject),JSON.stringify({version:2,subject,questions:next.questions.filter(q=>q.subject===subject)},null,2)+'\n']);
      if(!partial||JSON.stringify(next.settings)!==JSON.stringify(before.settings)){
        files.push([this.settingsFile,JSON.stringify(next.settings,null,2)+'\n']);
      }
      if(!files.length)return {
        ...before,syncToken:previousIssues?before.syncToken:null,formulaIssues:previousIssues??undefined
      };
      if(!partial||changedSubjects.size){
        const history=path.join(this.directory,'history');
        await fs.mkdir(history,{recursive:true});
        await this.writeSnapshot(history,before,next);
      }
      const originals=new Map();for(const [file] of files){try{originals.set(file,await fs.readFile(file));}catch(error){if(error.code!=='ENOENT')throw error;originals.set(file,null);}}
      const staged=[],replaced=[];
      try{for(const [file,content] of files){const temp=file+'.'+randomUUID()+'.tmp';await fs.writeFile(temp,content,{flag:'wx'});staged.push([file,temp]);}
        const current=await this.read(readOptions);if(current.revision!==before.revision)throw Object.assign(Error('写入期间本地文件发生变化，已停止保存，请同步后重试。'),{status:409});
        for(const [file,temp] of staged){await fs.rename(temp,file);replaced.push(file);}
      }catch(error){for(const file of replaced){const bytes=originals.get(file);if(bytes===null)await fs.rm(file,{force:true});else await fs.writeFile(file,bytes);}throw error;}
      finally{for(const [,temp] of staged)await fs.rm(temp,{force:true});}
      const orderedQuestions=subjects.flatMap(subject=>next.questions.filter(question=>question.subject===subject));
      const revision=libraryRevision(orderedQuestions,next.settings);
      const checkedIds=new Set(recordsToCheck.map(question=>question.id));
      const issues=partial?previousIssues?.filter(issue=>!checkedIds.has(issue.id)):[];
      return this.confirmSavedSync({...next,questions:orderedQuestions,revision,formulaIssues:issues},issues);
    });this.queue=task.catch(()=>{});return task;
  }
}
