// ============ DATA HARGA & STOK (edit di sini) ============
// size = jumlah ekor per kg.
const SIZES = [
  { size: 20,  harga: 105000, stok: 120,  tren: 1.2 },
  { size: 30,  harga: 90000,  stok: 300,  tren: 0.6 },
  { size: 40,  harga: 80000,  stok: 450,  tren: -0.4 },
  { size: 50,  harga: 72000,  stok: 800,  tren: 0.8 },
  { size: 60,  harga: 66000,  stok: 1200, tren: 0 },
  { size: 70,  harga: 61000,  stok: 950,  tren: -1.1 },
  { size: 80,  harga: 57000,  stok: 600,  tren: 0.3 },
  { size: 90,  harga: 53000,  stok: 40,   tren: -0.6 },
  { size: 100, harga: 49000,  stok: 700,  tren: 0.5 },
];
// Potongan harga kalau udang masih campur
const POTONGAN_CAMPUR = 0.15;
const STOK_MENIPIS = 100;

// ============ HELPER ============
const $ = (id) => document.getElementById(id);
const rp = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const load = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const dataOf = (size) => SIZES.find((s) => s.size === Number(size));
const hargaOf = (size) => dataOf(size).harga;
const MAX_HARGA = Math.max(...SIZES.map((s) => s.harga));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function toast(msg, type = "ok") {
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = msg;
  $("toasts").appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3200);
}

// ============ ANIMASI UMUM ============
function countUp(el) {
  const to = Number(el.dataset.count) || 0;
  const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
  const fmt = (v) => pre + Math.round(v).toLocaleString("id-ID") + suf;
  if (reduceMotion) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 1400;
  const step = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    if (e.target.dataset.count !== undefined) countUp(e.target);
    if (e.target._onVisible) e.target._onVisible();
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });

function onVisible(el, cb) { el._onVisible = cb; io.observe(el); }

