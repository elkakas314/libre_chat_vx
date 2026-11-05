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
          contextCount:document.querySelectorAll('[data-testid="vx-context-surface"]').length,
          launcherCount:document.querySelectorAll('.vx-context-launcher').length,
          mainWidth:document.querySelector('main[role="main"]')?.getBoundingClientRect().width ?? 0,
        }));
        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.width + 2);
        screenshots.push({file,metrics});
        writeFileSync(path.join(output,prefix + '-metrics.json'),JSON.stringify({
          schema:'libre-chat-vx.native-visual-inspection.v1',
          revision,overlayFlag:flag,viewport,screenshots,errors,
          material_verified:false,live_verified:false,
          test_profile:'UPSTREAM_E2E_MOCK_MODEL'
        },null,2));
      };
      const launcher = page.getByRole('button', { name:'Abrir contexto NOSTROMO' });
      const context = page.getByTestId('vx-context-surface');
      await expect(context).toHaveCount(0);
      if (flag) await expect(launcher).toBeVisible();
      else await expect(launcher).toHaveCount(0);
      const mainWidth = await page.getByRole('main').evaluate(el => el.getBoundingClientRect().width);
      expect(mainWidth).toBeGreaterThan(viewport.label === 'desktop' ? 600 : 300);
      await snap('empty-chat');
      if (viewport.label === 'desktop') {
        await selectMockEndpoint(page,MOCK_ENDPOINTS[0]);
        const response = await sendMessageAndWaitForCompletion(page,'NOSTROMO E2E prueba de composición visual');
        expect(response.ok()).toBeTruthy();
        await expect(mockReply(page)).toBeVisible();
        await snap('chat-with-response');
      }
      if (flag) {
        await launcher.click();
        await expect(context).toBeVisible();
        await expect(context.getByText('MANOJOS3')).toBeVisible();
        await expect(context.getByText('VX13')).toBeVisible();
        await snap('context-open');
        await context.getByRole('button', { name:'Ver detalles técnicos' }).click();
        await expect(context.getByText('Observaciones LIVE: no verificadas.')).toBeVisible();
        await snap('technical-details');
        await context.getByRole('button', { name:'Ocultar detalles técnicos' }).click();
        if (viewport.label === 'desktop') {
          await page.evaluate(() => {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          });
          await snap('context-light');
          await page.evaluate(() => {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
          });
        }
        await page.keyboard.press('Escape');
        await expect(context).toHaveCount(0);
        await expect(launcher).toBeFocused();
        await snap('escape-return');
        await launcher.press('Enter');
        await expect(context).toBeVisible();
        await context.getByRole('button',{name:'Cerrar contexto NOSTROMO'}).click();
        await expect(context).toHaveCount(0);
        await expect(launcher).toBeFocused();
        await snap('context-closed');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('textbox', { name:'Message input' }).waitFor({state:'attached'});
        await expect(page.getByTestId('vx-context-surface')).toHaveCount(0);
        await expect(page.getByRole('button', {name:'Abrir contexto NOSTROMO'})).toBeVisible();
        await snap('reloaded-chat');
      }
      expect(errors).toEqual([]);
    });
  });
}
