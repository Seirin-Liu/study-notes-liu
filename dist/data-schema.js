(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NoteSchema=factory();})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const subjects=['chemistry','biology','math','physics','chinese','english'];
  const topicCatalog={"math":{"math-sets-logic":"集合与常用逻辑用语","math-inequalities":"不等式","math-functions-derivatives":"函数与导数","math-trigonometry":"三角函数与解三角形","math-sequences":"数列","math-solid-geometry":"立体几何与空间向量","math-analytic-geometry":"平面解析几何","math-probability-statistics":"概率与统计","math-complex-numbers-vectors":"复数、平面向量","math-combinatorics-binomial":"排列组合与二项式定理","math-novel-problems":"新定义与创新题型"},"physics":{"phys-kinematics":"运动的描述与匀变速直线运动","phys-forces":"相互作用","phys-newtons-laws":"牛顿运动定律","phys-curved-motion":"曲线运动","phys-gravitation":"万有引力与航天","phys-mechanical-energy":"机械能守恒定律","phys-momentum":"动量与动量守恒","phys-electric-field":"电场","phys-circuits":"电路","phys-magnetic-field":"磁场","phys-induction":"电磁感应","phys-alternating-current":"交变电流","phys-thermodynamics":"热学","phys-waves-optics":"机械波与光学","phys-atomic-physics":"原子物理","phys-experiments":"物理实验"},"chemistry":{"chem-stoichiometry":"物质的量与化学计量","chem-ionic-reactions":"离子反应","chem-redox":"氧化还原反应","chem-elements-compounds":"元素化合物","chem-structure-properties":"物质结构与性质","chem-thermochemistry":"化学反应与能量","chem-rates-equilibrium":"化学反应速率与化学平衡","chem-aqueous-equilibrium":"水溶液中的离子平衡","chem-electrochemistry":"电化学","chem-organic":"有机化学基础","chem-experiments":"化学实验","chem-industrial-processes":"化学与工业流程"},"biology":{"bio-molecular-components":"细胞的分子组成","bio-cell-structure-transport":"细胞的结构与物质运输","bio-metabolism":"酶、ATP与细胞代谢","bio-cell-cycle-differentiation":"细胞的增殖、分化、衰老与凋亡","bio-meiosis":"遗传的细胞基础","bio-molecular-genetics":"遗传的分子基础","bio-inheritance":"遗传规律与伴性遗传","bio-variation-breeding":"变异、育种与人类遗传病","bio-evolution":"生物进化","bio-homeostasis":"稳态与调节","bio-ecology":"生物与环境","bio-biotechnology":"生物技术与工程","bio-experiments":"生物学实验与探究"},"chinese":{"zh-characters":"字音字形","zh-vocabulary":"词语成语","zh-sentence-errors":"病句修改","zh-coherence":"语句连贯","zh-memorization":"古诗默写","zh-classical-reading":"文言文阅读","zh-poetry":"诗歌鉴赏","zh-informational-reading":"信息类阅读","zh-literary-reading":"文学类阅读","zh-language-use":"语言运用","zh-writing":"作文写作"},"english":{"en-vocabulary":"词汇短语","en-grammar":"语法填空","en-cloze":"完形填空","en-reading":"阅读理解","en-sentence-insertion":"七选五","en-practical-writing":"应用文写作","en-continuation":"读后续写","en-listening":"听力理解"}};
  const topics=Object.fromEntries(subjects.map(subject=>[subject,Object.keys(topicCatalog[subject])]));
  // Accept the former full labels when importing historical records.
  const legacyTopicIds={
    "平面解析几何（直线、圆、圆锥曲线）":"math-analytic-geometry",
    "曲线运动（平抛、圆周）":"phys-curved-motion",
    "热学（分子动理论、气体、热力学定律）":"phys-thermodynamics",
    "原子物理（原子结构、原子核、波粒二象性）":"phys-atomic-physics",
    "元素化合物（钠、铝、铁、铜、氯、硫、氮、碳等）":"chem-elements-compounds",
    "化学反应与能量（热化学）":"chem-thermochemistry",
    "水溶液中的离子平衡（电离、水解、沉淀溶解）":"chem-aqueous-equilibrium",
    "酶、ATP与细胞代谢（呼吸、光合）":"bio-metabolism",
    "遗传的细胞基础（减数分裂）":"bio-meiosis",
    "遗传的分子基础（DNA、基因表达）":"bio-molecular-genetics",
    "稳态与调节（内环境、神经、体液、免疫、植物激素）":"bio-homeostasis",
    "生物与环境（种群、群落、生态系统）":"bio-ecology",
    "生物技术与工程（基因、细胞、发酵工程）":"bio-biotechnology"
  };
  function topicId(subject,value){
    if(typeof value!=='string'||!subjects.includes(subject))return '';
    const key=value.trim();
    if(topics[subject].includes(key))return key;
    const legacyId=legacyTopicIds[key];
    if(topics[subject].includes(legacyId))return legacyId;
    return topics[subject].find(id=>topicCatalog[subject][id]===key)||'';
  }
  function topicName(subject,value){return topicCatalog[subject]?.[topicId(subject,value)]||value||'';}
  const kinds=['question','note'];
  const answerTypes=['text','judgment','single-choice'];
  const judgmentAnswers=['正确','错误'];
  const optionKeys=['A','B','C','D'];
  const optionFields=optionKeys.map(key=>'option-'+key);
  const limits={source:120,originalNumber:40,question:20000,answer:10000,explanation:20000,notes:10000,equation:2000,equationPlain:2000};
  const imageName=/^[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/i;
  function answerErrors(q){
    const type=q.answerType===undefined?'text':q.answerType;
    if(!answerTypes.includes(type))return ['请选择有效的答案类型。'];
    if(q.kind==='note'&&type!=='text')return ['笔记仅支持文本答案。'];
    const options=q.options;
    const optionObject=options!==null&&typeof options==='object'&&!Array.isArray(options);
    const issues=[];
    if(type==='single-choice'){
      if(!optionObject||Object.keys(options).length!==optionKeys.length||
        optionKeys.some(key=>!Object.hasOwn(options,key)||typeof options[key]!=='string'||!options[key].trim()||options[key].length>limits.answer)){
        issues.push('单选题须填写 A、B、C、D 四个选项，每项最多 '+limits.answer+' 字。');
      }
      if(!optionKeys.includes(q.answer))issues.push('请选择 A、B、C、D 中的一个作为正确答案。');
    }else{
      if(options!==undefined&&(!optionObject||Object.keys(options).length))issues.push('只有单选题可以填写 A、B、C、D 选项。');
      if(type==='judgment'&&!judgmentAnswers.includes(q.answer))issues.push('请选择「正确」或「错误」作为判断题答案。');
    }
    return issues;
  }
  function fieldText(q,field){
    if(optionFields.includes(field))return q.answerType==='single-choice'?q.options?.[field.at(-1)]||'':'';
    return q[field]||'';
  }
  function errors(q){const out=[];if(!q||typeof q!=='object'||Array.isArray(q))return ['题目必须是一个 JSON 对象'];if(!subjects.includes(q.subject))out.push('学科必须为 chemistry、biology、math、physics、chinese 或 english');if(typeof q.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(q.id))out.push('id 只能含英文字母、数字、连字符和下划线，长度 1—80');if(typeof q.topic!=='string'||!q.topic.trim()||q.topic.length>60)out.push('专题必填，最多 60 字');if(typeof q.topic==='string'&&subjects.includes(q.subject)&&!topicId(q.subject,q.topic))out.push('题目类别必须从该学科规定的类别中选择');if(typeof q.question!=='string'||!q.question.trim())out.push('题目不能为空');for(const[k,n]of Object.entries(limits))if(q[k]!==undefined&&(typeof q[k]!=='string'||q[k].length>n))out.push(k+' 必须是字符串，且不超过 '+n+' 字');if(q.kind!==undefined&&!kinds.includes(q.kind))out.push('条目类型必须为 question（错题）或 note（笔记）');out.push(...answerErrors(q));if(q.mastered!==undefined&&typeof q.mastered!=='boolean')out.push('mastered 必须为布尔值');if(q.images!==undefined){if(!Array.isArray(q.images)||q.images.length>20)out.push('images 必须为最多 20 张的数组');else for(const image of q.images){if(!image||typeof image!=='object'||!imageName.test(image.file||'')||typeof image.alt!=='string'||image.alt.length>200)out.push('题图需有安全文件名和不超过 200 字的说明');if(image&&image.placement!==undefined&&image.placement!=='manual')out.push('题图 placement 仅支持 manual（手动插入）');}}
    if(q.vocabularyProcessed!==undefined&&typeof q.vocabularyProcessed!=='boolean'){
      out.push('vocabularyProcessed 必须为布尔值。');
    }
    return out;
  }
  function originalNumber(q){
    if(typeof q.originalNumber==='string')return q.originalNumber.trim();
    const line=(q.question||'').split('\n',1)[0];
    const match=line.match(/^(?:原卷\s*)?第\s*([0-9０-９]+)\s*题\s*([A-DＡ-Ｄ](?![a-zA-Z])|[（(]\s*[0-9０-９]+\s*[）)])?/u)
      ||line.match(/^.{0,70}(?:高考|原卷|试卷|周练).{0,35}?第\s*([0-9０-９]+)\s*题\s*([A-DＡ-Ｄ](?![a-zA-Z])|[（(]\s*[0-9０-９]+\s*[）)])?/u);
    return match?match.slice(1).join('').normalize('NFKC').replace(/\s+/g,''):'';
  }
  function questionSource(q){
    if(typeof q.source==='string')return q.source.trim();
    if(q.kind==='note')return '';
    const line=(q.question||'').split('\n',1)[0].normalize('NFKC');
    const match=line.match(/^([^:：|｜]{1,90}?)\s*第\s*(\d+)\s*题(?:\s*([A-D](?![a-zA-Z])|\(\s*\d+\s*\)))?/u);
    if(!match||!/高考|试卷|周练|月考|模考|联考|期中|期末|测试卷/.test(match[1]))return '';
    const paper=match[1].trim().replace(/[·｜|\-]+\s*$/u,'').trim();
    return paper+' 第'+match[2]+'题'+(match[3]||'').replace(/\s+/g,'');
  }
  function normalize(q){const result={id:q.id,subject:q.subject,topic:topicId(q.subject,q.topic)||q.topic.trim(),kind:q.kind??'question'};for(const k of Object.keys(limits))result[k]=q[k]||'';result.answerType=q.answerType??'text';result.options=result.answerType==='single-choice'?Object.fromEntries(optionKeys.map(key=>[key,q.options[key].trim()])):{};result.originalNumber=originalNumber(q);result.source=questionSource(q);result.images=(q.images||[]).map(image=>({file:image.file,alt:image.alt,...(image.placement==='manual'?{placement:'manual'}:{})}));result.mastered=!!q.mastered;result.demo=!!q.demo;result.createdAt=typeof q.createdAt==='string'?q.createdAt:new Date().toISOString();result.updatedAt=typeof q.updatedAt==='string'?q.updatedAt:result.createdAt;
    if(typeof q.vocabularyProcessed==='boolean')result.vocabularyProcessed=q.vocabularyProcessed;
    return result;
  }
  function settings(input={}){const answers=input.answers!==false;return {paper:input.paper==='A4'?'A4':'B5',columns:input.columns===1?1:2,compact:input.compact!==false,answers,answer:input.answer===undefined?answers:input.answer!==false,explanation:input.explanation===undefined?answers:input.explanation!==false,notes:input.notes===undefined?answers:input.notes!==false};}
  return {errors,answerErrors,fieldText,normalize,originalNumber,questionSource,settings,subjects,topics,topicId,topicName,limits,answerTypes,judgmentAnswers,optionKeys,optionFields};
});
