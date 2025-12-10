# Combo Tools 使用手冊

## 系統概述

Combo Tools 是一個商品組合管理工具，用於管理商品的組合資料、白點位置標記，並支援與 Google Sheets 整合。本系統提供直觀的視覺化介面，讓您可以輕鬆管理商品組合的白點位置，並匯出為多種格式。

### 主要功能

- 📊 **資料匯入**：支援 CSV 和 JS 檔案匯入
- 🎯 **視覺化標記**：在商品圖片上拖曳設定白點位置
- 📤 **多格式匯出**：匯出為 CSV 或 JS 格式
- 🔄 **Google Sheets 整合**：雙向同步資料到 Google Sheets
- ⚙️ **彈性設定**：可自訂顯示選項

---

## 系統要求

### 環境變數設定

如需使用 Google Sheets 整合功能，請設定以下環境變數：

```env
# Google Sheets API 認證
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# API 端點設定
NEXT_PUBLIC_API_URL=http://localhost:3000/api
BASE_URL=https://www.mrliving.com.tw
MEDIA_URL=https://www.mrliving.com.tw/media
```

詳細的 Google Sheets API 設定步驟，請參閱 `GOOGLE_SHEETS_SETUP.md` 文件。

---

## 頁面導覽

### 1. 首頁 (Home)

首頁提供系統功能的快速導覽，包含兩個主要入口：

- **Edit Combo**：進入商品組合編輯頁面
- **View Production**：檢視產出結果

---

### 2. 編輯 Combo (Edit Combo)

這是系統的核心功能頁面，提供完整的商品組合管理功能。

#### 2.1 資料匯入

支援兩種匯入方式：

##### CSV 檔案匯入

**檔案格式要求：**

```csv
product_sku,prod_name,url,img,dot_skus,dot_pos
```

**欄位說明：**

- `product_sku`：主商品 SKU
- `prod_name`：商品名稱
- `url`：前台連結
- `img`：商品圖片網址
- `dot_skus`：分號分隔的白點商品 SKU 清單（選填，例如：`DOT001;DOT002;DOT003`）
- `dot_pos`：分號分隔的白點位置清單（格式：`top%:left%`，例如：`30.5%:45.2%;60.3%:20.1%`）

**匯入方式：**

1. 拖曳 CSV 檔案到上傳區域
2. 或點擊上傳區域選擇檔案

**範例：**

```csv
product_sku,prod_name,url,img,dot_skus,dot_pos
ABC123,測試商品,https://example.com/product.html,https://example.com/image.jpg,DOT001,DOT002,,,30.5%:45.2%,60.3%:20.1%,,
```

##### JS 檔案匯入

**檔案格式要求：**

```javascript
const allRecomComboData = [
  {
    name: "商品名稱",
    sku: "PRODUCT_SKU",
    img: "{{media url=catalog/product/image.jpg}}",
    dots: [
      {
        sku: "DOT_SKU_1",
        top: "30.5%",
        left: "45.2%",
        url: "{{store direct_url='product.html'}}"
      }
    ]
  }
];
```

**匯入方式：**

1. 拖曳 JS 檔案到上傳區域
2. 或點擊上傳區域選擇檔案

系統會自動：
- 解析檔案內容
- 從 API 取得商品名稱和網址
- 轉換為內部資料格式

#### 2.2 資料表格檢視

匯入資料後，會顯示可調整高度的資料表格，包含以下欄位：

- 商品名稱
- 商品 SKU
- 前台連結
- 白點商品 1~4 SKU

**表格功能：**

- **點擊複製**：點擊任一欄位即可複製內容
- **調整高度**：拖曳表格底部的控制條可調整表格高度
- **清除資料**：點擊右上角「Clear」按鈕清除所有資料

#### 2.3 視覺化編輯

視覺化區域提供直觀的圖形化介面，可以管理白點位置。

##### 顯示設定

點擊「Config」按鈕可開啟顯示選項選單：

- ☑️ **Show SKU**：顯示白點商品 SKU
- ☑️ **Show Name**：顯示白點商品名稱
- ☑️ **Show Position**：顯示白點位置座標

**特殊佈局：**

