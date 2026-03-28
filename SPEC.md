# 萬象 2.0 (Fatexi) — 規格書

## 1. Concept & Vision

**定位**：全球首款量化命理趨勢分析平台

萬象 2.0 是一個將東西方命理體系數值化的「命理交易所」。用戶看到的不是占卜話術，而是清楚標記在 K 線圖上的運勢曲線——像操盤手一樣看待自己的命運。

品牌調性：**賽博玄學 (Cyber-Occultism)** — 深色背景 + 霓虹光 + 技術圖表。

## 2. Design Language

### Color Palette
- Background: `#030308` (深空黑)
- Surface: `#0D0D1A` (面板背景)
- Neon Cyan: `#00D4FF`
- Neon Pink: `#FF006E`
- Up/Green: `#00FF88`
- Down/Red: `#FF3366`
- Text: `#E0E0E0` / `#9999AA` / `#666680`

### Typography
- UI: Inter (Google Fonts) — 英文本體
- Numbers/Data: JetBrains Mono (等寬)
- Mobile-first: 最小 body 16px

### Motion
- fade-up 進場動畫
- Fatexi Ball 脈動
- 卡片揭示動畫

## 3. Routes

| Route | Description |
|-------|-------------|
| `/` | 行銷落地頁 |
| `/register` | 註冊流程（3步） |
| `/onboarding` | 理論分析 Intro（姓名/八字/五行/星座） |
| `/dashboard` | 萬象運命圖 — 主儀表板 |
| `/trend` | K線趨勢分析 |
| `/interpret` | AI 解讀器 |
| `/compass` | 萬象羅盤 |

### User Flow
1. 訪問 `/` → 了解產品
2. 點 CTA → `/register`
3. 填寫姓名/出生/地點 → `/onboarding`
4. 看理論分析（姓名學、八字、五行、星座）→ 進入
5. `/dashboard` — 萬象運命圖

## 4. Features

### 落地頁 (`/`)
- Hero + CTA
- 功能展示卡片
- 使用流程
- Footer

### 註冊 (`/register`)
- 3步引導式表單
- Step 1: 姓名
- Step 2: 出生年月日時（時辰）+ 性別
- Step 3: 居住地

### Onboarding (`/onboarding`)
- 姓名學分析卡片
- 八字分析卡片
- 五行分析卡片（帶 bars）
- 星座分析卡片
- 「進入萬象運命圖」按鈕

### 命運圖 (`/dashboard`)
- Fatexi Ball（根據分數變形發光）
- 四大指標：財富/事業/感情/能量
- AI 導語
- 快速連結

### K線 (`/trend`)
- 時/日/週/月/年 切換
- K線蠟燭 + MA5/MA10 均線
- 點擊查看詳細

### AI 解讀 (`/interpret`)
- 理論溯源（八字/占星/紫微）
- 宜忌清單
- 對話式諮詢

### 羅盤 (`/compass`)
- SVG 羅盤
- 四方位卡片（財富/事業/愛情/健康）

## 5. Technical

- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS v4
- Charts: Recharts
- AI: DeepSeek（待串接）
- Fonts: Inter + JetBrains Mono
- Deployment: Vercel
- State: localStorage（目前無後端）
