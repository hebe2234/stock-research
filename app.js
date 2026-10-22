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
      '<td><strong>' + esc(s.ticker) + '</strong></td><td class="ellipsis" title="' + esc(s.name) + '">' + esc(s.name) + '</td><td>' + esc(s.sector) + '</td>' +
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
  if (act === 'detail' && stock) { showWatchModal(stock); }
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

// ===== 本週大跌股專區（TradingView 榜單 + Gemini 逐一分析 + Google Doc 日誌） =====
const LKEY = 'stockResearch.losers.v1';
const AKEY = 'stockResearch.archive.v1';
const SKEY = 'stockResearch.settings';
const QKEY = 'stockResearch.docqueue';
let L = loadJSON(LKEY, { weekKey: '', fetchedAt: '', list: [], results: {} });
let ARCH = loadJSON(AKEY, []);
let SET = loadJSON(SKEY, { geminiKey: '', model: 'gemini-2.5-flash', grounding: '1', docUrl: '' });
SET.provider = SET.provider || 'gemini';
SET.localEndpoint = SET.localEndpoint || 'http://localhost:8080';
SET.localModel = SET.localModel || 'qwen3-coder-30b-a3b-instruct-q4_k_m.gguf';
SET.localApiKey = SET.localApiKey || '';
SET.localNews = SET.localNews || 'web';
if (SET.localNews === '1' || SET.localNews === 'gemini') SET.localNews = 'web';
SET.tavilyKey = SET.tavilyKey || '';
SET.docUrl = SET.docUrl || '';
let DOCQ = loadJSON(QKEY, []);
let LexpandedId = null;
let running = false, stopFlag = false;
let docFlushing = false;

