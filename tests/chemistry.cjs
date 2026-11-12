const assert = require('node:assert/strict');
const {checkEquation,knowledgeHints}=require('../dist/chemistry.js');
const cases=[
 ['2H2 + O2 = 2H2O','good'],['H2 + O2 = H2O','error'],
 ['2H₂ + O₂ → 2H₂O','good'],['N2 + 3H2 ⇌ 2NH3','good'],
 ['S₂O₃²⁻ + 2H⁺ = S↓ + SO₂↑ + H₂O','good'],
 ['SO2 + Br2 + 2H2O = 4H^+ + 2Br^- + SO4^2-','good'],
 ['Fe^2+ = Fe^3+ + e^-','good'],['Fe^2+ = Fe^3+','error'],
 ['3HCO3^- + Al^3+ = 3CO2 + Al(OH)3','good'],
 ['CuSO4·5H2O = CuSO4 + 5H2O','good'],
 ['2NH3 + H2SO4 = (NH4)2SO4','good'],
 ['[Al(OH)4]^- + H^+ = Al(OH)3 + H2O','good'],
 ['CaCO3(s) = CaO(s) + CO2(g)↑','good'],
 ['Fe3+ = Fe2+','warning'],['hello = world','warning'],
 ['Ca(OH2 = CaO + H2O','warning'],['H2 + = H2','warning'],
 ['0H2 = H2','warning'],['','info'],['H2 O2','warning'],
 ['H2 = (点燃)H2','warning'],['Xe = Xe','good']
];
for(const[input,expected]of cases)assert.equal(checkEquation(input).level,expected,input);
assert(knowledgeHints('容量瓶').some(x=>x.title.includes('不能')));
assert(knowledgeHints('NH3 浓硫酸').some(x=>x.level==='warning'));
assert(knowledgeHints('Cl2 干燥').some(x=>x.title==='氯气干燥'));
console.log(`Passed ${cases.length} equation cases and 3 knowledge checks.`);
