#!/usr/bin/env node
// Concatenates src/app/*.js into dist/app.js.
//
// The app is written as one IIFE so every module shares one closure: no globals,
// no module boundaries to wire up, and the browser still loads a single script.
// Order matters — later modules use functions declared earlier (hoisting covers
// function declarations, but top-level `const`/`let` initialisers run in order).
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'src', 'app');
const target = path.join(root, 'dist', 'app.js');

const modules = [
  '00-core.js',        // DOM helpers, subjects, shared state, library read/write
  '10-format.js',      // LaTeX and image rendering for cards and print
  '20-render.js',      // list, sidebar and overview markup
  '30-mascot.js',      // sidebar mascot reactions
  '40-selection.js',   // filters, per-question selection, batch mastery
  '50-editor.js',      // editor panel, drafts, chemistry checks, settings
  '52-image-processing.js',
  '55-preview.js',     // print preview glue and field lookup helpers
  '60-rich-text.js',   // **bold** / __underline__ marks
  '65-review.js',
  '70-boot.js',        // event wiring and start-up
  '75-scroll.js',      // list scroll position memory
  '76-mobile.js'
];

async function build() {
  const catalog = JSON.parse(await fs.readFile(path.join(root, 'data', 'topics.json'), 'utf8'));
  const schemaPath = path.join(root, 'dist', 'data-schema.js');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const updatedSchema = schema.replace(/^  const topicCatalog=.*;$/m, () => '  const topicCatalog=' + JSON.stringify(catalog) + ';');
  if (updatedSchema !== schema) await fs.writeFile(schemaPath, updatedSchema);
  const parts = [];
  parts.push('/* 本文件由 node scripts/build-app.mjs 从 src/app/*.js 生成，请勿手工编辑。 */');
  parts.push('(() => {');
  parts.push("  'use strict';");
  for (const name of modules) {
    const file = path.join(sourceDir, name);
    let source;
    try {
      source = await fs.readFile(file, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') throw Error(`缺少源文件：src/app/${name}`);
      throw error;
    }
    parts.push('');
    parts.push(`  /* ===== ${name} ===== */`);
    parts.push(source.replace(/\s+$/, ''));
  }
  parts.push('');
  parts.push('})();');
  const output = parts.join('\n') + '\n';
  await fs.mkdir(path.dirname(target), {recursive: true});
  await fs.writeFile(target, output);
  return {modules: modules.length, bytes: Buffer.byteLength(output), lines: output.split('\n').length};
}

const result = await build();
console.log(`已合并 ${result.modules} 个源文件 → dist/app.js（${result.lines} 行，${(result.bytes / 1024).toFixed(1)} KB）`);
