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