當三個選項都關閉時，系統會切換為簡潔模式：
- 主商品圖片擴展為全寬
- 白點商品以小圖示顯示於下方

##### 白點設定操作

**新增白點位置：**

1. 點擊尚未設定位置的白點商品（右側列表或底部小圖）
2. 圖片進入放置模式（顯示藍色遮罩和十字游標）
3. 在主商品圖片上點擊想要標記的位置
4. 白點會立即出現在該位置

**調整白點位置：**

1. 直接在主商品圖片上拖曳白點到新位置
2. 放開滑鼠後，位置會自動儲存
3. 拖曳時不會觸發整個頁面重新渲染，確保流暢度

**互動反饋：**

- **滑鼠懸停**：懸停在白點或商品項目上會產生雙向高亮效果
  - 懸停白點 → 右側對應商品高亮
  - 懸停商品 → 圖片上對應白點放大
- **拖曳中**：白點會放大並顯示藍色光暈
- **放置模式**：白點會以動畫脈衝效果提示

**觸控優化：**

- 白點的可點擊區域（48×48 像素）大於視覺大小（16×16 像素）
- 更容易在觸控裝置上操作

##### 位置格式

白點位置使用百分比表示，格式為：`top%:left%`

- `top`：從圖片頂部算起的百分比（0-100%）
- `left`：從圖片左側算起的百分比（0-100%）
- 範例：`30.50%:45.20%` 表示距離頂部 30.5%、距離左側 45.2% 的位置

#### 2.4 資料匯出

點擊右下角的浮動按鈕可執行匯出操作：

##### Export CSV

匯出為 CSV 格式檔案，包含所有商品資料和白點位置資訊。

**檔案命名格式：**

```
combo-data-YYYY-MM-DD.csv
```

**用途：**
- 備份資料
- 與其他系統交換資料
- 重新匯入此系統

##### Export JS

匯出為 JavaScript 格式檔案，適合直接用於前端程式碼。

**檔案命名格式：**

```
combo-data-YYYY-MM-DD.js
```

**檔案內容結構：**

```javascript
const allRecomComboData = [
  {
    name: "商品名稱",
    sku: "PRODUCT_SKU",
    img: "{{media url=catalog/product/image.jpg}}",
    dots: [
      {
        sku: "DOT_SKU",
        top: "30.5%",
        left: "45.2%",
        url: "{{store direct_url='product.html'}}"
      }
    ]
  }
];
```

**功能特點：**
- 自動從 API 取得白點商品的 URL
- URL 轉換為 Magento 模板格式 `{{store direct_url='...'}}`
- 可直接嵌入前端程式碼使用

#### 2.5 Google Sheets 整合

##### Pull Sheet（拉取資料）

從 Google Sheets 拉取資料並取代目前的前端資料。

**操作步驟：**

1. 點擊「Pull Sheet」按鈕
2. 系統會使用在「設定」頁面配置的 Spreadsheet ID 和 Sheet Name
3. 如未設定，系統會彈出提示要求輸入
4. 成功後會顯示拉取的資料筆數

**注意事項：**
- 此操作會覆蓋目前的前端資料
- 建議在拉取前先匯出備份

##### Update Sheet（更新試算表）

將目前的資料上傳到 Google Sheets，取代試算表內容。

**操作步驟：**

1. 點擊「Update Sheet」按鈕
2. 系統會將資料轉換為 CSV 格式
3. 清除 Google Sheet 的舊資料
4. 寫入新資料

**資料格式：**

試算表會包含以下欄位（與 CSV 匯出格式相同）：
```
product_sku | prod_name | url | img | dot_skus | dot_pos
```

---

### 3. 檢視產出 (View Production)

用於檢視爬取後的商品圖片和白點位置。

#### 功能說明

##### Scrape（爬取）

根據目前的資料列（rows），爬取商品頁面的圖片和白點資訊。

**操作步驟：**

1. 先在 Edit Combo 頁面匯入資料
2. 切換到 View Production 頁面
3. 點擊「Scrape」按鈕
4. 等待爬取完成

##### 圖片篩選

使用篩選按鈕可以快速篩選結果：

