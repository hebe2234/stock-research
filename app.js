// Stock Research 選股研究台 v1 — localStorage CRUD
const KEY = 'stockResearch.v1';
let stocks = load();
let editingId = null;
let expandedId = null;

const $ = id => document.getElementById(id);
const STATUS = { watch: ['觀察中', 'watch'], research: ['研究中', 'research'], consider: ['考慮買入', 'consider'], hold: ['持有', 'hold'] };

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch (e) { return []; }
}
function save() { localStorage.setItem(KEY, JSON.stringify(stocks)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function num(v, suffix) {
  if (v === '' || v === null || v === undefined || isNaN(v)) return '–';
  return esc(v) + (suffix || '');
}
function stars(n) {
  n = parseInt(n, 10) || 0;
  return n ? '<span class="stars">' + '★'.repeat(n) + '☆'.repeat(5 - n) + '</span>' : '–';
}

function filtered() {
  const q = $('q').value.trim().toLowerCase();
  let list = stocks.filter(s => !q || (s.ticker + ' ' + s.name + ' ' + s.sector).toLowerCase().includes(q));
  const by = $('sortBy').value;
  list.sort((a, b) => {
    if (by === 'score') return (b.score || 0) - (a.score || 0);
    if (by === 'ticker') return String(a.ticker).localeCompare(String(b.ticker));
    if (by === 'earnings') return String(a.earnings || '9999').localeCompare(String(b.earnings || '9999'));
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
  });
  return list;
}

function render() {
  const list = filtered();
  $('emptyState').style.display = list.length ? 'none' : 'block';
  $('tbody').innerHTML = list.map(s => {
    const st = STATUS[s.status] || STATUS.watch;
    let row = '<tr>' +
      '<td><strong>' + esc(s.ticker) + '</strong></td><td>' + esc(s.name) + '</td><td>' + esc(s.sector) + '</td>' +
      '<td class="num">' + num(s.price) + '</td><td class="num">' + num(s.target) + '</td>' +
      '<td class="num">' + num(s.rev, '%') + '</td><td class="num">' + num(s.eps, '%') + '</td><td class="num">' + num(s.roe, '%') + '</td>' +
      '<td class="num">' + num(s.pe) + '</td><td class="num">' + num(s.peg) + '</td>' +
      '<td>' + stars(s.score) + '</td>' +
      '<td><span class="pill ' + st[1] + '">' + st[0] + '</span></td>' +
      '<td>' + esc(s.earnings || '–') + '</td>' +
      '<td><button class="small secondary" data-act="detail" data-id="' + s.id + '">詳情</button> ' +
      '<button class="small secondary" data-act="edit" data-id="' + s.id + '">編輯</button> ' +
      '<button class="small danger" data-act="del" data-id="' + s.id + '">刪除</button></td></tr>';
    if (expandedId === s.id) {
      row += '<tr class="detail"><td colspan="14">' +
        '<strong>毛利率：</strong>' + num(s.gm, '%') + '　<strong>FCF：</strong>' + (s.fcf === '' || s.fcf == null ? '–' : '$' + esc(s.fcf) + 'M') +
        '　<strong>D/E：</strong>' + num(s.de) + '　<strong>更新：</strong>' + esc((s.updatedAt || '').slice(0, 10)) + '<br>' +
        '<strong>消息面 / 催化劑：</strong>' + esc(s.catalyst || '（無）') + '<br>' +
        '<strong>研究筆記：</strong><br>' + esc(s.notes || '（無）').replace(/\n/g, '<br>') +
        '</td></tr>';
    }
    return row;
  }).join('');
}

const FIELDS = ['ticker', 'name', 'sector', 'status', 'price', 'target', 'rev', 'eps', 'gm', 'roe', 'fcf', 'de', 'pe', 'peg', 'score', 'earnings', 'catalyst', 'notes'];
function openForm(stock) {
  editingId = stock ? stock.id : null;
  $('formTitle').textContent = stock ? '編輯 ' + stock.ticker : '新增股票';
  FIELDS.forEach(f => { $('f_' + f).value = stock ? (stock[f] == null ? '' : stock[f]) : (f === 'status' ? 'watch' : f === 'score' ? '0' : ''); });
  $('formPanel').hidden = false;
  $('f_ticker').focus();
}
function closeForm() { $('formPanel').hidden = true; editingId = null; }

$('formPanel').addEventListener('submit', e => {
  e.preventDefault();
  const rec = {};
  FIELDS.forEach(f => { rec[f] = $('f_' + f).value.trim(); });
  if (!rec.ticker) { alert('代號必填'); return; }
  rec.ticker = rec.ticker.toUpperCase();
  ['price', 'target', 'rev', 'eps', 'gm', 'roe', 'fcf', 'de', 'pe', 'peg'].forEach(f => { rec[f] = rec[f] === '' ? '' : Number(rec[f]); });
  rec.score = parseInt(rec.score, 10) || 0;
  rec.updatedAt = new Date().toISOString();
  if (editingId) {
    const i = stocks.findIndex(s => s.id === editingId);
    if (i >= 0) stocks[i] = Object.assign({}, stocks[i], rec);
  } else {
    rec.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    stocks.unshift(rec);
  }
  save(); closeForm(); render();
});

$('tbody').addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id, act = btn.dataset.act;
  const stock = stocks.find(s => s.id === id);
  if (act === 'detail') { expandedId = expandedId === id ? null : id; render(); }
  if (act === 'edit' && stock) openForm(stock);
  if (act === 'del' && stock && confirm('刪除 ' + stock.ticker + '？')) {
    stocks = stocks.filter(s => s.id !== id); save(); render();
  }
});

