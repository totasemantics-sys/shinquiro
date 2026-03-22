# プロジェクト完全仕様書 - SHINQUIRO v4

**最終更新日**: 2026年3月22日
**バージョン**: 4.0

---

## 1. プロジェクト概要

### 基本情報
| 項目 | 内容 |
|------|------|
| 名称 | SHINQUIRO（シンキロウ） |
| 目的 | 大学受験英語長文の検索・分析システム |
| 対象ユーザー | 教師・塾講師・受験生 |
| ホスティング | Netlify |

### 技術スタック
| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16.1.3 (App Router) |
| UI | React 19.2.0, Tailwind CSS 4 |
| アイコン | Lucide React |
| CSV処理 | PapaParse |
| Markdown | react-markdown |

---

## 2. 画面構成

### 画面一覧

| # | 画面名 | パス | 主な機能 |
|---|--------|------|----------|
| 1 | トップページ | `/` | サイトのハブ。各機能への導線 |
| 2 | 大学検索 | `/unilist` | 大学を条件で絞り込み、大学別ページへ遷移 |
| 3 | 試験検索 | `/exam` | 試験形式・条件で大問・試験を検索 |
| 4 | 長文詳細検索 | `/search` | 長文の絞り込み検索 |
| 5 | 大問詳細ページ | `/mondai/[識別名]` | 大問の詳細情報・重要単語 |
| 6 | 大学別一覧ページ | `/university/[大学コード]` | 大学ごとの過去問一覧 |
| 7 | 単語検索・比較 | `/words` | 単語帳での掲載状況確認・大学別検索 |
| 8 | 記事一覧 | `/articles` | 記事のカテゴリ別一覧 |
| 9 | 記事詳細 | `/articles/[slug]` | 記事本文の表示 |
| 10 | 本文レベル説明 | `/about/passage-levels` | レベル基準の説明 |
| 11 | 設問形式説明 | `/about/question-formats` | 各設問形式の説明 |

### サイト構成図

```
トップページ（/）
├── 大学検索（/unilist）
│   └── 大学別一覧（/university/[code]）
│       └── 大問詳細（/mondai/[id]）
├── 試験検索（/exam）
│   └── 大問詳細（/mondai/[id]）※長文問題のみ
├── 長文詳細検索（/search）
│   ├── 大問詳細（/mondai/[id]）
│   └── 大学別一覧（/university/[code]）
├── 単語検索（/words）
├── 記事一覧（/articles）
│   └── 記事詳細（/articles/[slug]）
└── About系（/about/...）
```

---

## 3. 各画面の詳細仕様

### 3.0 トップページ (`app/page.js`)

#### 概要
サイト全体のハブとして、各機能への導線を提供するランディングページ。

#### レイアウト構成

**上部: 今日の難単語バー**（max-w-[450px] mx-auto）
- Sparklesアイコン（amber）＋「今日の難単語」ラベル（左固定）
- 単語名（text-xl font-bold）＋出典テキスト（年度・大学名・学部、中央揃え）
- 「意味を見る」ボタン（右固定）
- keywords.csvから修練/上級レベルの単語を日付ハッシュで日替わり選択
- モーダル: 単語名・品詞・意味（熟語記法対応）・出現大問・単語帳掲載状況

**中段: 3カラムグリッド**（lg:grid-cols-3、スマホは1列積み）

**左カラム: 名称から検索**
- 「大学名で検索」: テキスト入力＋GOボタン → `/unilist?q=XXX`
  - 入力中にサジェスト表示（最大8件）、クリックで直接 `/university/[コード]` へ
- 「地方を選ぶ」: 11地方ボタン → `/unilist?region=XXX`
  - 北海道/東北/北関東/南関東/甲信越/北陸/東海/関西/中国/四国/九州・沖縄
- 下部ショートカット: 「国公立大学をすべて見る」「私立大学をすべて見る」ボタン

**中央カラム: 形式から検索**
- 試験区分（国公立/私立トグル）
- 📖 リーディング: 日本語記述 / 英語記述（各 あり/どちらでも/なし）
- ✏️ ライティング: あり/どちらでも/なし（「あり」で英作文タイプ選択可）
- 🎧 リスニング: あり/どちらでも/なし（「あり」で解答形式選択可）
- 📝 文法問題: あり/どちらでも/なし（「あり」で問題タイプ選択可）
- 「条件に合う試験を表示」ボタン → `/exam?tab=exam&...` へURLパラメータ付きで遷移
- 「長文をもっと詳細に検索 →」リンク → `/search`

