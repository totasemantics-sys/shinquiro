# SHINQUIRO - プロジェクト設定

## プロジェクト概要
大学受験英語長文の検索・分析Webアプリ。対象ユーザーは教師・塾講師・受験生。

## 技術スタック
- **フレームワーク**: Next.js 16.1.3 (App Router)
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
├── unilist/page.js           # 大学検索
├── exam/page.js              # 試験検索
├── search/page.js            # 長文詳細検索
├── mondai/[id]/page.js       # 大問詳細
├── university/[code]/page.js # 大学別一覧
├── words/page.js             # 単語検索・比較・大学別検索
├── articles/page.js          # 記事一覧
├── articles/[slug]/page.js   # 記事詳細（サーバーコンポーネント、OGP設定）
├── articles/[slug]/ArticleDetailClient.js # 記事詳細クライアント描画
└── about/                    # 説明ページ群

lib/                          # データ読み込みユーティリティ
├── loadData.js               # mondai/setsumon/knowledge/hashtags/universities
├── loadExamData.js           # exam/reading/writing/listening/grammar
├── loadWordData.js           # tangocho.csv
├── loadKeywordData.js        # keywords.csv
├── loadWordMasterData.js     # word_master.csv
├── loadTangochoMasterData.js # tangocho_master.csv
├── parseIdiomNotation.js     # 熟語記法（<<>>）解析ユーティリティ
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
| universities.csv | 大学コード | 大学マスタ（コード,名称,区分,地方,医学部） |
| tangocho.csv | 単語+単語帳名称 | 単語帳掲載データ |
| keywords.csv | 大問ID+単語 | 重要単語マスタ |
| word_master.csv | 原形 | 単語マスタ（品詞,意味,レベル） |
| tangocho_master.csv | 単語帳名称 | 単語帳マスタ（ASIN） |
| articles.csv | slug | 記事メタ情報（image列でアイキャッチ指定可） |
| exam.csv | 試験ID | 試験マスタ |
| reading.csv | 大問ID | 長文問題（試験形式用） |
| writing.csv | 大問ID | 英作文問題 |
| listening.csv | 大問ID | リスニング問題 |
| grammar.csv | 大問ID | 文法問題 |

## コーディング規約
- コンポーネントは基本 `'use client'`（CSVデータをクライアントサイドで読み込み）
- 例外: `generateMetadata` が必要なページはサーバーコンポーネント化し、クライアント部分を別ファイルに分離（例: `articles/[slug]/page.js` + `ArticleDetailClient.js`）
- **`useSearchParams()` を使うページは必ず Suspense でラップする**（ビルドエラー防止）:
  ```jsx
  function FooPageInner() { /* useSearchParams()をここで使う */ }
  export default function FooPage() { return <Suspense><FooPageInner /></Suspense>; }
  ```
- Tailwind CSSでスタイリング（インラインclassName）
- レスポンシブは `md:` `lg:` ブレークポイントで対応
- アイコンはLucide Reactを使用
- 日本語コメントOK

## デザイン方針（レイアウト）
- メインカラー: emerald（緑系）
- カードUIは角丸+シャドウ（`rounded-xl shadow-md`）
- ホバーでボーダー色変化＋影拡大
- テーブルはストライプ表示
- モバイルファーストでカラム数を切り替え

