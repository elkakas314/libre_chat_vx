/* Browser-smoke SOURCE only. A screenshot never closes a LIVE gate. */
'use strict';
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const { chromium } = require('playwright');
const { mkdirSync, writeFileSync, copyFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const root = resolve(__dirname, '../..');
const out = resolve(root, 'visual-evidence');
mkdirSync(out, { recursive: true });

async function run() {
  await build({
    entryPoints: [resolve(__dirname, 'fixture-entry.tsx')],
    outfile: resolve(out, 'fixture.js'), bundle: true, platform: 'browser',
    format: 'iife', jsx: 'automatic', logLevel: 'warning',
  });
  copyFileSync(resolve(root, 'overlay/upstream/VXCockpit.css'), resolve(out, 'VXCockpit.css'));
  writeFileSync(resolve(out, 'index.html'), [
    '<!doctype html><html lang="es"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<link rel="stylesheet" href="./VXCockpit.css">',
    '<style>html,body{margin:0;background:#0c1824;color:#eaf0fa;',
    'font:15px system-ui,sans-serif}.vx-visual-fixture{padding:12px;',
    'max-width:1080px;margin:auto}section,nav{min-width:0;border:1px solid #38536c;',
    'border-radius:8px;padding:10px;margin:8px 0;overflow-wrap:anywhere}',
    'button{font:inherit;max-width:100%;margin:3px;padding:7px}',
    'button:focus-visible{outline:3px solid #ffd36b}*{box-sizing:border-box}',
    'fieldset{min-width:0}li{overflow-wrap:anywhere}</style>',
    '</head><body><div id="root"></div><script src="./fixture.js"></script></body></html>',
  ].join(''));
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const config of [
      { name:'desktop', width:1280, height:900 },
      { name:'mobile', width:390, height:844 },
    ]) {
      const page = await browser.newPage({
        viewport: { width:config.width, height:config.height },
        reducedMotion: 'reduce', deviceScaleFactor: 1,
      });
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(pathToFileURL(resolve(out,'index.html')).href);
      await page.locator('[data-testid="vx-nostromo-cockpit"]').waitFor();
      assert.equal(
        await page.locator('[data-testid="vx-target-navigator"] button[aria-pressed="true"]').innerText(),
        'AUTO',
      );
      assert.match(await page.locator('[data-testid="librechat-vx-cockpit"]').innerText(),/SOURCE_ONLY/);
      assert.match(await page.locator('[data-testid="vx-tentacle-hud"]').innerText(),/authority:false/);
      const truth = await page.locator('[data-testid="vx-minimal-truth"]').innerText();
      assert.match(truth,/MANOJOS3/);
      assert.match(truth,/VX13/);
      await page.getByRole('button',{name:'BOTH',exact:true}).click();
      assert.equal(
        await page.getByRole('button',{name:'BOTH',exact:true}).getAttribute('aria-pressed'),
        'true',
      );
      assert.match(await page.locator('[data-testid="vx-tentacle-hud"]').innerText(),/scope:BOTH/);
      assert.equal(await page.getByRole('button',{name:'EXECUTE',exact:true}).isDisabled(),true);
      const widths = await page.evaluate(() => ({
        viewport: window.innerWidth, document:document.documentElement.scrollWidth,
      }));
      assert.ok(widths.document <= widths.viewport + 2,
        'Horizontal overflow: ' + JSON.stringify({scenario:config.name,...widths}));
      assert.deepEqual(errors, []);
      const screenshot = config.name + '.png';
      await page.screenshot({path:resolve(out,screenshot),fullPage:true});
      results.push({scenario:config.name,status:'PASS',screenshot,widths});
      await page.close();
    }
  } finally {
    await browser.close();
  }
  const evidence = {
    schema:'libre-chat-vx.source-browser-visual.v1',
    scope:'SOURCE_FIXTURE_ONLY', live_verified:false, live_gate_closed:false,
    github_sha:process.env.GITHUB_SHA || null,
    observed_at_utc:new Date().toISOString(), results,
  };
  writeFileSync(resolve(out,'visual-proof.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence));
}
run().catch(error=>{console.error(error);process.exitCode=1;});