**右カラム: 単語検索**
- 「単語を調べる」: テキスト入力＋GOボタン → `/words?q=XXX`
- `<hr>` 区切り
- 「単語帳比較」: 3つのプルダウン（単語帳選択）＋「比較する」ボタン → `/words?mode=compare&book1=...`
- `<hr>` 区切り
- 「大学別検索」: テキスト入力＋GOボタン → `/words?mode=university&univ=XXX`
  - 入力中にサジェスト表示（マスタデータに存在する大学名のみ有効）

#### IMEキー問題対策
- テキスト入力にEnterで検索する場合、日本語IME変換確定のEnterを誤検知しないよう `onCompositionStart/End` + `useRef(false)` でフラグ管理

---

### 3.1 大学検索 (`app/unilist/page.js`)

#### 概要
大学・短大・専門学校などを条件で絞り込み、大学別ページへ遷移する画面。

#### URLパラメータ（外部から状態を渡せる）
| パラメータ | 説明 | 例 |
|-----------|------|-----|
| `q` | 名称の部分一致検索文字列 | `?q=東京` |
| `category` | 試験区分（「国公立」「私立」） | `?category=国公立` |
| `region` | 地方名 | `?region=南関東` |

#### タブ構成
- **大学検索**: 国公立・私立大学を検索
- **共通テスト・その他試験**: 共通テスト・資格試験を一覧表示

#### フィルター（大学検索タブ）
| フィルター | 説明 |
|-----------|------|
| 名称 | テキスト入力で部分一致フィルタ |
| 区分 | 国公立 / 私立（複数選択可） |
| 地方 | 11地方ボタン（複数選択可） |
| 医学部 | すべて / あり / なし |

#### 結果一覧
- 区分バッジ（固定幅3.5rem）・地方バッジ（固定幅5.5rem）・大学名・医バッジの横並び
- 件数表示
- クリックで `/university/[コード]` へ遷移

---

### 3.2 試験検索 (`app/exam/page.js`)

#### 概要
試験の形式・条件で大問・試験全体を検索できる画面。2タブ構成。

#### URLパラメータ（外部から状態を渡せる）
| パラメータ | 説明 |
|-----------|------|
| `tab` | `mondai` / `shiken` |
| `category` | 試験区分（パイプ区切り複数可: `国公立\|私立`） |
| `reading_jp` | 日本語記述: `あり`/`なし`/`どちらでも` |
| `reading_en` | 英語記述: `あり`/`なし`/`どちらでも` |
| `writing` | ライティング: `あり`/`なし`/`どちらでも` |
| `writing_type` | 英作文タイプ（パイプ区切り複数可） |
| `listening` | リスニング: `あり`/`なし`/`どちらでも` |
| `listening_type` | 解答形式（パイプ区切り複数可） |
| `grammar` | 文法: `あり`/`なし`/`どちらでも` |
| `grammar_type` | 問題タイプ（パイプ区切り複数可） |

#### 「大問で探す」タブ

**フィルター**:
- 共通: 試験区分（国公立/私立/共通テスト/資格）
- 問題タイプ（1つ選択）: ライティング / リスニング / 文法
- 各タイプ固有のサブフィルター（複数選択可）

**結果表示**:
- 条件に合う大問をフラットにリスト表示
- 各行: 試験区分バッジ / 大学名 / 年度 / 問題タイプ固有情報
- **長文問題（reading）で識別名が存在する場合**: 行がクリッカブルになり `/mondai/[識別名]` へ新規タブで遷移（ExternalLinkアイコン表示）
- モバイル: `flex-col`で縦積み表示（横切れ防止）

#### 「試験で探す」タブ

**フィルター**:
- 共通: 試験区分・年度
- リーディング: 合計語数下限/上限、日本語記述、英語記述
- ライティング: あり/どちらでも/なし（「あり」選択時のみ英作文タイプ選択可）
- リスニング: あり/どちらでも/なし（「あり」選択時のみ解答形式選択可）
- 文法: あり/どちらでも/なし（「あり」選択時のみ問題タイプ選択可）

