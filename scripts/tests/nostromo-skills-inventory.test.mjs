import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root=resolve('.');
const catalog=JSON.parse(readFileSync(join(root,'config/skills.current.json'),'utf8'));
const active=catalog.catalog.map(x=>x.name);
const legacy=catalog.legacy_compatibility.map(x=>x.name);
const optional=catalog.optional_agent_skills.map(x=>x.name);
const physical=readdirSync(join(root,'skills'),{withFileTypes:true})
 .filter(x=>x.isDirectory()&&existsSync(join(root,'skills',x.name,'SKILL.md')))
 .map(x=>x.name).sort();
test('14 Skills physical / 10 canonical / 2 legacy / 2 optional exact coverage',()=>{
 assert.equal(catalog.counts.active_catalog,10);
 assert.equal(catalog.counts.legacy_on_disk,2);
 assert.equal(catalog.counts.optional_agent_skills,2);
 assert.equal(catalog.counts.physical_skills,14);
 const names=[...active,...legacy,...optional];
 assert.equal(new Set(names).size,14);
 assert.deepEqual(names.sort(),physical);
});
test('optional agent procedures exist but are not enabled in canonical catalog',()=>{
 assert.deepEqual(optional.sort(),['nostromo-autonomo','nostromo-extension-creator']);
 assert.ok(optional.every(x=>!active.includes(x)));
 assert.ok(catalog.optional_agent_skills.every(x=>x.status==='SOURCE_OPTIONAL_NO_LIVE_ENABLE'));
});
test('read-only inventory counts 14, mirror canary only binds 12/10',()=>{
 const inventory=readFileSync(join(root,'canaries/skill-sync-live/02-inventory-skills.sh'),'utf8');
 const mirror=readFileSync(join(root,'canaries/skill-sync-live/03-verify-sync-content.sh'),'utf8');
 assert.match(inventory,/expected_physical:14,expected_active:10,expected_legacy:2,expected_optional:2/);
 assert.match(inventory,/optional_agent_skills/);
 assert.doesNotMatch(mirror,/\$inv\[0\]\.optional/);
 assert.match(mirror,/if \$stage==1 then 12 else 10 end/);
});

test('stage1 excludes optional-agent procedures while stage2 excludes legacy aliases',()=>{
 const one=readFileSync(join(root,'deployment/skill-sync/librechat.skill-sync-stage1.example.yaml'),'utf8');
 const two=readFileSync(join(root,'deployment/skill-sync/librechat.skill-sync-stage2.example.yaml'),'utf8');
 for(const name of [...catalog.catalog.map(x=>x.name),...legacy])
   assert.ok(one.includes('skills/'+name));
 for(const name of optional)assert.equal(one.includes('skills/'+name),false);
 for(const name of legacy)assert.equal(two.includes('skills/'+name),false);
 for(const name of optional)assert.equal(two.includes('skills/'+name),false);
 assert.match(one,/skillDiscoveryDepth: 0/);
});
