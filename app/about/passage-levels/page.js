'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Header from '@/app/components/Header';

export default function PassageLevels() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header />
        {/* 戻るボタン */}
            <div className="max-w-4xl mx-auto px-4 pt-6">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4"
            >
                <ChevronLeft size={20} />
                戻る
            </button>
            </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* 5段階判別 */}
            <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5段階判別</h2>
            <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">レベル</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">説明</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td className="border border-gray-300 px-4 py-3 font-bold">S</td>
                    <td className="border border-gray-300 px-4 py-3">英検1級上位（構文、語彙ともにかなり高レベル）</td>
                    </tr>
                    <tr>
                    <td className="border border-gray-300 px-4 py-3 font-bold">A</td>
                    <td className="border border-gray-300 px-4 py-3">英検1級下位（構文は少し平易だが、語彙レベルが高い）</td>
                    </tr>
                    <tr>
                    <td className="border border-gray-300 px-4 py-3 font-bold">B</td>
                    <td className="border border-gray-300 px-4 py-3">英検準1級上位（構文はAと遜色ないが、語彙が平易）</td>
                    </tr>
                    <tr>
                    <td className="border border-gray-300 px-4 py-3 font-bold">C</td>
                    <td className="border border-gray-300 px-4 py-3">英検準1級下位（構文、語彙ともに大学受験では標準〜少し難しい）</td>
                    </tr>
                    <tr>
                    <td className="border border-gray-300 px-4 py-3 font-bold">D</td>
                    <td className="border border-gray-300 px-4 py-3">~英検2級（大学受験では基礎レベル）</td>
                    </tr>
                </tbody>
                </table>
            </div>
            <p className="text-gray-700">
                ※たとえば、例年の共通テストでは後半の大問1つまたは2つがレベルCに分類されています。
            </p>
            </section> 

          {/* 限界と注意点 */}
            <section className="mb-12">
            <div className="bg-gray-100 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ 設計上の限界と注意点</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                <li>あくまで本文の難しさであり、<strong>設問の難しさや形式、制限時間は考慮されていません。</strong></li>
                <li>同様に、トピックの専門性も考慮されていません。</li>
                <li>物語文など、人物の発言が多い文章は低めの数値が出る傾向があります</li>
                <li>今後、計算式の更新で過去の分類が更新される可能性があります</li>
                </ul>
            </div>
            </section>

          {/* 使用指標の解説 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">使用指標の解説</h2>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">1. Flesch-Kincaid Grade Level</h3>
            <p className="mb-4">
              Flesch-Kincaid Grade Level (以下FK_Grade)は、文章の可読性を評価する国際的に広く使われている指標です。
            </p>
            <p className="mb-4">
              数値が高いほど文構造が複雑であることを意味し、たとえばFK_Grade = 12.0は「アメリカの高校3年生レベル」を意味します。計算式は
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="font-mono text-sm">
                FK_Grade = 0.39 × (総単語数 / 総文数) + 11.8 × (総音節数 / 総単語数) - 15.59
              </p>
            </div>
            <p>
              で、FK_Gradeが英検レベル判別の<strong>最も強力な指標</strong>（η² = 0.820）であることを確認しています。
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">2. 中難度語彙割合(10K-20K)</h3>
            <p className="mb-4">
              COCAベースで頻度ランク10,000〜20,000位にあたる語彙が文章全体に占める割合(タイプベース)です。
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>基礎単語(日常的に頻繁に使われる語)ではない</li>
              <li>高度すぎる専門用語でもない</li>
            </ul>
            <p>
              これを指標として加えたところ、FK_Gradeだけでは判別困難なA-B境界(1級下位レベルと準1級上位レベルの境界)において、この指標が<strong>決定的な役割</strong>（効果量d = 1.93）を果たし、精度向上に大いに役立っています。
            </p>
          </section>

          {/* システムの概要 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">どうやってレベルを判定しているのか</h2>
            <p className="mb-4">
              さて、ここから具体的な背景です。
            </p>
            <p className="mb-4">
              英語長文問題の本文レベルの難しさを客観的に計算できれば、受験生の皆さん、ならびに先生方の教材選定に役立つのではないか？と思ったのがきっかけです。
            </p>
            <p className="mb-4">
              レベルとしてわかりやすいのは英検だろうということで、近年の英検1級、準1級、2級の問題をそれぞれ用意し、本文語数の影響を排除した上で、級ごとにはっきりと分かれている要因をあぶりだしていきました。
              15以上の変数を試してみたところ、最も説明力が高いのは<strong>Flesch-Kincaid Grade Level</strong>(以下、FK_Grade)であることがわかりました。
            </p>
            <p>
              しかしそこで問題になるのが、「1級レベル」「準1級レベル」「2級レベル」とだけ言われても、
            </p>. 
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>「級の中でも難易度にばらつきがあるのでは？」</strong></li>
              <li><strong>「そもそも3つに分類では粗すぎないか？」</strong></li>
              <li><strong>「異なる級どうしにはどんな差があるのか？」</strong></li>
            </ul>　
            <p>
              という点です。これらを解消するため、各級をFK_Gradeの中央値で2分割して6段階に分けた簡易モデルを作成しようとしたところ、まず2級にはFK_Gradeの大きなばらつきがないことが判明します（p &gt; .05）。
            </p><br></br>
            <p>  
              そこで6段階は諦め、FK_Gradeを<strong>1級の中央値15.28、準1級の中央値12.20、そして2級の最大値である9.58</strong>で分割した5段階にシフトしました。
              この単一指標の簡易モデルによる判定では78.6%の精度を達成したのですが、「1級下位と準1級上位のFK_Gradeのかぶっている範囲が大きい」ことが判明します。
            </p><br></br>
            <p>  
              というわけで、AとBに分類されたものをごちゃ混ぜにして、FK_Grade以外の変数で説明力の高いものがないかチェックしていくと、中難易度語彙(詳細は上記)が最も精度が高かったため、A-B判定のための指標として採用しました。
            </p>
            

          </section>

          {/* 判定基準 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">最終的な手順</h2>
            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Step 1：FK_Gradeによる粗分類</h3>
            <p className="mb-4">
              まず、Flesch-Kincaid Grade Level（FK_Grade）で4つのグループに大別します。
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">FK_Gradeの範囲</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">判定レベル</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">15.28以上</td>
                    <td className="border border-gray-300 px-4 py-2">S（1級上位）</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">12.20〜15.28未満</td>
                    <td className="border border-gray-300 px-4 py-2">A or B（境界領域）</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">9.58〜12.20未満</td>
                    <td className="border border-gray-300 px-4 py-2">C（準1級下位）</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">9.58未満</td>
                    <td className="border border-gray-300 px-4 py-2">D（2級）</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Step 2：境界領域の精密分類</h3>
            <p className="mb-4">
              FK_Gradeが12.20〜15.28の範囲（A-B境界）では、中難易度語彙の中央値7.36%で判定します。
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>中難易度語彙 ≥ 7.36%</strong> → A（1級下位）</li>
              <li><strong>中難易度語彙 &lt; 7.36%</strong> → B（準1級上位）</li>
            </ul>
            <p>
              この2段階アプローチにより、単一指標による判定（精度78.6%）から<strong>9.3ポイント向上</strong>し、87.9%の精度を達成しました。
            </p>
          </section>

          {/* システムの性能 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">レベル判定基準の精度</h2>

            <h3 className="text-xl font-bold text-gray-900 mb-3">全体精度</h3>
            <p className="mb-4">
              英検1級・準1級・2級の読解問題66問（各級22問、2020-2025年出題）を用いた検証の結果：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
              <li><strong>全体精度</strong>：87.9%（58/66問）</li>
              <li><strong>高信頼度判定の精度</strong>：91.7%（55/60問）</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-3">レベル別精度</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">レベル</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">精度</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">特徴</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">S（1級上位）</td>
                    <td className="border border-gray-300 px-4 py-2">100%</td>
                    <td className="border border-gray-300 px-4 py-2">極めて高精度</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">D（2級）</td>
                    <td className="border border-gray-300 px-4 py-2">95.5%</td>
                    <td className="border border-gray-300 px-4 py-2">高精度</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">C（準1級下位）</td>
                    <td className="border border-gray-300 px-4 py-2">82%</td>
                    <td className="border border-gray-300 px-4 py-2">良好</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">A-B境界</td>
                    <td className="border border-gray-300 px-4 py-2">77.3%</td>
                    <td className="border border-gray-300 px-4 py-2">やや困難</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 今後 */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">今後のアップデートについて</h2>

            <p className="mb-6">
              今後、対象とするデータを増やして計算式をアップデートすることや、計算式自体の変数を変えることがあります。その際、過去のデータについても本文レベルの判定が変わることがありますのでご了承ください。
            </p>
          </section>

          {/* フッター情報 */}
          <div className="border-t pt-6 text-sm text-gray-600">
            <p><strong>最終更新日</strong>：2025年10月29日</p>
            <p><strong>分析ソフトウェア</strong>：JASP 0.18</p>
            <p><strong>データソース</strong>：英検1級・準1級・2級過去問（2020-2025年）</p>
          </div>

        </div>
      </div>
    </div>
  );
}