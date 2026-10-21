# Stock Research 選股研究台

基本面為主、消息面為輔的選股研究整理網站。

- 網站：https://hebe2234.github.io/stock-research/
- 功能：watchlist 新增/編輯/刪除、基本面欄位（營收/EPS 成長、毛利率、ROE、FCF、D/E、P/E、PEG、自評 1-5 分）、消息面催化劑、下次財報日、研究筆記、搜尋與排序、JSON 匯出/匯入備份。
- 資料存在瀏覽器 localStorage（不上傳伺服器）；換裝置前先匯出備份。

## 本週大跌股專區（v2）

- 每週一鍵抓下跌最多的前 100 檔（TradingView 數據；NASDAQ/NYSE/AMEX、股價 ≥ $5、市值 ≥ $300M）。
- 按「開始分析」才啟動：Gemini（自備 AI Studio 免費 API Key，存在本機瀏覽器）逐一用第一性原理分析——下跌主因、分類、是否市場不理性、反彈機率（1–3 個月漲回跌前價位）、觀察重點。可中途停止，隔天接著跑未完成的。
- 每日分析結果自動彙成日誌（Markdown），設定 Drive OAuth Client ID 後自動同步到 Google Drive 的「Stock Research 日誌」資料夾；未設定時存本機並可下載。
- v2.1：批次分析（預設 5 檔/次）＋模型備援鏈，壓低 Gemini 免費額度消耗（flash 免費僅 20 次/日）。
- v2.2：分析來源可切「本地 llama.cpp」——OpenAI 相容 endpoint（預設 http://localhost:8080），無額度限制；本地模式分析前先抓 GDELT 近一週新聞標題餵入 prompt 補即時資訊。建議在跑 llama-server 的那臺電腦開本網站。

研究流程：每研究一檔就建一筆 → 基本面數字以最新財報為準 → 消息面記催化劑 → 評分與狀態自己拍板。本站只做資料整理，不構成投資建議。