- **All**：顯示所有結果
- **With image**：只顯示有圖片的項目
- **No image**：只顯示沒有圖片的項目

#### 圖片卡片

每張卡片顯示：
- 商品圖片（包含白點標記）
- 商品標題或網址

---

### 4. 設定 (Settings)

配置 Google Sheets 相關設定。

#### Google Sheets Configuration

##### Spreadsheet ID（試算表 ID）

**如何取得：**

1. 開啟您的 Google Sheet
2. 查看網址列，格式如下：
   ```
   https://docs.google.com/spreadsheets/d/[YOUR_SHEET_ID]/edit#gid=0
   ```
3. 複製 `/d/` 和 `/edit` 之間的字串
4. 貼入「Spreadsheet ID」欄位

**範例：**
```
網址：https://docs.google.com/spreadsheets/d/1abc123XYZ456/edit#gid=0
ID：1abc123XYZ456
```

##### Sheet Name（工作表名稱）

輸入要操作的工作表分頁名稱，例如：`Sheet1`、`商品資料`

**注意事項：**
- 名稱必須完全符合（區分大小寫）
- 不可為空

##### 儲存設定

點擊「Save Configuration」按鈕儲存設定。

**設定儲存位置：**
- 設定會儲存在瀏覽器的 localStorage
- 每個瀏覽器需個別設定
- 清除瀏覽器資料會清除設定

---

## 工作流程範例

### 情境一：從 CSV 建立新的商品組合

1. **準備 CSV 檔案**
   ```csv
   product_sku,prod_name,url,img,dot_skus,dot_pos
   MAIN001,沙發組合,https://example.com/sofa.html,,DOT001,DOT002,,,,,
   ```

2. **匯入資料**
   - 前往 Edit Combo 頁面
   - 拖曳 CSV 檔案到上傳區域
   - 等待系統處理完成

3. **設定白點位置**
   - 在視覺化區域找到商品卡片
   - 點擊尚未設定位置的白點商品（DOT001）
   - 在主商品圖片上點擊想要標記的位置
   - 重複步驟標記 DOT002

4. **調整白點位置**
   - 如果位置不準確，直接拖曳白點到正確位置

5. **匯出結果**
   - 點擊「Export CSV」儲存為檔案
   - 或點擊「Update Sheet」上傳到 Google Sheets

### 情境二：從 Google Sheets 編輯現有資料

1. **設定 Google Sheets**
   - 前往 Settings 頁面
   - 輸入 Spreadsheet ID 和 Sheet Name
   - 儲存設定

2. **拉取資料**
   - 前往 Edit Combo 頁面
   - 點擊「Pull Sheet」按鈕
   - 確認資料已載入

3. **編輯白點位置**
   - 在視覺化區域調整白點位置
   - 使用拖曳功能微調

4. **更新回 Google Sheets**
   - 點擊「Update Sheet」按鈕
   - 確認更新成功訊息

### 情境三：從 JS 檔案匯入並匯出

1. **匯入 JS 檔案**
   - 前往 Edit Combo 頁面
   - 拖曳 JS 檔案到右側上傳區域
   - 系統自動解析並取得商品資訊

2. **檢查資料**
   - 查看資料表格確認商品資訊正確
   - 在視覺化區域確認圖片和白點

3. **調整後匯出**
   - 調整需要修改的白點位置
   - 點擊「Export JS」匯出新檔案
   - 或點擊「Export CSV」轉換為 CSV 格式

---

## 常見問題

### Q1：匯入 CSV 後沒有顯示主商品圖片？

**A1：** 這是正常的。如果 CSV 的 `img` 欄位為空，系統會自動使用 `product_sku` 從 API 取得圖片。請稍等幾秒讓系統完成抓取。

### Q2：白點商品顯示「No img」？

**A2：** 可能的原因：
- 商品 SKU 不存在於系統中
- 該商品沒有設定圖片
- API 連線失敗

建議檢查 SKU 是否正確，或查看右側列表是否有「(Not found)」標記。

### Q3：如何批次修改多個商品的白點位置？

**A3：** 目前需要逐一調整。建議流程：
1. 調整第一個商品的白點位置
2. 匯出 CSV
3. 用試算表軟體批次複製位置資料
4. 重新匯入修改後的 CSV

