/* Grad-IQ planner runtime. Vanilla JS, no network calls, no tracking.
   Sections between //@FULL and //@END ship only in the buyer pack; //@DEMO only in the public demo. */
(function () {
  "use strict";
  var DEMO = true; // public demo: sample data only, nothing is saved, no export/import
  var P, C;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(/[$,\s]/g, "")); return isFinite(n) ? n : 0; }
  var u0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var u2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function money(n, c) { n = num(n); return (c || Math.round(n) !== n ? u2 : u0).format(n); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function getPath(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split("."), last = ks.pop(); var t = ks.reduce(function (a, k) { if (a[k] == null) a[k] = {}; return a[k]; }, o); t[last] = v; }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function safeUrl(u) { u = String(u || "").trim(); if (!u) return ""; try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch (e) { return ""; } }
  function csvCell(v) { v = v == null ? "" : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  var tt;
  function toast(m) { var t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2600); }

  /* field helpers used by planner templates */
  var H = {
    esc: esc, num: num, money: money, uid: uid, today: today,
    val: function (p) { var v = getPath(S, p); return v == null ? "" : v; },
    input: function (p, label, type, o) {
      o = o || {}; var v = H.val(p), t = type || "text", inp;
      if (t === "check") return '<label class="check"><input type="checkbox" data-path="' + p + '"' + (v ? " checked" : "") + "><span>" + label + "</span></label>";
      if (t === "select") inp = '<select data-path="' + p + '">' + o.options.map(function (op) { var k = Array.isArray(op) ? op[0] : op, l = Array.isArray(op) ? op[1] : op; return '<option value="' + esc(k) + '"' + (String(v) === String(k) ? " selected" : "") + ">" + esc(l) + "</option>"; }).join("") + "</select>";
      else if (t === "textarea") inp = '<textarea data-path="' + p + '" placeholder="' + esc(o.ph || "") + '">' + esc(v) + "</textarea>";
      else {
        var it = t === "money" || t === "number" ? "number" : t;
        inp = '<input type="' + it + '" data-path="' + p + '" value="' + esc(v) + '"' + (it === "number" ? ' inputmode="decimal" step="' + (o.step || "any") + '" min="0"' : "") + ' placeholder="' + esc(o.ph || "") + '"' + (t === "text" ? ' autocomplete="off"' : "") + ">";
        if (t === "money") inp = '<span class="money">' + inp + "</span>";
      }
      return '<label class="field">' + label + (o.hint ? ' <span class="hint">' + o.hint + "</span>" : "") + inp + "</label>";
    },
    out: function (id, cls) { return '<span data-out="' + id + '"' + (cls ? ' class="' + cls + '"' : "") + "></span>"; },
    del: function (p, i) { return '<button type="button" class="btn sm danger no-print" data-del="' + p + '" data-i="' + i + '" aria-label="Remove row">✕</button>'; },
    add: function (p, label) { return '<button type="button" class="btn sm secondary no-print" data-add="' + p + '">+ ' + esc(label) + "</button>"; }
  };
  window.PH = H;

  var S;
  function load() { return Object.assign(P.defaults(), P.demo()); }
  function save() { status("Demo · not saved"); }
  function status(m) { var s = $("#save-status"); if (s) s.textContent = m; }

  function chrome() {
    var top = document.createElement("header"); top.className = "topbar";
    top.innerHTML = '<a class="brand" href="#main"><span class="logo-mark" aria-hidden="true"></span><span><strong>Grad-IQ</strong><span class="brand-sub">' + esc(P.title) + "</span></span></a>";
    document.body.insertBefore(top, document.body.firstChild);
    var sk = document.createElement("a"); sk.className = "skip-link"; sk.href = "#main"; sk.textContent = "Skip to content"; document.body.insertBefore(sk, top);
    document.body.classList.add("gq-demo-build");
    var b = document.createElement("div"); b.className = "demo-banner sales"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Demo notice");
    var bu = safeUrl(C.BUY_URL), pr = C.PRICE ? '<span class="price-tag"><strong>' + esc(C.PRICE) + "</strong></span> " : "";
    b.innerHTML = "<span class='demo-note'><strong>This is a demo with sample data.</strong> Nothing you type is saved. Get the full planner to save, export and print your own plan.</span><span class='banner-actions'>" + pr +
      (bu ? '<a class="btn sm buy-btn" href="' + esc(bu) + '" target="_blank" rel="noopener">Get the full planner</a>' : '<span class="pill soon">Coming soon</span>') + "</span>";
    top.insertAdjacentElement("afterend", b);
    var tb = $("#toolbar");
    var h = '<button type="button" class="btn sm" id="t-print">🖨 Print</button>';
    h += '<button type="button" class="btn sm" id="t-reset">↺ Reset sample data</button><span class="status" id="save-status">Demo · not saved</span>';
    tb.innerHTML = h;
    $("#t-print").onclick = function () { window.print(); };
    $("#t-reset").onclick = function () { S = load(); renderAll(); toast("Sample data restored"); };
    var ph = document.createElement("div"); ph.className = "print-only";
    ph.innerHTML = "<p class='small'>Grad-IQ · " + esc(P.title) + " · printed " + esc(new Date().toLocaleDateString("en-US")) + (DEMO ? " · DEMO SAMPLE DATA" : "") + "</p>";
    $("#main").insertBefore(ph, $("#main").firstChild);
    var f = document.createElement("footer"); f.className = "site-footer";
    f.innerHTML = "<p class='disclaimer'>For planning only. Not medical, legal, tax, or financial advice.</p><p class='small'><strong>Grad-IQ by IQ Learning</strong> · " +
      (DEMO ? "This demo runs on sample data and stores nothing." : "Your entries stay in this browser on this device.") + " No accounts, no tracking. <a href='#sources'>Sources</a></p>";
    document.body.appendChild(f);
  }

  var active;
  function tabs() {
    var t = $("#tabs");
    t.innerHTML = P.sections.map(function (s) { return '<button type="button" role="tab" id="tab-' + s.id + '" aria-controls="pane-' + s.id + '" data-tab="' + s.id + '">' + esc(s.label) + "</button>"; }).join("");
    var panes = $("#panes");
    panes.innerHTML = P.sections.map(function (s) { return '<section class="pane" role="tabpanel" id="pane-' + s.id + '" aria-labelledby="tab-' + s.id + '"></section>'; }).join("");
    t.addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) show(b.getAttribute("data-tab"), true); });
  }
  function show(id, scroll) {
    active = id;
    $$("#tabs [data-tab]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === id ? "true" : "false"); });
    P.sections.forEach(function (s) { $("#pane-" + s.id).hidden = s.id !== id; });
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* file:// */ }
    var ab = $('#tabs [data-tab="' + id + '"]'); if (ab && ab.scrollIntoView) try { ab.scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) { /* ignore */ }
  }
  function renderSection(s) { $("#pane-" + s.id).innerHTML = '<h2 class="section-print-title">' + esc(s.label) + "</h2>" + s.render(S, H); }
  function renderAll() { P.sections.forEach(renderSection); outs(); }
  function outs() {
    var o = P.compute(S, H);
    $$("[data-out]").forEach(function (el) { var k = el.getAttribute("data-out"); if (k in o) { var v = o[k]; if (v && typeof v === "object") { el.innerHTML = v.html; } else el.textContent = v; } });
  }
  function sectionOf(el) { var p = el.closest(".pane"); return p && P.sections.filter(function (s) { return "pane-" + s.id === p.id; })[0]; }
  function rerender(el) { var s = sectionOf(el); if (s) { var y = window.scrollY; renderSection(s); outs(); window.scrollTo(0, y); } }

  function bind() {
    var panes = $("#panes");
    panes.addEventListener("input", function (e) {
      var el = e.target, p = el.getAttribute("data-path"); if (!p) return;
      var v = el.type === "checkbox" ? el.checked : el.value;
      setPath(S, p, v); save(); outs();
    });
    panes.addEventListener("change", function (e) { var el = e.target; if (el.getAttribute("data-path") && (el.tagName === "SELECT" || el.type === "checkbox" || el.hasAttribute("data-rerender"))) rerender(el); });
    panes.addEventListener("click", function (e) {
      var a = e.target.closest("[data-add]"), d = e.target.closest("[data-del]");
      if (a) { var p = a.getAttribute("data-add"); var arr = getPath(S, p); arr.push(P.templates[p]()); save(); rerender(a); var rows = $$('[data-row="' + p + '"]'); var last = rows[rows.length - 1]; if (last) { var f = last.querySelector("input,select"); if (f) f.focus(); } }
      if (d) { var dp = d.getAttribute("data-del"), i = +d.getAttribute("data-i"); if (!confirm("Remove this row?")) return; getPath(S, dp).splice(i, 1); save(); rerender(d); }
      var act = e.target.closest("[data-action]"); if (act && P.actions && P.actions[act.getAttribute("data-action")]) { P.actions[act.getAttribute("data-action")](S, act); save(); renderAll(); }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    P = window.PLANNER; C = window.PLANNER_CONFIG || {};
    S = load(); chrome(); tabs(); renderAll(); bind();
    var h = (location.hash || "").slice(1);
    show(P.sections.some(function (s) { return s.id === h; }) ? h : P.sections[0].id);
    window.addEventListener("hashchange", function () { var k = (location.hash || "").slice(1); if (k !== active && P.sections.some(function (s) { return s.id === k; })) show(k, true); });
  });
})();
