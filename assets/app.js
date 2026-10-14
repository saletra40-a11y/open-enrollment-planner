/* Open Enrollment Health-Cost Planner (Grad-IQ). Dates verified on HealthCare.gov (see Sources). */
(function () {
  "use strict";
  var H = window.PH;
  var DATES = [
    ["d1", "2026-11-01", "Nov 1, 2026", "Open Enrollment starts", "First day to enroll in, renew, or change a Marketplace plan for 2027."],
    ["d2", "2026-12-15", "Dec 15, 2026", "Deadline for Jan 1 coverage", "Enroll or change plans by this date for coverage starting January 1, 2027."],
    ["d3", "2027-01-01", "Jan 1, 2027", "Coverage starts", "For people who enrolled by Dec 15 and paid their first premium."],
    ["d4", "2027-01-15", "Jan 15, 2027", "Open Enrollment ends", "Last day to enroll or change plans for 2027. After this you need a Special Enrollment Period."],
    ["d5", "2027-02-01", "Feb 1, 2027", "Coverage starts (late enrollees)", "For people who enrolled Dec 16 – Jan 15 and paid their first premium."]
  ];
  var PREP = [
    ["p1", "Find my HealthCare.gov (or state Marketplace) login"],
    ["p2", "Gather pay stubs / income estimate for everyone in my tax household"],
    ["p3", "List my doctors, clinics and hospitals I want to keep"],
    ["p4", "List my prescriptions (name, dose, how often)"],
    ["p5", "Read my plan's renewal notice for 2027 premium and benefit changes"],
    ["p6", "Pay the first premium after I pick a plan"]
  ];
  var SCREEN = [
    ["lowIncome", "My household income is low or recently dropped", "medicaid"],
    ["kids", "I have children under 19 who need coverage", "chip"],
    ["pregnant", "Someone in my household is pregnant", "medicaid"],
    ["lostCov", "I lost (or will lose) health coverage, e.g. job, school or parent's plan, or Medicaid", "sep"],
    ["moved", "I moved to a new ZIP code or county", "sep"],
    ["family", "I got married, had a baby, adopted, or my household changed", "sep"],
    ["incomeChange", "My income changed in a way that may change my savings", "sep"]
  ];
  var L = {
    hc: "https://www.healthcare.gov/quick-guide/dates-and-deadlines/",
    state: "https://www.healthcare.gov/marketplace-in-your-state/",
    medicaid: "https://www.healthcare.gov/medicaid-chip/",
    screener: "https://www.healthcare.gov/screener/",
    sep: "https://www.healthcare.gov/coverage-outside-open-enrollment/special-enrollment-period/",
    changes: "https://www.healthcare.gov/reporting-changes/",
    help: "https://www.healthcare.gov/find-assistance/",
    costs: "https://www.healthcare.gov/choose-a-plan/your-total-costs/",
    fap: "https://www.irs.gov/charities-non-profits/financial-assistance-policy-and-emergency-medical-care-policy-section-501r4"
  };
  function a(u, t) { return '<a href="' + u + '" target="_blank" rel="noopener">' + t + "</a>"; }
  function plan(n) { return { id: H.uid(), name: n || "", metal: "", premium: "", deductible: "", oopMax: "", pcp: "", spec: "", rx: "", coins: "", doctors: "", drugs: "", docsOk: false, drugsOk: false, notes: "" }; }
  function bill() { return { id: H.uid(), provider: "", date: "", billed: "", insPaid: "", owed: "", paid: "", itemReq: false, itemGot: false, fapAsked: false, fapApplied: false, plan: false, planMonthly: "", status: "new", notes: "" }; }

  function defaults() {
    return {
      checks: {}, myStateDeadline: "", stateName: "",
      income: { lastYear: "", expected: "", household: "", changes: "", updated: false, compared: false, notAuto: false, notes: "" },
      use: { pcpVisits: "", specVisits: "", rxPerMonth: "", otherCosts: "" },
      plans: [plan("Current plan (renewal)"), plan(""), plan("")],
      screen: {}, sepDate: "", sepNotes: "",
      bills: []
    };
  }
  function demo() {
    return {
      checks: { d1: true, p1: true, p2: true, p3: true, p5: true }, stateName: "HealthCare.gov state", myStateDeadline: "",
      income: { lastYear: "31000", expected: "34500", household: "1", changes: "Raise in August; new part-time TA role in January", updated: true, compared: true, notAuto: true, notes: "Renewal notice says my current plan's premium goes up for 2027 — compare before keeping it." },
      use: { pcpVisits: "3", specVisits: "2", rxPerMonth: "1", otherCosts: "1200" },
      plans: [
        { id: "a", name: "Current plan (renewal)", metal: "Silver", premium: "212", deductible: "4500", oopMax: "8500", pcp: "40", spec: "80", rx: "15", coins: "30", doctors: "Dr. Lee (PCP) ✓, campus clinic ✓", drugs: "Sertraline ✓", docsOk: true, drugsOk: true, notes: "Sample numbers" },
        { id: "b", name: "Plan B", metal: "Bronze", premium: "118", deductible: "7500", oopMax: "9200", pcp: "60", spec: "120", rx: "25", coins: "40", doctors: "Dr. Lee ✗", drugs: "Sertraline ✓", docsOk: false, drugsOk: true, notes: "Sample numbers" },
        { id: "c", name: "Plan C", metal: "Silver", premium: "236", deductible: "2500", oopMax: "7000", pcp: "30", spec: "60", rx: "10", coins: "20", doctors: "Dr. Lee ✓", drugs: "Sertraline ✓", docsOk: true, drugsOk: true, notes: "Sample numbers" }
      ],
      screen: { incomeChange: true }, sepDate: "", sepNotes: "Ask about Medicaid if my TA stipend ends.",
      bills: [
        { id: "x", provider: "City Hospital ER (sample)", date: "2026-08-14", billed: "2840", insPaid: "1610", owed: "1230", paid: "150", itemReq: true, itemGot: true, fapAsked: true, fapApplied: true, plan: true, planMonthly: "50", status: "plan", notes: "FA application sent 9/2; reference #—" },
        { id: "y", provider: "Lab work (sample)", date: "2026-09-03", billed: "310", insPaid: "190", owed: "120", paid: "0", itemReq: true, itemGot: false, fapAsked: false, fapApplied: false, plan: false, planMonthly: "", status: "review", notes: "Waiting on itemized bill before paying" }
      ]
    };
  }
  function est(p, u) {
    var prem = H.num(p.premium) * 12, ded = H.num(p.deductible), oop = H.num(p.oopMax), other = H.num(u.otherCosts);
    var copays = H.num(u.pcpVisits) * H.num(p.pcp) + H.num(u.specVisits) * H.num(p.spec) + H.num(u.rxPerMonth) * 12 * H.num(p.rx);
    var dedPart = Math.min(other, ded), coins = Math.max(0, other - ded) * H.num(p.coins) / 100;
    var care = copays + dedPart + coins; if (oop > 0) care = Math.min(care, oop);
    return { prem: prem, care: care, total: prem + care, worst: prem + oop };
  }

  var sections = [
    { id: "dates", label: "1 · Key dates", render: function (s) {
      return '<div class="card"><p class="eyebrow">2027 coverage · HealthCare.gov dates</p><h2>Key dates checklist</h2>' +
        '<div class="notice warn"><p><strong>State Marketplaces can have different dates.</strong> If your state runs its own Marketplace, check its deadlines ' + a(L.state, "(find your state's Marketplace)") + " and write them below.</p></div>" +
        DATES.map(function (d) { return '<div class="date-row"><input type="checkbox" data-path="checks.' + d[0] + '"' + (s.checks[d[0]] ? " checked" : "") + ' aria-label="' + H.esc(d[3]) + ' done"><div><span class="when">' + d[2] + "</span> · <strong>" + d[3] + "</strong><br><span class='small muted'>" + d[4] + "</span> " + H.out("cd-" + d[0], "pill lav") + "</div></div>"; }).join("") +
        '<p class="source">Source: ' + a(L.hc, "HealthCare.gov — Dates and deadlines") + "</p>" +
        '<div class="field-row">' + H.input("stateName", "My Marketplace", "text", { ph: "HealthCare.gov or my state's site" }) + H.input("myStateDeadline", "My Marketplace's last day to enroll", "date", { hint: "(if different)" }) + "</div></div>" +
        '<div class="card"><h2>Get-ready checklist</h2>' + PREP.map(function (p) { return '<div class="ck-row" style="grid-template-columns:26px 1fr"><input type="checkbox" data-path="checks.' + p[0] + '"' + (s.checks[p[0]] ? " checked" : "") + ' id="ck-' + p[0] + '"><label for="ck-' + p[0] + '">' + p[1] + "</label></div>"; }).join("") +
        '<p style="margin-top:.8rem">' + H.out("prog") + "</p></div>";
    } },
    { id: "income", label: "2 · Update income", render: function () {
      return '<div class="card blush"><p class="eyebrow">Don\'t just auto-renew</p><h2>Update your income, then compare</h2><p>Your savings on a Marketplace plan are based on the income you <em>expect</em> for the coming year. If you let your plan renew without updating your application, your savings and your plan\'s price and benefits may not fit your 2027 situation. Update your application and compare plans before you keep the same one.</p><p class="source">' + a(L.changes, "HealthCare.gov — Reporting income & household changes") + "</p></div>" +
        '<div class="card"><div class="field-row">' + H.input("income.lastYear", "Last year's household income", "money") + H.input("income.expected", "Expected 2027 household income", "money", { hint: "(best estimate)" }) + H.input("income.household", "People in tax household", "number", { step: "1" }) + "</div>" +
        '<p>' + H.out("incDelta") + "</p>" +
        H.input("income.changes", "What changed? (job, raise, stipend, move, marriage, baby…)", "textarea") +
        H.input("income.updated", "I updated my income and household on my application", "check") +
        H.input("income.notAuto", "I read my 2027 renewal notice (new premium, deductible, doctors, drugs)", "check") +
        H.input("income.compared", "I compared at least 3 plans before keeping or switching", "check") +
        H.input("income.notes", "Notes", "textarea") + "</div>";
    } },
    { id: "compare", label: "3 · Compare plans", render: function (s) {
      var u = '<div class="card sky"><h2>My expected use in 2027</h2><p class="small">Used to estimate each plan\'s total yearly cost. Rough guesses are fine.</p><div class="field-row">' +
        H.input("use.pcpVisits", "Primary care visits / yr", "number", { step: "1" }) + H.input("use.specVisits", "Specialist visits / yr", "number", { step: "1" }) +
        H.input("use.rxPerMonth", "Prescription fills / month", "number", { step: "1" }) + H.input("use.otherCosts", "Other care before insurance / yr", "money", { hint: "(tests, ER, procedures)" }) + "</div></div>";
      var cards = s.plans.map(function (p, i) {
        var b = "plans." + i + ".";
        return '<div class="plan-card" data-row="plans" data-best="' + i + '"><div class="card-head"><strong>' + H.out("pn-" + i) + "</strong>" + H.del("plans", i) + "</div>" +
          H.input(b + "name", "Plan name") + H.input(b + "metal", "Metal level", "select", { options: ["", "Bronze", "Silver", "Gold", "Platinum", "Catastrophic", "Other"] }) +
          H.input(b + "premium", "Monthly premium (after savings)", "money") + H.input(b + "deductible", "Deductible", "money") + H.input(b + "oopMax", "Out-of-pocket maximum", "money") +
          '<div class="field-row">' + H.input(b + "pcp", "Primary copay", "money") + H.input(b + "spec", "Specialist copay", "money") + "</div>" +
          '<div class="field-row">' + H.input(b + "rx", "Rx copay / fill", "money") + H.input(b + "coins", "Coinsurance %", "number") + "</div>" +
          H.input(b + "doctors", "My doctors in network?", "text", { ph: "names ✓ / ✗" }) + H.input(b + "docsOk", "All my doctors are covered", "check") +
          H.input(b + "drugs", "My drugs covered?", "text", { ph: "drug names ✓ / ✗" }) + H.input(b + "drugsOk", "All my drugs are covered", "check") +
          '<div class="kv"><span>Premiums / yr</span><strong>' + H.out("pp-" + i) + '</strong></div><div class="kv"><span>Est. care costs</span><strong>' + H.out("pc-" + i) + '</strong></div><div class="kv"><span><strong>Est. total / yr</strong></span><strong>' + H.out("pt-" + i) + '</strong></div><div class="kv"><span>Worst case (premiums + OOP max)</span><strong>' + H.out("pw-" + i) + "</strong></div>" + H.out("pf-" + i) + "</div>";
      }).join("");
      return u + '<div class="card"><div class="card-head"><h2>Side-by-side plans</h2>' + H.add("plans", "Add plan") + '</div><div class="notice">' + H.out("best") + '</div><div class="plan-grid">' + (cards || '<p class="empty">Add a plan to compare.</p>') + '</div><p class="small muted" style="margin-top:.8rem">Estimate = premiums + copays + the part of other care you pay before and after the deductible (coinsurance), capped at the out-of-pocket maximum. Real plans have more rules; check each plan\'s Summary of Benefits. ' + a(L.costs, "How total costs work (HealthCare.gov)") + "</p></div>";
    } },
    { id: "check", label: "4 · Medicaid & SEP", render: function (s) {
      return '<div class="card"><h2>Medicaid / CHIP and Special Enrollment check</h2><p class="small">Tick anything that applies. This is not an eligibility decision — it points you to the official place to check.</p>' +
        SCREEN.map(function (q) { return H.input("screen." + q[0], q[1], "check"); }).join("") + "</div>" +
        '<div class="card mint"><h2>What to check next</h2>' + H.out("next") + "</div>" +
        '<div class="card"><div class="field-row">' + H.input("sepDate", "Date of my life event (if any)", "date") + "</div>" + H.out("sepWin") + H.input("sepNotes", "Notes", "textarea") +
        '<p class="small">Free local help: ' + a(L.help, "Find assisters and brokers near you (HealthCare.gov)") + "</p></div>";
    } },
    { id: "bills", label: "5 · Medical bills", render: function (s) {
      var rows = s.bills.map(function (b, i) {
        var p = "bills." + i + ".";
        return '<div class="row-card" data-row="bills"><div class="card-head"><strong>' + H.out("bn-" + i) + "</strong> " + H.out("bs-" + i) + H.del("bills", i) + "</div>" +
          '<div class="field-row">' + H.input(p + "provider", "Provider") + H.input(p + "date", "Date of service", "date") + H.input(p + "status", "Status", "select", { options: [["new", "New"], ["review", "Reviewing / disputing"], ["fa", "Financial assistance pending"], ["plan", "On payment plan"], ["paid", "Paid"], ["collections", "Sent to collections"]] }) + "</div>" +
          '<div class="field-row">' + H.input(p + "billed", "Amount billed", "money") + H.input(p + "insPaid", "Insurance paid", "money") + H.input(p + "owed", "I owe", "money") + H.input(p + "paid", "I've paid", "money") + "</div>" +
          '<div class="field-row">' + H.input(p + "itemReq", "Itemized bill requested", "check") + H.input(p + "itemGot", "Itemized bill received & checked", "check") + H.input(p + "fapAsked", "Asked for the financial-assistance policy", "check") + H.input(p + "fapApplied", "Applied for financial assistance", "check") + "</div>" +
          '<div class="field-row">' + H.input(p + "plan", "Payment plan set up", "check") + H.input(p + "planMonthly", "Payment plan / month", "money") + "</div>" + H.input(p + "notes", "Notes (who I spoke with, reference #)", "textarea") + "</div>";
      }).join("");
      return '<div class="card"><p class="eyebrow">Before you pay</p><h2>Medical bill tracker</h2><div class="notice"><p>Ask for an <strong>itemized bill</strong> and check it against your insurer\'s Explanation of Benefits. Ask the provider for its <strong>financial-assistance policy</strong> (nonprofit hospitals are required to have a written one — ' + a(L.fap, "IRS rules") + ") and whether a <strong>payment plan</strong> is available.</p></div>" +
        '<div class="stat-grid" style="margin-bottom:1rem"><div class="stat"><div class="label">Total billed</div><div class="value">' + H.out("tb") + '</div></div><div class="stat lav"><div class="label">I owe</div><div class="value">' + H.out("to") + '</div></div><div class="stat mint"><div class="label">Paid so far</div><div class="value">' + H.out("tp") + '</div></div><div class="stat blush"><div class="label">Still open</div><div class="value">' + H.out("tr") + "</div></div></div>" +
        '<div class="rows">' + (rows || '<p class="empty">No bills yet.</p>') + '</div><p style="margin-top:.8rem">' + H.add("bills", "Add bill") + "</p></div>";
    } },
    { id: "sources", label: "Sources", render: function () {
      return '<div class="card soft" id="sources"><h2>Sources</h2><ul class="small">' +
        "<li>" + a(L.hc, "HealthCare.gov — When can you get health insurance? (dates and deadlines)") + " — Nov 1 start, Dec 15 for Jan 1 coverage, Jan 15 end, Feb 1 coverage start.</li>" +
        "<li>" + a(L.state, "HealthCare.gov — Marketplace in your state") + " — state Marketplaces may set different dates.</li>" +
        "<li>" + a("https://www.kff.org/quick-insights/aca-marketplace-insurers-are-proposing-a-median-premium-increase-of-about-15-in-2027/", "KFF (Aug 4, 2026)") + " — insurers proposed a median 15% premium increase for 2027 (proposed rates; final rates vary by state and plan).</li>" +
        "<li>" + a(L.medicaid, "HealthCare.gov — Medicaid & CHIP") + " · " + a(L.sep, "Special Enrollment Periods") + " · " + a(L.changes, "Reporting changes") + "</li>" +
        "<li>" + a(L.fap, "IRS — Financial assistance policy requirements for nonprofit hospitals (Section 501(r)(4))") + "</li></ul><p class='small muted'>Checked Oct 14, 2026. Rules and dates can change; always confirm on the official site.</p></div>";
    } }
  ];
  function daysTo(iso) { var d = new Date(iso + "T00:00:00"), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((d - n) / 864e5); }
  function compute(s) {
    var o = {};
    DATES.forEach(function (d) { var n = daysTo(d[1]); o["cd-" + d[0]] = n > 1 ? "in " + n + " days" : n === 1 ? "tomorrow" : n === 0 ? "today" : "passed"; });
    var done = PREP.filter(function (p) { return s.checks[p[0]]; }).length;
    o.prog = done + " of " + PREP.length + " get-ready steps done";
    var ly = H.num(s.income.lastYear), ex = H.num(s.income.expected);
    o.incDelta = ly && ex ? "Expected change: " + (ex >= ly ? "+" : "−") + H.money(Math.abs(ex - ly)) + " (" + (ex >= ly ? "+" : "−") + Math.abs(Math.round((ex - ly) / ly * 100)) + "%). Make sure your application shows the new number." : "Enter both numbers to see the change.";
    var best = -1, bt = Infinity;
    s.plans.forEach(function (p, i) {
      var e = est(p, s.use);
      o["pn-" + i] = p.name || "Plan " + (i + 1);
      o["pp-" + i] = H.money(e.prem); o["pc-" + i] = H.money(Math.round(e.care)); o["pt-" + i] = H.money(Math.round(e.total)); o["pw-" + i] = H.num(p.oopMax) ? H.money(e.worst) : "—";
      var flags = []; if (!p.docsOk) flags.push('<span class="pill warn">check doctors</span>'); if (!p.drugsOk) flags.push('<span class="pill warn">check drugs</span>');
      o["pf-" + i] = { html: flags.length ? '<p style="margin:.5rem 0 0">' + flags.join(" ") + "</p>" : '<p style="margin:.5rem 0 0"><span class="pill ok">doctors & drugs ✓</span></p>' };
      if (H.num(p.premium) > 0 && e.total < bt) { bt = e.total; best = i; }
    });
    o.best = best < 0 ? "Enter premiums and your expected use to see the lowest estimated total." : { html: "Lowest estimated total for your expected use: <strong>" + H.esc(s.plans[best].name || "Plan " + (best + 1)) + "</strong> at about <strong>" + H.money(Math.round(bt)) + "</strong>/yr." + (!(s.plans[best].docsOk && s.plans[best].drugsOk) ? " Check its doctors and drugs before choosing." : "") };
    setTimeout(function () { document.querySelectorAll(".plan-card").forEach(function (c) { c.classList.toggle("best", +c.getAttribute("data-best") === best); }); }, 0);
    var nx = [];
    if (s.screen.lowIncome || s.screen.pregnant) nx.push("<li><strong>Medicaid:</strong> you can apply any time of year, not just during Open Enrollment. " + a(L.medicaid, "Check Medicaid & CHIP") + " · " + a(L.screener, "Quick eligibility screener") + "</li>");
    if (s.screen.kids) nx.push("<li><strong>CHIP:</strong> children may qualify for free or low-cost coverage even if parents don't. " + a(L.medicaid, "Check Medicaid & CHIP") + "</li>");
    if (s.screen.lostCov || s.screen.moved || s.screen.family || s.screen.incomeChange) nx.push("<li><strong>Special Enrollment Period:</strong> some life events let you enroll or change plans outside Open Enrollment. " + a(L.sep, "See if you qualify (HealthCare.gov)") + "</li>");
    if (s.screen.incomeChange) nx.push("<li><strong>Income changed:</strong> update your application so your savings match. " + a(L.changes, "Report changes") + "</li>");
    o.next = { html: nx.length ? "<ul>" + nx.join("") + "</ul>" : "<p class='muted'>Nothing ticked yet. Open Enrollment (" + a(L.hc, "dates") + ") is the main time to enroll or change plans.</p>" };
    o.sepWin = { html: s.sepDate ? "<p class='notice warn'>Many Special Enrollment Periods have a limited window after the event (often 60 days). Days since your event: <strong>" + Math.max(0, -daysTo(s.sepDate)) + "</strong>. Confirm your exact window on " + a(L.sep, "HealthCare.gov") + ".</p>" : "" };
    var tb = 0, to = 0, tp = 0;
    s.bills.forEach(function (b, i) {
      tb += H.num(b.billed); to += H.num(b.owed); tp += H.num(b.paid);
      o["bn-" + i] = (b.provider || "Bill " + (i + 1)) + (b.date ? " · " + b.date : "");
      var rem = Math.max(0, H.num(b.owed) - H.num(b.paid));
      o["bs-" + i] = { html: '<span class="pill ' + (b.status === "paid" ? "ok" : b.status === "collections" ? "bad" : "lav") + '">' + H.money(rem, true) + " open</span>" };
    });
    o.tb = H.money(tb); o.to = H.money(to); o.tp = H.money(tp); o.tr = H.money(Math.max(0, to - tp));
    return o;
  }
  var tables = {
    plans: { label: "Plans", rows: function (s) { var r = [["Plan", "Metal", "Monthly premium", "Deductible", "OOP max", "Primary copay", "Specialist copay", "Rx copay", "Coinsurance %", "Doctors", "All doctors covered", "Drugs", "All drugs covered", "Est. yearly premiums", "Est. care costs", "Est. total per year", "Worst case"]]; s.plans.forEach(function (p) { var e = est(p, s.use); r.push([p.name, p.metal, p.premium, p.deductible, p.oopMax, p.pcp, p.spec, p.rx, p.coins, p.doctors, p.docsOk ? "yes" : "no", p.drugs, p.drugsOk ? "yes" : "no", e.prem.toFixed(2), e.care.toFixed(2), e.total.toFixed(2), e.worst.toFixed(2)]); }); return r; } },
    bills: { label: "Bills", rows: function (s) { var r = [["Provider", "Date of service", "Billed", "Insurance paid", "I owe", "Paid", "Itemized requested", "Itemized received", "FA policy asked", "FA applied", "Payment plan", "Plan per month", "Status", "Notes"]]; s.bills.forEach(function (b) { r.push([b.provider, b.date, b.billed, b.insPaid, b.owed, b.paid, b.itemReq ? "yes" : "no", b.itemGot ? "yes" : "no", b.fapAsked ? "yes" : "no", b.fapApplied ? "yes" : "no", b.plan ? "yes" : "no", b.planMonthly, b.status, b.notes]); }); return r; } }
  };
  window.PLANNER = { key: "gradiq-open-enrollment-v1", slug: "open-enrollment-planner", title: "Open Enrollment Health-Cost Planner", defaults: defaults, demo: demo, sections: sections, compute: compute, tables: tables, templates: { plans: function () { return plan(""); }, bills: bill } };
})();