### Q4：Google Sheets 更新失敗？

**A4：** 請檢查：
- 環境變數 `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL` 和 `GOOGLE_SHEETS_PRIVATE_KEY` 是否正確設定
- Service Account 是否有該試算表的編輯權限
- Sheet Name 是否完全符合（區分大小寫）
- 試算表是否存在

### Q5：白點位置不準確？

**A5：** 白點位置使用百分比計算，會隨圖片大小等比縮放。如果位置不準：
- 嘗試拖曳白點微調
- 確認圖片已完全載入後再設定位置
- 使用較大的視窗檢視，以獲得更精確的點擊

### Q6：如何備份資料？

**A6：** 有三種方式：
1. **Export CSV**：匯出為 CSV 檔案儲存於本機
2. **Update Sheet**：上傳到 Google Sheets 雲端備份
3. **Export JS**：匯出為 JS 檔案（適合程式碼部署）

建議定期使用 Export CSV 或 Update Sheet 備份。

### Q7：可以同時編輯多個商品組合嗎？

**A7：** 可以。系統一次可載入多筆資料，在視覺化區域會以卡片形式排列，每張卡片可獨立編輯。

### Q8：白點數量有限制嗎？

**A8：** 目前系統支援每個主商品最多 4 個白點（dot1 ~ dot4）。如需更多白點，需要修改系統程式碼。

### Q9：拖曳白點時頁面會卡頓？

**A9：** 系統已優化拖曳效能，使用本地狀態避免重新渲染整個頁面。如果仍有卡頓：
- 檢查是否載入過多資料（建議單次處理 50 筆以內）
- 關閉不必要的瀏覽器分頁
- 使用較新版本的瀏覽器

### Q10：側邊欄如何收合？

**A10：** 
- **收合**：點擊側邊欄標題列右側的 ✕ 按鈕
- **展開**：點擊左上角的選單 ☰ 按鈕

---

## 技術規格

### 支援的檔案格式

#### CSV 格式

- 編碼：UTF-8
- 分隔符號：逗號 (,)
- 必要欄位：`product_sku`
- 選填欄位：`prod_name`, `url`, `img`, `dot_skus`, `dot_pos`

#### JS 格式

- 檔案類型：JavaScript / Text
- 結構：必須包含 `allRecomComboData` 陣列變數
- 物件屬性：
  - `sku`（必要）
  - `name`（選填）
  - `img`（選填）
  - `dots`（選填陣列）

### 位置資料格式

白點位置使用字串格式，支援以下寫法：

- 完整格式：`"30.5%:45.2%"` （top:left）
- 只有 top：`"30.5%:"` 或 `"30.5%"`
- 只有 left：`":45.2%"`

數值會保留兩位小數，範圍 0-100%。

### API 端點

系統使用以下 API 端點：

- `POST /api/upload`：CSV 檔案上傳
- `POST /api/products/list`：取得商品資訊
- `POST /api/scrape`：爬取商品頁面
- `POST /api/google-sheets/update`：更新 Google Sheet
- `GET /api/google-sheets/get`：取得 Google Sheet 資料

### 瀏覽器相容性

建議使用以下瀏覽器：

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 系統架構

### 前端技術

- **框架**：Next.js 14+ (React 19)
- **狀態管理**：Zustand
- **UI 元件**：DaisyUI + Tailwind CSS
- **圖示**：Lucide React
- **通知**：React Hot Toast

### 後端技術

- **API Routes**：Next.js API Routes
- **爬蟲**：Playwright
- **Google Sheets**：googleapis

### 資料流程

1. **匯入階段**
   ```
   CSV/JS 檔案 → /api/upload → 解析 → Zustand Store → UI 顯示
   ```

2. **編輯階段**
   ```
   使用者互動 → 更新 Zustand Store → 即時反映到 UI
   ```

3. **匯出階段**
   ```
   Zustand Store → 格式轉換 → 產生檔案 → 下載
   ```

4. **Google Sheets 同步**
   ```
   Pull: Google Sheets API → /api/google-sheets/get → Zustand Store
   Push: Zustand Store → /api/google-sheets/update → Google Sheets API
   ```