function loadJSON(k, dft) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? dft : v; } catch (e) { return dft; } }
function saveJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function pad2(n) { return String(n).padStart(2, '0'); }
function dateStr(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function todayStr() { return dateStr(new Date()); }
function mondayKey() { const d = new Date(); const back = (d.getDay() + 6) % 7; d.setDate(d.getDate() - back); return dateStr(d); }
function fmtMcap(v) { if (!v) return '–'; return v >= 1e9 ? '$' + (v / 1e9).toFixed(1) + 'B' : '$' + Math.round(v / 1e6) + 'M'; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function resOf(t, prov) { const r = L.results[t]; return r ? (r[prov] || null) : null; }
function provOfRes(res) { return (res && res.model && String(res.model).indexOf('local:') === 0) ? 'local' : 'gemini'; }
function doneCount(prov) { return L.list.filter(s => { const r = resOf(s.ticker, prov); return r && !r.err; }).length; }

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
  if (L.list.length && !running) $('L_progress').textContent = 'Gemini ' + doneCount('gemini') + ' / ' + L.list.length + '・本地 ' + doneCount('local') + ' / ' + L.list.length;
  $('L_tbody').innerHTML = L.list.map((s, i) => {
    const g = resOf(s.ticker, 'gemini'), l = resOf(s.ticker, 'local');
    const st = (r) => r ? (r.err ? '⚠️' : '✅') : '–';
    const status = 'G ' + st(g) + ' / 本 ' + st(l);
    const irrPart = (tag, r) => (r && !r.err && r.irrational) ? tag + ' ' + esc(r.irrational) : '';
    const irr = [irrPart('G', g), irrPart('本', l)].filter(Boolean).join('・') || '–';
    const probPart = (tag, r) => (r && !r.err && r.reboundProb !== '' && r.reboundProb != null) ? tag + ' ' + r.reboundProb + '%' : '';
    const prob = [probPart('G', g), probPart('本', l)].filter(Boolean).join('・') || '–';
    let row = '<tr><td>' + (i + 1) + '</td><td><strong>' + esc(s.ticker) + '</strong></td><td class="ellipsis" title="' + esc(s.name) + '">' + esc(s.name) + '</td><td>' + esc(s.sector) + '</td>' +
      '<td class="num">' + num(s.price) + '</td><td class="num" style="color:#b3261e">' + (s.chgW == null ? '–' : s.chgW.toFixed(1) + '%') + '</td>' +
      '<td class="num">' + fmtMcap(s.mcap) + '</td><td>' + status + '</td><td>' + irr + '</td><td class="num">' + prob + '</td>' +
      '<td><button class="small secondary" data-lact="g" data-t="' + esc(s.ticker) + '">Gemini</button> ' +
      '<button class="small secondary" data-lact="l" data-t="' + esc(s.ticker) + '">本地</button> ' +
      '<button class="small secondary" data-lact="detail" data-t="' + esc(s.ticker) + '">比較</button></td></tr>';
    return row;
  }).join('');
}

function models() {
  const list = (SET.model || 'gemini-2.5-flash').split(',').map(x => x.trim()).filter(Boolean);
  if (!list.includes('gemini-2.5-flash-lite')) list.push('gemini-2.5-flash-lite');
  return list;
}

function buildBatchPrompt(batch, newsMap) {
  const lines = batch.map(s => {
    let line = '- ' + s.ticker + '（' + s.name + '，產業：' + (s.sector || '未知') + '）：本週漲跌 ' + (s.chgW == null ? '?' : s.chgW.toFixed(1)) + '%，現價 $' + s.price + '，市值約 ' + fmtMcap(s.mcap);
    const nw = newsMap && newsMap[s.ticker];
    if (nw) line += '\n  近期查證資訊：' + nw;
    return line;
  }).join('\n');
  const nowD = new Date();
  const today = nowD.getFullYear() + ' 年 ' + (nowD.getMonth() + 1) + ' 月 ' + nowD.getDate() + ' 日';
  return '今天是 ' + today + '。你是股票分析師，用第一性原理逐一分析以下美股本週（最近 7 天）大跌的原因。清單：\n' + lines +
    '\n【日期規則】新聞標題後括號內是該新聞的發布日期；dropCause 裡註明的消息日期必須照抄新聞的日期，或只寫相對時間（例如「本週」），嚴禁自行推測年份，絕對不要寫成過去的年份。' +
    '\n請先查明每檔本週下跌的實際原因（財報、指引、公司消息、產業、總經或資金面）。【資訊規則】有附查證資訊的，必須以其為主要依據，不得忽略另編原因；沒有附查證資訊的，dropCause 開頭必須寫「（無即時新聞可查）」，只能依股價表現做保守推測，嚴禁編造具體事件、數字或日期。然後只輸出一個 JSON 陣列，不要任何其他文字、不要 markdown 圍欄。陣列每檔一個物件，欄位：' +
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

async function fetchNews(s) {
  const name = (s.name || s.ticker).replace(/\b(Inc|Corp|Corporation|Ltd|Limited|PLC|SA|NV|AG|Co|Company|Holdings|Group)\b\.?/gi, '').trim();
  const fmt = (d) => d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + String(d.getSeconds()).padStart(2, '0');
  const now = new Date();
  const from = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  const win = '&mode=artlist&format=json&startdatetime=' + fmt(from) + '&enddatetime=' + fmt(now);
  async function gdelt(query, maxrecords, sort) {
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(query) + '&maxrecords=' + maxrecords + '&sort=' + sort + win;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const ctl = new AbortController();
        const to = setTimeout(() => ctl.abort(), 8000);
        const r = await fetch(url, { signal: ctl.signal });
        clearTimeout(to);
        if (r.ok) { const j = await r.json(); return j.articles || []; }
      } catch (e) { /* 失敗就重試一次 */ }
      if (attempt === 0) await sleep(6000);
    }
    return null;
  }
  function collect(arts, seen, out, cap) {
    for (const a of arts) {
      const t = (a.title || '').trim();
      if (!t || seen[t]) continue;
      seen[t] = 1;
      const d = (a.seendate || '').slice(0, 8);
      const ds = d.length === 8 ? d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8) : d;
      out.push(t + '（' + (a.domain || '') + '，' + ds + '）');
      if (out.length >= cap) break;
    }
  }
  const seen = {}, out = [];
  const a1 = await gdelt('"' + name + '"', 25, 'hybridrel');
  if (a1) collect(a1, seen, out, 6);
  if (out.length < 2) {
    await sleep(6000);
    const a2 = await gdelt(name, 10, 'datedesc');
    if (a2) collect(a2, seen, out, 6);
  }
  return out.join('；');
}