**結果表示**:
- 試験単位のカード表示
- ヒットした大問をハイライト（`bg-emerald-50 border-emerald-200`）
- **長文問題で識別名が存在する場合**: 行がクリッカブルになり `/mondai/[識別名]` へ新規タブで遷移

---

### 3.3 長文詳細検索 (`app/search/page.js`)

#### 概要
長文データを多角的に絞り込み検索できるメイン検索画面。

#### フィルター機能一覧

| フィルター名 | 入力形式 | 複数選択 | 説明 |
|-------------|----------|----------|------|
| 試験区分 | ボタン | ✅ | 国公立/私立/共通テスト/資格 |
| 大学名・試験名 | テキスト（サジェスト付き） | - | 大学名で絞り込み |
| 年度 | ドロップダウン×2 | - | 開始年〜終了年の範囲指定 |
| 本文語数 | レンジスライダー×2 | - | 0〜1500語の範囲指定 |
| 本文レベル | ボタン | ✅ | S/A/B/C/D |
| ジャンル | ボタン | - | 単一選択 |
| ハッシュタグ | モーダル検索 | ✅ | AND/OR切替可能 |
| 文章記述(日) | 3択ボタン | - | 必須/どちらでも/除外 |
| 文章記述(英) | 3択ボタン | - | 必須/どちらでも/除外 |
| 設問カテゴリ | ボタン | ✅ | 選択/文章記述(日)/文章記述(英)/短答記述 |
| 設問形式 | ボタン | ✅ | 内容一致/正誤判定/英文和訳など |
| 知識・文法 | モーダル検索 | ✅ | 関係代名詞/不定詞/倒置など |
| フリーワード | テキスト | - | 大学名/学部/ジャンル/ハッシュタグを横断検索 |

#### フィルタリングロジック（重要）
```
設問カテゴリ・設問形式・知識文法は「同一設問でAND条件」
例: 「選択」かつ「内容一致」かつ「関係代名詞」を含む設問がある大問のみ表示
```

#### ソート機能
- 年度順（新しい/古い）
- 語数順（多い/少ない）
- 本文レベル順（難しい/易しい）

#### UI要素
- **スクロール時固定バー**: 現在の検索条件を表示
- **左下固定**: ヒット数表示（緑ボーダー、点滅アニメーション）
- **50件ずつ表示**: 「さらに50件表示」ボタン

---

### 3.4 大問詳細ページ (`app/mondai/[id]/page.js`)

#### 概要
個別の大問について詳細情報を表示。重要単語のチェック機能付き。

#### セクション構成

1. **パンくずリスト**
2. **基本情報テーブル**（本文語数/レベル/設問数/ジャンル/ハッシュタグ/出典/Amazon）
3. **設問構成テーブル**（設問名/カテゴリ/形式/知識文法）
4. **講評・ポイント**（`/public/reviews/[識別名].md` から読み込み）
5. **「データの修正を依頼」リンク**（Googleフォームへ新規タブ）
6. **重要単語セクション**
7. **単語帳掲載状況セクション**

#### 重要単語機能

**モード切替**: 一覧 / チェック

**レベル振り分けロジック**:
- 同じ単語が複数レベルに存在する場合:
  - **一覧**: それぞれのレベルに別々に表示
  - **チェック**: 1回のみ出題（全レベルの意味をピンクハイライト表示）
- `filterKeywordsByLevelsUnique()`: 単語単位でユニーク化

**一覧モード**:
- 品詞フィルタ（動詞/名詞/形容詞副詞/その他）
- レベル別グループ化、グリッド表示（PC: 4列、スマホ: 2列）
- 熟語記法対応

**チェックモード**:
- レベル選択画面 → 単語チェック → 結果画面の3ステップ
- 「この大問で出題された意味のみをチェック」トグル（bg-pink-300、デフォルトOFF）
- 熟語記法対応

---

### 3.5 大学別一覧ページ (`app/university/[code]/page.js`)

#### 概要
特定の大学の過去問を一覧表示。**デフォルト表示タブは「試験形式」**。

#### タブ構成
- **試験形式**: 試験形式の条件で絞り込み・大問単位で表示
- **長文リスト**: 長文問題のテーブル一覧
- **単語情報**: 出題単語の集計・単語帳掲載状況

