(() => {
  const C = window.WR_CONFIG || {}, $ = id => document.getElementById(id);
  const P = new URLSearchParams(location.search), param = k => (P.get(k) || "").slice(0, 80);
  const LINK = { c: param("c"), job: param("job"), t: param("t") };
  const ENDPOINT = (C.COMPANIES || {})[LINK.c] || "";
  const DEMO = !ENDPOINT && P.get("demo") === "1";
  const post = o => fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(o) }).then(r => r.json());
  const mk = (tag, attrs, kids) => { const e = document.createElement(tag); Object.entries(attrs || {}).forEach(([k, v]) => k === "class" ? e.className = v : e.setAttribute(k, v)); (kids || []).forEach(x => e.appendChild(typeof x === "string" ? document.createTextNode(x) : x)); return e; };
  const yen = n => Number(n).toLocaleString() + "円";
  const fail = m => { $("intro").innerHTML = "<h1>リンクを開けませんでした</h1><p></p>"; $("intro").querySelector("p").textContent = m; $("f").hidden = true; };

  // 見本（デモ：?demo=1）。本物のお客様の情報は入っていません
  const DEMO_INFO = { ok: true, shop: "（デモ）", jobId: "DEMO-001", date: "2026-10-14", slotNo: 1, media: "ミツモア", units: 2, reservedAmount: 16000, payment: "現金", hasEmail: false, assignedStaffId: "C000-S02", answered: false,
    staff: [{ id: "C000-S02", name: "中田大貴" }, { id: "C000-S99", name: "テスト用スタッフ" }], pricesUpdated: "",
    prices: [{ item: "aircon_wall", label: "エアコンクリーニング 壁掛け", unit: 8000 }, { item: "aircon_auto", label: "エアコンクリーニング お掃除機能付き", unit: 14000 }],
    checks: [["inner", "内部の汚れ・ニオイは取れた", 1], ["wall", "エアコン下の壁・床に汚れが残っていない", 1], ["wipe", "水が垂れた場所を拭き取った", 0], ["works", "作業後、エアコンが正常に動いた", 1], ["damage", "エアコン・家具に傷や破損がない", 1], ["curtain", "カーテン・家具を元に戻した", 0], ["drain", "排水溝・換気扇フィルターのお掃除（おまけ）をした", 0], ["toilet", "トイレ掃除（おまけ）をした", 0], ["warranty", "補償（保証）の説明をした", 1], ["emergency", "異変があった時の連絡先の説明をした", 1]].map(x => ({ k: x[0], t: x[1], req: !!x[2] })),
    payments: ["現金", "クレジットカード", "PayPay", "PayPal", "銀行振込", "その他"] };

  let info = null; const counts = {}, answers = {};
  const calc = () => { let total = 0; const missing = []; (info.prices || []).forEach(p => { total += (counts[p.item] || 0) * p.unit; }); return { total, any: Object.values(counts).some(n => n > 0), missing }; };
  const differs = () => { const c = calc(), v = $("amount").value === "" ? null : Number(String($("amount").value)); if (v === null) return false; return (c.any && c.total !== v) || (info.reservedAmount && Number(info.reservedAmount) !== v) || !c.any || (info.prices || []).length === 0; };
  const refresh = () => {
    const c = calc(); $("calc").textContent = c.any ? yen(c.total) : "—";
    const am = $("amount"); if (!am.dataset.touched && c.any) am.value = c.total;
    if (!am.dataset.touched && !c.any && info.reservedAmount) am.value = info.reservedAmount;
    $("notebox").hidden = !differs();
    const bad = info.checks.some(x => answers[x.k] === 0); $("pmbox").hidden = !($("problem").checked || bad);
    document.querySelectorAll(".ck").forEach(el => el.classList.toggle("bad", answers[el.dataset.k] === 0));
  };

  const render = j => {
    info = j; $("f").hidden = false; $("brand").textContent = (j.shop ? j.shop + "　" : "") + "作業報告";
    $("job").textContent = "受付番号 " + j.jobId + "　作業日 " + j.date + (j.slotNo ? "　枠" + j.slotNo : "") + "　媒体 " + j.media + (j.units ? "　" + j.units + "台" : "");
    if (j.answered) { $("job").textContent += "　（すでに報告ずみです。直す時は事務所へ連絡してください）"; $("submit").disabled = true; }
    const sel = $("staff"); sel.appendChild(mk("option", { value: "" }, ["選んでください"]));
    j.staff.forEach(s => sel.appendChild(mk("option", { value: s.id }, [s.name]))); sel.appendChild(mk("option", { value: "other" }, ["その他（一覧にいない人）"]));
    if (j.assignedStaffId && j.staff.some(s => s.id === j.assignedStaffId)) sel.value = j.assignedStaffId;
    sel.addEventListener("change", () => { $("otherbox").hidden = sel.value !== "other"; });
    const pl = $("plist");
    if (!(j.prices || []).length) $("pricesub").textContent = "この会社の料金表に、この媒体（" + j.media + "）の料金がまだありません。いただいた金額を入れて、理由を書いてください。事務所に、料金表の入力をお願いしてください。";
    else $("pricesub").textContent = "やった作業の数を選んでください。" + j.media + " の料金で計算します（税込）。";
    (j.prices || []).forEach(p => {
      counts[p.item] = 0; const out = mk("output", {}, ["0"]);
      const minus = mk("button", { type: "button", "aria-label": p.label + "を減らす" }, ["−"]), plus = mk("button", { type: "button", "aria-label": p.label + "を増やす" }, ["＋"]);
      minus.addEventListener("click", () => { counts[p.item] = Math.max(0, counts[p.item] - 1); out.textContent = counts[p.item]; refresh(); });
      plus.addEventListener("click", () => { counts[p.item] = Math.min(20, counts[p.item] + 1); out.textContent = counts[p.item]; refresh(); });
      const tr = mk("tr", {}, [mk("td", { class: "n" }, [p.label, mk("small", {}, [yen(p.unit) + " / 1つ" + (p.source === "共通" ? "（共通の料金）" : "")])]), mk("td", {}, [mk("div", { class: "step" }, [minus, out, plus])])]);
      pl.appendChild(tr);
    });
    $("reserved").textContent = j.reservedAmount ? "予約のときの金額：" + yen(j.reservedAmount) : "";
    $("amount").addEventListener("input", () => { $("amount").dataset.touched = "1"; refresh(); });
    const pay = $("payment"); pay.appendChild(mk("option", { value: "" }, ["選んでください"])); j.payments.forEach(p => pay.appendChild(mk("option", { value: p }, [p])));
    if (j.payment && j.payments.indexOf(j.payment) >= 0) pay.value = j.payment;
    j.checks.forEach(x => {
      const row = mk("div", { class: "ck", "data-k": x.k }, [mk("p", {}, [x.t])]), seg = mk("div", { class: "seg3", role: "group", "aria-label": x.t });
      [["はい", 1, ""], ["いいえ", 0, "x"]].concat(x.req ? [] : [["該当なし", "na", ""]]).forEach(([lab, val, cls]) => {
        const b = mk("button", { type: "button", class: cls, "aria-pressed": "false" }, [lab]);
        b.addEventListener("click", () => { answers[x.k] = val; seg.querySelectorAll("button").forEach(o => o.setAttribute("aria-pressed", o === b ? "true" : "false")); refresh(); });
        seg.appendChild(b);
      }); row.appendChild(seg); $("checks").appendChild(row);
    });
    $("allyes").addEventListener("click", () => { j.checks.forEach(x => { answers[x.k] = 1; }); document.querySelectorAll(".ck").forEach(row => row.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", i === 0 ? "true" : "false"))); refresh(); });
    $("problem").addEventListener("change", refresh);
    $("mailcard").hidden = !!j.hasEmail;
    $("email").addEventListener("input", () => { $("agreebox").hidden = !$("email").value.trim(); });
    refresh();
  };

  const err = m => { const e = $("err"); e.textContent = m; e.hidden = false; e.scrollIntoView({ block: "center", behavior: "smooth" }); return false; };
  $("f").addEventListener("submit", ev => {
    ev.preventDefault(); $("err").hidden = true;
    const staff = $("staff").value; if (!staff) return err("作業した人を選んでください。");
    if (staff === "other" && !$("other").value.trim()) return err("その他の人のお名前を入れてください。");
    const items = (info.prices || []).filter(p => counts[p.item] > 0).map(p => ({ item: p.item, count: counts[p.item] }));
    const amount = $("amount").value; if (amount === "" || !/^\d+$/.test(String(amount))) return err("お客様にいただいた金額（円）を、整数で入れてください。");
    if (differs() && $("amountNote").value.trim().length < 2) return err("金額が料金表（または予約）と違うので、理由を書いてください。");
    if (!$("payment").value) return err("お支払い方法を選んでください。");
    for (const x of info.checks) if (answers[x.k] === undefined) return err("作業のチェックに、答えていない項目があります。");
    const bad = info.checks.some(x => answers[x.k] === 0);
    if (($("problem").checked || bad) && $("pm").value.trim().length < 2) return err("「いいえ」や問題がある時は、状況をひとこと書いてください。");
    const email = info.hasEmail ? "" : $("email").value.trim();
    if (email && !$("agree").checked) return err("メールアドレスは、お客様に案内をお伝えして、ご本人からいただいてください。");
    const body = { kind: "report.submit", jobId: LINK.job, token: LINK.t, website: $("hp").value, staffId: staff, otherName: $("other").value.trim(), items, finalAmount: Number(amount), amountNote: $("amountNote").value.trim(),
      payment: $("payment").value, hoseCount: Number($("hose").value || 0), transport: Number($("transport").value || 0), parking: Number($("parking").value || 0),
      review: $("review").checked, lineReg: $("line").checked, mailReg: $("mail").checked, checks: answers, problem: $("problem").checked, problemMemo: $("pm").value.trim(), email };
    const btn = $("submit"); btn.disabled = true; btn.textContent = "送信しています…";
    const fin = j => {
      if (!j.ok) { btn.disabled = false; btn.textContent = "この内容で報告する"; return err(j.message || "送信できませんでした。"); }
      $("f").hidden = true; $("intro").hidden = true; const d = $("done"); d.hidden = false;
      d.innerHTML = "<div class='thanks'><h2>報告ありがとうございました</h2><p id='t1'></p><p class='note' id='t2'></p></div>";
      $("t1").textContent = (DEMO ? "（デモ表示：記録はされていません）" : "") + yen(body.finalAmount) + " で、報告を受け取りました。売上の登録まで終わっています。";
      $("t2").textContent = j.surveyMail ? "お客様に、アンケート（品質チェック）のお願いが届きます。" : "お客様のメールアドレスが無いので、アンケートのお願いは、事務所が別の方法でお客様に渡します。";
      window.scrollTo(0, 0);
    };
    if (DEMO) return fin({ ok: true, surveyMail: !!email });
    post(body).then(fin).catch(() => { btn.disabled = false; btn.textContent = "この内容で報告する"; err("通信できませんでした。電波のよい所で、もう一度お試しください。"); });
  });

  if (DEMO) { $("demo").hidden = false; render(DEMO_INFO); return; }
  if (!LINK.c || !LINK.job || !LINK.t || !ENDPOINT) return fail("作業依頼のメールのリンクから開いてください。");
  post({ kind: "report.info", jobId: LINK.job, token: LINK.t }).then(j => { if (!j.ok) return fail(j.message || "リンクが正しくありません。"); render(j); }).catch(() => fail("通信できませんでした。電波のよい所で、開きなおしてください。"));
})();