async function pingLocal() {
  try {
    const ep = (SET.localEndpoint || 'http://localhost:8080').replace(/\/+$/, '');
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 8000);
    const opts = { signal: ctl.signal };
    if (SET.localApiKey) opts.headers = { 'Authorization': 'Bearer ' + SET.localApiKey.trim() };
    const r = await fetch(ep + '/v1/models', opts);
    clearTimeout(to);
    return r.ok;
  } catch (e) { return false; }
}

async function localCall(prompt) {
  const ep = (SET.localEndpoint || 'http://localhost:8080').replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (SET.localApiKey) headers['Authorization'] = 'Bearer ' + SET.localApiKey.trim();
  let r;
  try {
    r = await fetch(ep + '/v1/chat/completions', { method: 'POST', headers: headers, body: JSON.stringify({ model: SET.localModel || 'local', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 4096 }) });
  } catch (e) { throw new Error('LOCALDOWN: ' + e.message); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('本地模型 ' + r.status + '：' + ((j.error && j.error.message) || ''));
  const text = ((((j.choices || [])[0] || {}).message || {}).content || '');
  if (!text) throw new Error('本地模型回覆空白');
  return { text: text, model: 'local:' + (SET.localModel || '') };
}

async function callLLM(batch, provider) {
  if (provider === 'local') {
    let newsMap = null;
    if (SET.localNews === 'web') {
      newsMap = {};
      for (const s of batch) newsMap[s.ticker] = await fetchWebNews(s);
    } else if (SET.localNews === 'gdelt') {
      newsMap = {};
      for (const s of batch) newsMap[s.ticker] = await fetchNews(s);
    }
    const out = await localCall(buildBatchPrompt(batch, newsMap));
    out.newsMap = newsMap;
    return out;
  }
  return geminiCall(buildBatchPrompt(batch));
}

async function fetchWebNews(s) {
  if (SET.tavilyKey && SET.tavilyKey.trim()) {
    try {
      const name = (s.name || s.ticker).replace(/\b(Inc|Corp|Corporation|Ltd|Limited|PLC|SA|NV|AG|Co|Company|Holdings|Group)\b\.?/gi, '').trim();
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 12000);
      const r = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal, body: JSON.stringify({ api_key: SET.tavilyKey.trim(), query: name + ' stock news', topic: 'news', days: 14, max_results: 6, search_depth: 'basic' }) });
      clearTimeout(to);
      if (r.ok) {
        const j = await r.json();
        const out = [];
        for (const a of (j.results || [])) {
          const t = (a.title || '').trim();
          if (!t) continue;
          let host = '';
          try { host = new URL(a.url).hostname.replace(/^www\./, ''); } catch (e) { /* 無法解析網址就留空 */ }
          const d = (a.published_date || '').slice(0, 10);
          const snip = (a.content || '').replace(/\s+/g, ' ').trim().slice(0, 220);
          out.push(t + '（' + host + (d ? '，' + d : '') + '）' + (snip ? '：' + snip : ''));
          if (out.length >= 5) break;
        }
        if (out.length) return '【網路搜尋】' + out.join('；');
      }
    } catch (e) { /* 搜尋失敗就退回 GDELT */ }
  }
  return fetchNews(s);
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