#### 試験形式タブ
- フィルター: 試験区分・年度・日程・方式・学部・問題タイプ
- 結果カード: 試験ごとにまとめて表示
- **長文問題で識別名が存在する場合**: 行がクリッカブルになり `/mondai/[識別名]` へ新規タブで遷移

#### 長文リストタブ
- 上部フィルター（年度/日程/方式/学部）
- テーブル（PC: 8カラム、スマホ: 5カラム）
- 行クリックで大問詳細へ遷移

#### 単語情報タブ
- 上部フィルター（年度/日程/方式/学部）
- 出題単語テーブル（大学別検索モードと同様の機能）

#### 単語詳細モーダル（単語情報タブ）
- **ヘッダー**: 単語名・品詞バッジ・出題回数の行 ＋ フィルター状態バッジ行
  - 大学名バッジ（bg-blue-100）
  - 絞込中の年度範囲（20XX〜20XX）
  - 日程・方式・学部のバッジ（各フィルターが設定されている場合のみ）
- **大学フィルタトグル**（出現した大問の上に配置）:
  - 「絞込中の年度/日程/方式/学部のみ」（デフォルト）
  - 「{大学名}の全ての出題履歴から」
  - フィルタ未適用時は非表示
- 意味一覧・大問一覧は大学別検索の単語詳細モーダルと同様

---

### 3.6 単語検索・単語帳比較 (`app/words/page.js`)

#### 概要
英単語が各単語帳に掲載されているか確認できる。3つのモードを切り替えて使用。

#### URLパラメータ
| パラメータ | 説明 |
|-----------|------|
| `q` | 初期検索ワード（単語検索モード） |
| `mode` | `compare`（比較モード）/ `university`（大学別モード） |
| `book1` / `book2` / `book3` | 比較する単語帳名（compareモード） |
| `univ` | 大学名（universityモード） |

#### モード切替トグル
- 「単語検索」「単語帳比較」「大学別検索」の3ボタン
- モバイルでは `text-xs whitespace-nowrap` でコンパクト化、横並びを維持

#### 3.6.1 単語検索モード
（v3.5と変更なし）

#### 3.6.2 単語帳比較モード

**PC表示（md以上）**:
- ヘッダー行に単語帳名（プルダウン選択）
- 結果セル: ◯/△/- の記号を状態色で表示
- 上部「比較実行」ボタン（`hidden md:block`）

**モバイル表示（md未満）**:
- ヘッダー行: ①②③ の代わりに `1`/`2`/`3` の角丸バッジ（書籍カラー: slate-600/cyan-700/teal-600）
- 結果セル: 書籍カラーで記号を表示（`md:hidden`）+ PC用状態色（`hidden md:inline`）
- **画面下部固定フッター** (`fixed bottom-0 md:hidden`):
  - 左側: 「比較実行」ボタン（角丸スクエア、縦書き風コンパクトデザイン）
  - 右側: 3つの単語帳プルダウン（各バッジ付き）
- コンテンツ押し上げ用スペーサー (`md:hidden h-[110px]`)

**テーブル行の高さ（モバイル）**:
- `<td>` は `py-2.5 md:py-3` でモバイル時に若干コンパクト

**書籍カラー**:
```javascript
bgColors:   ['bg-slate-600', 'bg-cyan-700', 'bg-teal-600']
textColors: ['text-slate-600', 'text-cyan-700', 'text-teal-600']
```

#### 3.6.3 大学別検索モード
（v3.5と変更なし）

---

### 3.7 記事一覧 (`app/articles/page.js`)

（v3.5と変更なし）

### 3.8 記事詳細 (`app/articles/[slug]/page.js` + `ArticleDetailClient.js`)

（v3.5と変更なし）

---

## 4. 共通コンポーネント

### 4.1 ヘッダー (`app/components/Header.js`)

#### ナビゲーション項目（ハンバーガーメニュー）
| リンク | パス | 備考 |
|--------|------|------|
| トップ | `/` | |
| 大学検索 | `/unilist` | |
| 試験検索 | `/exam` | |
| 長文詳細検索 | `/search` | |
| 単語検索 | `/words` | |
| 記事 | `/articles` | 準備中バッジ表示 |
| 本文レベルとは | `/about/passage-levels` | 区切り線の下 |

#### Props
| prop | 型 | 説明 |
|------|-----|------|
| pageTitle | string | ページタイトル（ロゴ横に表示） |
| pageDescription | string | ページの説明文（pageTitle下に小さく表示） |

