'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Sparkles, X, ChevronRight } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import { loadKeywordData } from '@/lib/loadKeywordData';
import { loadWordData, searchWord } from '@/lib/loadWordData';
import { loadTangochoMasterData, getAmazonLinkByBookName } from '@/lib/loadTangochoMasterData';
import { loadAllData } from '@/lib/loadData';
import { parseIdiomNotation } from '@/lib/parseIdiomNotation';

// ─── 定数 ────────────────────────────────────────────────
const WRITING_TYPES     = ['和文英訳', '自由英作文(100語未満)', '自由英作文(100語以上)'];
const LISTENING_FORMATS = ['選択問題', '日本語記述', '英語記述'];
const GRAMMAR_TYPES     = ['空所選択補充', '語句整序', '誤文訂正', '発音・アクセント'];
const PRESENCE_OPTIONS  = ['あり', 'どちらでも', 'なし'];

function getDailyWord(words) {
  const dateStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return words[Math.abs(hash) % words.length];
}

export default function Home() {
  const router = useRouter();

  // ── 今日の難単語
  const [dailyWord,          setDailyWord]          = useState(null);
  const [showDailyWordModal, setShowDailyWordModal]  = useState(false);
  const [wordData,           setWordData]            = useState([]);
  const [tangochoMaster,     setTangochoMaster]      = useState([]);
  const [mondaiData,         setMondaiData]          = useState([]);
  const [universities,       setUniversities]        = useState([]);
  const [loading,            setLoading]             = useState(true);

  // ── IME composition フラグ
  const isComposingRef = useRef(false);

  // ── 名称から検索
  const [uniInput,           setUniInput]            = useState('');
  const [showUniSug,         setShowUniSug]          = useState(false);
  const uniInputRef = useRef(null);

  // ── 形式から検索
  const [examTypes,          setExamTypes]           = useState([]);
  const [readingBunshoJp,    setReadingBunshoJp]     = useState('どちらでも');
  const [readingBunshoEn,    setReadingBunshoEn]     = useState('どちらでも');
  const [writingFilter,      setWritingFilter]       = useState('どちらでも');
  const [writingTypes,       setWritingTypes]        = useState([]);
  const [listeningFilter,    setListeningFilter]     = useState('どちらでも');
  const [listeningFormats,   setListeningFormats]    = useState([]);
  const [grammarFilter,      setGrammarFilter]       = useState('どちらでも');
  const [grammarTypes,       setGrammarTypes]        = useState([]);

  // ── 単語検索
  const [wordInput,          setWordInput]           = useState('');
  const [compareBook1,       setCompareBook1]        = useState('');
  const [compareBook2,       setCompareBook2]        = useState('');
  const [compareBook3,       setCompareBook3]        = useState('');
  const [uniWordInput,       setUniWordInput]        = useState('');
  const [showUniWordSug,     setShowUniWordSug]      = useState(false);
  const uniWordInputRef = useRef(null);

  // ── データ読み込み
  useEffect(() => {
    async function load() {
      try {
        const kw = await loadKeywordData();

        // 「原形＋意味」の組み合わせでユニーク化した候補リストを構築
        const hardWordsMap = new Map();
        kw.forEach(row => {
          if ((row.レベル === '修練' || row.レベル === '上級') && row.単語 && row.意味) {
            const key = `${row.単語}__${row.意味}`;
            if (!hardWordsMap.has(key)) {
              hardWordsMap.set(key, { 単語: row.単語, 品詞: row.品詞 || '', 意味: row.意味, 大問IDs: [] });
            }
            if (row.大問ID && !hardWordsMap.get(key).大問IDs.includes(row.大問ID)) {
              hardWordsMap.get(key).大問IDs.push(row.大問ID);
            }
          }
        });
        const hardWords = [...hardWordsMap.values()];
        if (hardWords.length > 0) setDailyWord(getDailyWord(hardWords));

        const [wd, tm, allData] = await Promise.all([
          loadWordData(),
          loadTangochoMasterData(),
          loadAllData(),
        ]);
        setWordData(wd);
        setTangochoMaster(tm);
        setMondaiData(allData.reading);
        setUniversities(allData.universities);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 単語帳比較のデフォルト設定
  useEffect(() => {
    if (tangochoMaster.length > 0) {
      const books = tangochoMaster.map(t => t.単語帳名称).filter(Boolean);
      setCompareBook1(books[0] || '');
      setCompareBook2(books[1] || '');
      setCompareBook3(books[2] || '');
    }
  }, [tangochoMaster]);

  // サジェスト外クリックで閉じる
  useEffect(() => {
    const handler = (e) => {
      if (uniInputRef.current    && !uniInputRef.current.contains(e.target))    setShowUniSug(false);
      if (uniWordInputRef.current && !uniWordInputRef.current.contains(e.target)) setShowUniWordSug(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── 派生データ
  const availableBooks = useMemo(() =>
    tangochoMaster.map(t => t.単語帳名称).filter(Boolean),
    [tangochoMaster]
  );

  const uniSuggestions = useMemo(() => {
    if (!uniInput.trim()) return [];
    return universities
      .filter(u => (u.区分 === '国公立' || u.区分 === '私立') && u.名称?.includes(uniInput.trim()))
      .slice(0, 8);
  }, [uniInput, universities]);

  const uniWordOptions = useMemo(() =>
    [...new Set(mondaiData.map(m => m.大学名).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja')),
    [mondaiData]
  );

  const uniWordSuggestions = useMemo(() => {
    if (!uniWordInput.trim()) return [];
    return uniWordOptions.filter(n => n.includes(uniWordInput.trim())).slice(0, 8);
  }, [uniWordInput, uniWordOptions]);

  const uniWordValid   = uniWordInput.trim() !== '' && uniWordOptions.includes(uniWordInput.trim());
  const uniWordNoData  = uniWordInput.trim() !== '' && !uniWordValid && uniWordSuggestions.length === 0;

  // ── ハンドラー
  const toggleArr = (setter, arr, value) =>
    setter(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);

  const handleExamSearch = () => {
    const p = new URLSearchParams({ tab: 'exam' });
    if (examTypes.length > 0)                                    p.set('category',       examTypes.join('|'));
    if (readingBunshoJp !== 'どちらでも')                         p.set('reading_jp',     readingBunshoJp);
    if (readingBunshoEn !== 'どちらでも')                         p.set('reading_en',     readingBunshoEn);
    if (writingFilter   !== 'どちらでも')                         p.set('writing',        writingFilter);
    if (writingFilter === 'あり' && writingTypes.length > 0)     p.set('writing_type',   writingTypes.join('|'));
    if (listeningFilter !== 'どちらでも')                         p.set('listening',      listeningFilter);
    if (listeningFilter === 'あり' && listeningFormats.length > 0) p.set('listening_type', listeningFormats.join('|'));
    if (grammarFilter   !== 'どちらでも')                         p.set('grammar',        grammarFilter);
    if (grammarFilter === 'あり' && grammarTypes.length > 0)     p.set('grammar_type',   grammarTypes.join('|'));
    router.push(`/exam?${p.toString()}`);
  };

  // ── 今日の難単語モーダル用ヘルパー
  const getBookStatuses = (word) => {
    if (!word || !wordData.length) return [];
    return searchWord(wordData, word).map(r => {
      let headword = null;
      if (r.掲載区分 !== '見出し語' && r.単語帳内番号) {
        const hw = wordData.find(d => d.単語帳名称 === r.単語帳名称 && d.単語帳内番号 === r.単語帳内番号 && d.掲載区分 === '見出し語');
        if (hw) headword = hw.単語;
      }
      return { book: r.単語帳名称, status: r.掲載区分 === '見出し語' ? 'main' : 'related', number: r.単語帳内番号 || null, page: r.ページ数 || null, headword };
    });
  };

  const getDailyWordSource = (entry) => {
    if (!entry || !mondaiData.length) return null;
    const list = entry.大問IDs.map(id => mondaiData.find(m => m.大問ID === id)).filter(Boolean);
    if (!list.length) return null;
    list.sort((a, b) => parseInt(b.年度) - parseInt(a.年度) || a.大問ID.localeCompare(b.大問ID));
    const top = list[0];
    const label = `${top.年度} ${top.大学名} ${top.学部}`;
    return list.length >= 2 ? `${label} など` : label;
  };

  // ── スタイル定数
  const btnAct = 'bg-emerald-600 text-white';
  const btnIna = 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ═══ 今日の難単語（横長） ═══ */}
        <div className="bg-white rounded-xl shadow-md px-6 py-4 max-w-[450px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <span className="font-semibold text-gray-700 text-sm whitespace-nowrap">今日の難単語</span>
            </div>

            {loading ? (
              <span className="text-sm text-gray-400 flex-1">読み込み中...</span>
            ) : dailyWord ? (
              <div className="flex flex-col flex-1 min-w-0 items-center">
                {(() => {
                  const pm = parseIdiomNotation(dailyWord.意味);
                  return <span className="text-xl font-bold text-gray-800">{pm.isIdiom ? pm.displayWord : dailyWord.単語}</span>;
                })()}
                {(() => {
                  const src = getDailyWordSource(dailyWord);
                  return src ? <span className="text-xs text-gray-400 mt-0.5">{src}</span> : null;
                })()}
              </div>
            ) : (
              <span className="text-sm text-gray-400 flex-1">データを取得できませんでした</span>
            )}

            {dailyWord && !loading && (
              <button
                onClick={() => setShowDailyWordModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors text-sm shrink-0"
              >
                意味を見る
              </button>
            )}
          </div>
        </div>

        {/* ═══ 中段: 3カラム ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── 左: 名称から検索 ── */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col gap-5">
            <h2 className="text-base font-bold text-gray-800">名称から検索</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">大学名で検索</label>
              <div className="relative" ref={uniInputRef}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={uniInput}
                    onChange={e => { setUniInput(e.target.value); setShowUniSug(true); }}
                    onFocus={() => setShowUniSug(true)}
                    onCompositionStart={() => { isComposingRef.current = true; }}
                    onCompositionEnd={() => { isComposingRef.current = false; }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !isComposingRef.current && uniInput.trim()) {
                        router.push(`/unilist?q=${encodeURIComponent(uniInput.trim())}`);
                        setShowUniSug(false);
                      }
                    }}
                    placeholder="例: 東京大学"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={() => {
                      if (uniInput.trim()) router.push(`/unilist?q=${encodeURIComponent(uniInput.trim())}`);
                      setShowUniSug(false);
                    }}
                    disabled={!uniInput.trim()}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >GO</button>
                </div>

                {showUniSug && uniSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {uniSuggestions.map(u => (
                      <button key={u.コード}
                        onMouseDown={() => {
                          router.push(`/university/${u.コード}`);
                          setShowUniSug(false);
                          setUniInput('');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-2"
                      >
                        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${u.区分 === '国公立' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {u.区分}
                        </span>
                        {u.名称}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">地方を選ぶ</label>
              <div className="flex flex-wrap gap-1.5">
                {['北海道','東北','北関東','南関東','甲信越','北陸','東海','関西','中国','四国','九州・沖縄'].map(r => (
                  <button key={r}
                    onClick={() => router.push(`/unilist?region=${encodeURIComponent(r)}`)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                  >{r}</button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-100">
              <button
                onClick={() => router.push('/unilist?category=国公立')}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                <span>国公立大学をすべて見る</span>
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => router.push('/unilist?category=私立')}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                <span>私立大学をすべて見る</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* ── 中央: 形式から検索 ── */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col gap-4">
            <h2 className="text-base font-bold text-gray-800">形式から検索</h2>

            {/* 試験区分 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">試験区分</label>
              <div className="flex gap-2">
                {['国公立', '私立'].map(t => (
                  <button key={t} onClick={() => toggleArr(setExamTypes, examTypes, t)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${examTypes.includes(t) ? btnAct : btnIna}`}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* リーディング */}
            <div>
              <label className="block text-xs font-semibold text-emerald-600 mb-1.5">📖 リーディング</label>
              <div className="space-y-1.5 pl-1">
                {[
                  ['日本語記述', readingBunshoJp, setReadingBunshoJp],
                  ['英語記述',   readingBunshoEn, setReadingBunshoEn],
                ].map(([label, val, setter]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                    <div className="flex gap-1">
                      {PRESENCE_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => setter(opt)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${val === opt ? btnAct : btnIna}`}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ライティング */}
            <div>
              <label className="block text-xs font-semibold text-yellow-600 mb-1.5">✏️ ライティング</label>
              <div className="flex gap-1 mb-1.5">
                {PRESENCE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setWritingFilter(opt); if (opt !== 'あり') setWritingTypes([]); }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${writingFilter === opt ? btnAct : btnIna}`}
                  >{opt}</button>
                ))}
              </div>
              {writingFilter === 'あり' && (
                <div className="flex flex-wrap gap-1 pl-2 border-l-2 border-emerald-200">
                  {WRITING_TYPES.map(t => (
                    <button key={t} onClick={() => toggleArr(setWritingTypes, writingTypes, t)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${writingTypes.includes(t) ? btnAct : btnIna}`}
                    >{t}</button>
                  ))}
                </div>
              )}
            </div>

            {/* リスニング */}
            <div>
              <label className="block text-xs font-semibold text-purple-600 mb-1.5">🎧 リスニング</label>
              <div className="flex gap-1 mb-1.5">
                {PRESENCE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setListeningFilter(opt); if (opt !== 'あり') setListeningFormats([]); }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${listeningFilter === opt ? btnAct : btnIna}`}
                  >{opt}</button>
                ))}
              </div>
              {listeningFilter === 'あり' && (
                <div className="flex flex-wrap gap-1 pl-2 border-l-2 border-emerald-200">
                  {LISTENING_FORMATS.map(f => (
                    <button key={f} onClick={() => toggleArr(setListeningFormats, listeningFormats, f)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${listeningFormats.includes(f) ? btnAct : btnIna}`}
                    >{f}</button>
                  ))}
                </div>
              )}
            </div>

            {/* 文法 */}
            <div>
              <label className="block text-xs font-semibold text-orange-600 mb-1.5">📝 文法問題</label>
              <div className="flex gap-1 mb-1.5">
                {PRESENCE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setGrammarFilter(opt); if (opt !== 'あり') setGrammarTypes([]); }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${grammarFilter === opt ? btnAct : btnIna}`}
                  >{opt}</button>
                ))}
              </div>
              {grammarFilter === 'あり' && (
                <div className="flex flex-wrap gap-1 pl-2 border-l-2 border-emerald-200">
                  {GRAMMAR_TYPES.map(t => (
                    <button key={t} onClick={() => toggleArr(setGrammarTypes, grammarTypes, t)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${grammarTypes.includes(t) ? btnAct : btnIna}`}
                    >{t}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
              <button
                onClick={handleExamSearch}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Search size={15} />
                条件に合う試験を表示
              </button>
              <Link href="/search" className="block text-center text-xs text-emerald-600 hover:underline py-1">
                長文をもっと詳細に検索 →
              </Link>
            </div>
          </div>

          {/* ── 右: 単語検索 ── */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col gap-6">
            <h2 className="text-base font-bold text-gray-800">単語検索</h2>

            {/* 単語を調べる */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">単語を調べる</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={wordInput}
                  onChange={e => setWordInput(e.target.value)}
                  onCompositionStart={() => { isComposingRef.current = true; }}
                  onCompositionEnd={() => { isComposingRef.current = false; }}
                  onKeyDown={e => { if (e.key === 'Enter' && !isComposingRef.current && wordInput.trim()) router.push(`/words?q=${encodeURIComponent(wordInput.trim())}`); }}
                  placeholder="例: abandon"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  onClick={() => { if (wordInput.trim()) router.push(`/words?q=${encodeURIComponent(wordInput.trim())}`); }}
                  disabled={!wordInput.trim()}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >GO</button>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 単語帳比較 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">単語帳比較</label>
              <div className="flex flex-col gap-2">
                {[[compareBook1, setCompareBook1], [compareBook2, setCompareBook2], [compareBook3, setCompareBook3]].map(([val, setter], i) => (
                  <select key={i} value={val} onChange={e => setter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">（選択なし）</option>
                    {availableBooks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                ))}
                <button
                  onClick={() => {
                    const p = new URLSearchParams({ mode: 'compare' });
                    if (compareBook1) p.set('book1', compareBook1);
                    if (compareBook2) p.set('book2', compareBook2);
                    if (compareBook3) p.set('book3', compareBook3);
                    router.push(`/words?${p.toString()}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors mt-1"
                >
                  <BookOpen size={14} />
                  比較する
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 大学別検索 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">大学別検索</label>
              <div className="relative" ref={uniWordInputRef}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={uniWordInput}
                    onChange={e => { setUniWordInput(e.target.value); setShowUniWordSug(true); }}
                    onFocus={() => setShowUniWordSug(true)}
                    onCompositionStart={() => { isComposingRef.current = true; }}
                    onCompositionEnd={() => { isComposingRef.current = false; }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !isComposingRef.current && uniWordValid) {
                        router.push(`/words?mode=university&univ=${encodeURIComponent(uniWordInput.trim())}`);
                        setShowUniWordSug(false);
                      }
                    }}
                    placeholder="例: 東京大学"
                    className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${uniWordNoData ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  <button
                    onClick={() => {
                      if (uniWordValid) {
                        router.push(`/words?mode=university&univ=${encodeURIComponent(uniWordInput.trim())}`);
                        setShowUniWordSug(false);
                      }
                    }}
                    disabled={!uniWordValid}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >GO</button>
                </div>
                {uniWordNoData && (
                  <p className="text-xs text-red-500 mt-1">データがありません</p>
                )}
                {showUniWordSug && uniWordSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {uniWordSuggestions.map(name => (
                      <button key={name}
                        onMouseDown={() => { setUniWordInput(name); setShowUniWordSug(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
                      >{name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 最新記事（準備中） ═══ */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">最新記事</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-gray-100 h-36 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-300" />
                </div>
                <div className="p-4">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">記事コンテンツを準備中です</p>
        </div>
      </div>

      {/* ═══ 今日の難単語モーダル ═══ */}
      {showDailyWordModal && dailyWord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-emerald-50">
              <div className="flex items-center justify-between">
                {(() => {
                  const pm = parseIdiomNotation(dailyWord.意味);
                  return <h3 className="text-2xl font-bold text-gray-900">{pm.isIdiom ? pm.displayWord : dailyWord.単語}</h3>;
                })()}
                <button onClick={() => setShowDailyWordModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* 品詞と意味 */}
              {(() => {
                const pm = parseIdiomNotation(dailyWord.意味);
                return (
                  <div className="mb-6">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-white bg-emerald-600 px-2 py-0.5 rounded">{dailyWord.品詞 || 'その他'}</span>
                        </div>
                        <div className="text-base text-gray-800">
                          <span>{pm.displayMeaning}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 出現した大問 */}
              {(() => {
                if (!dailyWord.大問IDs.length || !mondaiData.length) return null;
                const list = dailyWord.大問IDs
                  .map(id => mondaiData.find(m => m.大問ID === id)).filter(Boolean)
                  .sort((a, b) => parseInt(b.年度) - parseInt(a.年度));
                if (!list.length) return null;
                return (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">出現した大問</h4>
                    <div className="space-y-2">
                      {list.map((m, idx) => (
                        <Link key={idx} href={`/mondai/${m.識別名}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                          onClick={() => setShowDailyWordModal(false)}
                        >
                          <div className="text-sm font-medium text-gray-900">{m.年度} {m.大学名} {m.学部} {m.大問名}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 単語帳掲載状況 */}
              {(() => {
                const statuses = getBookStatuses(dailyWord.単語);
                if (!statuses.length) return null;
                return (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">「{dailyWord.単語}」の単語帳掲載状況</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      {statuses.map((item, idx) => {
                        const amazonLink = getAmazonLinkByBookName(tangochoMaster, item.book);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className={`font-bold ${item.status === 'main' ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {item.status === 'main' ? '◯' : '△'}
                            </span>
                            {amazonLink
                              ? <a href={amazonLink} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 hover:underline">{item.book}</a>
                              : <span>{item.book}</span>}
                            {(item.number || item.page) && (
                              <span className="text-xs text-gray-400">
                                {item.number && `No.${item.number}`}
                                {item.number && item.page && ' / '}
                                {item.page && `p.${item.page}`}
                                {item.headword && ` (${item.headword})`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowDailyWordModal(false)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
              >閉じる</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
