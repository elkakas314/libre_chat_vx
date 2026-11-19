/* Browser-smoke SOURCE only. A screenshot never closes a LIVE gate. */
'use strict';
const assert = require('node:assert/strict');
const { build } = require('vite');
const { chromium } = require('playwright');
const { mkdirSync, mkdtempSync, writeFileSync, copyFileSync, readFileSync } = require('node:fs');
const { createServer } = require('node:http');
const { relative, resolve } = require('node:path');
const root = resolve(__dirname, '../..');
const evidenceRoot = resolve(root, 'visual-evidence');
mkdirSync(evidenceRoot, { recursive: true });
const out = mkdtempSync(resolve(evidenceRoot, 'run-'));

async function run() {
  await build({
    configFile: false,
    root,
    logLevel: 'warn',
    esbuild: { jsx: 'automatic' },
    build: {
      outDir: out,
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, 'fixture-entry.tsx'),
        output: { format: 'iife', entryFileNames: 'fixture.js' },
      },
    },
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
  let browser;
  let server;
  const results = [];
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
    });
    server = createServer((request, response) => {
      let pathname;
      try { pathname = new URL(request.url, 'http://127.0.0.1').pathname; }
      catch { response.writeHead(400).end(); return; }
      const assets = {
        '/index.html': ['index.html', 'text/html; charset=utf-8'],
        '/fixture.js': ['fixture.js', 'text/javascript; charset=utf-8'],
        '/VXCockpit.css': ['VXCockpit.css', 'text/css; charset=utf-8'],
      };
      const asset = assets[pathname];
      if (!asset || request.method !== 'GET') { response.writeHead(404).end(); return; }
      response.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-store' });
      response.end(readFileSync(resolve(out, asset[0])));
    });
    await new Promise((resolveListen, rejectListen) => {
      server.once('error', rejectListen);
      server.listen(0, '127.0.0.1', resolveListen);
    });
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const baseURL = `http://127.0.0.1:${address.port}`;
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
      await page.goto(`${baseURL}/index.html`);
      await page.locator('[data-testid="vx-nostromo-cockpit"]').waitFor();
      assert.equal(
        await page.locator('[data-testid="vx-target-navigator"] button[aria-pressed="true"]').innerText(),
        'AUTO',
      );
      assert.equal(await page.locator('[data-testid="librechat-vx-cockpit"]').isHidden(),true);
      assert.match(await page.locator('[data-testid="librechat-vx-cockpit"]').textContent(),/SOURCE_ONLY/);
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
    if (browser) await browser.close();
    if (server?.listening) await new Promise(resolveClose => server.close(resolveClose));
  }
  const evidence = {
    schema:'libre-chat-vx.source-browser-visual.v1',
    scope:'SOURCE_FIXTURE_ONLY', live_verified:false, live_gate_closed:false,
    source_sha:process.env.NOSTROMO_CI_SHA || process.env.GITHUB_SHA || null,
    artifact_dir:relative(root,out),
    observed_at_utc:new Date().toISOString(), results,
  };
  writeFileSync(resolve(out,'visual-proof.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence));
}
run().catch(error=>{console.error(error);process.exitCode=1;});