$('btnAdd').addEventListener('click', () => openForm(null));
$('btnCancel').addEventListener('click', closeForm);
$('q').addEventListener('input', render);
$('sortBy').addEventListener('change', render);

$('btnExport').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(stocks, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'stock-research-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('btnImport').addEventListener('click', () => $('fileImport').click());
$('fileImport').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error('格式不對');
      if (confirm('匯入將取代目前全部資料，確定？')) { stocks = data; save(); render(); }
    } catch (err) { alert('匯入失敗：' + err.message); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

render();

// ===== 本週大跌股專區（TradingView 榜單 + Gemini 逐一分析 + Drive 日誌） =====
const LKEY = 'stockResearch.losers.v1';
const AKEY = 'stockResearch.archive.v1';
const SKEY = 'stockResearch.settings';
const DKEY = 'stockResearch.drive';
let L = loadJSON(LKEY, { weekKey: '', fetchedAt: '', list: [], results: {} });
let ARCH = loadJSON(AKEY, []);
let SET = loadJSON(SKEY, { geminiKey: '', model: 'gemini-2.5-flash', grounding: '1', driveClientId: '' });
let DRV = loadJSON(DKEY, { folderId: '', files: {} });
let LexpandedId = null;
let running = false, stopFlag = false;
let accessToken = null, tokenExp = 0, tokenClient = null, gisPromise = null, syncing = false;

function loadJSON(k, dft) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? dft : v; } catch (e) { return dft; } }
function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function pad2(n) { return String(n).padStart(2, '0'); }
function dateStr(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function todayStr() { return dateStr(new Date()); }
function mondayKey() { const d = new Date(); const back = (d.getDay() + 6) % 7; d.setDate(d.getDate() - back); return dateStr(d); }
function fmtMcap(v) { if (!v) return '–'; return v >= 1e9 ? '$' + (v / 1e9).toFixed(1) + 'B' : '$' + Math.round(v / 1e6) + 'M'; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function doneCount() { return L.list.filter(s => { const r = L.results[s.ticker]; return r && !r.err; }).length; }

async function fetchLosers() {
  $('L_weekLabel').textContent = '載入中…';
  const body = {
    filter: [
      { left: 'exchange', operation: 'in_range', right: ['NASDAQ', 'NYSE', 'AMEX'] },
      { left: 'close', operation: 'egreater', right: 5 },
      { left: 'market_cap_basic', operation: 'egreater', right: 300000000 }
    ],
    options: { lang: 'en' },
    markets: ['america'],
    symbols: { query: { types: ['stock'] } },
    columns: ['name', 'description', 'close', 'change|1W', 'volume', 'market_cap_basic', 'sector'],
    sort: { sortBy: 'change|1W', sortOrder: 'asc' },
    range: [0, 100]
  };
  const r = await fetch('https://scanner.tradingview.com/america/scan', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('TradingView 回應 ' + r.status);
  const j = await r.json();
  const wk = mondayKey();
  if (L.weekKey !== wk) L.results = {};
  L.weekKey = wk;
  L.fetchedAt = new Date().toISOString();
  L.list = (j.data || []).map(x => { const d = x.d; return { ticker: d[0], name: d[1], price: d[2], chgW: d[3], volume: d[4], mcap: d[5], sector: d[6] }; });
  saveJSON(LKEY, L);
}

function detailHTML(s, res) {
  if (res.err) return '<strong>失敗：</strong>' + esc(res.err);
  if (res.raw) return '<strong>Gemini 原始回覆（格式解析失敗，原文保留）：</strong><br>' + esc(res.raw).replace(/\n/g, '<br>');
  return '<strong>下跌主因：</strong>' + esc(res.cause || '') + '<br>' +
    '<strong>分類：</strong>' + esc(res.category || '') + '<br>' +
    '<strong>市場不理性：</strong>' + esc(res.irrational || '') + ' — ' + esc(res.reason || '') + '<br>' +
    '<strong>反彈機率（1–3 個月漲回跌前價位）：</strong>' + esc(res.reboundProb) + '%<br>' +
    '<strong>觀察重點：</strong>' + esc(res.keyPoints || '') + '<br>' +
    '<span style="color:#5b6b7a">分析時間：' + esc((res.at || '').slice(0, 16).replace('T', ' ')) + '・模型：' + esc(res.model || '') + '</span>';
}

function renderL() {
  const wk = mondayKey();
  $('L_weekLabel').textContent = L.list.length
    ? ('榜單週：' + L.weekKey + (L.weekKey !== wk ? '（已跨週，按「載入」更新）' : '') + '・抓取於 ' + (L.fetchedAt || '').slice(0, 10))
    : '';
  $('L_empty').style.display = L.list.length ? 'none' : 'block';
  if (L.list.length && !running) $('L_progress').textContent = '已分析 ' + doneCount() + ' / ' + L.list.length;
  $('L_tbody').innerHTML = L.list.map((s, i) => {
    const res = L.results[s.ticker];
    let status = '未分析', irr = '–', prob = '–';
    if (res) {
      if (res.err) status = '⚠️ 失敗';
      else { status = '✅ 完成'; irr = esc(res.irrational || '–'); prob = (res.reboundProb === '' || res.reboundProb == null) ? '–' : res.reboundProb + '%'; }
    }
    let row = '<tr><td>' + (i + 1) + '</td><td><strong>' + esc(s.ticker) + '</strong></td><td>' + esc(s.name) + '</td><td>' + esc(s.sector) + '</td>' +
      '<td class="num">' + num(s.price) + '</td><td class="num" style="color:#b3261e">' + (s.chgW == null ? '–' : s.chgW.toFixed(1) + '%') + '</td>' +
      '<td class="num">' + fmtMcap(s.mcap) + '</td><td>' + status + '</td><td>' + irr + '</td><td class="num">' + prob + '</td>' +
      '<td><button class="small secondary" data-lact="one" data-t="' + esc(s.ticker) + '">分析</button> ' +
      '<button class="small secondary" data-lact="detail" data-t="' + esc(s.ticker) + '">詳情</button></td></tr>';
    if (LexpandedId === s.ticker && res) row += '<tr class="detail"><td colspan="11">' + detailHTML(s, res) + '</td></tr>';
    return row;
  }).join('');
}

function models() {
  const list = (SET.model || 'gemini-2.5-flash').split(',').map(x => x.trim()).filter(Boolean);
  if (!list.includes('gemini-2.5-flash-lite')) list.push('gemini-2.5-flash-lite');
  return list;
}

function buildBatchPrompt(batch) {
  const lines = batch.map(s => '- ' + s.ticker + '（' + s.name + '，產業：' + (s.sector || '未知') + '）：本週漲跌 ' + (s.chgW == null ? '?' : s.chgW.toFixed(1)) + '%，現價 $' + s.price + '，市值約 ' + fmtMcap(s.mcap)).join('\n');
  return '你是股票分析師，用第一性原理逐一分析以下美股本週大跌的原因。清單：\n' + lines +
    '\n請先查明每檔本週下跌的實際原因（財報、指引、公司消息、產業、總經或資金面），然後只輸出一個 JSON 陣列，不要任何其他文字、不要 markdown 圍欄。陣列每檔一個物件，欄位：' +
    '{"ticker":"代號","dropCause":"下跌主因，一段話，註明消息日期","category":"基本面惡化|消息面一次性衝擊|市場情緒/資金面|產業系統性|不明",' +
    '"irrational":"是|否|部分","irrationalReason":"為什麼這樣判斷，公司核心基本面是否實質受損","reboundProb":0到100的整數（未來1到3個月漲回本週下跌前價位的機率）,' +
    '"keyPoints":"投資人該觀察的2到3個驗證點"}';
}

async function geminiCallOnce(model, prompt, useGrounding) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(SET.geminiKey.trim());
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } };
  if (useGrounding) body.tools = [{ google_search: {} }];
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('Gemini ' + r.status + '：' + ((j.error && j.error.message) || ''));
  const parts = ((((j.candidates || [])[0] || {}).content || {}).parts || []);
  const text = parts.map(p => p.text || '').join('');
  if (!text) throw new Error('Gemini 回覆空白');
  return { text: text, model: model };
}