---

## 進階使用技巧

### 技巧一：快速批次設定位置

如果多個商品的白點位置相似：

1. 設定第一個商品的白點位置
2. 匯出 CSV
3. 用試算表軟體複製 `dot_pos` 欄位到其他列
4. 重新匯入 CSV
5. 微調個別位置差異

### 技巧二：利用顯示設定優化工作流程

編輯時建議設定：
- 開啟所有顯示選項（SKU、Name、Position）以便確認資料
- 完成後關閉所有選項切換為簡潔模式預覽最終效果

### 技巧三：鍵盤快捷操作

- 複製資料：直接點擊表格儲存格
- 清除資料：使用 Clear 按鈕而非手動刪除
- 調整表格高度：拖曳比滾動更方便查看大量資料

### 技巧四：使用 Google Sheets 作為資料庫

將 Google Sheets 作為中央資料庫：
- 團隊成員各自 Pull Sheet 下載資料
- 在本地編輯調整
- 確認無誤後 Update Sheet 上傳
- 其他成員再次 Pull Sheet 取得最新版本

### 技巧五：視覺化區域佈局切換

善用 Config 設定切換佈局：
- **編輯模式**：開啟所有顯示選項，使用並排佈局方便調整
- **預覽模式**：關閉所有顯示選項，主圖全寬顯示接近實際效果

---

## 維護與更新

### 清除快取資料

如遇到異常，可嘗試清除瀏覽器 localStorage：

1. 開啟瀏覽器開發者工具（F12）
2. 切換到 Application / Storage 分頁
3. 展開 Local Storage
4. 刪除相關項目：
   - `combo-tools-config`
   - `google-sheets-config`

### 環境變數更新

修改環境變數後需要重新啟動應用程式：

```bash
# 開發環境
npm run dev

# 正式環境
npm run build
npm start
```

### 資料遷移

如需更換 Google Sheet：

1. 在新的 Google Sheet 授予 Service Account 編輯權限
2. 前往 Settings 頁面更新 Spreadsheet ID
3. 執行 Pull Sheet 測試連線
4. 使用 Update Sheet 上傳現有資料

---

## 授權與支援

### 版權資訊

© 2025 Combo Tools. All rights reserved.

### 技術支援

如遇到問題或需要協助，請聯繫系統管理員。

### 版本資訊

- 目前版本：1.0.0
- 最後更新：2025-11-12

---

## 附錄

### A. CSV 欄位對照表

| 欄位名稱 | 說明 | 必填 | 範例 |
|---------|------|-----|------|
| product_sku | 主商品 SKU | ✓ | `MAIN001` |
| prod_name | 商品名稱 | | `沙發組合` |
| url | 前台連結 | | `https://example.com/product.html` |
| img | 商品圖片網址 | | `https://example.com/image.jpg` |
| dot_skus | 白點商品 SKU 清單 | | `DOT001;DOT002;DOT003;DOT004` |
| dot_pos | 白點位置清單 | | `30.5%:45.2%;60.3%:20.1%;50%:50%;80%:30%` |

### B. JS 物件結構

```typescript
interface ComboData {
  name: string;          // 商品名稱
  sku: string;           // 主商品 SKU
  img: string;           // 圖片路徑（Magento 格式）
  dots: DotProduct[];    // 白點商品陣列
}

interface DotProduct {
  sku: string;           // 白點商品 SKU
  top: string;           // 頂部位置（百分比）
  left: string;          // 左側位置（百分比）
  url?: string;          // 商品連結（Magento 格式）
}
```

### C. Magento 模板格式

系統匯出的 JS 檔案使用 Magento 模板格式：

**圖片路徑：**
```
{{media url=catalog/product/cache/912f4218b83600a6f47af6c76f1f9667/path/to/image.jpg}}
```

**商品連結：**
```
{{store direct_url='product-name.html'}}
```

### D. 鍵盤快捷鍵

目前系統未實作鍵盤快捷鍵，所有操作需使用滑鼠/觸控。

---

**文件結束**

如有任何疑問或建議，歡迎回饋給開發團隊。