async function analyzeBatch(batch, provider) {
  const out = await callLLM(batch, provider);
  const map = parseBatch(out.text);
  const at = new Date().toISOString();
  for (const s of batch) {
    const f = map[String(s.ticker).toUpperCase()];
    const res = f ? Object.assign({ at: at, model: out.model }, f) : { at: at, model: out.model, raw: out.text };
    if (provider === 'local') res.news = (out.newsMap && out.newsMap[s.ticker]) || '';
    const slot = L.results[s.ticker] || (L.results[s.ticker] = {});
    slot[provider] = res;
    ARCH = ARCH.filter(a => !(a.date === todayStr() && a.ticker === s.ticker && (a.provider || provOfRes(a.res)) === provider));
    ARCH.push({ date: todayStr(), weekKey: L.weekKey, ticker: s.ticker, name: s.name, chgW: s.chgW, provider: provider, res: res });
    enqueueDoc({ date: todayStr(), time: new Date().toTimeString().slice(0, 5), ticker: s.ticker, name: s.name, chgW: s.chgW, provider: provider, model: res.model || '', cause: res.cause || '', category: res.category || '', irrational: res.irrational || '', reason: res.reason || '', reboundProb: (res.reboundProb === '' || res.reboundProb == null ? '' : res.reboundProb), keyPoints: res.keyPoints || '', raw: res.raw || '' });
  }
  saveJSON(LKEY, L);
  saveJSON(AKEY, ARCH);
  renderL(); updateLogView();
  flushDocQueue();
}

async function analyzeOne(s) { await analyzeBatch([s], SET.provider); }

async function runAnalysis() {
  if (running) return;
  if (SET.provider !== 'local' && (!SET.geminiKey || !SET.geminiKey.trim())) { alert('先在專區設定填 Gemini API Key 並儲存'); $('S_geminiKey').focus(); return; }
  if (!L.list.length) { alert('先載入本週大跌榜'); return; }
  if (SET.provider === 'local') {
    $('L_progress').textContent = '連線本地模型中…';
    const okPing = await pingLocal();
    if (!okPing) { $('L_progress').textContent = '連不上本地模型：確認 llama-server 已啟動、endpoint 位址正確，且是在跑 llama 的那臺電腦開這個網站。'; return; }
    $('L_progress').textContent = '';
  }
  const targets = L.list.filter(s => { const r = resOf(s.ticker, SET.provider); return !r || r.err; });
  if (!targets.length) { $('L_progress').textContent = '本週榜單已全部分析完'; return; }
  const batchSize = SET.provider === 'local' ? 1 : Math.max(1, parseInt(SET.batch, 10) || 5);
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
      await analyzeBatch(batch, SET.provider); okCount += batch.length;
    } catch (e) {
      if (/^LOCALDOWN:/.test(e.message) || /Failed to fetch/i.test(e.message)) { $('L_progress').textContent = '連不上本地模型，先停下：確認 llama-server 有開、位址正確、在同一臺電腦開網站。'; break; }
      if (/^QUOTA:/.test(e.message)) { $('L_progress').textContent = '所有模型的免費額度都用完了，剩下的明天按「開始分析」會接著跑。'; break; }
      if (/401|403|API key/i.test(e.message)) { $('L_progress').textContent = 'Gemini 金鑰有問題，先停下：' + e.message; break; }
      for (const s of batch) { const slot = L.results[s.ticker] || (L.results[s.ticker] = {}); slot[SET.provider] = { err: e.message, at: new Date().toISOString() }; }
      saveJSON(LKEY, L); renderL();
    }
    if (!stopFlag) await sleep(SET.provider === 'local' ? 1000 : 6500);
  }
  running = false;
  $('L_btnRun').disabled = false; $('L_btnStop').disabled = true;
  if (!stopFlag && okCount) $('L_progress').textContent = '本輪完成（新增 ' + okCount + ' 檔）。已分析 ' + doneCount(SET.provider) + ' / ' + L.list.length;
  renderL();
}

function buildLog(date) {
  const items = ARCH.filter(a => a.date === date);
  if (!items.length) return '';
  const order = [], byT = {};
  for (const a of items) {
    if (!byT[a.ticker]) { byT[a.ticker] = { name: a.name, chgW: a.chgW, entries: [] }; order.push(a.ticker); }
    byT[a.ticker].entries.push(a);
  }
  let md = '# 選股研究日誌 ' + date + '\n\n本週大跌股・第一性原理分析（Gemini／本地模型對照）\n';
  for (const t of order) {
    const g = byT[t];
    md += '\n## ' + t + ' ' + (g.name || '') + '（本週 ' + (g.chgW == null ? '?' : g.chgW.toFixed(1)) + '%）\n';
    for (const a of g.entries) {
      const r = a.res || {};
      const prov = a.provider || provOfRes(r);
      md += '\n### ' + (prov === 'local' ? '本地模型' : 'Gemini') + '（' + (r.model || '') + '）\n';
      if (r.raw) { md += '- 原始回覆（解析失敗，原文保留）：\n' + r.raw + '\n'; continue; }
      md += '- 下跌主因：' + (r.cause || '') + '\n';
      md += '- 分類：' + (r.category || '') + '\n';
      md += '- 市場不理性：' + (r.irrational || '') + ' — ' + (r.reason || '') + '\n';
      md += '- 反彈機率（1–3 個月漲回跌前價位）：' + (r.reboundProb === '' || r.reboundProb == null ? '–' : r.reboundProb + '%') + '\n';
      md += '- 觀察重點：' + (r.keyPoints || '') + '\n';
    }
  }
  return md;
}