async function geminiCall(prompt) {
  let lastErr = null, quotaHit = false;
  for (const model of models()) {
    const variants = SET.grounding !== '0' ? [true, false] : [false];
    for (const g of variants) {
      try { return await geminiCallOnce(model, prompt, g); }
      catch (e) {
        lastErr = e;
        if (/401|403|API key/i.test(e.message)) throw e;
        if (/429|RESOURCE_EXHAUSTED|quota/i.test(e.message)) { quotaHit = true; break; }
      }
    }
  }
  if (quotaHit) throw new Error('QUOTA: 所有模型的免費額度都用完了');
  throw lastErr || new Error('Gemini 呼叫失敗');
}

function parseBatch(text) {
  let t = text.trim().replace(/```json/gi, '').replace(/```/g, '').trim();
  const map = {};
  let arr = null;
  const a = t.indexOf('['), b = t.lastIndexOf(']');
  if (a >= 0 && b > a) { try { arr = JSON.parse(t.slice(a, b + 1)); } catch (e) { /* 繼續試單物件 */ } }
  if (!Array.isArray(arr)) {
    const oa = t.indexOf('{'), ob = t.lastIndexOf('}');
    if (oa >= 0 && ob > oa) { try { const o = JSON.parse(t.slice(oa, ob + 1)); if (o && o.ticker) arr = [o]; } catch (e) { /* 解析失敗 */ } }
  }
  if (Array.isArray(arr)) {
    for (const o of arr) {
      if (!o || !o.ticker) continue;
      let kp = o.keyPoints;
      if (Array.isArray(kp)) kp = kp.join('；');
      let prob = parseInt(o.reboundProb, 10);
      if (isNaN(prob)) prob = '';
      map[String(o.ticker).toUpperCase()] = { cause: o.dropCause || o.cause || '', category: o.category || '', irrational: o.irrational || '', reason: o.irrationalReason || o.reason || '', reboundProb: prob, keyPoints: kp || '' };
    }
  }
  return map;
}