#### pageDescriptionの各ページ設定
| ページ | pageDescription |
|--------|----------------|
| /unilist | シンキロウ/条件から大学を絞り込み |
| /exam | シンキロウ/条件に合った試験を絞り込み |
| /words | シンキロウ/単語の出題状況・掲載状況をチェック |

### 4.2 フッター (`app/components/Footer.js`)

（v3.5と変更なし）

---

## 5. データ構造

### 5.1 CSVファイル一覧

全て `public/data/` に配置

| ファイル名 | 説明 | 読み込み元 |
|-----------|------|-----------|
| reading.csv | 長文問題マスタ（exam.csvとJOINして使用） | loadData.js |
| setsumon.csv | 設問詳細 | loadData.js |
| knowledge.csv | 知識・文法タグ | loadData.js |
| hashtags.csv | テーマタグ | loadData.js |
| universities.csv | 大学マスタ | loadData.js |
| tangocho.csv | 単語帳掲載データ | loadWordData.js |
| keywords.csv | 重要単語マスタ | loadKeywordData.js |
| word_master.csv | 単語マスタ（品詞・意味） | loadWordMasterData.js |
| tangocho_master.csv | 単語帳マスタ（ASIN） | loadTangochoMasterData.js |
| articles.csv | 記事メタ情報 | loadArticlesData.js / loadArticlesDataServer.js |
| exam.csv | 試験マスタ（reading.csvとJOINして使用） | loadExamData.js |
| writing.csv | 英作文問題 | loadExamData.js |
| listening.csv | リスニング問題 | loadExamData.js |
| grammar.csv | 文法問題 | loadExamData.js |

### 5.2 universities.csv（大学マスタ）
```
コード,名称,区分,地方,医学部
```
- 区分: 国公立 / 私立 / 共通テスト / 資格

---

## 6. ディレクトリ構造

```
SHINQUIRO/
├── app/
│   ├── page.js                    # トップページ（ハブ）
│   ├── layout.tsx                 # ルートレイアウト
│   ├── components/
│   │   ├── Header.js              # 共通ヘッダー
│   │   └── Footer.js              # 共通フッター
│   ├── unilist/
│   │   └── page.js                # 大学検索
│   ├── exam/
│   │   └── page.js                # 試験検索
│   ├── search/
│   │   └── page.js                # 長文詳細検索
│   ├── mondai/[id]/
│   │   └── page.js                # 大問詳細ページ
│   ├── university/[code]/
│   │   └── page.js                # 大学別一覧ページ
│   ├── words/
│   │   └── page.js                # 単語検索・単語帳比較・大学別検索
│   ├── articles/
│   │   ├── page.js                # 記事一覧
│   │   └── [slug]/
│   │       ├── page.js            # 記事詳細（サーバーコンポーネント）
│   │       └── ArticleDetailClient.js
│   └── about/
│       ├── passage-levels/page.js
│       └── question-formats/page.js
│
├── lib/
│   ├── loadData.js                # メインデータ読み込み
│   ├── loadExamData.js            # 試験データ読み込み（exam/reading/writing/listening/grammar）
│   ├── loadKeywordData.js
│   ├── loadWordData.js
│   ├── loadWordMasterData.js
│   ├── loadTangochoMasterData.js
│   ├── parseIdiomNotation.js      # 熟語記法（<<>>）解析
│   ├── loadArticlesData.js
│   └── loadArticlesDataServer.js
│
└── public/
    ├── data/                      # CSVデータファイル群
    ├── images/articles/defaults/  # 記事デフォルトアイキャッチ（SVG）
    ├── articles/                  # 記事本文（Markdown）
    ├── reviews/                   # 大問ごとの講評（Markdown）
    └── docs/                      # 説明ページ用Markdown
```

---

## 7. 技術的ポイント

### 7.1 useSearchParams と Suspense

`useSearchParams()` を使用するページはビルド時のプリレンダリングエラーを防ぐため、コンポーネントを `<Suspense>` でラップする必要がある。

**実装パターン**（各ページで統一）:
```jsx
'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ExamPageInner() {
  const searchParams = useSearchParams();
  // ...実装
}

export default function ExamPage() {
  return <Suspense><ExamPageInner /></Suspense>;
}
```

