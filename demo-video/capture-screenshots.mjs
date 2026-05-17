/**
 * Screenshot capture script for the Remotion demo video.
 * Captures public pages from localhost:3000 (mock mode) and admin pages from diboy.dev.
 * Run: node capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'public', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1280, height: 720 };

async function shot(page, filename) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT_DIR, filename), fullPage: false });
  console.log(`✓ ${filename}`);
}

async function removeBanner(page) {
  await page.evaluate(() => {
    // Remove mock mode banner (fixed bottom)
    document.querySelectorAll('[class*="fixed"]').forEach(el => {
      const style = getComputedStyle(el);
      if (style.position === 'fixed' && parseInt(style.bottom) >= 0) el.remove();
    });
  }).catch(() => {});
}

async function scrollTo(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, selector).catch(() => {});
  await page.waitForTimeout(600);
}

async function scrollPx(page, y) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await page.waitForTimeout(600);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  // ─── PUBLIC PAGES (localhost:3000, mock mode) ──────────────────────────────

  console.log('\n📸 Public pages...');

  // 1. Hero section
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await removeBanner(page);
  await scrollPx(page, 0);
  await shot(page, 'public-hero.png');

  // 2. About section
  await scrollTo(page, 'section[id="about"], [data-section="about"], h2');
  // Try scrolling to find the about section by looking for section headers
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h2, h3, [class*="section"]'));
    const about = headers.find(el => el.textContent?.toLowerCase().includes('about'));
    if (about) about.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 700, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await shot(page, 'public-about.png');

  // 3. Skills / Stack section
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h2, h3, [class*="section"], [class*="margin"]'));
    const skills = headers.find(el => el.textContent?.toLowerCase().includes('stack') || el.textContent?.toLowerCase().includes('skill'));
    if (skills) skills.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 1600, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await shot(page, 'public-skills.png');

  // 4. Projects section
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h2, h3, [class*="section"], [class*="margin"]'));
    const proj = headers.find(el => el.textContent?.toLowerCase().includes('project'));
    if (proj) proj.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 2800, behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await shot(page, 'public-projects.png');

  // 5. Robotics section
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h2, h3, [class*="margin"], [class*="section"]'));
    const rob = headers.find(el => el.textContent?.toLowerCase().includes('robot') || el.textContent?.toLowerCase().includes('move'));
    if (rob) rob.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 4500, behavior: 'instant' });
  });
  await page.waitForTimeout(1000); // Extra wait for Fusion 360 iframe
  await shot(page, 'public-robotics.png');

  // 6. Experience section
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h2, h3, [class*="margin"], [class*="section"]'));
    const exp = headers.find(el => el.textContent?.toLowerCase().includes('experience'));
    if (exp) exp.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 6000, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await shot(page, 'public-experience.png');

  // 7. Blog preview section (Writing §06)
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h2, h3, [class*="margin"], [class*="section"]'));
    const blog = headers.find(el => el.textContent?.toLowerCase().includes('writing') || el.textContent?.toLowerCase().includes('logbook') || el.textContent?.toLowerCase().includes('blog'));
    if (blog) blog.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 7500, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await shot(page, 'public-blog-preview.png');

  // 8. Contact section
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h2, h3, [class*="margin"], [class*="section"], form'));
    const contact = headers.find(el => el.textContent?.toLowerCase().includes('contact') || el.textContent?.toLowerCase().includes('touch'));
    if (contact) contact.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo({ top: 9000, behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await shot(page, 'public-contact.png');

  // 9. Blog listing
  await page.goto('http://localhost:3000/blog', { waitUntil: 'networkidle' });
  await removeBanner(page);
  await scrollPx(page, 0);
  await shot(page, 'blog-listing.png');

  // 10. Individual blog post — find the first post link and click it
  await page.goto('http://localhost:3000/blog', { waitUntil: 'networkidle' });
  await removeBanner(page);
  const postLink = await page.$('a[href^="/blog/"]');
  if (postLink) {
    const href = await postLink.getAttribute('href');
    await page.goto(`http://localhost:3000${href}`, { waitUntil: 'networkidle' });
    await removeBanner(page);
    await scrollPx(page, 0);
    await shot(page, 'blog-post.png');
  } else {
    // Fallback slug
    await page.goto('http://localhost:3000/blog/implementing-slam-from-scratch-with-ros2', { waitUntil: 'networkidle' });
    await removeBanner(page);
    await scrollPx(page, 0);
    await shot(page, 'blog-post.png');
  }

  // 11. Projects listing
  await page.goto('http://localhost:3000/projects', { waitUntil: 'networkidle' });
  await removeBanner(page);
  await scrollPx(page, 0);
  await shot(page, 'projects-listing.png');

  // ─── ADMIN PAGES (diboy.dev — user should be logged in) ──────────────────

  console.log('\n📸 Admin pages (diboy.dev — requires active session)...');

  const adminBase = 'https://diboy.dev';

  // 12. Admin login page (capture before the session auto-redirects)
  await page.goto(`${adminBase}/admin/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // If redirected to dashboard (already logged in), go back to capture login form
  if (page.url().includes('/admin/login') || page.url().includes('/login')) {
    await scrollPx(page, 0);
    await shot(page, 'admin-login.png');
  } else {
    // Redirected to dashboard — capture login via a fresh context
    const loginCtx = await browser.newContext({ viewport: VIEWPORT });
    const loginPage = await loginCtx.newPage();
    await loginPage.goto(`${adminBase}/admin/login`, { waitUntil: 'networkidle' });
    await loginPage.waitForTimeout(800);
    await loginPage.screenshot({ path: join(OUT_DIR, 'admin-login.png'), fullPage: false });
    console.log('✓ admin-login.png');
    await loginCtx.close();
  }

  // For subsequent admin pages use existing session from shared browser context
  // Note: session cookies from diboy.dev should be present if user was logged in before
  // If not logged in, these will redirect to login and we capture what's visible

  const adminPages = [
    { url: `${adminBase}/admin`, file: 'admin-dashboard.png' },
    { url: `${adminBase}/admin/blog`, file: 'admin-blog-list.png' },
    { url: `${adminBase}/admin/blog/new`, file: 'admin-blog-editor.png' },
    { url: `${adminBase}/admin/projects`, file: 'admin-projects.png' },
    { url: `${adminBase}/admin/agents`, file: 'admin-agents.png' },
    { url: `${adminBase}/admin/career`, file: 'admin-career.png' },
  ];

  for (const { url, file } of adminPages) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await scrollPx(page, 0);
    await shot(page, file);
  }

  await browser.close();
  console.log('\n✅ All screenshots captured to demo-video/public/screenshots/');
})();