## 重要なロジック
- 長文検索のフィルタリング: 設問カテゴリ・設問形式・知識文法は「同一設問内でAND条件」
- 単語検索は3モード切替（単語検索/単語帳比較/大学別検索）
- 大問詳細の重要単語は一覧モード/チェックモードの2モード
- **重要単語のレベル振り分け**: 同じ単語が複数レベルにまたがる場合、一覧では各レベルに表示、チェックではユニーク化して1回のみ出題（`filterKeywordsByLevelsUnique`）
- **品詞フィルタ**: 一覧/チェック両モードに4カテゴリ（動詞/名詞/形容詞副詞/その他）。`matchesPosFilter()`で判定
- **「出題意味のみチェック」トグル**: デフォルトOFF。ONでkeyword由来の意味のみ隠す、OFFで全意味を隠す
- **単語検索の意味フィルタ**: keywords.csvに存在する意味でフィルタリング。意味ごとに出現した大問を絞り込み
- **word_master優先度**: `parseInt(優先度) || 999` は0がfalsyで999になるバグあり→修正済み
- **今日の難単語**: トップページで日替わりの難単語を表示。keywords.csvから修練・上級レベルをユニーク抽出し、日付ハッシュで1つ選択。最大幅450px、中央揃え。モーダルで品詞・意味、出現大問、単語帳掲載状況を表示
- **熟語記法（<<>>記法）**: 意味列に`<<prevent A from doing>> Aにdoさせない`のように記述すると、`<<>>`内を熟語の表示形、それ以外を意味として分離表示。`parseIdiomNotation()`で解析。原形は検索・照合・URLで維持
- **大学別検索のグルーピングトグル（2段階）**:
  - トグル1「同じ品詞・異なる意味をまとめる」（デフォルトON）: 同一原形+品詞のレコードを1行に集約
  - トグル2「同じ綴り・異なる品詞もまとめる」（デフォルトON）: 品詞を跨いで1行に集約。トグル2 ONならトグル1も強制ON
  - 有効な組み合わせ: 両方OFF / トグル1のみON / 両方ON
  - 集約時のデータ構造: `meaningsByPos`（品詞→意味配列の2階層）、`posCounts`（品詞カウント）、`topIdiom`（代表熟語記法）
  - テーブル表示: 品詞・意味に`+N`表示、熟語記法は単語欄にカッコ書き（※付）、対応する意味欄にも※印
- **大学別検索の単語詳細モーダル**:
  - 大学フィルタトグル: 「絞込中の大学のみ」/「すべての検索結果」の2択。フィルタ未適用時は非表示
  - 意味一覧: 品詞ごとにグルーピング表示。各意味はトグルボタン（`key`=`品詞__意味`で一意管理）
  - 大問一覧: 選択中の意味に該当する大問のみ表示。クリックで新規タブに大問詳細を開く
  - レスポンシブ: PC=テーブル、スマホ=カード形式
  - 注意書き:「※出題回数の多すぎる意味は掲載していません」をフッターに表示
- **大学別ページ（/university/[code]）の単語詳細モーダル追加情報**:
  - ヘッダーに大学名バッジ、年度範囲（20XX〜20XX）、日程・方式・学部バッジを表示
  - 大学フィルタトグルのラベル: 「絞込中の年度/日程/方式/学部のみ」/「{大学名}の全ての出題履歴から」
  - トグルは「出現した大問」の直上に配置
- **URLパラメータによる画面間連携**:
  - `/unilist?q=XXX&category=国公立&region=南関東`
  - `/exam?tab=shiken&category=国公立|私立&writing=あり&writing_type=自由英作文:100語以上`
  - `/words?q=XXX&mode=compare&book1=XXX&book2=XXX`
  - URLパラメータはlazy initializerパターンで初期state設定（`useState(() => searchParams.get('q') || '')`）
- **日本語IME対策**: テキスト入力のEnterキー検索は `isComposingRef = useRef(false)` + `onCompositionStart/End` でフラグ管理
- **大問詳細へのクリッカブル行**: reading行で識別名が存在する場合 `<a href="/mondai/[識別名]" target="_blank">` を使用。`onClick={e => e.stopPropagation()}` で行クリックと区別。使用箇所: /exam（試験で探すタブ）、/university/[code]（試験形式タブ）
- **大学別ページのデフォルトタブ**: `useState('exam')`（試験形式タブ）
- **単語帳比較モードのスマホ書籍カラー**: `['bg-slate-600', 'bg-cyan-700', 'bg-teal-600']` / `['text-slate-600', 'text-cyan-700', 'text-teal-600']`

## デザイン方針（色の統一）
- 選択中ボタンの色: `bg-emerald-600`（ヘッダーナビ、単語帳選択、検索履歴、品詞フィルタ、意味フィルタ等すべて統一）
- keyword由来の意味ハイライト: `bg-pink-100`（チェックモード内）、`text-pink-400 font-bold`（モーダル内）
- 「出題意味のみチェック」トグル: `bg-pink-300`
- 単語帳比較モバイルバッジ: slate-600 / cyan-700 / teal-600（書籍1/2/3）

## 仕様書
詳細な仕様は `docs/SHINQUIRO_SPECIFICATION_v4.md` を参照。

## 今後の予定
- 設問形式説明ページの作成
- お気に入り・閲覧履歴機能
- Google Analytics 4 / Search Console 導入
- OGP画像（記事以外）・サイトマップ
- Google AdSense / Amazon アフィリエイト
- mondai.csv → reading.csv + exam.csv への移行（v4.x）
