(function (root) {
  'use strict';
  const elements = new Set(('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split(' '));
  const sub = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
  const sup = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
  const normalize = s => s.replace(/[₀-₉]/g,c=>sub[c]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g,s=>'^'+[...s].map(c=>sup[c]).join('')).replace(/（/g,'(').replace(/）/g,')').replace(/\s/g,'');
  function formula(source) {
    let i=0;
    function number() { const m=source.slice(i).match(/^\d+/); if(!m)return 1; i+=m[0].length; const n=Number(m[0]);if(n<1||n>100000)throw Error('下标或系数超出检查范围');return n; }
    function group(end) {
      const atoms={};let count=0;
      while(i<source.length && source[i]!==end) {
        let part={};
        if(source[i]==='('||source[i]==='[') { const close=source[i++]==='('?')':']';part=group(close);if(source[i++]!==close)throw Error('括号不匹配'); }
        else { const m=source.slice(i).match(/^[A-Z][a-z]?/);if(!m||!elements.has(m[0]))throw Error('含有不支持的化学式或条件');i+=m[0].length;part[m[0]]=1; }
        const n=number(); for(const [e,v] of Object.entries(part)) atoms[e]=(atoms[e]||0)+v*n;count++;
      }
      if(!count)throw Error('化学式不能为空');return atoms;
    }
    const result=group('');if(i!==source.length)throw Error('括号不匹配');return result;
  }
  function species(raw) {
    let s=raw.replace(/\((aq|s|l|g)\)/g,'').replace(/[↑↓]/g,'');
    const c=s.match(/^\d+/);const coefficient=c?Number(c[0]):1;if(c)s=s.slice(c[0].length);if(coefficient<1||coefficient>100000)throw Error('系数超出检查范围');
    let charge=0; const q=s.match(/\^(\d*)([+-])$/);if(q){charge=(Number(q[1])||1)*(q[2]==='+'?1:-1);s=s.slice(0,q.index);}
    if(/[+\-^]/.test(s))throw Error('离子电荷请使用 ^2-、^+ 或上标形式');
    if(s==='e'&&charge===-1)return {atoms:{},charge:-coefficient};
    const atoms={};for(let part of s.split(/[·.]/)){const m=part.match(/^\d+/);const n=m?Number(m[0]):1;if(m)part=part.slice(m[0].length);for(const [e,v]of Object.entries(formula(part)))atoms[e]=(atoms[e]||0)+v*n*coefficient;}
    return {atoms,charge:charge*coefficient};
  }
  function side(s) {
    const charges=[];
    s=s.replace(/\^\d*[+-]/g,q=>'@'+(charges.push(q)-1)+'@');
    const atoms={};let charge=0;
    for(const raw of s.split('+')) { const item=species(raw.replace(/@(\d+)@/g,(_,i)=>charges[Number(i)]));for(const[e,v]of Object.entries(item.atoms))atoms[e]=(atoms[e]||0)+v;charge+=item.charge; }
    return {atoms,charge};
  }
  function checkEquation(input) {
    if(!input.trim())return {level:'info',title:'输入方程式后自动检查',detail:'支持元素原子数与规范标注的电荷守恒；复杂配合物、反应条件请人工核对。'};
    try {
      const s=normalize(input);const sides=s.split(/⇌|⇋|⟶|→|->|=>|=/);if(sides.length!==2||sides.some(s=>!s))throw Error('请用 =、→ 或 ⇌ 连接反应物与生成物');
      const left=side(sides[0]),right=side(sides[1]);
      const mismatches=[...new Set([...Object.keys(left.atoms),...Object.keys(right.atoms)])].filter(e=>(left.atoms[e]||0)!==(right.atoms[e]||0)).map(e=>`${e}：左 ${left.atoms[e]||0} / 右 ${right.atoms[e]||0}`);
      if(left.charge!==right.charge)mismatches.push(`电荷：左 ${left.charge} / 右 ${right.charge}`);
      if(mismatches.length)return {level:'error',title:'守恒检查未通过',detail:mismatches.join('；')+'。请检查系数、下标或电荷。'};
      return {level:'good',title:'原子数与所写电荷守恒',detail:'该结果仅说明守恒，反应能否发生、产物与条件仍需核查。'};
    } catch(e) { return {level:'warning',title:'这条方程式需人工核查',detail:e.message+'。本工具不会自动判断其正确或错误。'}; }
  }
  function knowledgeHints(text) {
    const hints=[];
    if(/滴定管/.test(text))hints.push({level:'info',title:'仪器润洗',detail:'滴定管使用前应先用蒸馏水洗净，再用待装液润洗。'});
    if(/容量瓶/.test(text))hints.push({level:'info',title:'容量瓶不能用待装液润洗',detail:'用蒸馏水洗净即可，残留少量蒸馏水不影响定容；用待装液润洗会额外引入溶质。'});
    if(/碱石灰/.test(text))hints.push({level:'info',title:'碱石灰的成分与用途',detail:'高中常写主要成分 CaO、NaOH，可干燥 NH₃，也能吸收 CO₂、SO₂、HCl 等酸性气体。'});
    if(/氨|NH[3₃]/i.test(text)&&/硫酸|H[2₂]SO[4₄]/i.test(text))hints.push({level:'warning',title:'检查氨气干燥剂',detail:'NH₃ 会与浓硫酸反应，不能用浓硫酸干燥。NH₃ 足量时：2NH₃ + H₂SO₄ = (NH₄)₂SO₄。'});
    if(/氯气|Cl[2₂]/i.test(text)&&/硫酸|干燥/.test(text))hints.push({level:'info',title:'氯气干燥',detail:'Cl₂ 通常可用浓硫酸干燥；不能把氨气的干燥禁忌直接套用到氯气。'});
    if(/S[2₂]O[3₃]|硫代硫酸/.test(text))hints.push({level:'info',title:'硫代硫酸根遇酸',detail:'S₂O₃²⁻ + 2H⁺ = S↓ + SO₂↑ + H₂O；酸性溶液中不能大量共存。'});
    hints.push({level:'info',title:'保存前再看一眼',detail:'反应条件、用量与产物是否匹配？离子方程式是否满足拆分原则？气体、沉淀和可逆符号是否完整？'});
    return hints;
  }
  root.Chemistry={checkEquation,knowledgeHints};
  if(typeof module!=='undefined')module.exports=root.Chemistry;
})(typeof window==='undefined'?globalThis:window);
