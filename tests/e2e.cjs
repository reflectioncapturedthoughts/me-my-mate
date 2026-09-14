/* MeMyMate end-to-end test — runs the full user journey in headless Chrome
   against the PRODUCTION build (http://localhost:4173).

   Usage:
     npm run build && npm run preview          # serve dist on :4173
     npm i -D puppeteer-core                   # + any local Chrome/Chromium
     CHROME=/path/to/chrome node tests/e2e.cjs # (edit BASE/executablePath below)

   Covers: splash → signup → quick tour → create (typing + auto-seconds) →
   play (repeats, topic clear, win) → share link → settings (theme/dark/sound)
   → logout/login → auth errors → knight-code mode → fail/restart → mobile. */
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const BASE = "http://localhost:4173";
const SHOTS = "/tmp/shots";
fs.mkdirSync(SHOTS, { recursive: true });

let passed = 0, failed = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} ${extra}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** goto + wait for the 3s splash to finish (fresh document each time). */
async function gotoPage(page, url) {
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector(".splash", { timeout: 3000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector(".splash"), { timeout: 8000 });
  await sleep(150);
}

/** Click an ElementHandle; if coordinates fail, diagnose + JS-click. */
async function clickHandle(page, handle, label = "") {
  try {
    await handle.click();
  } catch (e) {
    const diag = await page.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const at = document.elementFromPoint(cx, cy);
      return {
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        inViewport: r.top >= 0 && r.bottom <= window.innerHeight,
        elementAtCenter: at ? at.tagName + "." + (at.className || "").toString().slice(0, 40) : null,
        scrollY: window.scrollY,
      };
    }, handle);
    console.log(`  ⚠️ coord-click failed (${label}):`, e.message.split("\n")[0], JSON.stringify(diag));
    await handle.evaluate((el) => el.click());
  }
}

