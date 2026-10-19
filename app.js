(function () {
  var FUEL_COLOR = { "가솔린": "var(--f-gas)", "디젤": "var(--f-dsl)", "LPG": "var(--f-lpg)", "하이브리드": "var(--f-hyb)" };


  function $(id) { return document.getElementById(id); }
  var state = { fuel: "전체", origin: "전체", q: "" };
  var FUELS = ["전체", "가솔린", "디젤", "LPG", "하이브리드"];
  var ORIGINS = ["전체", "닛산", "르노", "지리"];

  $("stats").textContent = E.length + "개 엔진 · " + MODELS.length + "개 차종";

  function chips(id, list, key) {
    var host = $(id);
    list.forEach(function (v) {
      var b = document.createElement("button");
      b.className = "chip"; b.textContent = v; b.type = "button";
      b.setAttribute("aria-pressed", v === state[key] ? "true" : "false");
      b.addEventListener("click", function () {
        state[key] = v;
        host.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c.textContent === v ? "true" : "false"); });
        renderEngines();
      });
      host.appendChild(b);
    });
  }
  chips("fuel-chips", FUELS, "fuel");
  chips("origin-chips", ORIGINS, "origin");
  $("q").addEventListener("input", function (ev) { state.q = ev.target.value.trim().toLowerCase(); renderEngines(); });

  function matches(e) {
    if (state.fuel !== "전체" && e.fuel !== state.fuel) return false;
    if (state.origin !== "전체" && e.origin !== state.origin) return false;
    if (state.q) {
      var hay = (e.code + " " + e.cars.map(function (c) { return c[0]; }).join(" ")).toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    return true;
  }

  function cardHTML(e, i) {
    var cars = e.cars.map(function (c) { return "<li><b>" + c[0] + "</b><span>" + c[1] + "</span></li>"; }).join("");
    var meta = [e.origin + " 계열", e.cyl, e.cc].filter(Boolean).join(" · ");
    return '<article class="card" style="animation-delay:' + Math.min(i, 12) * 18 + 'ms">' +
      '<button class="head" type="button" aria-expanded="false">' +
        '<span class="code">' + e.code + '</span>' +
        '<span class="disp">' + e.disp + '<small>L</small></span>' +
        '<span class="sub"><span class="dot" style="--c:' + FUEL_COLOR[e.fuel] + '"></span>' + e.fuel + (e.unv ? ' <span class="flag">형식명 미확인</span>' : '') + '</span>' +
        '<span class="spec">' + e.spec + '</span>' +
      '</button>' +
      '<div class="more"><div><div class="more-in">' +
        '<div class="sub" style="margin-bottom:10px">' + meta + '</div>' +
        '<ul class="cars">' + cars + '</ul>' +
        '<p class="note">' + e.note + '</p>' +
      '</div></div></div></article>';
  }

  function renderEngines() {
    var list = E.filter(matches);
    $("count").textContent = list.length + " / " + E.length + "개 표시";
    var grid = $("grid");
    if (!list.length) { grid.innerHTML = '<div class="empty">조건에 맞는 엔진이 없습니다. 필터를 바꾸거나 검색어를 지워보세요.</div>'; return; }
    grid.innerHTML = list.map(cardHTML).join("");
    grid.querySelectorAll(".head").forEach(function (h) {
      h.addEventListener("click", function () {
        var card = h.parentElement;
        var open = card.classList.toggle("open");
        h.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  function renderModels() {
    var host = $("models");
    host.innerHTML = MODELS.map(function (m) {
      var rows = [];
      E.forEach(function (e) {
        e.cars.forEach(function (c) { if (c[0] === m) rows.push({ e: e, d: c[1] }); });
      });
      var html = rows.map(function (r) {
        return '<button class="row" type="button" data-code="' + r.e.code + '">' +
          '<span class="dot" style="--c:' + FUEL_COLOR[r.e.fuel] + '"></span>' +
          '<span><span class="c">' + r.e.code + '</span><span class="d">' + r.d + '</span></span>' +
          '<span class="l">' + r.e.disp + 'L</span></button>';
      }).join("");
      return '<section class="model"><h3>' + m + '</h3><div class="rows">' + html + '</div></section>';
    }).join("");
    host.querySelectorAll(".row").forEach(function (b) {
      b.addEventListener("click", function () {
        $("q").value = b.getAttribute("data-code"); state.q = $("q").value.toLowerCase();
        state.fuel = "전체"; state.origin = "전체";
        document.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c.textContent === "전체" ? "true" : "false"); });
        setTab("eng"); renderEngines();
        var first = $("grid").querySelector(".head"); if (first) first.click();
      });
    });
  }

  function setTab(name) {
    ["eng", "mod", "tbl", "tm", "dec", "quiz"].forEach(function (n) {
      var on = n === name;
      $("t-" + n).setAttribute("aria-selected", on ? "true" : "false");
      $("p-" + n).hidden = !on;
    });
    // 좁은 화면에서 탭 줄이 가로로 스크롤되므로 고른 탭이 보이게 한다
    try { $("t-" + name).scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (e) {}
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
  }
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { setTab(t.getAttribute("data-tab")); });
  });

  // quiz
  var score = 0, total = 0, cur = null, last = -1;
  var pool = E.filter(function (e) { return e.quiz !== false; });
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function modelsOf(e) { var s = []; e.cars.forEach(function (c) { if (s.indexOf(c[0]) < 0) s.push(c[0]); }); return s; }

  function nextQ() {
    var i; do { i = Math.floor(Math.random() * pool.length); } while (i === last && pool.length > 1);
    last = i; var e = pool[i]; var right = modelsOf(e);
    var answer = right[Math.floor(Math.random() * right.length)];
    var wrong = shuffle(MODELS.filter(function (m) { return right.indexOf(m) < 0; })).slice(0, 3);
    cur = { e: e, answer: answer, right: right, opts: shuffle(wrong.concat([answer])) };
    $("q-code").textContent = e.code;
    $("q-sub").textContent = e.disp + "L · " + e.fuel + " · " + e.origin + " 계열 · " + e.cyl;
    $("opts").innerHTML = cur.opts.map(function (m) { return '<button class="opt" type="button" data-m="' + m + '">' + m + '</button>'; }).join("");
    $("fb").innerHTML = "이 엔진이 들어간 차종을 고르세요.";
    $("next").disabled = true;
    $("opts").querySelectorAll(".opt").forEach(function (b) { b.addEventListener("click", function () { answerQ(b); }); });
  }
  function answerQ(btn) {
    var m = btn.getAttribute("data-m"); total++;
    var ok = cur.right.indexOf(m) >= 0;
    if (ok) score++;
    $("opts").querySelectorAll(".opt").forEach(function (b) {
      b.disabled = true;
      if (cur.right.indexOf(b.getAttribute("data-m")) >= 0) b.classList.add("right");
    });
    if (!ok) btn.classList.add("wrong");
    $("fb").innerHTML = (ok ? "<strong>정답입니다.</strong> " : "<strong>오답입니다.</strong> ") + cur.e.code + "는 " + cur.right.join(", ") + "에 쓰였습니다. " + cur.e.note;
    $("q-score").textContent = "정답 " + score + " / " + total;
    $("next").disabled = false;
  }
  $("next").addEventListener("click", nextQ);

  // 연식별 제원표
  var TST = { m: "전체", t: "전체", f: "전체", q: "" };
  // 한 행이 여러 변속기 종류에 걸릴 수 있다 (예: 4AT/5MT)
  function tmOf(r) { return TM.filter(function (t) { return new RegExp(t.match).test(r[3] + " " + r[7]); }); }
  // 출처가 없고 상태 표시("수정"/"확인됨")도 없는 행은 "확인 필요"로 본다.
  function needsSrc(r) { return !r[13] && !r[11]; }
  function srcHtml(src) {
    if (!src) return "";
    var link = /^https?:\/\//.test(src)
      ? '<a href="' + esc(src) + '" target="_blank" rel="noopener noreferrer">' + esc(src.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48)) + "</a>"
      : esc(src);
    return '<span class="src">출처: ' + link + "</span>";
  }
  var TMOD = ["전체"]; TBL.forEach(function (r) { if (TMOD.indexOf(r[10]) < 0) TMOD.push(r[10]); });
  function tchips(id, list, key) {
    var host = $(id);
    list.forEach(function (v) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = v;
      b.setAttribute("aria-pressed", v === TST[key] ? "true" : "false");
      b.addEventListener("click", function () {
        TST[key] = v;
        host.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c.textContent === v ? "true" : "false"); });
        renderTbl();
      });
      host.appendChild(b);
    });
  }
  tchips("t-models", TMOD, "m");
  tchips("t-tms", ["전체"].concat(TM.map(function (t) { return t.chip; })), "t");
  tchips("t-flags", ["전체", "수정함", "웹 확인됨", "변경 없음", "출처 필요"], "f");
  $("tq").addEventListener("input", function (e) { TST.q = e.target.value.trim().toLowerCase(); renderTbl(); });
  function esc(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function renderTbl() {
    var list = TBL.filter(function (r) {
      if (TST.m !== "전체" && r[10] !== TST.m) return false;
      if (TST.t !== "전체" && !tmOf(r).some(function (t) { return t.chip === TST.t; })) return false;
      if (TST.f === "수정함" && r[11] !== "fix") return false;
      if (TST.f === "웹 확인됨" && r[11] !== "ok") return false;
      if (TST.f === "변경 없음" && r[11]) return false;
      if (TST.f === "출처 필요" && !needsSrc(r)) return false;
      if (TST.q && (r[0] + " " + r[2]).toLowerCase().indexOf(TST.q) < 0) return false;
      return true;
    });
    var nFix = TBL.filter(function (r) { return r[11] === "fix"; }).length;
    var nOk = TBL.filter(function (r) { return r[11] === "ok"; }).length;
    var nNeed = TBL.filter(needsSrc).length;
    $("tcount").textContent = list.length + " / " + TBL.length + "행 표시 · 수정 " + nFix + "행 · 웹 확인 " + nOk + "행 · 출처 필요 " + nNeed + "행";
    var head = ["차종(세대코드)", "연식", "엔진", "배기량", "출력(ps)", "토크(kgm)", "LPG", "변속기", "연비", "비고"];
    var h = "<thead><tr>" + head.map(function (x) { return "<th>" + x + "</th>"; }).join("") + "</tr></thead>";
    var b = list.map(function (r) {
      var flag = r[11] ? '<span class="sev ' + r[11] + '"><i></i>' + (r[11] === "fix" ? "수정" : "확인됨") + '</span><span class="why">' + esc(r[12]) + "</span>"
        : needsSrc(r) ? '<span class="sev need"><i></i>확인 필요</span>' : "";
      flag += srcHtml(r[13]);
      var cells = [esc(r[0]) + flag].concat(r.slice(1, 10).map(esc));
      return "<tr>" + cells.map(function (c, i) { return "<td" + (i === 9 ? ' class="wrap"' : "") + ">" + c + "</td>"; }).join("") + "</tr>";
    }).join("");
    $("tbl").innerHTML = h + "<tbody>" + b + "</tbody>";
  }
  renderTbl();

  // 변속기
  function syncChips(id, v) { $(id).querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", c.textContent === v ? "true" : "false"); }); }
  function renderTm() {
    $("tmcount").textContent = TM.length + "종 · 제원표 " + TBL.length + "행 기준";
    $("tms").innerHTML = TM.map(function (t) {
      var rows = TBL.filter(function (r) { return tmOf(r).indexOf(t) >= 0; });
      var dl = [["장점", t.pros], ["단점", t.cons], ["알아둘 점", t.check]].filter(function (x) { return x[1]; })
        .map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + esc(x[1]) + "</dd>"; }).join("");
      var src = t.src.length ? t.src.map(srcHtml).join("") : '<span class="sev need"><i></i>확인 필요</span>';
      var list = rows.map(function (r) {
        return '<button class="row" type="button" data-row="' + TBL.indexOf(r) + '">' +
          '<span class="dot" style="--c:var(--muted)"></span>' +
          '<span><span class="c">' + esc(r[0]) + '</span><span class="d">' + esc(r[2]) + " · " + esc(r[7]) + "</span></span>" +
          '<span class="l">' + esc(r[1]) + "</span></button>";
      }).join("");
      return '<section class="model"><h3>' + esc(t.name) + ' <span class="flag">' + esc(t.en) + "</span></h3>" +
        '<p class="tm-how">' + esc(t.how) + "</p>" + (dl ? '<dl class="tm-pc">' + dl + "</dl>" : "") + "<div>" + src + "</div>" +
        '<div class="count">제원표 ' + rows.length + "행</div><div class=\"rows\">" + list + "</div></section>";
    }).join("");
    $("tms").querySelectorAll(".row").forEach(function (b) {
      b.addEventListener("click", function () {
        var r = TBL[+b.getAttribute("data-row")];
        TST.m = "전체"; TST.f = "전체"; TST.t = "전체"; TST.q = r[0].toLowerCase(); $("tq").value = r[0];
        syncChips("t-models", "전체"); syncChips("t-tms", "전체"); syncChips("t-flags", "전체");
        renderTbl(); setTab("tbl");
      });
    });
  }
  renderTm();

  // 형식명 읽기
  var ARCH = [
    ["1", "단일 배럴 카뷰레터, 평행 밸브"],
    ["2", "2배럴 카뷰레터, 평행 밸브"],
    ["3", "단점·다점 연료분사, 평행 밸브"],
    ["4", "가솔린, 실린더당 4밸브"],
    ["5", "가솔린 직접분사"],
    ["6", "2배럴 카뷰레터, 크로스플로 밸브"],
    ["7", "다점 분사, 반구형 연소실, 실린더당 2밸브"],
    ["8", "간접분사 디젤 (예연소실)"],
    ["9", "직접분사 디젤"]
  ];
  var DISP = { H: ["1.3L", "H5Ht (XM3 1.3 TCe)"], K: ["1.5L", "K9K (1,461cc)"], M: ["1.6L", "H4M, M5M, R9M"], P: ["1.8L", "M5P (1,797cc)"], R: ["2.0L", "M4R, M5R, M9R"] };
  var FAMILY = {
    H: "소형군(0.9~1.33L)은 르노·메르세데스·닛산, 대형군(1.0~1.6L)은 르노·닛산이 공동 개발한 가솔린 엔진군.",
    K: "E형의 발전형. K4M·K7M은 1,598cc, K9K는 1,461cc 디젤(dCi).",
    M: "이 도감에 나오는 M 계열. 직4, 알루미늄 오픈덱, 체인 구동 DOHC 16밸브.",
    R: "R9M 등 1.6 dCi 디젤에 쓰이는 계열.",
    Q: "르노 체계가 아닌 닛산 형식명(QG, QR)일 수 있습니다.",
    S: "르노 체계가 아닌 닛산 형식명(SR)일 수 있습니다.",
    V: "르노 체계가 아닌 닛산 형식명(VQ)일 수 있습니다."
  };
  $("arch").innerHTML = ARCH.map(function (a) { return '<tr data-n="' + a[0] + '"><td>' + a[0] + '</td><td>' + a[1] + '</td></tr>'; }).join("");
  $("dispt").innerHTML = Object.keys(DISP).map(function (k) { return '<tr data-l="' + k + '"><td>' + k + '</td><td>' + DISP[k][0] + '</td><td style="color:var(--muted)">' + DISP[k][1] + '</td></tr>'; }).join("");
  ["M4R", "M5R", "M5M", "M5P", "M9R", "K9K", "R9M", "H4M", "H5H"].forEach(function (c) {
    var b = document.createElement("button"); b.type = "button"; b.className = "chip mono"; b.textContent = c;
    b.addEventListener("click", function () { $("dcode").value = c; decode(); });
    $("dex").appendChild(b);
  });
  function part(k, v, m, off) { return '<div class="part' + (off ? " off" : "") + '"><span class="k">' + k + '</span><span class="v">' + (v || "–") + '</span><span class="m">' + m + '</span></div>'; }
  function decode() {
    var raw = $("dcode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    var m = /^([A-Z])(\d)([A-Z])(.*)$/.exec(raw);
    document.querySelectorAll("#arch tr, #dispt tr").forEach(function (r) { r.classList.remove("hit"); });
    if (!m) { $("parts").innerHTML = part("계열", raw.charAt(0), "알파벳 한 글자", !raw) + part("구조", "", "숫자 한 자리", true) + part("배기량", "", "알파벳 한 글자", true); $("dnote").textContent = "글자, 숫자, 글자 순서로 입력하세요. 예: M5R"; return; }
    var a = ARCH.filter(function (x) { return x[0] === m[2]; })[0];
    var d = DISP[m[3]];
    $("parts").innerHTML = part("계열", m[1], FAMILY[m[1]] || "엔진 계열을 뜻하는 글자") + part("구조", m[2], a ? a[1] : "0은 규칙에 없는 숫자") + part("배기량", m[3], d ? "약 " + d[0] : "이 도감에는 없는 글자 (규칙표 참고)", !d);
    if (a) { var tr = document.querySelector('#arch tr[data-n="' + m[2] + '"]'); if (tr) tr.classList.add("hit"); }
    if (d) { var tl = document.querySelector('#dispt tr[data-l="' + m[3] + '"]'); if (tl) tl.classList.add("hit"); }
    $("dnote").textContent = m[4] ? "뒤에 붙은 " + m[4] + "는 변형 구분 코드입니다. 터보 여부, 장착 차종, 변속기에 따라 달라집니다." : "";
  }
  $("dcode").addEventListener("input", decode);
  decode();

  var dq = { score: 0, total: 0, cur: null, last: -1 };
  var DQ = ["M4R", "M5R", "M5M", "M5P", "M9R", "K9K", "R9M", "H4M", "H5H"];
  function dNext() {
    var i; do { i = Math.floor(Math.random() * DQ.length); } while (i === dq.last);
    dq.last = i; var c = DQ[i]; dq.cur = { c: c, ans: DISP[c.charAt(2)][0] };
    $("d-code").textContent = c; $("d-sub").textContent = "마지막 글자 " + c.charAt(2) + "가 뜻하는 배기량은?";
    $("d-opts").innerHTML = Object.keys(DISP).map(function (k) { return '<button class="opt mono" type="button" data-v="' + DISP[k][0] + '">' + DISP[k][0] + '</button>'; }).join("");
    $("d-fb").textContent = ""; $("d-next").disabled = true;
    $("d-opts").querySelectorAll(".opt").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-v"); dq.total++; var ok = v === dq.cur.ans; if (ok) dq.score++;
        $("d-opts").querySelectorAll(".opt").forEach(function (o) { o.disabled = true; if (o.getAttribute("data-v") === dq.cur.ans) o.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        var a = ARCH.filter(function (x) { return x[0] === dq.cur.c.charAt(1); })[0];
        $("d-fb").innerHTML = (ok ? "<strong>정답입니다.</strong> " : "<strong>오답입니다.</strong> ") + dq.cur.c + "는 " + dq.cur.ans + "급이고, 가운데 숫자 " + a[0] + "는 " + a[1] + "입니다.";
        $("d-score").textContent = "정답 " + dq.score + " / " + dq.total; $("d-next").disabled = false;
      });
    });
  }
  $("d-next").addEventListener("click", dNext);
  dNext();

  renderEngines(); renderModels(); nextQ();
  var h = (location.hash || "").replace("#", "");
  if (["eng", "mod", "tbl", "tm", "dec", "quiz"].indexOf(h) >= 0) setTab(h);
})();