async function analyzeBatch(batch) {
  const out = await geminiCall(buildBatchPrompt(batch));
  const map = parseBatch(out.text);
  const at = new Date().toISOString();
  for (const s of batch) {
    const f = map[String(s.ticker).toUpperCase()];
    const res = f ? Object.assign({ at: at, model: out.model }, f) : { at: at, model: out.model, raw: out.text };
    L.results[s.ticker] = res;
    ARCH = ARCH.filter(a => !(a.date === todayStr() && a.ticker === s.ticker));
    ARCH.push({ date: todayStr(), weekKey: L.weekKey, ticker: s.ticker, name: s.name, chgW: s.chgW, res: res });
  }
  saveJSON(LKEY, L);
  saveJSON(AKEY, ARCH);
  renderL(); updateLogView();
}

async function analyzeOne(s) { await analyzeBatch([s]); }

async function runAnalysis() {
  if (running) return;
  if (!SET.geminiKey || !SET.geminiKey.trim()) { alert('先在專區設定填 Gemini API Key 並儲存'); $('S_geminiKey').focus(); return; }
  if (!L.list.length) { alert('先載入本週大跌榜'); return; }
  if (SET.driveClientId) { try { await getToken(); } catch (e) { $('L_driveStatus').textContent = 'Drive 授權失敗：' + e.message + '（日誌仍會存本機）'; } }
  const targets = L.list.filter(s => { const r = L.results[s.ticker]; return !r || r.err; });
  if (!targets.length) { $('L_progress').textContent = '本週榜單已全部分析完'; return; }
  const batchSize = Math.max(1, parseInt(SET.batch, 10) || 5);
  const batches = [];
  for (let i = 0; i < targets.length; i += batchSize) batches.push(targets.slice(i, i + batchSize));
  running = true; stopFlag = false;
  $('L_btnRun').disabled = true; $('L_btnStop').disabled = false;
  let okCount = 0;
  for (let bi = 0; bi < batches.length; bi++) {
    if (stopFlag) break;
    const batch = batches[bi];
    $('L_progress').textContent = '分析中（批次 ' + (bi + 1) + ' / ' + batches.length + '）：' + batch.map(s => s.ticker).join(', ') + '…';
    try {
      await analyzeBatch(batch); okCount += batch.length;
      syncDriveLog();
    } catch (e) {
      if (/^QUOTA:/.test(e.message)) { $('L_progress').textContent = '所有模型的免費額度都用完了，剩下的明天按「開始分析」會接著跑。'; break; }
      if (/401|403|API key/i.test(e.message)) { $('L_progress').textContent = 'Gemini 金鑰有問題，先停下：' + e.message; break; }
      for (const s of batch) { L.results[s.ticker] = { err: e.message, at: new Date().toISOString() }; }
      saveJSON(LKEY, L); renderL();
    }
    if (!stopFlag) await sleep(6500);
  }
  running = false;
  $('L_btnRun').disabled = false; $('L_btnStop').disabled = true;
  if (!stopFlag && okCount) $('L_progress').textContent = '本輪完成（新增 ' + okCount + ' 檔）。已分析 ' + doneCount() + ' / ' + L.list.length;
  renderL();
}

