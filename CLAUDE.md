# SHINQUIRO - プロジェクト設定

## プロジェクト概要
大学受験英語長文の検索・分析Webアプリ。対象ユーザーは教師・塾講師・受験生。

## 技術スタック
- **フレームワーク**: Next.js 16.0.8 (App Router)
- **UI**: React 19.2.0, Tailwind CSS 4, Lucide React
- **CSV処理**: PapaParse
- **Markdown**: react-markdown
- **ホスティング**: Netlify

## ディレクトリ構成
```
app/                          # ページコンポーネント
├── page.js                   # トップページ（ハブ）
├── layout.tsx                # ルートレイアウト
├── components/Header.js      # 共通ヘッダー
├── components/Footer.js      # 共通フッター（問い合わせリンク+コピーライト）
├── search/page.js            # 長文検索
├── mondai/[id]/page.js       # 大問詳細
├── university/[code]/page.js # 大学別一覧
├── words/page.js             # 単語検索・比較・大学別検索
├── articles/page.js          # 記事一覧
├── articles/[slug]/page.js   # 記事詳細（サーバーコンポーネント、OGP設定）
├── articles/[slug]/ArticleDetailClient.js # 記事詳細クライアント描画
└── about/                    # 説明ページ群

lib/                          # データ読み込みユーティリティ
├── loadData.js               # mondai/setsumon/knowledge/hashtags/universities
├── loadWordData.js           # tangocho.csv
├── loadKeywordData.js        # keywords.csv
├── loadWordMasterData.js     # word_master.csv
├── loadTangochoMasterData.js # tangocho_master.csv
├── loadArticlesData.js       # articles.csv（クライアント用）
└── loadArticlesDataServer.js # articles.csv（サーバー用、fs読み込み）

public/data/                  # CSVデータファイル群
public/images/articles/defaults/ # 記事デフォルト画像（カテゴリ別SVG）
public/reviews/               # 大問ごとの講評（Markdown）
public/articles/              # 記事本文（Markdown）
public/docs/                  # 説明ページ用Markdown
```

## データ構造（CSV）
すべて `public/data/` に配置。各lib関数でキャッシュ付きで読み込み。

| ファイル | 主キー | 用途 |
|---------|--------|------|
| mondai.csv | 大問ID | 大問マスタ（大学名,年度,語数,レベル等） |
| setsumon.csv | 設問ID（大問IDで紐付け） | 設問詳細（カテゴリ,形式） |
| knowledge.csv | 設問ID | 知識・文法タグ |
| hashtags.csv | 大問ID | テーマタグ |
| universities.csv | 大学コード | 大学マスタ |
| tangocho.csv | 単語+単語帳名称 | 単語帳掲載データ |
| keywords.csv | 大問ID+単語 | 重要単語マスタ |
| word_master.csv | 原形 | 単語マスタ（品詞,意味,レベル） |
| tangocho_master.csv | 単語帳名称 | 単語帳マスタ（ASIN） |
| articles.csv | slug | 記事メタ情報（image列でアイキャッチ指定可） |

## コーディング規約
- コンポーネントは基本 `'use client'`（CSVデータをクライアントサイドで読み込み）
- 例外: `generateMetadata` が必要なページはサーバーコンポーネント化し、クライアント部分を別ファイルに分離（例: `articles/[slug]/page.js` + `ArticleDetailClient.js`）
- Tailwind CSSでスタイリング（インラインclassName）
- レスポンシブは `md:` `lg:` ブレークポイントで対応
- アイコンはLucide Reactを使用
- 日本語コメントOK

## デザイン方針
- メインカラー: emerald（緑系）
- カードUIは角丸+シャドウ（`rounded-xl shadow-md`）
- ホバーでボーダー色変化＋影拡大
- テーブルはストライプ表示
- モバイルファーストでカラム数を切り替え

## 重要なロジック
- 長文検索のフィルタリング: 設問カテゴリ・設問形式・知識文法は「同一設問内でAND条件」
- 単語検索は3モード切替（単語検索/単語帳比較/大学別検索）
- 大問詳細の重要単語は一覧モード/チェックモードの2モード

## 仕様書
詳細な仕様は `docs/SHINQUIRO_SPECIFICATION_v3_2.md` を参照。

## 今後の予定
- 設問形式説明ページの作成
- お気に入り・閲覧履歴機能
- Google Analytics 4 / Search Console 導入
- OGP画像（記事以外）・サイトマップ
- Google AdSense / Amazon アフィリエイト
