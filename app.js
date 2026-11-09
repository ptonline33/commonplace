/* Commonplace — a small offline-first, general-purpose blog PWA. */
"use strict";

const CFG = window.COMMONPLACE_CONFIG || {};
const API = (CFG.apiBase || "/api");
const $ = (id) => document.getElementById(id);

const state = {
  catalog: [],          // post metadata (local + cloud, merged)
  postCache: {},        // slug -> full post (with blocks)
  deferredPrompt: null,
  currentSlug: null,
  tocIds: [],
  clapCount: 0,
  clapBusy: false,
  prefs: { font: "atkinson", size: 1.0, theme: "system" }
};

const TOPICS = ["Field guides", "City notes", "Essays", "How-tos", "Reading lists", "Detours"];

/* ------------------------------ helpers ------------------------------ */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function safeUrl(u) {
  u = String(u || "").trim();
  return /^(https?:\/\/|mailto:|tel:|#|\.\/|\/)/i.test(u) ? u : "#";
}
function inlineMd(s) {
  let t = esc(s || "");
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
    (m, label, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.hidden = true; }, 3200);
}
async function getJSON(url, timeout = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } finally { clearTimeout(timer); }
}
function fmtDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return isNaN(d) ? iso : d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}
function store(key, val) { try { localStorage.setItem("commonplace:" + key, val); } catch (_) {} }
function read(key) { try { return localStorage.getItem("commonplace:" + key); } catch (_) { return null; } }
function accentOf(meta) {
  const a = meta && meta.accent;
  return (Array.isArray(a) ? a[0] : a) || "#b23a2b";
}