function buildLog(date) {
  const items = ARCH.filter(a => a.date === date);
  if (!items.length) return '';
  let md = '# 選股研究日誌 ' + date + '\n\n本週大跌股・第一性原理分析（Gemini）\n';
  for (const a of items) {
    const r = a.res || {};
    md += '\n## ' + a.ticker + ' ' + (a.name || '') + '（本週 ' + (a.chgW == null ? '?' : a.chgW.toFixed(1)) + '%）\n';
    if (r.raw) { md += '- Gemini 原始回覆（解析失敗，原文保留）：\n' + r.raw + '\n'; continue; }
    md += '- 下跌主因：' + (r.cause || '') + '\n';
    md += '- 分類：' + (r.category || '') + '\n';
    md += '- 市場不理性：' + (r.irrational || '') + ' — ' + (r.reason || '') + '\n';
    md += '- 反彈機率（1–3 個月漲回跌前價位）：' + (r.reboundProb === '' || r.reboundProb == null ? '–' : r.reboundProb + '%') + '\n';
    md += '- 觀察重點：' + (r.keyPoints || '') + '\n';
  }
  return md;
}

function updateLogView() {
  const md = buildLog(todayStr());
  $('L_logView').textContent = md || '（今日尚無分析紀錄）';
}

function loadGis() {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'https://accounts.google.com/gsi/client';
    sc.onload = res; sc.onerror = () => rej(new Error('GIS 載入失敗'));
    document.head.appendChild(sc);
  });
  return gisPromise;
}

async function getToken() {
  if (accessToken && Date.now() < tokenExp - 60000) return accessToken;
  await loadGis();
  return new Promise((res, rej) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: SET.driveClientId.trim(),
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (resp) => {
        if (resp && resp.access_token) { accessToken = resp.access_token; tokenExp = Date.now() + (resp.expires_in || 3600) * 1000; res(accessToken); }
        else rej(new Error((resp && resp.error) || '授權失敗'));
      }
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

async function driveApi(path, opts) {
  const r = await fetch('https://www.googleapis.com' + path, Object.assign({ headers: { Authorization: 'Bearer ' + accessToken } }, opts || {}));
  if (!r.ok) throw new Error('Drive ' + r.status);
  return r.status === 204 ? null : r.json().catch(() => null);
}

async function ensureFolder() {
  if (DRV.folderId) return DRV.folderId;
  const q = encodeURIComponent("name='Stock Research 日誌' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  const found = await driveApi('/drive/v3/files?q=' + q + '&fields=files(id,name)');
  if (found && found.files && found.files.length) { DRV.folderId = found.files[0].id; }
  else {
    const created = await driveApi('/drive/v3/files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Stock Research 日誌', mimeType: 'application/vnd.google-apps.folder' }) });
    DRV.folderId = created.id;
  }
  saveJSON(DKEY, DRV);
  return DRV.folderId;
}