function updateLogView() {
  const md = buildLog(todayStr());
  $('L_logView').textContent = md || '（今日尚無分析紀錄）';
}

/* ----- Google Doc 同步（Apps Script 橋接：每筆分析完成 append 進使用者自己的 Doc） ----- */
function enqueueDoc(payload) {
  DOCQ.push(payload);
  saveJSON(QKEY, DOCQ);
}

function docStatus(msg) { const el = $('L_docStatus'); if (el) el.textContent = msg; }

async function flushDocQueue(manual) {
  const url = (SET.docUrl || '').trim();
  if (!DOCQ.length) {
    if (manual) docStatus(url ? 'Google Doc：目前沒有待送紀錄' : 'Google Doc 未設定：先在專區設定貼上同步網址');
    return;
  }
  if (!url) { docStatus('Google Doc 未設定：' + DOCQ.length + ' 筆紀錄待送（設定貼上同步網址後會自動補送）'); return; }
  if (docFlushing) return;
  docFlushing = true;
  let sent = 0;
  while (DOCQ.length) {
    try {
      await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(DOCQ[0]) });
      DOCQ.shift(); sent++;
      saveJSON(QKEY, DOCQ);
    } catch (e) { break; }
  }
  docFlushing = false;
  if (DOCQ.length) docStatus('Google Doc 同步中斷：已送 ' + sent + ' 筆，剩 ' + DOCQ.length + ' 筆待補送（下次分析或按補送會再試）');
  else if (sent) docStatus('✅ 已記錄到 Google Doc（' + sent + ' 筆，' + new Date().toTimeString().slice(0, 8) + '）');
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
  if (btn.dataset.lact === 'detail') { showStockModal(s); return; }
  if (btn.dataset.lact === 'g' || btn.dataset.lact === 'l') {
    const prov = btn.dataset.lact === 'g' ? 'gemini' : 'local';
    if (prov === 'gemini' && (!SET.geminiKey || !SET.geminiKey.trim())) { alert('先在專區設定填 Gemini API Key 並儲存'); return; }
    if (prov === 'local' && !(await pingLocal())) { alert('連不上本地模型：確認 llama-server 有開、位址正確、在同一臺電腦開網站'); return; }
    btn.disabled = true; btn.textContent = '分析中…';
    try { await analyzeBatch([s], prov); }
    catch (err) { alert('分析失敗：' + err.message); }
    renderL();
  }
});
$('S_form').addEventListener('submit', (e) => {
  e.preventDefault();
  SET.provider = $('S_provider').value;
  SET.localEndpoint = $('S_localEndpoint').value;
  SET.localModel = $('S_localModel').value;
  SET.localApiKey = $('S_localApiKey').value;
  SET.tavilyKey = $('S_tavilyKey').value;
  SET.localNews = $('S_localNews').value;
  SET.geminiKey = $('S_geminiKey').value;
  SET.model = $('S_model').value || 'gemini-2.5-flash,gemini-2.5-flash-lite';
  SET.grounding = $('S_grounding').value;
  SET.batch = $('S_batch').value;
  SET.docUrl = $('S_docUrl').value.trim();
  saveJSON(SKEY, SET);
  $('S_status').textContent = '已儲存（' + new Date().toTimeString().slice(0, 8) + '）';
  flushDocQueue();
});
$('L_btnSync').addEventListener('click', () => { flushDocQueue(true); });
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

