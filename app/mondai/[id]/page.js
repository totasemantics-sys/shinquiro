'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ExternalLink, ChevronRight, Home } from 'lucide-react';
import { loadAllData, getUniversityCodeFromId, getUniversityName } from '@/lib/loadData';
import ReactMarkdown from 'react-markdown';
import { loadKeywordData, getKeywordsByMondaiId, getKeywordCountByLevel, filterKeywordsByLevelsUnique } from '@/lib/loadKeywordData';
import { loadWordData, getAvailableBooks } from '@/lib/loadWordData';
import { loadWordMasterData } from '@/lib/loadWordMasterData';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

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
  const [keywordMode, setKeywordMode] = useState('select-level'); // 'list' | 'select-level' | 'check' | 'result'
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]); // チェックボックス用
  const [currentKeywordIndex, setCurrentKeywordIndex] = useState(0);
  const [keywordAnswers, setKeywordAnswers] = useState([]);
  const [shuffledKeywords, setShuffledKeywords] = useState([]);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showListMeaning, setShowListMeaning] = useState(true);
  const [selectedPosFilters, setSelectedPosFilters] = useState(['動詞', '名詞', '形容詞副詞', 'その他']);
  const [checkPosFilters, setCheckPosFilters] = useState(['動詞', '名詞', '形容詞副詞', 'その他']);
  const [hideKeywordOnly, setHideKeywordOnly] = useState(true);
  const [activeListLevel, setActiveListLevel] = useState(null);

  // word_master用のstate
  const [wordMasterData, setWordMasterData] = useState([]);

  // 単語帳掲載状況用のstate
  const [wordData, setWordData] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  
  // 単語詳細モーダル用のstate
  const [showWordModal, setShowWordModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);

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
        // 一覧モードの初期タブを設定
        const firstLevel = ['修練', '上級', '標準', '基礎'].find(
          l => mondaiKeywords.some(k => k.レベル === l)
        );
        if (firstLevel) setActiveListLevel(firstLevel);

        // word_masterデータを読み込み
        const wordMasterLoaded = await loadWordMasterData();
        setWordMasterData(wordMasterLoaded);

        // 単語帳データを読み込み
        const wordDataLoaded = await loadWordData();
        setWordData(wordDataLoaded);
        const books = getAvailableBooks(wordDataLoaded);
        setAvailableBooks(books);
        if (books.length > 0) {
          setSelectedBook(books[0]);
        }
      }
      
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  // 単語帳掲載状況を取得する関数
  const getWordBookStatus = (word) => {
    if (!wordData || wordData.length === 0 || !selectedBook) return null;
    
    const searchTerm = word.toLowerCase().trim();
    const entry = wordData.find(
      row => row.単語?.toLowerCase() === searchTerm && row.単語帳名称 === selectedBook
    );
    
    if (entry) {
      return {
        status: entry.掲載区分 === '見出し語' ? 'main' : 'related',
        number: entry.単語帳内番号 || null,
        page: entry.ページ数 || null
      };
    }
    return null;
  };

  // 全単語帳での掲載状況を取得する関数
  const getAllBookStatuses = (word) => {
    if (!wordData || wordData.length === 0) return [];
    
    const searchTerm = word.toLowerCase().trim();
    
    return availableBooks.map(book => {
      const entry = wordData.find(
        row => row.単語?.toLowerCase() === searchTerm && row.単語帳名称 === book
      );
      
      if (entry) {
        return {
          book,
          status: entry.掲載区分 === '見出し語' ? 'main' : 'related',
          number: entry.単語帳内番号 || null,
          page: entry.ページ数 || null
        };
      }
      return {
        book,
        status: 'none',
        number: null,
        page: null
      };
    });
  };

  // チェックモード用：現在の単語の品詞+レベル一覧を取得（keywords.csv + word_master.csv）
  const getPartOfSpeechTags = (word) => {
    const tags = [];
    const seen = new Set();

    // keywords.csvから（この大問の同じ単語の全行）
    keywordData.filter(k => k.単語 === word).forEach(k => {
      if (k.品詞) {
        const key = `${k.品詞}|${k.レベル}`;
        if (!seen.has(key)) {
          seen.add(key);
          tags.push({ 品詞: k.品詞, レベル: k.レベル, source: 'keyword' });
        }
      }
    });

    // word_master.csvから（原形で照合）
    const normalizedWord = word.toLowerCase().trim();
    const masterEntries = wordMasterData.filter(
      row => row.原形 && row.原形.toLowerCase().trim() === normalizedWord
    );
    // 品詞+レベルでユニーク化
    masterEntries.forEach(m => {
      if (m.品詞) {
        const key = `${m.品詞}|${m.レベル}`;
        if (!seen.has(key)) {
          seen.add(key);
          tags.push({ 品詞: m.品詞, レベル: m.レベル, source: 'master' });
        }
      }
    });

    return tags;
  };

  // チェックモード用：品詞グループ別の意味一覧を取得
  const getMeaningsByPartOfSpeech = (word) => {
    const normalizedWord = word.toLowerCase().trim();

    // keywords.csvからこの単語の全エントリ
    const keywordEntries = keywordData.filter(k => k.単語 === word);

    // word_master.csvから原形で照合
    const masterEntries = wordMasterData.filter(
      row => row.原形 && row.原形.toLowerCase().trim() === normalizedWord
    );
    // 品詞・意味でユニーク化
    const uniqueMaster = [];
    const masterSeen = new Set();
    masterEntries.forEach(m => {
      const key = `${m.品詞}|${m.意味}`;
      if (!masterSeen.has(key)) {
        masterSeen.add(key);
        uniqueMaster.push(m);
      }
    });

    // keywords.csvの意味セット（ハイライト判定用）
    const keywordMeanings = new Set(keywordEntries.map(k => `${k.品詞}|${k.意味}`));

    // 品詞でグルーピング
    const posGroups = new Map();

    // まずword_masterの意味を追加
    uniqueMaster.forEach(m => {
      if (!posGroups.has(m.品詞)) {
        posGroups.set(m.品詞, []);
      }
      posGroups.get(m.品詞).push({
        意味: m.意味,
        レベル: m.レベル,
        isKeyword: keywordMeanings.has(`${m.品詞}|${m.意味}`),
        source: 'master'
      });
    });

    // keywords.csvにあってword_masterにない意味を追加
    keywordEntries.forEach(k => {
      if (!posGroups.has(k.品詞)) {
        posGroups.set(k.品詞, []);
      }
      const group = posGroups.get(k.品詞);
      const exists = group.some(item => item.意味 === k.意味);
      if (!exists) {
        group.push({
          意味: k.意味,
          レベル: k.レベル,
          isKeyword: true,
          source: 'keyword'
        });
      }
    });

    return posGroups;
  };

  // 単語カードクリック時の処理
  const handleWordClick = (keyword) => {
    setSelectedWord(keyword);
    setShowWordModal(true);
  };

  // 品詞フィルタのマッチ判定
  const matchesPosFilter = (pos, filters) => {
    if (filters.includes('動詞') && pos === '動詞') return true;
    if (filters.includes('名詞') && pos === '名詞') return true;
    if (filters.includes('形容詞副詞') && (pos === '形容詞' || pos === '副詞')) return true;
    if (filters.includes('その他') && !['動詞', '名詞', '形容詞', '副詞'].includes(pos)) return true;
    return false;
  };

  // レベル別に単語を分類し、アルファベット順にソート
  const getWordsByLevelWithStatus = (level) => {
    const levelKeywords = keywordData.filter(k => k.レベル === level);
    
    // アルファベット順にソートし、掲載状況を付与
    const sortedKeywords = [...levelKeywords].sort((a, b) => 
      a.単語.toLowerCase().localeCompare(b.単語.toLowerCase())
    );
    
    return sortedKeywords.map(keyword => {
      const status = getWordBookStatus(keyword.単語);
      return { ...keyword, bookStatus: status };
    });
  };

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

        <div className="flex justify-end mb-2">
          <a
            href="https://forms.gle/KiNp1WfdF5xYDHhC7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-600 hover:underline"
          >
            データの修正を依頼
          </a>
        </div>

        {/* 重要単語 */}
        {keywordData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">📚 重要単語</h2>
                {(keywordMode === 'select-level' || keywordMode === 'check' || keywordMode === 'result') && (
                  <span className="text-xs text-gray-400"><span className="bg-pink-100 px-1 rounded">　</span> この大問で出現した意味</span>
                )}
              </div>
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
                    ✓の単語を<wbr />単語帳比較へ
                  </button>
                  <div className="flex-1" />
                  <span className="text-xs text-gray-400 hidden md:inline">※この大問で出現した意味を優先的に表示</span>
                  <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                    <span className="text-sm text-gray-600">意味表示</span>
                    <div
                      onClick={() => setShowListMeaning(!showListMeaning)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${showListMeaning ? 'bg-emerald-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showListMeaning ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>
                <div className="md:hidden text-right mb-2">
                  <span className="text-xs text-gray-400">※この大問で出現した意味を優先的に表示</span>
                </div>

                {/* 品詞フィルタ */}
                {(() => {
                  const posCategories = [
                    { key: '動詞', label: '動詞' },
                    { key: '名詞', label: '名詞' },
                    { key: '形容詞副詞', label: '形容詞副詞' },
                    { key: 'その他', label: 'その他' },
                  ];
                  return (
                    <div className="flex justify-center gap-2 mb-3">
                      {posCategories.map(cat => {
                        const isActive = selectedPosFilters.includes(cat.key);
                        return (
                          <button
                            key={cat.key}
                            onClick={() => {
                              if (isActive) {
                                if (selectedPosFilters.length > 1) {
                                  setSelectedPosFilters(selectedPosFilters.filter(f => f !== cat.key));
                                }
                              } else {
                                setSelectedPosFilters([...selectedPosFilters, cat.key]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* レベルタブ */}
                <div className="flex gap-1 border-b border-gray-200 mb-4">
                  {['修練', '上級', '標準', '基礎'].map(level => {
                    const count = keywordData.filter(k => k.レベル === level && matchesPosFilter(k.品詞, selectedPosFilters)).length;
                    if (count === 0) return null;
                    const isActive = activeListLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setActiveListLevel(level)}
                        className={`px-4 py-2.5 text-base font-bold transition-colors border-b-2 -mb-px ${
                          isActive
                            ? 'border-emerald-600 text-emerald-700'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {level === '修練' && '🚀 修練'}
                        {level === '上級' && '🔬 上級'}
                        {level === '標準' && '🖋️ 標準'}
                        {level === '基礎' && '📘 基礎'}
                        <span className="text-xs ml-1">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* アクティブなレベルの単語一覧 */}
                {(() => {
                  const levelKeywords = keywordData.filter(k => k.レベル === activeListLevel && matchesPosFilter(k.品詞, selectedPosFilters));
                  if (levelKeywords.length === 0) return null;

                  return (
                    <div>
                      <div className="flex items-center justify-end gap-2 mb-3">
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
                              className={`flex flex-col p-3 rounded-md transition-colors text-left ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-4 h-4 border-2 rounded flex items-center justify-center" style={{
                                  borderColor: isSelected ? 'white' : '#d1d5db',
                                  backgroundColor: isSelected ? 'white' : 'transparent'
                                }}>
                                  {isSelected && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                                </span>
                                <span className="text-sm font-medium truncate">{keyword.単語}</span>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 ml-6 text-xs ${
                                isSelected ? 'text-white' : 'text-gray-500'
                              }`}>
                                {keyword.品詞 && (
                                  <span className="flex-shrink-0">{keyword.品詞.charAt(0)})</span>
                                )}
                                {showListMeaning && keyword.意味 && (
                                  <span className={`truncate ${isSelected ? '' : 'text-gray-800'}`}>
                                    {keyword.意味}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* チェックモード（レベル選択） */}
            {keywordMode === 'select-level' && (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">学習する品詞・レベルを選択</h3>
                <div className="flex items-start justify-center gap-4 max-w-2xl mx-auto">
                  {/* 品詞選択 */}
                  <div className="space-y-3 flex-1">
                    {[
                      { key: '動詞', label: '動詞' },
                      { key: '名詞', label: '名詞' },
                      { key: '形容詞副詞', label: '形容詞副詞' },
                      { key: 'その他', label: 'その他' },
                    ].map(cat => {
                      const isSelected = checkPosFilters.includes(cat.key);
                      return (
                        <button
                          key={cat.key}
                          onClick={() => {
                            if (isSelected) {
                              if (checkPosFilters.length > 1) {
                                setCheckPosFilters(checkPosFilters.filter(f => f !== cat.key));
                              }
                            } else {
                              setCheckPosFilters([...checkPosFilters, cat.key]);
                            }
                          }}
                          className={`w-full px-6 py-4 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="font-medium">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ×マーク */}
                  <div className="flex items-center self-center text-2xl font-bold text-gray-400 px-1">×</div>

                  {/* レベル選択 */}
                  <div className="space-y-3 flex-1">
                    {['修練', '上級', '標準', '基礎'].map(level => {
                      const count = new Set(keywordData.filter(k => k.レベル === level && matchesPosFilter(k.品詞, checkPosFilters)).map(k => k.単語)).size;
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
                              ? 'bg-emerald-600 text-white'
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
                </div>

                {/* 出題意味のみ隠すトグル + 開始ボタン */}
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className={`text-sm transition-colors ${hideKeywordOnly ? 'text-gray-800' : 'text-gray-400'}`}>
                    この大問で出題された意味<span className="font-bold">のみ</span>をチェック
                  </span>
                  <div
                    onClick={() => setHideKeywordOnly(!hideKeywordOnly)}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${hideKeywordOnly ? 'bg-pink-300' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hideKeywordOnly ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>

                  {selectedLevels.length > 0 && (
                    <button
                      onClick={() => {
                        const posFiltered = keywordData.filter(k => matchesPosFilter(k.品詞, checkPosFilters));
                        const filtered = filterKeywordsByLevelsUnique(posFiltered, selectedLevels);
                        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
                        setShuffledKeywords(shuffled);
                        setCurrentKeywordIndex(0);
                        setKeywordAnswers([]);
                        setShowMeaning(false);
                        setKeywordMode('check');
                      }}
                      className="mt-4 px-8 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
                    >
                      開始
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* チェックモード（単語チェック中） */}
            {keywordMode === 'check' && shuffledKeywords.length > 0 && (
              <div className="py-8">
                {/* プログレスバー + カウンター */}
                <div className="max-w-md mx-auto mb-8 flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-emerald-600 h-3 rounded-full transition-all"
                      style={{ width: `${(currentKeywordIndex / shuffledKeywords.length) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {currentKeywordIndex + 1} / {shuffledKeywords.length}
                  </div>
                </div>

                <div className="text-center text-5xl font-bold text-gray-900 mb-8">
                  {shuffledKeywords[currentKeywordIndex].単語}
                </div>

                {/* 品詞+レベル（左）＋ 意味（右） */}
                <div className="max-w-sm mx-auto mb-10">
                  {(() => {
                    const tags = getPartOfSpeechTags(shuffledKeywords[currentKeywordIndex].単語);
                    const allMeanings = getMeaningsByPartOfSpeech(shuffledKeywords[currentKeywordIndex].単語);

                    return (
                      <div className="space-y-2">
                        {tags.map((tag, idx) => {
                          const posMeanings = allMeanings.get(tag.品詞) || [];
                          // 同じ品詞のタグが複数ある場合、意味は最初のタグにだけ表示
                          const isFirstOfPos = tags.findIndex(t => t.品詞 === tag.品詞) === idx;

                          return (
                            <div key={idx} className="flex items-start gap-4">
                              <span className="flex-shrink-0 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                {tag.品詞} <span className="text-xs text-gray-500">{tag.レベル}</span>
                              </span>
                              <div className="flex-1 min-h-[32px] flex items-start">
                                {isFirstOfPos && posMeanings.length > 0 ? (
                                  <div className="space-y-1">
                                    {posMeanings.map((m, mIdx) => {
                                      // showMeaning: すべて表示
                                      if (showMeaning) {
                                        return (
                                          <div key={mIdx} className={`text-lg px-2 rounded ${m.isKeyword ? 'text-gray-900 font-bold bg-pink-100' : 'text-gray-400'}`}>
                                            {m.意味}
                                          </div>
                                        );
                                      }
                                      // hideKeywordOnly ON: keyword意味はピンクブロック、非keyword意味は表示
                                      if (hideKeywordOnly) {
                                        return m.isKeyword ? (
                                          <div key={mIdx} className="bg-pink-100 rounded px-2 min-h-[28px] w-24" />
                                        ) : (
                                          <div key={mIdx} className="text-lg px-2 rounded text-gray-400">
                                            {m.意味}
                                          </div>
                                        );
                                      }
                                      // hideKeywordOnly OFF: すべて非表示
                                      return null;
                                    })}
                                    {/* hideKeywordOnly OFF時、keyword意味があればピンクブロック1つ表示 */}
                                    {!showMeaning && !hideKeywordOnly && posMeanings.some(m => m.isKeyword) && (
                                      <div className="bg-pink-100 rounded px-2 min-h-[28px] w-24" />
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* ボタンエリア（幅を統一するためrefで計測） */}
                {!showMeaning ? (
                  <div className="flex justify-center">
                    <div className="inline-flex gap-4">
                      {/* 非表示の自信なし・自信ありで幅を確保し、意味を見るボタンをフル幅で重ねる */}
                      <div className="relative">
                        <div className="invisible flex gap-4">
                          <span className="px-8 py-4 text-lg font-medium">自信なし</span>
                          <span className="px-8 py-4 text-lg font-medium">自信あり</span>
                        </div>
                        <button
                          onClick={() => setShowMeaning(true)}
                          className="absolute inset-0 w-full bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-lg"
                        >
                          意味を見る
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <div className="inline-flex gap-4">
                      <button
                        onClick={() => {
                          const current = shuffledKeywords[currentKeywordIndex];
                          const keywordEntries = keywordData.filter(k => k.単語 === current.単語);
                          const newAnswers = [...keywordAnswers, {
                            word: current.単語,
                            pos: keywordEntries[0]?.品詞 || '',
                            meaning: keywordEntries.map(k => k.意味).filter(Boolean).join(', '),
                            levels: current.allLevels || [current.レベル],
                            confident: false
                          }];
                          setKeywordAnswers(newAnswers);
                          setShowMeaning(false);

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
                          const current = shuffledKeywords[currentKeywordIndex];
                          const keywordEntries = keywordData.filter(k => k.単語 === current.単語);
                          const newAnswers = [...keywordAnswers, {
                            word: current.単語,
                            pos: keywordEntries[0]?.品詞 || '',
                            meaning: keywordEntries.map(k => k.意味).filter(Boolean).join(', '),
                            levels: current.allLevels || [current.レベル],
                            confident: true
                          }];
                          setKeywordAnswers(newAnswers);
                          setShowMeaning(false);

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
                  </>
                )}

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
                            <div className="flex-1 min-w-0">
                              <div>{answer.word}</div>
                              {answer.pos && (
                                <div className={`text-xs truncate ${isSelected ? 'text-red-100' : 'text-gray-500'}`}>
                                  {answer.pos.charAt(0)}）{answer.meaning}
                                </div>
                              )}
                            </div>
                            <span className="text-sm flex-shrink-0">
                              {(answer.levels || [answer.level]).map(l =>
                                l === '修練' ? '🚀' : l === '上級' ? '🔬' : l === '標準' ? '🖋️' : l === '基礎' ? '📘' : ''
                              ).join(' ')}
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
                            <div className="flex-1 min-w-0">
                              <div>{answer.word}</div>
                              {answer.pos && (
                                <div className={`text-xs truncate ${isSelected ? 'text-emerald-100' : 'text-gray-500'}`}>
                                  {answer.pos.charAt(0)}）{answer.meaning}
                                </div>
                              )}
                            </div>
                            <span className="text-sm flex-shrink-0">
                              {(answer.levels || [answer.level]).map(l =>
                                l === '修練' ? '🚀' : l === '上級' ? '🔬' : l === '標準' ? '🖋️' : l === '基礎' ? '📘' : ''
                              ).join(' ')}
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
                      setCheckPosFilters(['動詞', '名詞', '形容詞副詞', 'その他']);
                      setHideKeywordOnly(true);
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

        {/* 単語帳掲載状況 */}
        {keywordData.length > 0 && availableBooks.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">📖 単語帳掲載状況</h2>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white min-w-[200px]"
              >
                {availableBooks.map(book => (
                  <option key={book} value={book}>{book}</option>
                ))}
              </select>
            </div>

            <div className="mb-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded"></div>
                <span className="text-gray-700">掲載あり</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                <span className="text-gray-700">掲載なし</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['修練', '上級', '標準', '基礎'].map(level => {
                const keywords = getWordsByLevelWithStatus(level);
                
                if (keywords.length === 0) return null;
                
                return (
                  <div key={level} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {level === '修練' && '🚀 修練'}
                        {level === '上級' && '🔬 上級'}
                        {level === '標準' && '🖋️ 標準'}
                        {level === '基礎' && '📘 基礎'}
                        <span className="text-gray-500 font-normal ml-1">({keywords.length}語)</span>
                      </h3>
                    </div>
                    <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                      {keywords.map((keyword, idx) => (
                        keyword.bookStatus ? (
                          // 掲載されている単語（緑ハイライト）
                          <button
                            key={idx}
                            onClick={() => handleWordClick(keyword)}
                            className="w-full px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-sm text-left hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <div className="font-medium text-gray-900">{keyword.単語}</div>
                            <div className="text-xs text-emerald-700">
                              {keyword.bookStatus.number && <span>No.{keyword.bookStatus.number}</span>}
                              {keyword.bookStatus.number && keyword.bookStatus.page && <span> / </span>}
                              {keyword.bookStatus.page && <span>p.{keyword.bookStatus.page}</span>}
                            </div>
                          </button>
                        ) : (
                          // 掲載されていない単語
                          <button
                            key={idx}
                            onClick={() => handleWordClick(keyword)}
                            className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-sm text-left hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <div className="text-gray-500">{keyword.単語}</div>
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 単語詳細モーダル */}
      {showWordModal && selectedWord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedWord.単語}</h3>
                  {(() => {
                    const posGroups = getMeaningsByPartOfSpeech(selectedWord.単語);
                    if (posGroups.size === 0) return null;
                    return (
                      <div className="mt-2 space-y-1">
                        {[...posGroups.entries()].map(([pos, meanings], i) => (
                          <div key={i} className="text-sm text-gray-700">
                            <span className="text-gray-400 mr-1">{meanings[0]?.レベル}</span>
                            <span className="text-gray-500">{pos}</span>{' '}
                            {meanings.map((m, j) => (
                              <span key={j}>
                                {j > 0 && ', '}
                                <span className={m.isKeyword ? 'font-bold text-pink-400' : ''}>{m.意味}</span>
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setShowWordModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">各単語帳での掲載状況</h4>
              <div className="space-y-2">
                {getAllBookStatuses(selectedWord.単語).map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      item.status === 'main'
                        ? 'bg-emerald-50 border-emerald-200'
                        : item.status === 'related'
                        ? 'bg-emerald-50/50 border-emerald-100'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex-1">
                      <div className={`font-medium ${item.status !== 'none' ? 'text-gray-900' : 'text-gray-400'}`}>
                        {item.book}
                      </div>
                      {item.status !== 'none' && (item.number || item.page) && (
                        <div className="text-xs text-emerald-700 mt-0.5">
                          {item.number && <span>No.{item.number}</span>}
                          {item.number && item.page && <span> / </span>}
                          {item.page && <span>p.{item.page}</span>}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {item.status === 'main' && (
                        <span className="text-2xl font-bold text-emerald-600">◯</span>
                      )}
                      {item.status === 'related' && (
                        <span className="text-2xl font-bold text-amber-500">△</span>
                      )}
                      {item.status === 'none' && (
                        <span className="text-2xl font-bold text-gray-300">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="text-emerald-600 font-bold">◯</span>
                  <span>見出し語</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-500 font-bold">△</span>
                  <span>関連語</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-300 font-bold">-</span>
                  <span>掲載なし</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowWordModal(false)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

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
      <Footer />
    </div>
  );
}