// gelembung hero
(function bubbles() {
  const box = $("bubbles");
  if (reduceMotion) return;
  for (let i = 0; i < 16; i++) {
    const b = document.createElement("i");
    const s = 8 + Math.random() * 34;
    b.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;` +
      `animation-duration:${8 + Math.random() * 10}s;animation-delay:${-Math.random() * 14}s`;
    box.appendChild(b);
  }
})();

// navbar: shadow, progress bar, back-to-top, burger, scroll-spy
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  $("progress").style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  $("nav").classList.toggle("scrolled", y > 20);
  $("toTop").classList.toggle("show", y > 600);
}, { passive: true });
$("toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

$("burger").addEventListener("click", () => {
  const open = $("menu").classList.toggle("open");
  $("burger").classList.toggle("open", open);
  $("burger").setAttribute("aria-expanded", open);
});
$("menu").addEventListener("click", (e) => {
  if (e.target.tagName === "A") { $("menu").classList.remove("open"); $("burger").classList.remove("open"); }
});

const links = [...document.querySelectorAll(".menu a")];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
  });
}, { rootMargin: "-40% 0px -55% 0px" });
links.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) spy.observe(s); });

// ============ TICKER & STATS ============
function buildTicker() {
  const item = (s) => {
    const cls = s.tren > 0 ? "up" : s.tren < 0 ? "down" : "flat";
    const arrow = s.tren > 0 ? "▲" : s.tren < 0 ? "▼" : "■";
    const pct = Math.abs(s.tren).toFixed(1).replace(".", ",") + "%";
    return `<span class="tk"><b>Size ${s.size}</b> ${rp(s.harga)} <span class="${cls}">${arrow} ${pct}</span></span>`;
  };
  const html = SIZES.map(item).join("");
  $("tickerTrack").innerHTML = html + html; // digandakan untuk loop mulus
}

function setStats() {
  $("stSize").dataset.count = SIZES.length;
  $("stStok").dataset.count = SIZES.reduce((a, s) => a + s.stok, 0);
  $("stPot").dataset.count = Math.round(POTONGAN_CAMPUR * 100);
  document.querySelectorAll("[data-count]").forEach((el) => io.observe(el));
}

// ============ KATALOG ============
function animateRows() {
  const rows = [...document.querySelectorAll("#katalogBody tr")];
  void $("katalogBody").offsetWidth; // paksa reflow supaya transisi jalan
  rows.forEach((tr, i) => { tr.style.transitionDelay = i * 55 + "ms"; tr.classList.add("in"); });
}

function renderKatalog(animate = true) {
  const f = $("fSize").value;
  const sort = $("fSort").value;
  const data = SIZES.filter((s) => !f || s.size === Number(f));

  data.sort((a, b) => {
    if (sort === "size-asc") return a.size - b.size;
    if (sort === "size-desc") return b.size - a.size;
    if (sort === "price-desc") return b.harga - a.harga;
    return a.harga - b.harga;
  });

  $("katalogBody").innerHTML = data.map((s) => `
    <tr>
      <td class="size">Size ${s.size}</td>
      <td>${s.size} ekor</td>
      <td>± ${(1000 / s.size).toFixed(1)} g</td>
      <td class="price">${rp(s.harga)}<div class="bar" style="--w:${(s.harga / MAX_HARGA * 100).toFixed(0)}%"><i></i></div></td>
      <td>${s.stok.toLocaleString("id-ID")} kg
        <span class="badge ${s.stok < STOK_MENIPIS ? "low" : "ok"}">${s.stok < STOK_MENIPIS ? "Menipis" : "Tersedia"}</span></td>
      <td><button class="btn navy sm" data-size="${s.size}">Minta Penawaran</button></td>
    </tr>`).join("");
  if (animate) animateRows();
}

function initFilter() {
  SIZES.forEach((s) => $("fSize").add(new Option("Size " + s.size, s.size)));
  $("fSize").addEventListener("change", () => renderKatalog());
  $("fSort").addEventListener("change", () => renderKatalog());
}

// ============ MODAL BELI ============
let modalSize = null;
function openModal(size) {
  modalSize = Number(size);
  $("mSize").textContent = "Size " + modalSize;
  $("mNama").value = ""; $("mKg").value = ""; $("mTotal").textContent = "";
  $("modal").classList.remove("hidden");
  setTimeout(() => $("mNama").focus(), 50);
}
function closeModal() { $("modal").classList.add("hidden"); }

$("katalogBody").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-size]");
  if (b) openModal(b.dataset.size);
});
$("mKg").addEventListener("input", () => {
  const kg = Number($("mKg").value);
  $("mTotal").textContent = kg > 0 ? `Estimasi: ${rp(kg * hargaOf(modalSize))} (belum termasuk ongkir)` : "";
});
$("mBatal").addEventListener("click", closeModal);
$("modal").addEventListener("click", (e) => { if (e.target === $("modal")) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
$("mKirim").addEventListener("click", () => {
  const nama = $("mNama").value.trim();
  const kg = Number($("mKg").value);
  if (!nama || !(kg > 0)) { toast("Isi nama dan jumlah kg dengan benar.", "err"); return; }
  const list = load("wt_beli");
  list.unshift({ nama, size: modalSize, kg, total: kg * hargaOf(modalSize), waktu: new Date().toLocaleString("id-ID") });
  save("wt_beli", list);
  closeModal();
  renderDaftar();
  toast("Permintaan penawaran tersimpan ✅");
});

// ============ SIMULASI SIZE ============
function renderSim() {
  const s = Number($("sizeRange").value);
  const d = dataOf(s);
  $("simSize").textContent = "Size " + s;
  $("simEkor").textContent = s + " ekor";
  $("simGram").textContent = "± " + (1000 / s).toFixed(1) + " g";
  $("simHarga").textContent = rp(d.harga);
  $("simStok").textContent = d.stok.toLocaleString("id-ID") + " kg";
  // panjang ~ berat^(1/3) -> skala ilustrasi
  $("simShrimp").style.width = (90 * Math.cbrt(100 / s)).toFixed(0) + "px";
  $("simBag").innerHTML = Array.from({ length: s }, (_, i) => `<i style="animation-delay:${i * 8}ms">🦐</i>`).join("");
}
$("sizeRange").addEventListener("input", renderSim);
$("simGo").addEventListener("click", () => {
  $("fSize").value = $("sizeRange").value;
  renderKatalog();
  $("katalog").scrollIntoView({ behavior: "smooth" });
});

// ============ FORM JUAL ============
function buildForm() {
  $("sizeInputs").innerHTML = SIZES.map((s) => `
    <label>Size ${s.size} (kg)
      <input type="number" min="0" step="any" data-size="${s.size}" class="inSize">
    </label>`).join("");
  SIZES.forEach((s) => $("campurSize").add(new Option("Size " + s.size, s.size)));
  $("campurSize").value = 70;
  $("potLabel").textContent = `(sekitar ${Math.round(POTONGAN_CAMPUR * 100)}%)`;
}

function sortirValue() {
  const r = document.querySelector('input[name="sortir"]:checked');
  return r ? r.value : null;
}

function hitungEstimasi() {
  const mode = sortirValue();
  if (mode === "ya") {
    const items = [...document.querySelectorAll(".inSize")]
      .map((i) => ({ size: Number(i.dataset.size), kg: Number(i.value) }))
      .filter((x) => x.kg > 0)
      .map((x) => ({ ...x, harga: hargaOf(x.size) }));
    if (!items.length) return null;
    return {
      mode, items,
      totalKg: items.reduce((a, x) => a + x.kg, 0),
      totalRp: items.reduce((a, x) => a + x.kg * x.harga, 0),
    };
  }
  if (mode === "campur") {
    const kg = Number($("campurKg").value);
    if (!(kg > 0)) return null;
    const size = Number($("campurSize").value);
    const harga = hargaOf(size) * (1 - POTONGAN_CAMPUR);
    return { mode, items: [{ size, kg, harga }], totalKg: kg, totalRp: kg * harga, jikaSortir: kg * hargaOf(size) };
  }
  return null;
}

function renderEstimasi() {
  const box = $("estimasi");
  const e = hitungEstimasi();
  if (!e) { box.classList.add("hidden"); return; }
  let html, extra = "";
  if (e.mode === "ya") {
    html = e.items.map((x) => `Size ${x.size}: ${x.kg} kg × ${rp(x.harga)}`).join("<br>");
  } else {
    const x = e.items[0];
    html = `Campur (dominan size ${x.size}): ${x.kg} kg × ${rp(x.harga)} <i>(sudah dipotong ${Math.round(POTONGAN_CAMPUR * 100)}%)</i>`;
    extra = `<div class="cmp">💡 Kalau semua sudah disortir di size ${x.size}, estimasi kasarnya ${rp(e.jikaSortir)}
      (selisih <b>${rp(e.jikaSortir - e.totalRp)}</b>).</div>`;
  }
  box.innerHTML = `${html}<hr style="margin:8px 0;border:0;border-top:1px solid #b9dcb0">
    Total ${e.totalKg.toLocaleString("id-ID")} kg → estimasi <b>${rp(e.totalRp)}</b>
    <br><small>Estimasi saja; harga final mengikuti QC &amp; kondisi pasar.</small>${extra}`;
  box.classList.remove("hidden");
}

document.querySelectorAll('input[name="sortir"]').forEach((r) =>
  r.addEventListener("change", () => {
    const m = sortirValue();
    $("boxYa").classList.toggle("hidden", m !== "ya");
    $("boxCampur").classList.toggle("hidden", m !== "campur");
    renderEstimasi();
  }));
$("jualForm").addEventListener("input", renderEstimasi);

$("jualForm").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const msg = $("formMsg");
  const nama = $("nama").value.trim();
  const wa = $("wa").value.trim();
  const tgl = $("tglPanen").value;
  const fail = (t) => { msg.textContent = t; msg.className = "msg err"; toast(t, "err"); };

  if (!nama) return fail("Nama petambak wajib diisi.");
  if (!/^[0-9+\-\s]{9,16}$/.test(wa)) return fail("Nomor WhatsApp tidak valid.");
  if (!sortirValue()) return fail("Pilih dulu: hasil panen sudah dikelompokkan per ukuran atau belum.");
  if (!tgl) return fail("Tanggal panen wajib diisi.");
  const e = hitungEstimasi();
  if (!e) return fail("Isi berat panen (kg) terlebih dahulu.");

  const list = load("wt_jual");
  list.unshift({ nama, wa, tgl, ...e, waktu: new Date().toLocaleString("id-ID") });
  save("wt_jual", list);

  msg.textContent = "Pengajuan terkirim (tersimpan di browser ini). Tim akan menghubungi via WhatsApp.";
  msg.className = "msg ok";
  toast("Pengajuan penjualan tersimpan ✅");
  $("jualForm").reset();
  $("boxYa").classList.add("hidden");
  $("boxCampur").classList.add("hidden");
  $("estimasi").classList.add("hidden");
  $("campurSize").value = 70;
  renderDaftar();
});

// ============ DAFTAR TERSIMPAN ============
function renderDaftar() {
  const jual = load("wt_jual");
  const beli = load("wt_beli");
  $("listJual").innerHTML = jual.length
    ? jual.map((j, i) => `<li><button class="del" data-k="wt_jual" data-i="${i}" aria-label="Hapus">×</button>
        <b>${esc(j.nama)}</b> – ${esc(j.totalKg)} kg (${j.mode === "ya" ? "sudah disortir" : "campur"})<br>
        Panen ${esc(j.tgl)} · est. ${rp(j.totalRp)}<br><small>${esc(j.waktu)}</small></li>`).join("")
    : '<li class="empty">Belum ada pengajuan.</li>';
  $("listBeli").innerHTML = beli.length
    ? beli.map((b, i) => `<li><button class="del" data-k="wt_beli" data-i="${i}" aria-label="Hapus">×</button>
        <b>${esc(b.nama)}</b> – Size ${esc(b.size)}, ${esc(b.kg)} kg<br>
        est. ${rp(b.total)}<br><small>${esc(b.waktu)}</small></li>`).join("")
    : '<li class="empty">Belum ada permintaan.</li>';
}

document.addEventListener("click", (e) => {
  const d = e.target.closest(".del");
  if (!d) return;
  const list = load(d.dataset.k);
  list.splice(Number(d.dataset.i), 1);
  save(d.dataset.k, list);
  renderDaftar();
  toast("Item dihapus");
});

$("resetData").addEventListener("click", () => {
  if (confirm("Hapus semua data tersimpan di browser ini?")) {
    localStorage.removeItem("wt_jual"); localStorage.removeItem("wt_beli");
    renderDaftar();
    toast("Semua data dihapus");
  }
});

// ============ INIT ============
buildTicker();
setStats();
initFilter();
buildForm();
renderKatalog(false);
onVisible($("tblWrap"), animateRows);
renderSim();
renderDaftar();
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