$('S_provider').value = SET.provider || 'gemini';
$('S_localEndpoint').value = SET.localEndpoint || 'http://localhost:8080';
$('S_localModel').value = SET.localModel || 'qwen3-coder-30b-a3b-instruct-q4_k_m.gguf';
$('S_localApiKey').value = SET.localApiKey || '';
$('S_tavilyKey').value = SET.tavilyKey || '';
$('S_localNews').value = SET.localNews || 'web';
$('S_btnTestLocal').addEventListener('click', async () => {
  const ep = $('S_localEndpoint').value.replace(/\/+$/, '');
  $('S_localStatus').textContent = '測試中…';
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 8000);
    const opts = { signal: ctl.signal };
    const key = $('S_localApiKey').value.trim();
    if (key) opts.headers = { 'Authorization': 'Bearer ' + key };
    const r = await fetch(ep + '/v1/models', opts);
    clearTimeout(to);
    const j = await r.json().catch(() => ({}));
    const ids = (j.data || []).map(m => m.id).join(', ');
    $('S_localStatus').textContent = r.ok ? ('✅ 連上了：' + (ids || '有回應')) : ('❌ 伺服器回應 ' + r.status);
  } catch (e) {
    $('S_localStatus').textContent = '❌ 連不上：' + e.message + '（確認 llama-server 有開、且在這臺電腦開網站）';
  }
});

$('S_geminiKey').value = SET.geminiKey || '';
$('S_model').value = SET.model || 'gemini-2.5-flash,gemini-2.5-flash-lite';
$('S_grounding').value = SET.grounding || '1';
$('S_batch').value = SET.batch || '5';
$('S_docUrl').value = SET.docUrl || '';
$('S_btnTestDoc').addEventListener('click', async () => {
  const url = $('S_docUrl').value.trim();
  const el = $('S_docStatus');
  if (!url) { el.textContent = '先貼上 Apps Script 網址並儲存設定'; return; }
  el.textContent = '送出測試中…';
  try {
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({ test: true, time: new Date().toTimeString().slice(0, 5) }) });
    el.textContent = '已送出測試 — 去你的 Google Doc 看看有沒有出現「✅ 連線測試」那行（沒出現的話檢查部署存取權是否為「任何人」）';
  } catch (e) {
    el.textContent = '❌ 連不上：' + e.message + '（檢查網址是否以 /exec 結尾、部署是否完成）';
  }
});
$('btnCopyGas').addEventListener('click', async () => {
  const btn = $('btnCopyGas');
  try { await navigator.clipboard.writeText($('gasCode').textContent); btn.textContent = '✅ 已複製，去 Apps Script 貼上'; }
  catch (e) { btn.textContent = '複製失敗：手動全選下方程式碼複製'; }
  setTimeout(() => { btn.textContent = '複製 Apps Script 腳本'; }, 3000);
});
renderL();
updateLogView();
flushDocQueue();

// ===== 詳情 / 比較彈窗 =====
function showModal(html) { $('modalContent').innerHTML = html; $('modalOverlay').style.display = 'flex'; }
function hideModal() { $('modalOverlay').style.display = 'none'; }
$('modalClose').addEventListener('click', hideModal);
$('modalOverlay').addEventListener('click', (e) => { if (e.target === $('modalOverlay')) hideModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideModal(); });

function analysisInner(res) {
  if (!res) return '<div>尚無分析</div>';
  let newsHtml = '';
  if (res.news !== undefined) {
    newsHtml = res.news
      ? '<div style="color:#5b6b7a;font-size:12.5px"><strong>本次餵入新聞：</strong>' + esc(res.news) + '</div>'
      : '<div style="color:#b3261e;font-size:12.5px"><strong>⚠️ 本次未抓到新聞，內容為模型依訓練資料推測，可信度低</strong></div>';
  }
  if (res.err) return '<div><strong>分析失敗：</strong>' + esc(res.err) + '</div>' + newsHtml;
  if (res.raw) return '<div>原始回覆（解析失敗，原文保留）：</div><div>' + esc(res.raw).replace(/\n/g, '<br>') + '</div>' + newsHtml;
  return '<div><strong>下跌主因：</strong>' + esc(res.cause || '') + '</div>' +
    '<div><strong>分類：</strong>' + esc(res.category || '') + '</div>' +
    '<div><strong>市場不理性：</strong>' + esc(res.irrational || '') + ' — ' + esc(res.reason || '') + '</div>' +
    '<div><strong>反彈機率：</strong>' + esc(res.reboundProb) + '%</div>' +
    '<div><strong>觀察重點：</strong>' + esc(res.keyPoints || '') + '</div>' +
    newsHtml +
    '<div style="color:#5b6b7a;font-size:12.5px">' + esc((res.at || '').slice(0, 16).replace('T', ' ')) + ' / ' + esc(res.model || '') + '</div>';
}

