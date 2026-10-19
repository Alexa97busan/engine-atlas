// 사용법: node check.js
// data.js의 형식 오류를 찾습니다. PR을 올리기 전에 한 번 실행하세요.
const fs = require("fs"), vm = require("vm");
const code = fs.readFileSync(__dirname + "/data.js", "utf8");
const { MODELS, E, TBL, TM, IMG } = vm.runInNewContext(code + "\n({ MODELS: MODELS, E: E, TBL: TBL, TM: TM, IMG: IMG })");
const errs = [];
TBL.forEach((r, i) => {
  const at = "TBL " + (i + 1) + "번째 행 (" + r[0] + ")";
  if (r.length < 13 || r.length > 14) errs.push(at + ": 칸 수는 13~14개여야 합니다 (현재 " + r.length + ")");
  if (!r[10]) errs.push(at + ": 모델키(11번째 칸)가 비어 있습니다. 차종 필터에 쓰이는 이름입니다");
  if (["fix", "ok", ""].indexOf(r[11]) < 0) errs.push(at + ": 상태는 'fix', 'ok', '' 중 하나여야 합니다");
  if (r[11] && !r[12]) errs.push(at + ": 상태가 있으면 사유(12번째 칸)를 적어야 합니다");
  if (r[13] && /^[a-z]+:/i.test(r[13]) && !/^https?:\/\//.test(r[13])) errs.push(at + ": 출처 주소는 http(s)만 허용합니다");
  r.forEach((v, j) => { if (typeof v !== "string") errs.push(at + ": " + (j + 1) + "번째 칸이 문자열이 아닙니다"); });
});
TM.forEach((t) => {
  const at = "변속기 " + (t.key || "?");
  ["key", "name", "match", "how"].forEach((k) => { if (!t[k]) errs.push(at + ": " + k + " 칸이 비어 있습니다"); });
  try { new RegExp(t.match); } catch (x) { errs.push(at + ": match 정규식 오류 (" + x.message + ")"); }
  if (!Array.isArray(t.src)) errs.push(at + ": src는 목록([])이어야 합니다");
  else t.src.forEach((s) => { if (/^[a-z]+:/i.test(s) && !/^https?:\/\//.test(s)) errs.push(at + ": 출처 주소는 http(s)만 허용합니다"); });
});
Object.keys(IMG).forEach((m) => {
  const at = "사진 " + m, im = IMG[m];
  if (MODELS.indexOf(m) < 0) errs.push(at + ": MODELS에 없는 차종입니다");
  ["file", "alt", "by", "license", "licenseUrl", "page"].forEach((k) => { if (!im[k]) errs.push(at + ": " + k + " 칸이 비어 있습니다 (촬영자·라이선스·원문 주소는 반드시 필요합니다)"); });
  ["licenseUrl", "page"].forEach((k) => { if (im[k] && !/^https:\/\//.test(im[k])) errs.push(at + ": " + k + "는 https 주소여야 합니다"); });
  if (!(im.w > 0 && im.h > 0)) errs.push(at + ": w, h(사진 크기)는 양의 숫자여야 합니다");
  if (im.file) {
    if (!/^images\/[\w.-]+\.(jpe?g|png|webp)$/i.test(im.file)) errs.push(at + ": file은 images/ 안의 jpg·png·webp 파일이어야 합니다");
    else if (!fs.existsSync(__dirname + "/" + im.file)) errs.push(at + ": " + im.file + " 파일이 없습니다");
    else if (fs.statSync(__dirname + "/" + im.file).size > 400 * 1024) errs.push(at + ": " + im.file + " 용량이 400KB를 넘습니다 (가로 960px 안팎, 200KB 안팎으로 줄여 주세요)");
  }
});
TBL.forEach((r, i) => {
  if (!TM.some((t) => new RegExp(t.match).test(r[3] + " " + r[7]))) errs.push("TBL " + (i + 1) + "번째 행 (" + r[0] + "): 변속기 '" + r[7] + "'가 TM의 어느 종류에도 맞지 않습니다");
});
E.forEach((e) => e.cars.forEach((c) => { if (MODELS.indexOf(c[0]) < 0) errs.push("엔진 " + e.code + ": 차종 '" + c[0] + "'가 MODELS에 없습니다"); }));
const need = TBL.filter((r) => !r[13] && !r[11]).length;
console.log("엔진 " + E.length + "종, 제원표 " + TBL.length + "행 (출처 필요 " + need + "행), 차종 사진 " + Object.keys(IMG).length + "/" + MODELS.length + "개");
if (errs.length) { console.error("\n오류 " + errs.length + "건\n- " + errs.join("\n- ")); process.exit(1); }
console.log("형식 검사 통과");