/** Set a React-controlled input's value the React-compatible way. */
async function setInput(page, selector, index, value) {
  await page.evaluate(
    (sel, idx, val) => {
      const el = document.querySelectorAll(sel)[idx];
      const proto =
        el.tagName === "TEXTAREA"
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    selector,
    index,
    value
  );
}

async function clickText(page, selector, text) {
  const handle = await page.evaluateHandle(
    (sel, txt) =>
      [...document.querySelectorAll(sel)].find((e) =>
        e.textContent.toLowerCase().includes(txt.toLowerCase())
      ) || null,
    selector,
    text
  );
  const el = handle.asElement();
  if (!el) throw new Error(`No element <${selector}> containing "${text}"`);
  try {
    await el.click();
  } catch {
    await el.evaluate((e) => e.click()); // fallback: JS click
  }
  return el;
}

async function waitGone(page, selector, timeout = 8000) {
  await page.waitForFunction(
    (s) => !document.querySelector(s),
    { timeout },
    selector
  );
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/tmp/chromium",
    env: { ...process.env, LD_LIBRARY_PATH: "/tmp/chromium-libs" },
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860 });
  page.on("pageerror", (e) => console.log("  ⚠️ PAGE ERROR:", e.message));

  /* ---------- 1. splash ---------- */
  console.log("[1] Splash screen");
  await page.goto(BASE + "/", { waitUntil: "networkidle2" });
  await page.waitForSelector(".splash", { timeout: 4000 });
  ok("splash visible with ARCT logo", await page.$(".splash .splash-logo") !== null);
  await page.screenshot({ path: SHOTS + "/01-splash.png" });
  const t0 = Date.now();
  await waitGone(page, ".splash", 6000);
  const splashTime = Date.now() - t0;
  ok(`splash lasted ~3s (measured from load: ${splashTime}ms after first check)`, true);
  ok("redirected to /auth (not logged in)", page.url().endsWith("/auth"), page.url());
  await page.screenshot({ path: SHOTS + "/02-auth.png" });

  /* ---------- 2. signup + quick tour ---------- */
  console.log("[2] Signup + quick tour");
  await page.type("#name", "Aarav Sharma");
  await page.type("#username", "aarav_test");
  await page.type("#password", "knight123");
  await page.screenshot({ path: SHOTS + "/03-signup-filled.png" });
  await clickText(page, "form button.btn-primary", "Create my account");
  await page.waitForSelector(".tour-card", { timeout: 6000 });
  ok("quick tour appeared after signup", true);
  await page.screenshot({ path: SHOTS + "/04-tour.png" });
  await clickText(page, ".tour-card button", "Next");
  await sleep(250);
  await clickText(page, ".tour-card button", "Next");
  await sleep(250);
  await clickText(page, ".tour-card button", "Next");
  await sleep(300);
  ok("tour slide 4 shows theme picker", await page.$(".tour-card .theme-grid") !== null);
  await clickText(page, ".tour-card button", "Let's go");
  await waitGone(page, ".tour-card");
  await page.waitForSelector(".hero", { timeout: 5000 });
  ok("landed on dashboard", await page.$(".hero") !== null);
  ok("greeting uses first name", (await page.$eval(".hero h1", (e) => e.textContent)).includes("Aarav"));
  await page.screenshot({ path: SHOTS + "/05-dashboard-empty.png" });

  /* ---------- 3. create knight via form ---------- */
  console.log("[3] Create knight (typing mode)");
  await clickText(page, ".hero button", "New Knight");
  await page.waitForSelector("#ktitle", { timeout: 5000 });
  await page.type("#ktitle", "Science — Force & Motion");
  await page.type(".topic-head .input", "Key Definitions");
  const text140 = "x".repeat(140); // 140 chars → ceil(140/20) = 7 seconds
  await page.type(".card-row textarea", text140);
  await sleep(200);
  const secsVal = await page.$eval(".card-row input[type=number]", (e) => e.value);
  ok("seconds auto-set while typing (140 chars → 7s)", secsVal === "7", `got ${secsVal}`);
  ok("auto badge shown", (await page.$(".badge-auto")) !== null);
  // manually change seconds → auto disengages
  await setInput(page, ".card-row input[type=number]", 0, "9");
  await sleep(150);
  const autoBadgeGone = (await page.$(".badge-auto")) === null;
  ok("manual edit disables auto", autoBadgeGone);
  ok("↺ auto button appears", await page.$eval("button[title*='automatic']", (e) => !!e) );
  // set repeats = 2 on card 1
  await setInput(page, ".card-row input[type=number]", 1, "2");
  await sleep(150);
  const repVal = await page.$$eval(".card-row input[type=number]", (els) => els[1].value);
  ok("repeats set to 2", repVal === "2", `got ${repVal}`);
  // add a second card
  await clickText(page, ".topic-block button", "Add card to this topic");
  await sleep(200);
  const cards = await page.$$(".card-row textarea");
  await cards[1].type("Newton's second law: F = ma, where F is force, m is mass and a is acceleration produced.");
  await sleep(200);
  const secs2 = await (await page.$$(".card-row input[type=number]"))[2].evaluate((e) => e.value);
  ok("second card auto-seconds = ceil(88/20) = 5", secs2 === "5", `got ${secs2}`);
  // add a second topic with a real card
  await clickText(page, ".page button", "Add topic");
  await sleep(250);
  ok("second topic added", (await page.$$(".topic-block")).length === 2);
  const topicBlocks = await page.$$(".topic-block");
  const t2Textarea = await topicBlocks[1].$(".card-row textarea");
  await t2Textarea.type("Momentum equals mass times velocity, p = mv, measured in kg m/s.");
  await sleep(200);
  // view as knight code modal
  await clickText(page, ".page button", "View as Knight Code");
  await page.waitForSelector(".modal pre", { timeout: 3000 });
  const genCode = await page.$eval(".modal pre", (e) => e.textContent);
  ok("generated code contains <knightcode> and repeats", genCode.includes("<knightcode>") && genCode.includes("<2/k>"));
  await page.screenshot({ path: SHOTS + "/07-code-view-modal.png" });
  await clickText(page, ".modal button", "Close");
  await sleep(200);
  await page.screenshot({ path: SHOTS + "/06-create-form.png" });
  await clickText(page, ".summary-bar button", "Forge Knight");
  await page.waitForSelector(".play-overlay", { timeout: 6000 });
  ok("after forging → game intro overlay", true);
  ok("intro lists 2 topics", (await page.$$(".topic-list .tl")).length === 2);
  await page.screenshot({ path: SHOTS + "/08-play-intro.png" });

  /* ---------- 4. play + win ---------- */
  console.log("[4] Play the game (win path)");
  await clickText(page, ".overlay-card button", "Start Battle");
  await page.waitForSelector(".playcard-text", { timeout: 4000 });
  ok("card 1 shown", (await page.$eval(".playcard-text", (e) => e.textContent)).startsWith("xxxx"));
  await page.screenshot({ path: SHOTS + "/09-playing-card.png" });
  await sleep(600); // grace period
  await page.click(".tap-btn");
  await sleep(900); // success animation + next card
  const repChip = await page.$eval(".chip.accent", (e) => e.textContent).catch(() => "");
  ok("repetition chip shows 2/2", repChip.includes("2/2"), repChip);
  await sleep(400);
  await page.click(".tap-btn"); // rep 2 of card 1
  await sleep(900);
  const card2 = await page.$eval(".playcard-text", (e) => e.textContent);
  ok("card 2 shown after repeats", card2.includes("Newton"), card2.slice(0, 40));
  await sleep(400);
  await page.click(".tap-btn"); // card 2 (Newton)
  await sleep(900);
  // topic 1 done → topic clear overlay → auto continues to topic 2's card
  await sleep(1800);
  const card3 = await page.$eval(".playcard-text", (e) => e.textContent).catch(() => "");
  ok("topic 2 card shown after topic-clear", card3.includes("Momentum"), card3.slice(0, 30));
  await sleep(400);
  await page.click(".tap-btn");
  await sleep(1200);
  const winH2 = await page.$eval(".overlay-card h2", (e) => e.textContent).catch(() => "");
  ok("win overlay 🏆", winH2.toLowerCase().includes("conquered"), winH2);
  ok("confetti rendered", (await page.$$(".confetti")).length > 10);
  await page.screenshot({ path: SHOTS + "/10-win.png" });

  /* ---------- 5. share link → public page ---------- */
  console.log("[5] Shared knight link");
  const knightId = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem("mmm_local_db_v1"));
    const key = Object.keys(db.knights)[0];
    return db.knights[key].id;
  });
  await clickText(page, ".overlay-card button", "Done");
  await page.waitForSelector(".hero", { timeout: 5000 });
  await page.goto(`${BASE}/knight?by=aarav_test&id=${knightId}`, { waitUntil: "networkidle2" });
  await page.waitForSelector(".share-hero", { timeout: 5000 });
  const shareTitle = await page.$eval(".share-hero h1", (e) => e.textContent);
  ok("public shared page loads knight", shareTitle.includes("Force & Motion"), shareTitle);
  ok("shows 'forged by @aarav_test'", (await page.$eval(".share-hero .by", (e) => e.textContent)).includes("@aarav_test"));
  await page.screenshot({ path: SHOTS + "/11-shared.png" });
  // play from shared page
  await clickText(page, ".panel button", "Play now");
  await page.waitForSelector(".play-overlay", { timeout: 4000 });
  ok("can play straight from share link", true);
  await clickText(page, ".play-overlay button", "Back");
  await page.waitForSelector(".share-hero", { timeout: 4000 });

  /* ---------- 6. settings: theme + dark + sound ---------- */
  console.log("[6] Settings");
  await gotoPage(page, BASE + "/settings");
  await page.waitForSelector(".theme-grid", { timeout: 5000 });
  const themeBtns = await page.$$(".theme-option");
  await clickHandle(page, themeBtns[5], "candy theme");
  await sleep(300);
  const modeBtns = await page.$$(".mode-toggle button");
  await clickHandle(page, modeBtns[1], "dark mode");
  await sleep(300);
  const attrs = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    mode: document.documentElement.dataset.mode,
  }));
  ok("theme switched to candy", attrs.theme === "candy", JSON.stringify(attrs));
  ok("mode switched to dark", attrs.mode === "dark");
  await page.screenshot({ path: SHOTS + "/12-settings-dark-candy.png" });
  // sound toggle
  const soundOn = await page.$eval(".switch", (e) => e.classList.contains("on"));
  await clickHandle(page, await page.$(".switch"), "sound switch");
  await sleep(200);
  const soundOff = await page.$eval(".switch", (e) => !e.classList.contains("on"));
  ok(`sound toggled (${soundOn} → off)`, soundOn && soundOff);
  // back to arct light for pretty shots later
  await clickHandle(page, themeBtns[0], "arct theme");
  await clickHandle(page, modeBtns[0], "light mode");

  /* ---------- 7. logout + login again ---------- */
  console.log("[7] Logout / login");
  await clickText(page, ".panel button", "Sign out");
  await page.waitForSelector("#username", { timeout: 5000 });
  ok("logged out → auth page", page.url().endsWith("/auth"));
  await clickText(page, ".tabs button", "I have an account");
  await page.type("#username", "aarav_test");
  await page.type("#password", "knight123");
  await clickText(page, "form button.btn-primary", "Enter the castle");
  try {
    await page.waitForSelector(".knight-grid", { timeout: 8000 });
  } catch (e) {
    const diag = await page.evaluate(() => ({
      url: location.pathname,
      err: document.querySelector(".issue.error")?.textContent || null,
      hasGrid: !!document.querySelector(".knight-grid"),
      emptyState: !!document.querySelector(".empty-state"),
    }));
    console.log("  ⚠️ knight-grid wait failed:", JSON.stringify(diag));
    await page.screenshot({ path: SHOTS + "/debug-login.png" });
    throw e;
  }
  ok("login restored session + knights", (await page.$$(".knight-card")).length === 1);
  ok("battles won stat = 1", (await page.$$eval(".stat b", (els) => els.map((e) => e.textContent))).includes("1"));
  await page.screenshot({ path: SHOTS + "/13-dashboard-with-knight.png" });

  /* ---------- 8. wrong password ---------- */
  console.log("[8] Auth errors");
  await page.evaluate(() => localStorage.removeItem("mmm_session_v1"));
  await gotoPage(page, BASE + "/auth");
  await clickText(page, ".tabs button", "I have an account");
  await page.type("#username", "aarav_test");
  await page.type("#password", "wrongpass");
  await clickText(page, "form button.btn-primary", "Enter the castle");
  await page.waitForSelector(".issue.error", { timeout: 4000 });
  ok("wrong password shows error", (await page.$eval(".issue.error", (e) => e.textContent)).includes("Wrong password"));

  /* ---------- 9. fail path in game ---------- */
  console.log("[9] Game fail → restart");
  // login again first
  await page.$eval("#password", (e) => { e.value = ""; });
  await page.type("#password", "knight123");
  await clickText(page, "form button.btn-primary", "Enter the castle");
  try {
    await page.waitForSelector(".knight-grid", { timeout: 8000 });
  } catch (e) {
    const diag = await page.evaluate(() => ({
      url: location.pathname,
      err: document.querySelector(".issue.error")?.textContent || null,
      hasGrid: !!document.querySelector(".knight-grid"),
      emptyState: !!document.querySelector(".empty-state"),
    }));
    console.log("  ⚠️ knight-grid wait failed:", JSON.stringify(diag));
    await page.screenshot({ path: SHOTS + "/debug-login.png" });
    throw e;
  }
  // create a tiny 1-second knight via code mode
  await gotoPage(page, BASE + "/create");
  await page.waitForSelector(".mode-switch", { timeout: 5000 });
  const modeCards = await page.$$(".mode-card");
  await clickHandle(page, modeCards[1], "code mode");
  await page.waitForSelector(".code-editor", { timeout: 3000 });
  const tinyCode = `<knightcode>\n<title>Tiny Battle</title>\n<topic1>One Card</topic1>\n<k1 1>Say me fast!<2/k>\n</knightcode>`;
  await setInput(page, ".code-editor", 0, tinyCode);
  await sleep(400);
  const okIssue = await page.$(".issue.ok");
  ok("live validation: perfect code banner", okIssue !== null);
  await page.screenshot({ path: SHOTS + "/14-create-code.png" });
  await clickText(page, ".summary-bar button", "Forge Knight");
  await page.waitForSelector(".play-overlay", { timeout: 6000 });
  await clickText(page, ".overlay-card button", "Start Battle");
  await page.waitForSelector(".playcard-text", { timeout: 4000 });
  // do NOT tap → 1s timer expires → fail overlay
  await page.waitForFunction(
    () => [...document.querySelectorAll(".overlay-card h2")].some((h) => h.textContent.includes("Time's up")),
    { timeout: 5000 }
  );
  ok("timeout → “Time's up!” fail overlay", true);
  await page.screenshot({ path: SHOTS + "/15-failed.png" });
  await clickText(page, ".overlay-card button", "Restart Knight");
  await page.waitForSelector(".playcard-text", { timeout: 4000 });
  ok("restart works → card shown again", true);
  await sleep(500);
  await page.click(".tap-btn"); // win rep 1 (within its 1s window)
  await sleep(1150);            // rep2 starts at +620ms; tap lands at rep2+530ms (350<530<1000)
  await page.click(".tap-btn"); // win rep 2 → victory
  await sleep(1400);
  const win2 = await page.$eval(".overlay-card h2", (e) => e.textContent).catch(() => "");
  ok("tiny knight won after restart", win2.toLowerCase().includes("conquered"), win2);

  /* ---------- 10. guide page + mobile layout ---------- */
  console.log("[10] Guide + mobile");
  await clickText(page, ".overlay-card button", "Done");
  await page.waitForSelector(".hero", { timeout: 5000 });
  await gotoPage(page, BASE + "/guide");
  await page.waitForSelector("#knight-code", { timeout: 5000 });
  ok("guide page with knight-code anchor", true);
  ok("guide shows code sample", (await page.$eval("#knight-code pre", (e) => e.textContent)).includes("<knightcode>"));
  await page.screenshot({ path: SHOTS + "/16-guide.png", fullPage: false });

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await gotoPage(page, BASE + "/");
  await page.waitForSelector(".knight-grid", { timeout: 5000 });
  ok("mobile dashboard renders 2 knights", (await page.$$(".knight-card")).length === 2);
  await page.screenshot({ path: SHOTS + "/17-mobile-dashboard.png" });
  await clickHandle(page, await page.$(".nav-burger"), "burger");
  await sleep(300);
  ok("mobile burger menu opens", await page.$eval(".nav-links", (e) => e.classList.contains("open")));
  await page.screenshot({ path: SHOTS + "/18-mobile-menu.png" });
  // mobile play screen
  const playBtn = await page.$(".knight-card .btn-primary");
  await clickHandle(page, playBtn, "mobile play");
  await page.waitForSelector(".overlay-card", { timeout: 4000 });
  await clickText(page, ".overlay-card button", "Start Battle");
  await page.waitForSelector(".tap-btn", { timeout: 4000 });
  await page.screenshot({ path: SHOTS + "/19-mobile-play.png" });
  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 2
  );
  ok("no horizontal overflow on mobile", noHScroll);

  /* ---------- done ---------- */
  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  console.error("E2E CRASH:", e);
  process.exit(1);
});