**対象ページ**: `/exam`, `/unilist`, `/words`, `/university/[code]`

### 7.2 URLパラメータからの状態初期化

`useSearchParams()` の値を使って React state を初期化する場合、lazy initializer パターンを使用（`useState` の引数にアロー関数）。

```javascript
const [qFilter, setQFilter] = useState(() => searchParams.get('q') || '');
const [kubunFilter, setKubunFilter] = useState(() => {
  const cat = searchParams.get('category');
  return (cat === '国公立' || cat === '私立') ? [cat] : [];
});
```

パイプ区切りの複数値の場合:
```javascript
// parsePipe ヘルパーを使用
const parsePipe = (v, allowed) => v ? v.split('|').filter(x => allowed.includes(x)) : [];
```

### 7.3 日本語IME対策

テキスト入力でEnterキー検索する場合、日本語IMEの変換確定Enterを誤検知しないよう対処:
```javascript
const isComposingRef = useRef(false);
<input
  onCompositionStart={() => { isComposingRef.current = true; }}
  onCompositionEnd={() => { isComposingRef.current = false; }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !isComposingRef.current) handleSearch();
  }}
/>
```

### 7.4 熟語記法（<<>>記法）

keywords.csvやword_master.csvの「意味」列に `<<熟語形>> 意味` の形式で記述可能。

`parseIdiomNotation()` で解析:
- `displayWord`: `<<>>`内のテキスト（熟語の表示形）
- `displayMeaning`: `<<>>`を除去した意味テキスト
- `isIdiom`: boolean

原形はそのまま維持。検索・単語帳照合・URLパラメータ・コピー機能はすべて原形を使用。

### 7.5 サーバー/クライアントコンポーネント分離

- `generateMetadata`（OGP設定）が必要なページはサーバーコンポーネント化
- クライアントロジックは別ファイルに分離
- パターン: `page.js`（サーバー）→ `XxxClient.js`（クライアント）

### 7.6 大問詳細へのリンク（クリッカブル行）

長文問題の行を大問詳細へリンクさせる実装パターン:
```jsx
const isReadingLink = row._type === 'reading' && row.識別名;

{isReadingLink ? (
  <a href={`/mondai/${row.識別名}`} target="_blank" rel="noopener noreferrer"
     className="..." onClick={e => e.stopPropagation()}>
    {row.大問番号}
    <ExternalLink size={12} className="ml-1 inline text-emerald-500" />
  </a>
) : (
  <span>{row.大問番号}</span>
)}
```

使用箇所: `/exam`（試験で探すタブ）、`/university/[code]`（試験形式タブ）

---

## 8. 本文レベル基準

| レベル | 基準 | 目安 |
|--------|------|------|
| S | 英検1級上位レベル | 最難関 |
| A | 英検1級下位レベル | 難関 |
| B | 英検準1級上位レベル | やや難 |
| C | 英検準1級下位レベル | 標準 |
| D | 〜英検2級レベル | 基礎 |

---

## 9. 重要単語レベル基準

| レベル | アイコン | 色 | 説明 |
|--------|----------|-----|------|
| 修練 | 🚀 | 紫 | 最難関語彙 |
| 上級 | 🔬 | 赤 | 発展的語彙 |
| 標準 | 🖋️ | 青 | 標準的語彙 |
| 基礎 | 📘 | 緑 | 基礎的語彙 |

---

## 10. デザイン方針

### カラー統一ルール
| 用途 | クラス |
|------|--------|
| 選択中ボタン | `bg-emerald-600 text-white` |
| keyword由来の意味ハイライト（チェックモード） | `bg-pink-100` |
| keyword由来の意味テキスト（モーダル） | `text-pink-400 font-bold` |
| 「出題意味のみチェック」トグル | `bg-pink-300` |
| 単語帳比較の書籍カラー1/2/3 | `slate-600` / `cyan-700` / `teal-600` |

### レスポンシブ
- モバイルファーストで `md:` `lg:` ブレークポイントで切り替え
- カードUI: `rounded-xl shadow-md`
- テーブル: ストライプ表示

---

## 11. 今後の予定

### 機能拡張
- [ ] 設問形式説明ページの完成
- [ ] お気に入り機能
- [ ] 最近見た大問の履歴