async function syncDriveLog() {
  if (!SET.driveClientId) { $('L_driveStatus').textContent = 'Drive 未設定：日誌目前只存本機（設定填 Client ID 後自動同步）'; return; }
  if (syncing) return;
  const date = todayStr();
  const content = buildLog(date);
  if (!content) { $('L_driveStatus').textContent = '今日尚無日誌可同步'; return; }
  syncing = true;
  try {
    await getToken();
    const folderId = await ensureFolder();
    let fileId = DRV.files[date];
    if (!fileId) {
      const q = encodeURIComponent("name='" + date + ".md' and '" + folderId + "' in parents and trashed=false");
      const found = await driveApi('/drive/v3/files?q=' + q + '&fields=files(id)');
      if (found && found.files && found.files.length) fileId = found.files[0].id;
    }
    if (fileId) {
      const r = await fetch('https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media', { method: 'PATCH', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'text/markdown' }, body: content });
      if (!r.ok) throw new Error('Drive 上傳 ' + r.status);
    } else {
      const boundary = 'sr' + Date.now();
      const meta = JSON.stringify({ name: date + '.md', parents: [folderId], mimeType: 'text/markdown' });
      const payload = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + boundary + '\r\nContent-Type: text/markdown\r\n\r\n' + content + '\r\n--' + boundary + '--';
      const created = await driveApi('/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body: payload });
      fileId = created.id;
    }
    DRV.files[date] = fileId; saveJSON(DKEY, DRV);
    $('L_driveStatus').textContent = '✅ 日誌已同步 Drive（' + date + '.md，' + new Date().toTimeString().slice(0, 8) + '）';
  } catch (e) {
    $('L_driveStatus').textContent = 'Drive 同步失敗：' + e.message + '（日誌仍存本機）';
  }
  syncing = false;
}

$('L_btnLoad').addEventListener('click', async () => {
  try { await fetchLosers(); renderL(); }
  catch (e) { $('L_weekLabel').textContent = '載入失敗：' + e.message; }
});
$('L_btnRun').addEventListener('click', runAnalysis);
$('L_btnStop').addEventListener('click', () => { stopFlag = true; $('L_progress').textContent = '已停止（進度有存，下次按開始會接著跑）'; });
$('L_tbody').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-lact]');
  if (!btn) return;
  const t = btn.dataset.t;
  const s = L.list.find(x => x.ticker === t);
  if (!s) return;
  if (btn.dataset.lact === 'detail') { LexpandedId = LexpandedId === t ? null : t; renderL(); return; }
  if (btn.dataset.lact === 'one') {
    if (!SET.geminiKey || !SET.geminiKey.trim()) { alert('先在專區設定填 Gemini API Key 並儲存'); return; }
    btn.disabled = true; btn.textContent = '分析中…';
    try { await analyzeOne(s); syncDriveLog(); }
    catch (err) { alert('分析失敗：' + err.message); }
    renderL();
  }
});
$('S_form').addEventListener('submit', (e) => {
  e.preventDefault();
  SET.geminiKey = $('S_geminiKey').value;
  SET.model = $('S_model').value || 'gemini-2.5-flash,gemini-2.5-flash-lite';
  SET.grounding = $('S_grounding').value;
  SET.batch = $('S_batch').value;
  SET.driveClientId = $('S_driveClient').value;
  saveJSON(SKEY, SET);
  $('S_status').textContent = '已儲存（' + new Date().toTimeString().slice(0, 8) + '）';
});
$('L_btnSync').addEventListener('click', async () => {
  if (!SET.driveClientId) { alert('先在專區設定填 Drive Client ID 並儲存'); return; }
  try { await getToken(); } catch (e) { $('L_driveStatus').textContent = 'Drive 授權失敗：' + e.message; return; }
  syncDriveLog();
});
$('L_btnDownloadLog').addEventListener('click', () => {
  const md = buildLog(todayStr());
  if (!md) { alert('今日尚無日誌'); return; }
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = todayStr() + '.md';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('S_geminiKey').value = SET.geminiKey || '';
$('S_model').value = SET.model || 'gemini-2.5-flash,gemini-2.5-flash-lite';
$('S_grounding').value = SET.grounding || '1';
$('S_batch').value = SET.batch || '5';
$('S_driveClient').value = SET.driveClientId || '';
renderL();
updateLogView();
