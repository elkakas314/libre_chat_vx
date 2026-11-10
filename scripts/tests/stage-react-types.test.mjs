import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,existsSync,readlinkSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {linkHostTypeDeclarations,clearStagedTypeLinks} from '../stage-react-types.mjs';
function f(){const root=mkdtempSync(path.join(tmpdir(),'nostromo-react-type-'));return {root,stage:path.join(root,'stage'),upstream:path.join(root,'upstream'),vx:path.join(root,'vx')};}
function typed(root,name){const dest=path.join(root,'node_modules','@types',name);mkdirSync(dest,{recursive:true});writeFileSync(path.join(dest,'index.d.ts'),'export {};\n');return dest;}
test('uses upstream declarations without modifying stage',()=>{
 const x=f();try{
  mkdirSync(x.stage);typed(x.upstream,'react');
  const st=linkHostTypeDeclarations(x);
  assert.equal(st.react,'UPSTREAM_INSTALLED');
  assert.equal(st['react-dom'],'MISSING');
  assert.equal(existsSync(path.join(x.stage,'node_modules')),false);
 }finally{rmSync(x.root,{recursive:true,force:true});}
});
test('links only declared host-local React types and removes stage symlinks',()=>{
 const x=f();try{
  mkdirSync(x.stage);const react=typed(x.vx,'react');typed(x.vx,'react-dom');
  const st=linkHostTypeDeclarations(x);
  assert.equal(st.react,'VX_FALLBACK_LINKED');
  assert.equal(readlinkSync(path.join(x.stage,'node_modules','@types','react')),react);
  clearStagedTypeLinks(x.stage);
  assert.equal(existsSync(path.join(x.stage,'node_modules')),false);
  assert.equal(existsSync(path.join(react,'index.d.ts')),true);
 }finally{rmSync(x.root,{recursive:true,force:true});}
});
test('fails closed if neither checkout has required declarations',()=>{
 const x=f();try{
  mkdirSync(x.stage);assert.throws(()=>linkHostTypeDeclarations(x),/REACT_TYPINGS_MISSING/);
  clearStagedTypeLinks(x.stage);
 }finally{rmSync(x.root,{recursive:true,force:true});}
});
