import test from 'node:test';import assert from 'node:assert/strict';import {Formula} from '../lib/formula-engine.mjs';
test('copied physics formulas tolerate duplicate inline and display delimiters',()=>{
 const formulas=[String.raw`\boxed{\vec p=m\vec v}`,String.raw`\mathrm{kg\cdot m/s}`,String.raw`\boxed{\Delta\vec p=\vec p_2-\vec p_1}`,String.raw`E_k=\frac12mv^2`,String.raw`\boxed{E_k=\frac{p^2}{2m}}`,String.raw`\boxed{\vec I=\vec F\Delta t}`,String.raw`\mathrm{N\cdot s}`,String.raw`I=F\Delta t`,String.raw`F-t`,String.raw`I=\bar F\Delta t`,String.raw`\bar F`,String.raw`\boxed{\vec I=\Delta\vec p}`,String.raw`\boxed{\vec I=m\vec v_2-m\vec v_1}`];
 for(const tex of formulas){for(const [a,b]of [['(',')'],['[',']']]){const canonical='\\'+a+tex+' \\'+b;const pasted='\\\\'+a+tex+' \\\\'+b;assert.deepEqual(Formula.check(pasted),[],tex);assert.equal(Formula.render(pasted),Formula.render(canonical));assert.equal(Formula.normalizeDelimiters(Formula.normalizeDelimiters(pasted)),Formula.normalizeDelimiters(pasted));}}
});
test('real formula errors remain blocked and matrix row separators are unchanged',()=>{
 const matrix=String.raw`\(\begin{matrix}1&2\\3&4\end{matrix}\)`;assert.equal(Formula.normalizeDelimiters(matrix),matrix);assert.deepEqual(Formula.check(matrix),[]);
 assert.ok(Formula.check(String.raw`\\(\unknownCommand{x}\\)`).length);assert.ok(Formula.check(String.raw`\(x`).length);
});