function showStockModal(s) {
  const g = resOf(s.ticker, 'gemini'), l = resOf(s.ticker, 'local');
  let h = '<h3>' + esc(s.ticker) + ' ' + esc(s.name) + '</h3>' +
    '<div>產業：' + esc(s.sector || '–') + '・現價 $' + num(s.price) + '・本週 ' + (s.chgW == null ? '–' : s.chgW.toFixed(1) + '%') + '・市值 ' + fmtMcap(s.mcap) + '</div>';
  if (g && l && !g.err && !l.err && !g.raw && !l.raw) {
    const same = (g.irrational || '') === (l.irrational || '');
    const dp = (typeof g.reboundProb === 'number' && typeof l.reboundProb === 'number') ? Math.abs(g.reboundProb - l.reboundProb) : null;
    h += '<div style="background:#eef2f6;border-radius:8px;padding:8px 12px;margin-top:10px"><strong>比較：</strong>不理性結論' +
      (same ? '相同' : '不同（Gemini：' + esc(g.irrational || '') + '／本地：' + esc(l.irrational || '') + '）') +
      (dp == null ? '' : '；反彈機率差 ' + dp + ' 個百分點') + '</div>';
  }
  h += '<div class="k">🤖 Gemini</div>' + analysisInner(g);
  h += '<div class="k">🖥️ 本地模型</div>' + analysisInner(l);
  showModal(h);
}

function showWatchModal(s) {
  const st = STATUS[s.status] || STATUS.watch;
  const row = (k, v) => '<div class="k">' + k + '</div><div>' + v + '</div>';
  const h = '<h3>' + esc(s.ticker) + ' ' + esc(s.name) + '</h3>' +
    '<div>產業：' + esc(s.sector || '–') + '・狀態：' + st[0] + '・評分：' + (s.score ? s.score + ' / 5' : '未評分') + '</div>' +
    row('現價 / 目標價', '$' + num(s.price) + ' / $' + num(s.target)) +
    row('營收成長 / EPS 成長', num(s.rev, '%') + ' / ' + num(s.eps, '%')) +
    row('毛利率 / ROE', num(s.gm, '%') + ' / ' + num(s.roe, '%')) +
    row('FCF / D/E', (s.fcf === '' || s.fcf == null ? '–' : '$' + esc(s.fcf) + 'M') + ' / ' + num(s.de)) +
    row('P/E / PEG', num(s.pe) + ' / ' + num(s.peg)) +
    row('下次財報', esc(s.earnings || '–')) +
    row('消息面 / 催化劑', esc(s.catalyst || '（無）')) +
    row('研究筆記', esc(s.notes || '（無）').replace(/\n/g, '<br>')) +
    row('更新時間', esc((s.updatedAt || '').slice(0, 10)));
  showModal(h);
}

function migrateResults() {
  let changed = false;
  for (const t of Object.keys(L.results || {})) {
    const r = L.results[t];
    if (r && !r.gemini && !r.local && (r.cause !== undefined || r.raw !== undefined || r.err || r.at)) {
      const prov = (provOfRes(r) === 'local' || /本地|LOCALDOWN/.test(r.err || '')) ? 'local' : 'gemini';
      L.results[t] = {}; L.results[t][prov] = r; changed = true;
    }
  }
  if (changed) saveJSON(LKEY, L);
}

migrateResults();
renderL();
updateLogView();
