/**
 * Admin screenshot capture — logs into diboy.dev admin and captures 7 admin pages.
 * Run: ADMIN_EMAIL=... ADMIN_PASSWORD=... node capture-admin-screenshots.mjs
 * Or with defaults from env: node capture-admin-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'public', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1280, height: 720 };
const BASE = 'https://diboy.dev';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@localhost';
const PASS  = process.env.ADMIN_PASSWORD || 'change-me';

async function shot(page, filename) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT_DIR, filename), fullPage: false });
  console.log(`✓ ${filename}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // Navigate to login page
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, 'admin-login.png');

  // Fill login form
  console.log(`\nLogging in as ${EMAIL}...`);
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log(`After login: ${currentUrl}`);

  if (currentUrl.includes('/login') || currentUrl.includes('/sign-in')) {
    console.log('\n⚠️  Login failed — credentials may be wrong for diboy.dev production.');
    console.log('Run with: ADMIN_EMAIL=your@email ADMIN_PASSWORD=yourpass node capture-admin-screenshots.mjs');
    await browser.close();
    process.exit(1);
  }

  console.log('✅ Logged in!');

  // Capture admin pages
  const pages = [
    { url: `${BASE}/admin`,          file: 'admin-dashboard.png' },
    { url: `${BASE}/admin/blog`,     file: 'admin-blog-list.png' },
    { url: `${BASE}/admin/blog/new`, file: 'admin-blog-editor.png' },
    { url: `${BASE}/admin/projects`, file: 'admin-projects.png' },
    { url: `${BASE}/admin/agents`,   file: 'admin-agents.png' },
    { url: `${BASE}/admin/career`,   file: 'admin-career.png' },
  ];

  for (const { url, file } of pages) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, file);
  }

  await browser.close();
  console.log('\n✅ Admin screenshots done.');
})();