### 公開準備
- [ ] Google Analytics 4 導入
- [ ] Google Search Console 登録
- [ ] OGP画像設定（記事以外のページ）
- [ ] サイトマップ生成
- [ ] プライバシーポリシーページ

### 収益化
- [ ] Google AdSense
- [ ] Amazon アフィリエイト
- [ ] Cookie同意バナー

### データ拡充
- [x] mondai.csv → reading.csv + exam.csv への移行（v4.0で完了）
- [ ] 識別名にアンダースコア区切り導入（試験IDと大問部分を分離）
- [ ] 大問IDプレフィックス方式（R/W/L/G）の導入

---

## 12. トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| ビルド時 useSearchParams エラー | Suspenseなしで使用 | コンポーネントをSuspenseでラップ（詳細は7.1参照） |
| 記事が404になる | slugの不一致 | articles.csvのslugとMarkdownファイル名を一致させる |
| 記事本文が表示されない | Markdownファイルがない | `public/articles/[slug].md` を作成 |
| カテゴリ色が表示されない | getCategoryColor未定義 | 該当カテゴリの色を追加 |

---

## 付録: クイックリファレンス

### よく使うファイルパス
```
トップページ:     app/page.js
大学検索:         app/unilist/page.js
試験検索:         app/exam/page.js
長文詳細検索:     app/search/page.js
大問詳細:         app/mondai/[id]/page.js
大学一覧:         app/university/[code]/page.js
単語検索:         app/words/page.js
記事一覧:         app/articles/page.js
記事詳細(server): app/articles/[slug]/page.js
記事詳細(client): app/articles/[slug]/ArticleDetailClient.js
ヘッダー:         app/components/Header.js
フッター:         app/components/Footer.js
データ読込:       lib/loadData.js
試験データ読込:   lib/loadExamData.js
熟語記法解析:     lib/parseIdiomNotation.js
```

### CSVファイル
```
public/data/reading.csv          → 長文問題マスタ（loadData.js + loadExamData.js 両方で使用）
public/data/exam.csv             → 試験マスタ（reading.csvとJOIN）
public/data/writing.csv          → 英作文問題
public/data/listening.csv        → リスニング問題
public/data/grammar.csv          → 文法問題
public/data/setsumon.csv         → 設問詳細
public/data/knowledge.csv        → 知識・文法タグ
public/data/hashtags.csv         → テーマタグ
public/data/universities.csv     → 大学マスタ
public/data/tangocho.csv         → 単語帳掲載データ
public/data/keywords.csv         → 重要単語マスタ
public/data/word_master.csv      → 単語マスタ（品詞・意味）
public/data/tangocho_master.csv  → 単語帳マスタ（ASIN）
public/data/articles.csv         → 記事メタ情報
```

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2025年1月 | 2.0 | 初版作成 |
| 2026年1月 | 2.1 | 単語検索に大学別検索モード追加 |
| 2026年1月 | 2.2 | word_master.csv追加、大学別検索モード改善 |
| 2026年1月 | 2.3 | 単語帳比較モード改善 |
| 2026年2月 | 2.4 | tangocho_master.csv追加、Amazonリンク追加 |
| 2026年2月 | **3.0** | トップページ新設、長文検索を/searchに移動、記事機能追加 |
| 2026年2月 | 3.1 | 共通フッター追加 |
| 2026年2月 | **3.2** | 記事画像機能、OGP/Twitter Card設定 |
| 2026年2月 | **3.3** | 重要単語・単語検索の大幅改善（複数レベル対応、品詞フィルタ等） |
| 2026年2月 | **3.4** | トップページ「今日の難単語」追加 |
| 2026年2月 | **3.4.1** | 熟語記法（<<>>記法）対応 |
| 2026年2月 | **3.5** | 大学別検索モードの大幅改善（グルーピングトグル、単語詳細モーダル刷新） |
| 2026年3月 | **4.0** | **試験検索（/exam）・大学検索（/unilist）新設**。トップページに地方選択エリア追加。大学別ページのデフォルトタブを試験形式に変更。長文問題行のクリッカブル化（→大問詳細）。単語詳細モーダルにフィルター状態バッジ・年度範囲表示追加。単語帳比較モードのモバイルUI刷新（書籍カラーバッジ・固定フッター）。URLパラメータによる画面間連携の強化。useSearchParams + Suspenseパターンをビルドエラー対策として確立。 |
