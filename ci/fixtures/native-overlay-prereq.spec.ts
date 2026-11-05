import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MOCK_ENDPOINTS, mockReply, selectMockEndpoint, sendMessageAndWaitForCompletion } from '../specs/mock/helpers';

const output = process.env.VX_CAPTURE_DIR;
if (!output) throw new Error('VX_CAPTURE_DIR_MISSING');
mkdirSync(output, { recursive: true });
const flag = process.env.VX_COCKPIT_FLAG === '1';
const revision = process.env.VX_SOURCE_SHA ?? 'UNKNOWN';

for (const viewport of [
  { label:'desktop', width:1280, height:900 },
  { label:'mobile', width:390, height:844 },
]) {
  test.describe(viewport.label, () => {
    test.use({ viewport:{ width:viewport.width, height:viewport.height }, colorScheme:'dark' });
    test(viewport.label + ' native-vx visual inspection', async ({ page }) => {
      test.setTimeout(105000);
      const errors: string[] = [];
      const screenshots: Record<string,unknown>[] = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.addInitScript((enabled) => {
        localStorage.setItem('librechat-vx-cockpit', enabled ? '1' : '0');
        localStorage.setItem('navVisible','true');
        localStorage.setItem('color-theme','dark');
        localStorage.setItem('i18nextLng','en-US');
      }, flag);
      await page.goto('/c/new', { waitUntil:'domcontentloaded' });
      await page.getByRole('textbox', { name:'Message input' }).waitFor({state:'attached',timeout:30000});
      await page.evaluate(() => document.fonts.ready);
      const prefix = (flag ? 'vx-on-' : 'vx-off-') + viewport.label;
      const snap = async (label:string) => {
        const file = prefix + '-' + label + '.png';
        await page.screenshot({path:path.join(output,file),animations:'disabled',fullPage:true,timeout:30000});
        const metrics = await page.evaluate(() => ({
          width:window.innerWidth,
          documentWidth:document.documentElement.scrollWidth,
          cockpitCount:document.querySelectorAll('[data-testid="vx-nostromo-cockpit"]').length,
          cockpitVisible:!!document.querySelector('[data-testid="vx-nostromo-cockpit"]') &&
            getComputedStyle(document.querySelector('[data-testid="vx-nostromo-cockpit"]')!).display !== 'none',
        }));
        screenshots.push({file,metrics});
        writeFileSync(path.join(output,prefix + '-metrics.json'),JSON.stringify({
          schema:'libre-chat-vx.native-visual-inspection.v1',
          revision,overlayFlag:flag,viewport,screenshots,errors,
          material_verified:false,live_verified:false,
          test_profile:'UPSTREAM_E2E_MOCK_MODEL'
        },null,2));
      };
      await snap('empty-chat');
      if (viewport.label === 'desktop') {
        await selectMockEndpoint(page,MOCK_ENDPOINTS[0]);
        const response = await sendMessageAndWaitForCompletion(page,'NOSTROMO E2E prueba de composición visual');
        expect(response.ok()).toBeTruthy();
        await expect(mockReply(page)).toBeVisible();
        await snap('chat-with-response');
      }
      if (flag) expect(await page.locator('[data-testid="vx-nostromo-cockpit"]').count()).toBeGreaterThan(0);
      expect(errors).toEqual([]);
    });
  });
}
