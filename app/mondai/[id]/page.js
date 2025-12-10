'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ExternalLink, ChevronRight, Home } from 'lucide-react';
import { loadAllData, getUniversityCodeFromId, getUniversityName } from '@/lib/loadData';
import ReactMarkdown from 'react-markdown';
import { loadKeywordData, getKeywordsByMondaiId, getKeywordCountByLevel, filterKeywordsByLevels } from '@/lib/loadKeywordData';
import Header from '@/app/components/Header';

export default function MondaiDetail() {
  const params = useParams();
  const router = useRouter();
  const [mondaiData, setMondaiData] = useState(null);
  const [setumonData, setSetumonData] = useState([]);
  const [hashtagData, setHashtagData] = useState([]);
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState([]);
  const [universityCode, setUniversityCode] = useState('');
  const [universityName, setUniversityName] = useState('');
  const [reviewContent, setReviewContent] = useState(null);
  const [hasReview, setHasReview] = useState(false);
  const [keywordData, setKeywordData] = useState([]);
  const [keywordMode, setKeywordMode] = useState('list'); // 'list' | 'select-level' | 'check' | 'result'
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]); // チェックボックス用
  const [currentKeywordIndex, setCurrentKeywordIndex] = useState(0);
  const [keywordAnswers, setKeywordAnswers] = useState([]);
  const [shuffledKeywords, setShuffledKeywords] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await loadAllData();
      const found = data.mondai.find(m => m.識別名 === params.id);
      
      if (found) {
        setMondaiData(found);
        const setumon = data.setsumon.filter(s => s.大問ID === found.大問ID);
        setSetumonData(setumon);
        setHashtagData(data.hashtags.filter(h => h.大問ID === found.大問ID));
        
        const setumonIds = setumon.map(s => s.設問ID);
        setKnowledgeData(data.knowledge.filter(k => setumonIds.includes(k.設問ID)));
        
        // 大学情報を取得
        setUniversities(data.universities);
        const code = getUniversityCodeFromId(found.識別名, data.universities);
        setUniversityCode(code);
        setUniversityName(getUniversityName(code, data.universities));

        // 講評マークダウンを読み込む
        try {
          const response = await fetch(`/reviews/${found.識別名}.md`);
          if (response.ok) {
            const text = await response.text();
            setReviewContent(text);
            setHasReview(true);
          } else {
            setHasReview(false);
          }
        } catch (error) {
          setHasReview(false);
        }

        // キーワードデータを読み込み
          const keywords = await loadKeywordData();
          const mondaiKeywords = getKeywordsByMondaiId(keywords, found.大問ID);
          setKeywordData(mondaiKeywords);

      }
      
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!mondaiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700">データが見つかりません</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            検索ページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <button onClick={() => router.push('/')} className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <Home size={16} />
            検索画面
          </button>
          <ChevronRight size={16} className="text-gray-400" />
          <button onClick={() => router.push(`/university/${universityCode}`)} className="hover:text-emerald-600 transition-colors">
            {universityName}
          </button>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="text-gray-800 font-medium">
            {mondaiData.年度}年度 {mondaiData.日程}{mondaiData.方式}{mondaiData.学部}{mondaiData.大問番号}
          </span>
        </nav>
        
        <h1 className="text-3xl font-bold text-gray-900">{mondaiData.大学名} {mondaiData.年度}年度　{mondaiData.学部} 【{mondaiData.大問番号}】</h1>
        <p className="text-sm text-gray-600 mt-2"> {mondaiData.日程} / {mondaiData.方式}</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">基本情報</h2>
            {mondaiData.ASIN && (
              <a href={`https://www.amazon.co.jp/dp/${mondaiData.ASIN}`} target="_blank" rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500">
                <ExternalLink size={16} />
                Amazonで見る
              </a>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 w-40">本文語数</th>
                  <td className="px-4 py-3 text-gray-900">{mondaiData.本文語数}語</td>
                </tr>
                {mondaiData.本文レベル && (
                  <tr className="hover:bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 w-40">
                      <div className="flex flex-col gap-2">
                        <span>本文レベル</span>
                        <button
                          onClick={() => router.push('/about/passage-levels')}
                          className="text-xs text-emerald-600 hover:text-emerald-700 underline text-left"
                        >
                          本文レベルとは
                        </button>
                      </div>
                    </th>
                    <td className="px-4 py-3 text-gray-900">
                      {mondaiData.本文レベル === 'S' && 'S:英検1級上位レベル'}
                      {mondaiData.本文レベル === 'A' && 'A:英検1級下位レベル'}
                      {mondaiData.本文レベル === 'B' && 'B:英検準1級上位レベル'}
                      {mondaiData.本文レベル === 'C' && 'C:英検準1級下位レベル'}
                      {mondaiData.本文レベル === 'D' && 'D:〜英検2級レベル'}
                    </td>
                  </tr>
                )}
                <tr className="hover:bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">設問数</th>
                  <td className="px-4 py-3 text-gray-900">
                    {mondaiData.設問数}問
                    {(() => {
                      const bunshoJapanese = setumonData.filter(s => s.設問カテゴリ === '文章記述(日)').length;
                      const bunshoEnglish = setumonData.filter(s => s.設問カテゴリ === '文章記述(英)').length;
                      
                      if (bunshoJapanese === 0 && bunshoEnglish === 0) {
                        return <span className="text-gray-600">（文章記述なし）</span>;
                      }
                      
                      return (
                        <span className="text-gray-600">
                          （うち文章記述:
                          {bunshoJapanese > 0 && `日本語${bunshoJapanese}問`}
                          {bunshoJapanese > 0 && bunshoEnglish > 0 && '　'}
                          {bunshoEnglish > 0 && `英語${bunshoEnglish}問`}
                          ）
                        </span>
                      );
                    })()}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">ジャンル</th>
                  <td className="px-4 py-3 text-gray-900">{mondaiData.ジャンル}</td>
                </tr>
                {hashtagData.length > 0 && (
                  <tr className="hover:bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">テーマ・キーワード</th>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {hashtagData.map((h, idx) => (
                          <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                            #{h.ハッシュタグ}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                <tr className="hover:bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">出典</th>
                  <td className="px-4 py-3 text-gray-900">{mondaiData.出典}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 設問構成 */}
        {setumonData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">設問構成</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-20">設問名</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">設問カテゴリ</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">設問形式</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">知識・文法</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {setumonData.map((s) => {
                    const setumonKnowledge = knowledgeData
                      .filter(k => k.設問ID === s.設問ID)
                      .map(k => k['知識・文法']);
                    return (
                      <tr key={s.設問ID} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-left text-gray-800">{s.設問名}</td>
                        <td className="px-3 py-3 text-left text-gray-800">{s.設問カテゴリ}</td>
                        <td className="px-3 py-3 text-left">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                            {s.設問形式}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-left">
                          <div className="flex flex-wrap gap-1 justify-start">
                            {setumonKnowledge.length > 0 ? (
                              setumonKnowledge.map((kg, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {kg}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 講評・ポイント */}
        {hasReview && reviewContent && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📝 ポイント</h2>
            <div className="prose prose-emerald max-w-none markdown-review">
              <ReactMarkdown>{reviewContent}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* 重要単語 */}
        {keywordData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">📚 重要単語</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setKeywordMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    keywordMode === 'list'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  一覧
                </button>
                <button
                  onClick={() => setKeywordMode('select-level')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    keywordMode === 'select-level' || keywordMode === 'check' || keywordMode === 'result'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  チェック
                </button>
              </div>
            </div>

            {/* 一覧モード */}
            {keywordMode === 'list' && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      const checkedWords = keywordData
                        .filter(k => selectedKeywords.includes(k.単語))
                        .map(k => k.単語)
                        .join('\n');
                      
                      if (checkedWords) {
                        navigator.clipboard.writeText(checkedWords).then(() => {
                          alert(`${selectedKeywords.length}個の単語をコピーしました`);
                        });
                      } else {
                        alert('単語を選択してください');
                      }
                    }}
                    className="px-4 py-2 bg-gray-50 text-emerald-600 border-2 border-emerald-600 rounded-md hover:bg-emerald-50 transition-colors text-sm font-medium"
                  >
                    ✓の単語をコピー
                  </button>
                  <button
                    onClick={() => {
                      const checkedWords = keywordData
                        .filter(k => selectedKeywords.includes(k.単語))
                        .map(k => k.単語);
                      
                      if (checkedWords.length > 0) {
                        const url = `/words?mode=compare&words=${encodeURIComponent(JSON.stringify(checkedWords))}`;
                        window.open(url, '_blank');
                      } else {
                        alert('単語を選択してください');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    ✓の単語を単語帳比較へ
                  </button>
                </div>
                
                <div className="space-y-6 max-w-5xl">
                  {['修練', '上級', '標準', '基礎'].map(level => {
                    const levelKeywords = keywordData.filter(k => k.レベル === level);
                    if (levelKeywords.length === 0) return null;
                    
                    return (
                      <div key={level}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {level === '修練' && '🚀 修練'}
                            {level === '上級' && '🔬 上級'}
                            {level === '標準' && '🖋️ 標準'}
                            {level === '基礎' && '📘 基礎'}
                            <span className="text-sm text-gray-500 ml-2">({levelKeywords.length}語)</span>
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const levelWords = levelKeywords.map(k => k.単語);
                                setSelectedKeywords([...new Set([...selectedKeywords, ...levelWords])]);
                              }}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              すべて選択
                            </button>
                            <button
                              onClick={() => {
                                const levelWords = levelKeywords.map(k => k.単語);
                                setSelectedKeywords(selectedKeywords.filter(w => !levelWords.includes(w)));
                              }}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              すべて解除
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {levelKeywords.map((keyword, idx) => {
                            const isSelected = selectedKeywords.includes(keyword.単語);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedKeywords(selectedKeywords.filter(w => w !== keyword.単語));
                                  } else {
                                    setSelectedKeywords([...selectedKeywords, keyword.単語]);
                                  }
                                }}
                                className={`flex items-center gap-2 p-3 rounded-md transition-colors text-left ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                <span className="flex-shrink-0 w-4 h-4 border-2 rounded flex items-center justify-center" style={{
                                  borderColor: isSelected ? 'white' : '#d1d5db',
                                  backgroundColor: isSelected ? 'white' : 'transparent'
                                }}>
                                  {isSelected && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                                </span>
                                <span className="text-sm font-medium truncate">{keyword.単語}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* チェックモード（レベル選択） */}
            {keywordMode === 'select-level' && (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">学習するレベルを選択</h3>
                <div className="space-y-3 max-w-md mx-auto">
                  {['修練', '上級', '標準', '基礎'].map(level => {
                    const count = keywordData.filter(k => k.レベル === level).length;
                    const isDisabled = count === 0;
                    const isSelected = selectedLevels.includes(level);
                    
                    return (
                      <button
                        key={level}
                        disabled={isDisabled}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedLevels(selectedLevels.filter(l => l !== level));
                          } else {
                            setSelectedLevels([...selectedLevels, level]);
                          }
                        }}
                        className={`w-full px-6 py-4 rounded-lg text-left transition-colors ${
                          isDisabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {level === '修練' && '🚀 修練'}
                            {level === '上級' && '🔬 上級'}
                            {level === '標準' && '🖋️ 標準'}
                            {level === '基礎' && '📘 基礎'}
                          </span>
                          <span className="text-sm">({count}語)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {selectedLevels.length > 0 && (
                  <button
                    onClick={() => {
                      const filtered = filterKeywordsByLevels(keywordData, selectedLevels);
                      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
                      setShuffledKeywords(shuffled);
                      setCurrentKeywordIndex(0);
                      setKeywordAnswers([]);
                      setKeywordMode('check');
                    }}
                    className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
                  >
                    開始
                  </button>
                )}
              </div>
            )}

            {/* チェックモード（単語チェック中） */}
            {keywordMode === 'check' && shuffledKeywords.length > 0 && (
              <div className="text-center py-8">
                {/* プログレスバー */}
                <div className="max-w-md mx-auto mb-8">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-emerald-600 h-3 rounded-full transition-all"
                      style={{ width: `${(currentKeywordIndex / shuffledKeywords.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  レベル: {selectedLevels.join('・')}
                </div>

                <div className="text-5xl font-bold text-gray-900 mb-4">
                  {shuffledKeywords[currentKeywordIndex].単語}
                </div>

                <div className="text-lg text-gray-600 mb-8">
                  {shuffledKeywords[currentKeywordIndex].レベル === '修練' && '🚀 修練'}
                  {shuffledKeywords[currentKeywordIndex].レベル === '上級' && '🔬 上級'}
                  {shuffledKeywords[currentKeywordIndex].レベル === '標準' && '🖋️ 標準'}
                  {shuffledKeywords[currentKeywordIndex].レベル === '基礎' && '📘 基礎'}
                </div>

                <div className="text-2xl text-gray-500 mb-12">
                  {currentKeywordIndex + 1} / {shuffledKeywords.length}
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      const newAnswers = [...keywordAnswers, {
                        word: shuffledKeywords[currentKeywordIndex].単語,
                        level: shuffledKeywords[currentKeywordIndex].レベル,
                        confident: false
                      }];
                      setKeywordAnswers(newAnswers);
                      
                      if (currentKeywordIndex + 1 < shuffledKeywords.length) {
                        setCurrentKeywordIndex(currentKeywordIndex + 1);
                      } else {
                        setKeywordMode('result');
                      }
                    }}
                    className="px-8 py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-lg"
                  >
                    自信なし
                  </button>
                  <button
                    onClick={() => {
                      const newAnswers = [...keywordAnswers, {
                        word: shuffledKeywords[currentKeywordIndex].単語,
                        level: shuffledKeywords[currentKeywordIndex].レベル,
                        confident: true
                      }];
                      setKeywordAnswers(newAnswers);
                      
                      if (currentKeywordIndex + 1 < shuffledKeywords.length) {
                        setCurrentKeywordIndex(currentKeywordIndex + 1);
                      } else {
                        setKeywordMode('result');
                      }
                    }}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-lg"
                  >
                    自信あり
                  </button>
                </div>
              </div>
            )}

            {/* 結果画面 */}
            {keywordMode === 'result' && (
              <div className="py-8">
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">お疲れ様でした！</h3>
                
                <div className="mb-6 flex items-center gap-3 justify-center">
                  <button
                    onClick={() => {
                      const notConfidentWords = keywordAnswers
                        .filter(a => !a.confident)
                        .map(a => a.word)
                        .join('\n');
                      
                      const checkedWords = keywordData
                        .filter(k => selectedKeywords.includes(k.単語))
                        .map(k => k.単語);
                      
                      const allWords = [...new Set([...notConfidentWords.split('\n'), ...checkedWords])].join('\n');
                      
                      if (allWords) {
                        navigator.clipboard.writeText(allWords).then(() => {
                          alert('単語をコピーしました');
                        });
                      }
                    }}
                    className="px-4 py-2 bg-gray-50 text-emerald-600 border-2 border-emerald-600 rounded-md hover:bg-emerald-50 transition-colors text-sm font-medium"
                  >
                    ✓の単語をコピー
                  </button>
                  <button
                    onClick={() => {
                      const notConfidentWords = keywordAnswers.filter(a => !a.confident).map(a => a.word);
                      const checkedWords = keywordData
                        .filter(k => selectedKeywords.includes(k.単語))
                        .map(k => k.単語);
                      
                      const allWords = [...new Set([...notConfidentWords, ...checkedWords])];
                      
                      if (allWords.length > 0) {
                        const url = `/words?mode=compare&words=${encodeURIComponent(JSON.stringify(allWords))}`;
                        window.open(url, '_blank');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    ✓の単語を単語帳比較へ
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  <div className="bg-red-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-red-700">
                        自信なし ({keywordAnswers.filter(a => !a.confident).length}語)
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const notConfidentWords = keywordAnswers.filter(a => !a.confident).map(a => a.word);
                            setSelectedKeywords([...new Set([...selectedKeywords, ...notConfidentWords])]);
                          }}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          すべて選択
                        </button>
                        <button
                          onClick={() => {
                            const notConfidentWords = keywordAnswers.filter(a => !a.confident).map(a => a.word);
                            setSelectedKeywords(selectedKeywords.filter(w => !notConfidentWords.includes(w)));
                          }}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          すべて解除
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {keywordAnswers.filter(a => !a.confident).map((answer, idx) => {
                        const isSelected = selectedKeywords.includes(answer.word);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedKeywords(selectedKeywords.filter(w => w !== answer.word));
                              } else {
                                setSelectedKeywords([...selectedKeywords, answer.word]);
                              }
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded transition-colors text-left ${
                              isSelected
                                ? 'bg-red-400 text-white'
                                : 'bg-white text-gray-800 hover:bg-red-100'
                            }`}
                          >
                            <span className="flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center" style={{
                              borderColor: isSelected ? 'white' : '#d1d5db',
                              backgroundColor: isSelected ? 'white' : 'transparent'
                            }}>
                              {isSelected && <span className="text-red-600 font-bold">✓</span>}
                            </span>
                            <span className="flex-1">{answer.word}</span>
                            <span className="text-sm">
                              {answer.level === '修練' && '🚀'}
                              {answer.level === '上級' && '🔬'}
                              {answer.level === '標準' && '🖋️'}
                              {answer.level === '基礎' && '📘'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-emerald-700">
                        自信あり ({keywordAnswers.filter(a => a.confident).length}語)
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const confidentWords = keywordAnswers.filter(a => a.confident).map(a => a.word);
                            setSelectedKeywords([...new Set([...selectedKeywords, ...confidentWords])]);
                          }}
                          className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                        >
                          すべて選択
                        </button>
                        <button
                          onClick={() => {
                            const confidentWords = keywordAnswers.filter(a => a.confident).map(a => a.word);
                            setSelectedKeywords(selectedKeywords.filter(w => !confidentWords.includes(w)));
                          }}
                          className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                        >
                          すべて解除
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {keywordAnswers.filter(a => a.confident).map((answer, idx) => {
                        const isSelected = selectedKeywords.includes(answer.word);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedKeywords(selectedKeywords.filter(w => w !== answer.word));
                              } else {
                                setSelectedKeywords([...selectedKeywords, answer.word]);
                              }
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded transition-colors text-left ${
                              isSelected
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-gray-800 hover:bg-emerald-100'
                            }`}
                          >
                            <span className="flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center" style={{
                              borderColor: isSelected ? 'white' : '#d1d5db',
                              backgroundColor: isSelected ? 'white' : 'transparent'
                            }}>
                              {isSelected && <span className="text-emerald-600 font-bold">✓</span>}
                            </span>
                            <span className="flex-1">{answer.word}</span>
                            <span className="text-sm">
                              {answer.level === '修練' && '🚀'}
                              {answer.level === '上級' && '🔬'}
                              {answer.level === '標準' && '🖋️'}
                              {answer.level === '基礎' && '📘'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <button
                    onClick={() => {
                      setKeywordMode('select-level');
                      setSelectedLevels([]);
                      setKeywordAnswers([]);
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
                  >
                    最初から
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <style jsx>{`
        .markdown-review h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #10b981;
        }
        .markdown-review h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .markdown-review p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .markdown-review ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin-bottom: 1rem;
        }
        .markdown-review li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .markdown-review strong {
          color: #10b981;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}