/* ------------------------------ block renderer ------------------------------ */
function renderBlocks(blocks) {
  state.tocIds = [];
  let html = "";
  for (const b of blocks || []) {
    switch (b.type) {
      case "h2": {
        const id = b.id || ("sec-" + state.tocIds.length);
        state.tocIds.push({ id, label: b.text });
        html += `<h2 id="${esc(id)}">${esc(b.text)}</h2>`;
        break;
      }
      case "h3":
        html += `<h3>${esc(b.text)}</h3>`;
        break;
      case "lead":
        html += `<p class="lead">${inlineMd(b.text)}</p>`;
        break;
      case "p":
        html += `<p>${inlineMd(b.text)}</p>`;
        break;
      case "ul":
        html += "<ul>" + (b.items || []).map((i) => `<li>${inlineMd(i)}</li>`).join("") + "</ul>";
        break;
      case "ol":
        html += "<ol>" + (b.items || []).map((i) => `<li>${inlineMd(i)}</li>`).join("") + "</ol>";
        break;
      case "checklist":
        html += '<ul class="checklist">' + (b.items || []).map((i) => `<li><span>${inlineMd(i)}</span></li>`).join("") + "</ul>";
        break;
      case "quote":
        html += `<blockquote class="quote"><p>${inlineMd(b.text)}</p>${b.by ? `<cite>${esc(b.by)}</cite>` : ""}</blockquote>`;
        break;
      case "callout":
        html += `<div class="callout ${esc(b.tone || "")}"><div class="ic" aria-hidden="true">${esc(b.icon || "i")}</div><div><b>${esc(b.title)}</b><p>${inlineMd(b.text)}</p></div></div>`;
        break;
      case "divider":
        html += '<hr class="divider">';
        break;
      case "stats":
        html += '<div class="stats">' + (b.items || []).map((s) =>
          `<div class="stat-box"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("") + "</div>";
        break;
      case "route":
        html += `<div class="route"><h3>${esc(b.title)}</h3><ol>` +
          (b.stops || []).map((s) => `<li>${inlineMd(s)}</li>`).join("") +
          `</ol>${b.note ? `<p class="note">${inlineMd(b.note)}</p>` : ""}</div>`;
        break;
      case "venue":
        html += renderVenue(b);
        break;
      case "sources":
        html += `<div class="sources"><h3>${esc(b.title || "Sources")}</h3><ul>` +
          (b.items || []).map((s) => `<li><a href="${safeUrl(esc(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join("") +
          "</ul></div>";
        break;
      default:
        break;
    }
  }
  return html;
}

function renderVenue(v) {
  const facts = [
    ["Where", v.address], ["Hours", v.hours], ["Table rate", v.rate],
    ["Getting there", v.transit], ["Parking", v.parking], ["Best for", v.bestFor]
  ].filter((f) => f[1]);
  return `<section class="venue" id="${esc(v.id || "")}" style="--v:${esc(v.c1 || "#b23a2b")}">
    <div class="venue-top">
      <div class="venue-num">${esc(v.num || "Stop")}</div>
      <h3>${esc(v.name)}</h3>
      <div class="venue-area">${esc(v.area || "")}</div>
      ${v.badge ? `<div class="venue-badge">${esc(v.badge)}</div>` : ""}
    </div>
    <div class="venue-body">
      <p class="venue-vibe">${inlineMd(v.vibe)}</p>
      <div class="venue-grid">${facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${inlineMd(f[1])}</dd></div>`).join("")}</div>
      ${v.tip ? `<p class="venue-tip"><b>Pro tip &rarr;</b> ${inlineMd(v.tip)}</p>` : ""}
      <div class="venue-links">${(v.links || []).map((l) =>
        `<a href="${safeUrl(esc(l.url))}" target="_blank" rel="noopener noreferrer">${esc(l.label)} &nearr;</a>`).join("")}</div>
    </div>
  </section>`;
}

/* ------------------------------ home ------------------------------ */
function renderHome() {
  const posts = state.catalog.filter((p) => p.published !== false);
  $("postCount").textContent = posts.length + (posts.length === 1 ? " post" : " posts");

  const stats = [
    { value: "01", label: "post and counting" },
    { value: "12 min", label: "the first read" },
    { value: "0", label: "trackers or paywalls" },
    { value: "100%", label: "offline ready" }
  ];
  $("statStrip").innerHTML = stats.map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("");

  if (!posts.length) {
    $("postGrid").innerHTML = '<p class="muted">No posts yet — check back soon.</p>';
  } else {
    $("postGrid").innerHTML = posts.map((p, i) => {
      const accent = accentOf(p);
      const cover = `<div class="card-cover">
          <span class="cover-label">Commonplace &middot; ${esc(p.kicker || "Journal")}</span>
          <span class="cover-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="cover-lines"><i></i><i></i><i></i></span>
        </div>`;
      return `<a class="post-card ${i === 0 ? "featured" : ""}" href="#/post/${esc(p.slug)}" style="--post-accent:${esc(accent)}">
        ${cover}
        <div class="card-body">
          <div class="meta"><span>${esc(fmtDate(p.date))}</span><span>&middot;</span><span>${esc(p.readMinutes || 8)} min read</span></div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.dek)}</p>
          <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          <div class="card-cta">Read the post &rarr;</div>
        </div>
      </a>`;
    }).join("");
  }

  $("topicRow").innerHTML = TOPICS.map((t) => `<span class="topic">${esc(t)}</span>`).join("");
}

/* ------------------------------ article ------------------------------ */
async function getPostData(meta) {
  if (meta.body && Array.isArray(meta.body)) return meta;
  if (state.postCache[meta.slug]) return state.postCache[meta.slug];
  const path = meta.file || `posts/${meta.slug}.json`;
  const data = await getJSON(path);
  state.postCache[meta.slug] = data;
  return data;
}

async function openPost(slug) {
  const meta = state.catalog.find((p) => p.slug === slug);
  if (!meta) { toast("That post isn't in the journal yet."); location.hash = "#/"; return; }
  state.currentSlug = slug;

  const head = $("articleHead");
  head.innerHTML = `<p class="kicker">${esc(meta.kicker || "Journal")}</p>
    <h1>${esc(meta.title)}</h1>
    <p class="dek">${esc(meta.dek)}</p>
    <div class="byline"><span class="avatar">A</span>
      <span><strong>${esc(meta.author || "Andrew")}</strong> &middot; ${esc(fmtDate(meta.date))} &middot; ${esc(meta.readMinutes || 8)} min read</span>
    </div>`;

  const cover = $("articleCover");
  cover.style.setProperty("--post-accent", accentOf(meta));
  cover.innerHTML = `<span class="cover-text">Commonplace &middot; ${esc(meta.kicker || "Journal")}</span>
    <span class="cover-num">01</span>
    <span class="cover-lines"><i></i><i></i><i></i></span>`;

  $("articleBody").innerHTML = '<p class="muted">Loading the post&hellip;</p>';
  try {
    const post = await getPostData(meta);
    $("articleBody").innerHTML = renderBlocks(post.blocks || post.body || []);
    buildToc();
    renderArticleFoot(meta);
    await loadClaps(slug);
  } catch (e) {
    $("articleBody").innerHTML = '<p class="error">This post could not be loaded. It may still be downloading for offline use — try again when you are back online.</p>';
  }
  window.scrollTo({ top: 0, behavior: "auto" });
  updateProgress();
}

function buildToc() {
  const toc = $("toc");
  if (!state.tocIds.length) { toc.hidden = true; return; }
  toc.hidden = false;
  toc.innerHTML = `<h2>On this page</h2>` + state.tocIds.map((t) =>
    `<a href="#${esc(t.id)}" data-toc="${esc(t.id)}">${esc(t.label)}</a>`).join("");
  toc.querySelectorAll("a").forEach((a) => a.addEventListener("click", (ev) => {
    ev.preventDefault();
    const target = $(a.dataset.toc);
    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 82, behavior: "smooth" });
  }));
}

function renderArticleFoot(meta) {
  $("articleFoot").innerHTML = `
    <div class="reactions">
      <button id="clapBtn" class="clap-btn" type="button">👏 Give it a clap</button>
      <span class="clap-count" id="clapCount">0 claps</span>
      <span class="muted" id="clapNote">Saved on this device &middot; synced when online</span>
    </div>
    <div class="article-nav">
      <a class="pill" href="#/">&larr; All posts</a>
      <a class="pill" href="#/about">About the journal &rarr;</a>
    </div>`;
  $("clapBtn").addEventListener("click", () => clap(meta.slug));
}

async function loadClaps(slug) {
  const local = Number(read("claps:" + slug) || 0);
  state.clapCount = local;
  paintClaps();
  try {
    const data = await getJSON(`${API}/reactions?slug=${encodeURIComponent(slug)}`);
    if (data && data.ok && typeof data.count === "number") {
      state.clapCount = data.count;
      paintClaps();
    }
  } catch (_) { /* offline: local count stands */ }
}
function paintClaps() {
  const el = $("clapCount");
  if (el) el.textContent = `${state.clapCount} ${state.clapCount === 1 ? "clap" : "claps"}`;
  const btn = $("clapBtn");
  if (btn && read("clapped:" + state.currentSlug)) {
    btn.textContent = "👏 Clapped — thanks!";
    btn.disabled = true;
  }
}
async function clap(slug) {
  if (state.clapBusy) return;
  if (read("clapped:" + slug)) return;
  state.clapBusy = true;
  store("clapped:" + slug, "1");
  const local = Number(read("claps:" + slug) || 0) + 1;
  store("claps:" + slug, String(local));
  state.clapCount = Math.max(state.clapCount + 1, local);
  paintClaps();
  toast("Thanks for the clap! 👏");
  try {
    const res = await fetch(`${API}/reactions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, kind: "clap" })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.count === "number") state.clapCount = data.count;
      if ($("clapNote")) $("clapNote").textContent = "Synced with Supabase";
      paintClaps();
    }
  } catch (_) { /* offline: the local clap is kept */ }
  state.clapBusy = false;
}

