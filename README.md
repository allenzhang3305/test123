# 產品組合指南管理器

## 環境需求

### Node.js v24

本專案需要 **Node.js v24**。建議使用 [nvm](https://github.com/nvm-sh/nvm)（Node 版本管理器）來管理 Node.js 版本。

#### 安裝 nvm（如果尚未安裝）

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

然後重新啟動終端機，或執行：

```sh
source ~/.nvm/nvm.sh
```

#### 安裝並使用 Node.js v24

```sh
nvm install 24
nvm use 24
```

驗證安裝：

```sh
node -v
# 應該輸出 v24.x.x
```

### pnpm

更多安裝選項請參考：https://pnpm.io/installation

驗證安裝：

```sh
pnpm -v
```

## 設定步驟

1. 將 `.env.example` 複製為 `.env.local` 並設定環境變數：

```sh
cp .env.example .env.local
```

2. 安裝依賴套件：

```sh
pnpm i
```

3. (僅開發時)啟動伺服器：

```sh
pnpm dev
```

4. （僅部署時）啟動伺服器：

```sh
pnpm run build
pnpm run start
```
