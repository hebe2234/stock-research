# Stock Research 選股研究台

基本面為主、消息面為輔的選股研究整理網站。版本紀錄見 [CHANGELOG.md](CHANGELOG.md)。

- 網站：https://hebe2234.github.io/stock-research/
- 功能：watchlist 新增/編輯/刪除、基本面欄位（營收/EPS 成長、毛利率、ROE、FCF、D/E、P/E、PEG、自評 1-5 分）、消息面催化劑、下次財報日、研究筆記、搜尋與排序、JSON 匯出/匯入備份。
- 資料存在瀏覽器 localStorage（不上傳伺服器）；換裝置前先匯出備份。

## 本週大跌股專區（v2）

- 每週一鍵抓下跌最多的前 100 檔（TradingView 數據；NASDAQ/NYSE/AMEX、股價 ≥ $5、市值 ≥ $300M）。
- 按「開始分析」才啟動：Gemini（自備 AI Studio 免費 API Key，存在本機瀏覽器）逐一用第一性原理分析——下跌主因、分類、是否市場不理性、反彈機率（1–3 個月漲回跌前價位）、觀察重點。可中途停止，隔天接著跑未完成的。
- 每日分析結果自動彙成日誌（Markdown，本機可下載）；另可同步到 Google Doc（見下）。
- v2.1：批次分析（預設 5 檔/次）＋模型備援鏈，壓低 Gemini 免費額度消耗（flash 免費僅 20 次/日）。
- v2.2：分析來源可切「本地 llama.cpp」——OpenAI 相容 endpoint（預設 http://localhost:8080），無額度限制；本地模式分析前先抓 GDELT 近一週新聞標題餵入 prompt 補即時資訊。建議在跑 llama-server 的那臺電腦開本網站。
- v2.4：日誌同步改走 **Google Doc**（取代原 Drive 資料夾 .md 作法，不再需要 Google Cloud OAuth Client ID）。機制：使用者自建一份 Google Doc，在文件內貼 `google-doc-sync.gs` 這段 Apps Script 並部署成網頁應用程式，把 /exec 網址貼回專區設定；之後每跑完一檔分析，網站就把該筆結果 POST 給腳本、append 進文件（含時間戳）。送出失敗的紀錄留在本機佇列，下次自動補送。（此作法後由 v3 的 GitHub 跨裝置同步取代。）
- v3.x：跨裝置同步改走私人 GitHub repo（data.json）；本地模式新聞升級 Tavily；分析 prompt 加日期／誠實／查證規則；結果管理（清空重跑）、反彈機率配色、摺疊設定群組。
- v3.6：大跌榜排序擴充（反彈機率 Gemini／本地、市值、現價）；**📌 追蹤專區**（勾選加入、加入日期與價格、自加入漲跌、刷新現價、TradingView 股價圖、跨日期分析日誌、區內重新分析，併入跨裝置同步）；**🤖 Gemini 選股**（彙整本週分析日誌給 Gemini 排名，可自訂檔數與條件，結果可直接加入追蹤）。
- v3.7：修刷新後榜單幾秒變回舊榜的同步 bug（改比抓取時間）；**📅 榜單日期切換**（每日快照、不限天數保留、可切任一日榜單檢視，舊榜唯讀＋當日分析顯示）；同步補全：除 API key 外所有資料（含追蹤、選股結果、榜單快照）皆存 GitHub。

研究流程：每研究一檔就建一筆 → 基本面數字以最新財報為準 → 消息面記催化劑 → 評分與狀態自己拍板。本站只做資料整理，不構成投資建議。