/* ------------------------------ cloud ------------------------------ */
async function loadCloudPosts() {
  try {
    const data = await getJSON(`${API}/posts`, 4500);
    if (!data || !data.ok || !Array.isArray(data.posts) || !data.posts.length) return;
    const bySlug = new Map(state.catalog.map((p) => [p.slug, p]));
    for (const p of data.posts) bySlug.set(p.slug, { ...bySlug.get(p.slug), ...p });
    state.catalog = Array.from(bySlug.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    renderHome();
  } catch (_) { /* bundled posts are the source of truth when offline */ }
}

/* ------------------------------ progress + spy ------------------------------ */
function updateProgress() {
  const bar = $("readingProgress").firstElementChild;
  const body = $("articleBody");
  if (!$("postView").hidden && body) {
    const start = body.getBoundingClientRect().top + window.scrollY;
    const end = start + body.offsetHeight - window.innerHeight * 0.6;
    const pct = Math.max(0, Math.min(100, ((window.scrollY - start + 200) / Math.max(1, end - start)) * 100));
    bar.style.width = pct + "%";
  } else {
    bar.style.width = "0%";
  }
  if (!$("postView").hidden && state.tocIds.length) {
    let active = state.tocIds[0].id;
    for (const t of state.tocIds) {
      const el = $(t.id);
      if (el && el.getBoundingClientRect().top <= 130) active = t.id;
    }
    $("toc").querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.toc === active));
  }
}

