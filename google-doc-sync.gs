// Stock Research 研究台 → Google Doc 同步腳本
// 用法：開一份 Google Doc →「擴充功能 → Apps Script」→ 全選刪掉預設內容 → 貼上這整份 → 儲存
// →「部署 → 新增部署作業 → 網頁應用程式」→ 執行身分：我；存取權：任何人 → 部署
// → 複製 /exec 結尾的網址，貼回研究台的專區設定「Google Doc 同步網址」。
// 之後若有修改這份腳本，要到「部署 → 管理部署作業 → 編輯 → 版本：新版本」才會生效（網址不變）。

function doPost(e) {
try {
var d = JSON.parse(e.postData.contents);
var body = DocumentApp.getActiveDocument().getBody();
if (d.test) {
body.appendParagraph('✅ 連線測試（' + d.time + '）— Stock Research 研究台已接上這份文件');
body.appendHorizontalRule();
return ok_();
}
var chg = (d.chgW === null || d.chgW === undefined || d.chgW === '')? '?': Number(d.chgW).toFixed(1);
var head = body.appendParagraph('' + d.ticker + ' ' + (d.name || '') +
'（本週 ' + chg + '%）— ' + (d.provider === 'local'? '本地模型': 'Gemini') + '（' + (d.model || '') + '）');
head.setHeading(DocumentApp.ParagraphHeading.HEADING2);
if (d.raw) {
body.appendParagraph('原始回覆（解析失敗，原文保留）：');
body.appendParagraph(d.raw);
} else {
body.appendParagraph('下跌主因：' + (d.cause || ''));
body.appendParagraph('分類：' + (d.category || ''));
body.appendParagraph('市場不理性：' + (d.irrational || '') + ' — ' + (d.reason || ''));
var prob = (d.reboundProb === '' || d.reboundProb === null || d.reboundProb === undefined)? '–': d.reboundProb + '%';
body.appendParagraph('反彈機率（1–3 個月漲回跌前價位）：' + prob);
body.appendParagraph('觀察重點：' + (d.keyPoints || ''));
}
body.appendHorizontalRule();
} catch (err) {
// 靜默失敗：研究台端有待送佇列，之後會補送
}
return ok_();
}

function ok_() {
return ContentService.createTextOutput(JSON.stringify({ ok: true})).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
return ContentService.createTextOutput('Stock Research Doc Sync OK');
}