/* ------------------------------ reader prefs + appearance ------------------------------ */
const FONTS = {
  atkinson: '"Atkinson Hyperlegible", Arial, sans-serif',
  literata: '"Literata", Georgia, serif',
  lexend: '"Lexend", Arial, sans-serif',
  lora: '"Lora", Georgia, serif'
};
function resolvedTheme() {
  if (state.prefs.theme === "light" || state.prefs.theme === "dark") return state.prefs.theme;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyAppearance() {
  const theme = resolvedTheme();
  document.documentElement.setAttribute("data-theme", theme);
  const btn = $("themeBtn");
  if (btn) {
    btn.textContent = theme === "dark" ? "☀" : "☾";
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance");
  }
  const color = theme === "dark" ? "#141518" : "#f7f5f0";
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
}
function applyPrefs() {
  document.documentElement.style.setProperty("--reader-font", FONTS[state.prefs.font] || FONTS.atkinson);
  document.documentElement.style.setProperty("--reader-size", (1.16 * state.prefs.size).toFixed(3) + "rem");
  $("fontSelect").value = state.prefs.font;
  applyAppearance();
}
function savePrefs() { store("prefs", JSON.stringify(state.prefs)); }
function loadPrefs() {
  try { Object.assign(state.prefs, JSON.parse(read("prefs") || "{}")); } catch (_) {}
  applyPrefs();
}

/* ------------------------------ router ------------------------------ */
function router() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const postMatch = /^\/post\/([\w-]+)(?:\/([\w-]+))?$/.exec(hash);
  const isPost = !!postMatch;
  const isAbout = hash === "/about";
  $("homeView").hidden = isPost || isAbout;
  $("postView").hidden = !isPost;
  $("aboutView").hidden = !isAbout;
  $("backBtn").hidden = !(isPost || isAbout);
  $("readerTools").hidden = !isPost;
  $("shareBtn").hidden = !isPost;
  $("toc").hidden = true;
  document.querySelectorAll("[data-nav]").forEach((a) =>
    a.classList.toggle("active", a.dataset.nav === (isAbout ? "about" : "home")));
  document.title = isPost ? "Post · Commonplace" : (isAbout ? "About · Commonplace" : "Commonplace — a general journal");
  if (isPost) {
    openPost(postMatch[1]).then(() => {
      if (postMatch[2]) {
        const target = $(postMatch[2]);
        if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 82, behavior: "auto" });
      }
    });
  } else { state.currentSlug = null; updateProgress(); }
  if (isAbout) window.scrollTo({ top: 0, behavior: "auto" });
}

/* ------------------------------ boot ------------------------------ */
async function boot() {
  loadPrefs();

  $("themeBtn").addEventListener("click", () => {
    state.prefs.theme = resolvedTheme() === "dark" ? "light" : "dark";
    applyAppearance();
    savePrefs();
  });
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener ? mq.addEventListener("change", () => { if (state.prefs.theme === "system") applyAppearance(); })
                        : mq.addListener(() => { if (state.prefs.theme === "system") applyAppearance(); });
  }

  $("fontSelect").addEventListener("change", (e) => { state.prefs.font = e.target.value; applyPrefs(); savePrefs(); });
  $("smallerBtn").addEventListener("click", () => { state.prefs.size = Math.max(0.8, +(state.prefs.size - 0.1).toFixed(2)); applyPrefs(); savePrefs(); });
  $("biggerBtn").addEventListener("click", () => { state.prefs.size = Math.min(1.6, +(state.prefs.size + 0.1).toFixed(2)); applyPrefs(); savePrefs(); });

  $("installBtn").addEventListener("click", doInstall);
  $("heroInstallBtn").addEventListener("click", doInstall);
  $("shareBtn").addEventListener("click", sharePost);
  $("backBtn").addEventListener("click", () => { location.hash = "#/"; });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    $("installBtn").hidden = false;
  });
  window.addEventListener("appinstalled", () => {
    state.deferredPrompt = null;
    $("installBtn").hidden = true;
    toast("Installed — the journal is yours. ✳");
  });

  const offline = () => { $("offlineBadge").hidden = navigator.onLine; };
  window.addEventListener("online", offline);
  window.addEventListener("offline", offline);
  offline();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  window.addEventListener("hashchange", router);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  try {
    const catalog = await getJSON("posts/index.json");
    state.catalog = catalog.posts || [];
  } catch (e) {
    state.catalog = [];
  }
  renderHome();
  router();
  loadCloudPosts();
}

async function doInstall() {
  if (state.deferredPrompt) {
    state.deferredPrompt.prompt();
    const choice = await state.deferredPrompt.userChoice;
    if (choice && choice.outcome === "accepted") toast("Installing Commonplace…");
    state.deferredPrompt = null;
    $("installBtn").hidden = true;
  } else {
    toast("Use your browser menu → Install app / Add to Home Screen.");
  }
}

async function sharePost() {
  const url = location.href;
  const data = { title: document.title, text: "A post from Commonplace", url };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(url);
    toast("Link copied to clipboard.");
  } catch (_) { /* user cancelled */ }
}

boot();
