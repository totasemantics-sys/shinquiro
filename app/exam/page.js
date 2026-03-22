'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, Search, BookOpen, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { loadAllData } from '@/lib/loadData';
import { loadExamData } from '@/lib/loadExamData';
import { loadWritingData } from '@/lib/loadWritingData';
import { loadListeningData, parseAnswerFormats } from '@/lib/loadListeningData';
import { loadGrammarData } from '@/lib/loadGrammarData';

// ─── 定数 ────────────────────────────────────────────────
const EXAM_TYPES       = ['国公立', '私立', '共通テスト', '資格'];
const WRITING_TYPES    = ['和文英訳', '自由英作文(100語未満)', '自由英作文(100語以上)'];
const LISTENING_FORMATS = ['選択問題', '日本語記述', '英語記述'];
const GRAMMAR_TYPES    = ['空所選択補充', '語句整序', '誤文訂正', '発音・アクセント'];
const PRESENCE_OPTIONS = ['あり', 'どちらでも', 'なし'];

const PROBLEM_TYPES_SEARCH = [
  { key: 'writing',   label: 'ライティング' },
  { key: 'listening', label: 'リスニング' },
  { key: 'grammar',   label: '文法' },
];

// ─── ヘルパー ──────────────────────────────────────────────
const examTypeBadgeClass = (type) => {
  const map = {
    '国公立':     'bg-blue-100 text-blue-800',
    '私立':       'bg-purple-100 text-purple-800',
    '共通テスト': 'bg-teal-100 text-teal-800',
    '資格':       'bg-orange-100 text-orange-800',
  };
  return map[type] || 'bg-gray-100 text-gray-700';
};

// ─── 共通フィルター UI コンポーネント ──────────────────────
function CommonFilters({ examTypes, setExamTypes, yearRange, setYearRange, availableYears }) {
  const btnActive   = 'bg-emerald-600 text-white';
  const btnInactive = 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  const toggle = (setter, current, value) =>
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
      <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-3">共通フィルター</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">試験区分</label>
        <div className="flex flex-wrap gap-2">
          {EXAM_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggle(setExamTypes, examTypes, type)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                examTypes.includes(type) ? btnActive : btnInactive
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">年度</label>
        <div className="flex items-center gap-2">
          <select
            value={yearRange[0]}
            onChange={e => setYearRange([e.target.value, yearRange[1]])}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">下限なし</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-gray-500 text-sm">〜</span>
          <select
            value={yearRange[1]}
            onChange={e => setYearRange([yearRange[0], e.target.value])}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">上限なし</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-sm text-gray-500">年度</span>
        </div>
      </div>
    </div>
  );
}

// ─── URLパラメータ → フィルター初期値のヘルパー ───────────
const parsePipe = (val) => val ? val.split('|').filter(Boolean) : [];
const parsePresence = (val) =>
  (val === 'あり' || val === 'なし') ? val : 'どちらでも';

// ─── メインコンポーネント ──────────────────────────────────
export default function ExamPage() {
  const searchParams = useSearchParams();

  // URLパラメータから初期値を決定
  const initTab       = searchParams.get('tab') === 'exam' ? 'exam' : 'search';
  const initCategory  = parsePipe(searchParams.get('category'));
  const initReadingJp = parsePresence(searchParams.get('reading_jp'));
  const initReadingEn = parsePresence(searchParams.get('reading_en'));
  const initWriting   = parsePresence(searchParams.get('writing'));
  const initWritingType   = parsePipe(searchParams.get('writing_type'));
  const initListening = parsePresence(searchParams.get('listening'));
  const initListeningType = parsePipe(searchParams.get('listening_type'));
  const initGrammar   = parsePresence(searchParams.get('grammar'));
  const initGrammarType   = parsePipe(searchParams.get('grammar_type'));

  const [activeTab, setActiveTab] = useState(initTab); // 'search' | 'exam'

  // ── データ
  const [examData,      setExamData]      = useState([]);
  const [readingData,   setReadingData]   = useState([]);
  const [setsumonData,  setSetsumonData]  = useState([]);
  const [writingData,   setWritingData]   = useState([]);
  const [listeningData, setListeningData] = useState([]);
  const [grammarData,   setGrammarData]   = useState([]);
  const [loading,       setLoading]       = useState(true);

  // ── 「大問で探す」フィルター
  const [s_examTypes,        setS_ExamTypes]        = useState([]);
  const [s_yearRange,        setS_YearRange]        = useState(['', '']);
  const [s_problemType,      setS_ProblemType]      = useState('');
  const [s_writingTypes,     setS_WritingTypes]     = useState([]);
  const [s_listeningFormats, setS_ListeningFormats] = useState([]);
  const [s_grammarTypes,     setS_GrammarTypes]     = useState([]);
  const [s_results,          setS_Results]          = useState([]);

  // ── 「試験で探す」フィルター（URLパラメータで初期値を設定）
  const [e_examTypes,  setE_ExamTypes]  = useState(initCategory);
  const [e_yearRange,  setE_YearRange]  = useState(['', '']);
  const [e_reading,    setE_Reading]    = useState({
    wordCountMin: '', wordCountMax: '',
    bunshoJapanese: initReadingJp, bunshoEnglish: initReadingEn,
  });
  const [e_writing,    setE_Writing]    = useState({ filter: initWriting,   types: initWritingType });
  const [e_listening,  setE_Listening]  = useState({ filter: initListening, formats: initListeningType });
  const [e_grammar,    setE_Grammar]    = useState({ filter: initGrammar,   types: initGrammarType });
  const [e_results,    setE_Results]    = useState([]);

  // データ読み込み
  useEffect(() => {
    async function load() {
      const [allData, exam, writing, listening, grammar] = await Promise.all([
        loadAllData(),
        loadExamData(),
        loadWritingData(),
        loadListeningData(),
        loadGrammarData(),
      ]);
      setReadingData(allData.reading);
      setSetsumonData(allData.setsumon);
      setExamData(exam);
      setWritingData(writing);
      setListeningData(listening);
      setGrammarData(grammar);
      setLoading(false);
    }
    load();
  }, []);

  const availableYears = useMemo(() =>
    [...new Set(examData.map(e => e.年度).filter(Boolean))].sort((a, b) => b - a),
    [examData]
  );

  const examMap = useMemo(() =>
    Object.fromEntries(examData.map(e => [e.試験ID, e])),
    [examData]
  );

  // ── 「大問で探す」検索
  const btnActive   = 'bg-emerald-600 text-white';
  const btnInactive = 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  const toggleS = (setter, current, value) =>
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);

  const handleProblemTypeChange = (type) => {
    setS_ProblemType(type);
    setS_WritingTypes([]);
    setS_ListeningFormats([]);
    setS_GrammarTypes([]);
  };

  useEffect(() => {
    if (!s_problemType) { setS_Results([]); return; }

    let source = [];
    if (s_problemType === 'writing')   source = writingData;
    if (s_problemType === 'listening') source = listeningData;
    if (s_problemType === 'grammar')   source = grammarData;

    let filtered = source.map(row => {
      const examId = row.識別名 ? row.識別名.split('_')[0] : '';
      return { ...(examMap[examId] || {}), ...row };
    });

    if (s_examTypes.length > 0)
      filtered = filtered.filter(r => s_examTypes.includes(r.試験区分));
    if (s_yearRange[0])
      filtered = filtered.filter(r => parseInt(r.年度) >= parseInt(s_yearRange[0]));
    if (s_yearRange[1])
      filtered = filtered.filter(r => parseInt(r.年度) <= parseInt(s_yearRange[1]));
    if (s_problemType === 'writing' && s_writingTypes.length > 0)
      filtered = filtered.filter(r => s_writingTypes.includes(r.英作文タイプ));
    if (s_problemType === 'listening' && s_listeningFormats.length > 0)
      filtered = filtered.filter(r => {
        const fmts = parseAnswerFormats(r.解答形式);
        return s_listeningFormats.some(f => fmts.includes(f));
      });
    if (s_problemType === 'grammar' && s_grammarTypes.length > 0)
      filtered = filtered.filter(r => s_grammarTypes.includes(r.問題タイプ));

    filtered.sort((a, b) => parseInt(b.年度) - parseInt(a.年度));
    setS_Results(filtered);
  }, [s_problemType, s_examTypes, s_yearRange, s_writingTypes, s_listeningFormats,
      s_grammarTypes, writingData, listeningData, grammarData, examMap]);

  // ── 「試験で探す」検索
  useEffect(() => {
    if (examData.length === 0) { setE_Results([]); return; }

    // 試験IDごとに大問をグルーピング
    const readingByExam  = {};
    const writingByExam  = {};
    const listeningByExam = {};
    const grammarByExam  = {};

    readingData.forEach(r => {
      const id = r.試験ID || (r.識別名 ? r.識別名.split('_')[0] : '');
      if (!readingByExam[id]) readingByExam[id] = [];
      readingByExam[id].push(r);
    });
    writingData.forEach(r => {
      const id = r.識別名 ? r.識別名.split('_')[0] : '';
      if (!writingByExam[id]) writingByExam[id] = [];
      writingByExam[id].push(r);
    });
    listeningData.forEach(r => {
      const id = r.識別名 ? r.識別名.split('_')[0] : '';
      if (!listeningByExam[id]) listeningByExam[id] = [];
      listeningByExam[id].push(r);
    });
    grammarData.forEach(r => {
      const id = r.識別名 ? r.識別名.split('_')[0] : '';
      if (!grammarByExam[id]) grammarByExam[id] = [];
      grammarByExam[id].push(r);
    });

    // 設問データを大問IDで引けるようにする
    const setsumonByMondaiId = {};
    setsumonData.forEach(s => {
      if (!setsumonByMondaiId[s.大問ID]) setsumonByMondaiId[s.大問ID] = [];
      setsumonByMondaiId[s.大問ID].push(s);
    });

    let results = examData.map(exam => {
      const id = exam.試験ID;
      const readingRows   = readingByExam[id]   || [];
      const writingRows   = writingByExam[id]   || [];
      const listeningRows = listeningByExam[id] || [];
      const grammarRows   = grammarByExam[id]   || [];

      // リーディング集計
      const totalWords = readingRows.reduce((sum, r) => sum + (parseInt(r.本文語数) || 0), 0);

      // 各reading行が日本語/英語記述を持つか
      const readingWithJp = new Set();
      const readingWithEn = new Set();
      readingRows.forEach(r => {
        const setsumons = setsumonByMondaiId[r.大問ID] || [];
        if (setsumons.some(s => s.設問カテゴリ === '文章記述(日)')) readingWithJp.add(r.大問ID);
        if (setsumons.some(s => s.設問カテゴリ === '文章記述(英)')) readingWithEn.add(r.大問ID);
      });
      const hasJapanese = readingWithJp.size > 0;
      const hasEnglish  = readingWithEn.size > 0;

      return {
        exam, id, readingRows, writingRows, listeningRows, grammarRows,
        totalWords, hasJapanese, hasEnglish, readingWithJp, readingWithEn,
      };
    });

    // ── フィルタリング

    // 試験区分
    if (e_examTypes.length > 0)
      results = results.filter(r => e_examTypes.includes(r.exam.試験区分));

    // 年度
    if (e_yearRange[0])
      results = results.filter(r => parseInt(r.exam.年度) >= parseInt(e_yearRange[0]));
    if (e_yearRange[1])
      results = results.filter(r => parseInt(r.exam.年度) <= parseInt(e_yearRange[1]));

    // リーディング: 合計語数
    if (e_reading.wordCountMin !== '')
      results = results.filter(r => r.totalWords >= parseInt(e_reading.wordCountMin));
    if (e_reading.wordCountMax !== '')
      results = results.filter(r => r.totalWords <= parseInt(e_reading.wordCountMax));

    // リーディング: 日本語記述
    if (e_reading.bunshoJapanese === 'あり')
      results = results.filter(r => r.hasJapanese);
    if (e_reading.bunshoJapanese === 'なし')
      results = results.filter(r => !r.hasJapanese);

    // リーディング: 英語記述
    if (e_reading.bunshoEnglish === 'あり')
      results = results.filter(r => r.hasEnglish);
    if (e_reading.bunshoEnglish === 'なし')
      results = results.filter(r => !r.hasEnglish);

    // ライティング
    if (e_writing.filter === 'あり') {
      results = results.filter(r => {
        if (r.writingRows.length === 0) return false;
        if (e_writing.types.length === 0) return true;
        return r.writingRows.some(w => e_writing.types.includes(w.英作文タイプ));
      });
    } else if (e_writing.filter === 'なし') {
      results = results.filter(r => r.writingRows.length === 0);
    }

    // リスニング
    if (e_listening.filter === 'あり') {
      results = results.filter(r => {
        if (r.listeningRows.length === 0) return false;
        if (e_listening.formats.length === 0) return true;
        return r.listeningRows.some(l => {
          const fmts = parseAnswerFormats(l.解答形式);
          return e_listening.formats.some(f => fmts.includes(f));
        });
      });
    } else if (e_listening.filter === 'なし') {
      results = results.filter(r => r.listeningRows.length === 0);
    }

    // 文法
    if (e_grammar.filter === 'あり') {
      results = results.filter(r => {
        if (r.grammarRows.length === 0) return false;
        if (e_grammar.types.length === 0) return true;
        return r.grammarRows.some(g => e_grammar.types.includes(g.問題タイプ));
      });
    } else if (e_grammar.filter === 'なし') {
      results = results.filter(r => r.grammarRows.length === 0);
    }

    // 年度降順ソート
    results.sort((a, b) => parseInt(b.exam.年度) - parseInt(a.exam.年度));
    setE_Results(results);
  }, [examData, readingData, setsumonData, writingData, listeningData, grammarData,
      e_examTypes, e_yearRange, e_reading, e_writing, e_listening, e_grammar]);

  // ── ハイライト判定 ─────────────────────────────────────
  // 条件に直接ヒットした大問IDのSetを返す
  const getHitIds = (entry) => {
    const hits = new Set();

    // リーディング
    const readingActive =
      e_reading.wordCountMin !== '' || e_reading.wordCountMax !== '' ||
      e_reading.bunshoJapanese !== 'どちらでも' || e_reading.bunshoEnglish !== 'どちらでも';

    if (readingActive) {
      entry.readingRows.forEach(r => {
        let match = true;
        if (e_reading.bunshoJapanese === 'あり' && !entry.readingWithJp.has(r.大問ID)) match = false;
        if (e_reading.bunshoJapanese === 'なし' &&  entry.readingWithJp.has(r.大問ID)) match = false;
        if (e_reading.bunshoEnglish  === 'あり' && !entry.readingWithEn.has(r.大問ID)) match = false;
        if (e_reading.bunshoEnglish  === 'なし' &&  entry.readingWithEn.has(r.大問ID)) match = false;
        if (match) hits.add(r.大問ID);
      });
    }

    // ライティング
    if (e_writing.filter === 'あり') {
      entry.writingRows.forEach(w => {
        if (e_writing.types.length === 0 || e_writing.types.includes(w.英作文タイプ))
          hits.add(w.大問ID);
      });
    }

    // リスニング
    if (e_listening.filter === 'あり') {
      entry.listeningRows.forEach(l => {
        const fmts = parseAnswerFormats(l.解答形式);
        if (e_listening.formats.length === 0 || e_listening.formats.some(f => fmts.includes(f)))
          hits.add(l.大問ID);
      });
    }

    // 文法
    if (e_grammar.filter === 'あり') {
      entry.grammarRows.forEach(g => {
        if (e_grammar.types.length === 0 || e_grammar.types.includes(g.問題タイプ))
          hits.add(g.大問ID);
      });
    }

    return hits;
  };

  // ── ユーティリティ ────────────────────────────────────
  const togglePresence = (setter, current, field, value) =>
    setter({ ...current, [field]: value });

  const toggleArr = (setter, current, field, value) =>
    setter({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter(v => v !== value)
        : [...current[field], value],
    });

  // ── レンダリング ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header pageTitle="試験検索" pageDescription="シンキロウ/条件に合った試験を絞り込み" />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* タブ切替 */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-md p-1 w-fit">
          {[['search', '大問で探す'], ['exam', '試験で探す']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-emerald-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            「大問で探す」タブ
        ══════════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <CommonFilters
              examTypes={s_examTypes} setExamTypes={setS_ExamTypes}
              yearRange={s_yearRange} setYearRange={setS_YearRange}
              availableYears={availableYears}
            />

            {/* 問題タイプ */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">問題タイプを選択</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {PROBLEM_TYPES_SEARCH.map(pt => (
                  <button
                    key={pt.key}
                    onClick={() => handleProblemTypeChange(s_problemType === pt.key ? '' : pt.key)}
                    className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      s_problemType === pt.key ? btnActive : btnInactive
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                リーディングの検索は
                <Link href="/search" className="text-emerald-600 hover:underline mx-1">長文詳細検索</Link>
                をご利用ください
              </p>
            </div>

            {/* 固有フィルター */}
            {s_problemType === 'writing' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">英作文タイプ</h2>
                <div className="flex flex-wrap gap-2">
                  {WRITING_TYPES.map(type => (
                    <button key={type}
                      onClick={() => toggleS(setS_WritingTypes, s_writingTypes, type)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        s_writingTypes.includes(type) ? btnActive : btnInactive
                      }`}
                    >{type}</button>
                  ))}
                </div>
              </div>
            )}
            {s_problemType === 'listening' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">解答形式</h2>
                <div className="flex flex-wrap gap-2">
                  {LISTENING_FORMATS.map(fmt => (
                    <button key={fmt}
                      onClick={() => toggleS(setS_ListeningFormats, s_listeningFormats, fmt)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        s_listeningFormats.includes(fmt) ? btnActive : btnInactive
                      }`}
                    >{fmt}</button>
                  ))}
                </div>
              </div>
            )}
            {s_problemType === 'grammar' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">問題タイプ</h2>
                <div className="flex flex-wrap gap-2">
                  {GRAMMAR_TYPES.map(type => (
                    <button key={type}
                      onClick={() => toggleS(setS_GrammarTypes, s_grammarTypes, type)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        s_grammarTypes.includes(type) ? btnActive : btnInactive
                      }`}
                    >{type}</button>
                  ))}
                </div>
              </div>
            )}

            {/* 結果 */}
            {s_problemType ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    検索結果：<span className="font-bold text-emerald-600 text-lg ml-1">{s_results.length}</span> 件
                  </p>
                  {loading && <span className="text-xs text-gray-400">読み込み中...</span>}
                </div>
                {s_results.length === 0 && !loading ? (
                  <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-400">
                    <Search size={36} className="mx-auto mb-3 text-gray-200" />
                    <p>条件に合う大問が見つかりませんでした</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {s_results.map((row, index) => (
                      <div key={row.大問ID}
                        className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${
                          index !== 0 ? 'border-t border-gray-100' : ''
                        }`}
                      >
                        {/* 1行目: 区分・大学名・年度 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {row.試験区分 && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${examTypeBadgeClass(row.試験区分)}`}>
                              {row.試験区分}
                            </span>
                          )}
                          <span className="font-medium text-gray-800">{row.大学名}</span>
                          <span className="text-gray-500">{row.年度}</span>
                          {row.日程 && <span className="text-gray-400">{row.日程}</span>}
                          {row.方式 && <span className="text-gray-400">{row.方式}</span>}
                          {row.学部 && <span className="text-gray-400">{row.学部}</span>}
                        </div>
                        {/* 2行目: 大問番号・問題タイプ・Amazon */}
                        <div className="flex items-center gap-2 sm:ml-auto">
                          <span className="text-gray-300 hidden sm:inline">|</span>
                          <span className="text-gray-700">{row.大問番号}</span>
                          <span className="text-gray-500">
                            {s_problemType === 'writing' && row.英作文タイプ}
                            {s_problemType === 'listening' && row.解答形式}
                            {s_problemType === 'grammar' && row.問題タイプ}
                          </span>
                          {row.ASIN && (
                            <a href={`https://www.amazon.co.jp/dp/${row.ASIN}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink size={12} />Amazon
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              !loading && (
                <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-400">
                  <p className="text-sm">問題タイプを選択すると検索結果が表示されます</p>
                </div>
              )
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            「試験で探す」タブ
        ══════════════════════════════════════════════ */}
        {activeTab === 'exam' && (
          <div className="space-y-4">
            <CommonFilters
              examTypes={e_examTypes} setExamTypes={setE_ExamTypes}
              yearRange={e_yearRange} setYearRange={setE_YearRange}
              availableYears={availableYears}
            />

            {/* 4エリアフィルター */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
              <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-3">条件を設定</h2>

              {/* ── リーディング ── */}
              <section>
                <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-1">
                  <span>📖</span> リーディング
                </h3>
                <div className="space-y-3 pl-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600 w-24 shrink-0">合計語数</span>
                    <input
                      type="number" placeholder="下限なし"
                      value={e_reading.wordCountMin}
                      onChange={e => setE_Reading({ ...e_reading, wordCountMin: e.target.value })}
                      className="w-28 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="text-gray-400 text-sm">〜</span>
                    <input
                      type="number" placeholder="上限なし"
                      value={e_reading.wordCountMax}
                      onChange={e => setE_Reading({ ...e_reading, wordCountMax: e.target.value })}
                      className="w-28 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="text-sm text-gray-400">語</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600 w-24 shrink-0">日本語記述</span>
                    {PRESENCE_OPTIONS.map(opt => (
                      <button key={opt}
                        onClick={() => setE_Reading({ ...e_reading, bunshoJapanese: opt })}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          e_reading.bunshoJapanese === opt ? btnActive : btnInactive
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600 w-24 shrink-0">英語記述</span>
                    {PRESENCE_OPTIONS.map(opt => (
                      <button key={opt}
                        onClick={() => setE_Reading({ ...e_reading, bunshoEnglish: opt })}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          e_reading.bunshoEnglish === opt ? btnActive : btnInactive
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* ── ライティング ── */}
              <section>
                <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-1">
                  <span>✏️</span> ライティング
                </h3>
                <div className="space-y-3 pl-1">
                  <div className="flex flex-wrap gap-2">
                    {PRESENCE_OPTIONS.map(opt => (
                      <button key={opt}
                        onClick={() => togglePresence(setE_Writing, e_writing, 'filter', opt)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          e_writing.filter === opt ? btnActive : btnInactive
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                  {e_writing.filter === 'あり' && (
                    <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-emerald-200">
                      <span className="text-xs text-gray-500 w-full">英作文タイプ（複数選択可）</span>
                      {WRITING_TYPES.map(type => (
                        <button key={type}
                          onClick={() => toggleArr(setE_Writing, e_writing, 'types', type)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            e_writing.types.includes(type) ? btnActive : btnInactive
                          }`}
                        >{type}</button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* ── リスニング ── */}
              <section>
                <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-1">
                  <span>🎧</span> リスニング
                </h3>
                <div className="space-y-3 pl-1">
                  <div className="flex flex-wrap gap-2">
                    {PRESENCE_OPTIONS.map(opt => (
                      <button key={opt}
                        onClick={() => togglePresence(setE_Listening, e_listening, 'filter', opt)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          e_listening.filter === opt ? btnActive : btnInactive
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                  {e_listening.filter === 'あり' && (
                    <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-emerald-200">
                      <span className="text-xs text-gray-500 w-full">解答形式（複数選択可）</span>
                      {LISTENING_FORMATS.map(fmt => (
                        <button key={fmt}
                          onClick={() => toggleArr(setE_Listening, e_listening, 'formats', fmt)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            e_listening.formats.includes(fmt) ? btnActive : btnInactive
                          }`}
                        >{fmt}</button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* ── 文法 ── */}
              <section>
                <h3 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-1">
                  <span>📝</span> 文法問題
                </h3>
                <div className="space-y-3 pl-1">
                  <div className="flex flex-wrap gap-2">
                    {PRESENCE_OPTIONS.map(opt => (
                      <button key={opt}
                        onClick={() => togglePresence(setE_Grammar, e_grammar, 'filter', opt)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          e_grammar.filter === opt ? btnActive : btnInactive
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
                  {e_grammar.filter === 'あり' && (
                    <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-emerald-200">
                      <span className="text-xs text-gray-500 w-full">問題タイプ（複数選択可）</span>
                      {GRAMMAR_TYPES.map(type => (
                        <button key={type}
                          onClick={() => toggleArr(setE_Grammar, e_grammar, 'types', type)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            e_grammar.types.includes(type) ? btnActive : btnInactive
                          }`}
                        >{type}</button>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* 結果 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  検索結果：<span className="font-bold text-emerald-600 text-lg ml-1">{e_results.length}</span> 件
                </p>
                {loading && <span className="text-xs text-gray-400">読み込み中...</span>}
              </div>

              {e_results.length === 0 && !loading ? (
                <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-400">
                  <Search size={36} className="mx-auto mb-3 text-gray-200" />
                  <p>条件に合う試験が見つかりませんでした</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {e_results.map(entry => {
                    const { exam, readingRows, writingRows, listeningRows, grammarRows, totalWords } = entry;
                    const hitIds = getHitIds(entry);
                    const hasAnyFilter =
                      e_writing.filter !== 'どちらでも' || e_listening.filter !== 'どちらでも' ||
                      e_grammar.filter !== 'どちらでも' ||
                      e_reading.wordCountMin !== '' || e_reading.wordCountMax !== '' ||
                      e_reading.bunshoJapanese !== 'どちらでも' || e_reading.bunshoEnglish !== 'どちらでも';

                    return (
                      <div key={exam.試験ID}
                        className="bg-white rounded-xl shadow-md border border-transparent hover:border-emerald-200 hover:shadow-lg transition-all overflow-hidden"
                      >
                        {/* 試験ヘッダー */}
                        <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {exam.試験区分 && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${examTypeBadgeClass(exam.試験区分)}`}>
                                {exam.試験区分}
                              </span>
                            )}
                            <span className="font-bold text-gray-800 text-base">{exam.大学名}</span>
                            <span className="text-gray-600 text-sm">{exam.年度}年度</span>
                            {exam.日程 && <span className="text-gray-500 text-sm">{exam.日程}</span>}
                            {exam.方式 && <span className="text-gray-500 text-sm">{exam.方式}</span>}
                            {exam.学部 && <span className="text-gray-400 text-sm">{exam.学部}</span>}
                            <div className="ml-auto flex items-center gap-3">
                              {exam.制限時間 && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock size={12} />{exam.制限時間}分
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {totalWords > 0
                                  ? `長文総語数:${totalWords}語`
                                  : '長文語数のデータなし'}
                              </span>
                              {exam.ASIN && (
                                <a href={`https://www.amazon.co.jp/dp/${exam.ASIN}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
                                >
                                  <ExternalLink size={12} />Amazon
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 大問一覧（大問番号の数値・アルファベット順） */}
                        {(() => {
                          // 各行に種別タグを付けてマージ
                          const allRows = [
                            ...readingRows.map(r => ({ ...r, _type: 'reading' })),
                            ...writingRows.map(w => ({ ...w, _type: 'writing' })),
                            ...listeningRows.map(l => ({ ...l, _type: 'listening' })),
                            ...grammarRows.map(g => ({ ...g, _type: 'grammar' })),
                          ];
                          // 大問番号でソート（例: "1A" → [1,"A"], "3" → [3,""]）
                          const parseNum = (n) => {
                            const m = String(n || '').match(/^(\d+)([A-Za-z]*)$/);
                            return m ? [parseInt(m[1]), m[2]] : [999, String(n || '')];
                          };
                          allRows.sort((a, b) => {
                            const [an, as] = parseNum(a.大問番号);
                            const [bn, bs] = parseNum(b.大問番号);
                            return an !== bn ? an - bn : as.localeCompare(bs);
                          });

                          const TYPE_STYLES = {
                            reading:   { emoji: '📖', label: '長文', hit: 'bg-emerald-50 border-l-4 border-emerald-400', badge: 'text-emerald-600 bg-emerald-100' },
                            writing:   { emoji: '✏️', label: '英作', hit: 'bg-yellow-50 border-l-4 border-yellow-400',   badge: 'text-yellow-700 bg-yellow-100' },
                            listening: { emoji: '🎧', label: 'リス', hit: 'bg-purple-50 border-l-4 border-purple-400',   badge: 'text-purple-700 bg-purple-100' },
                            grammar:   { emoji: '📝', label: '文法', hit: 'bg-orange-50 border-l-4 border-orange-400',   badge: 'text-orange-700 bg-orange-100' },
                          };

                          return (
                            <div className="divide-y divide-gray-50">
                              {allRows.map(row => {
                                const s = TYPE_STYLES[row._type];
                                // フィルター設定時のみハイライト判定
                                const rowClass = hasAnyFilter && hitIds.has(row.大問ID)
                                  ? s.hit
                                  : hasAnyFilter
                                    ? 'opacity-50'
                                    : '';
                                const isReadingLink = row._type === 'reading' && row.識別名;
                                const rowContent = <>
                                  <span className="text-base">{s.emoji}</span>
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${s.badge}`}>{s.label}</span>
                                  <span className="text-sm text-gray-700">{row.大問番号}</span>
                                  {row._type === 'reading' && <>
                                    <span className="text-sm text-gray-500">{row.本文語数}語</span>
                                    {row.本文レベル && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                                        Lv.{row.本文レベル}
                                      </span>
                                    )}
                                    {row.ジャンル && <span className="text-xs text-gray-400">{row.ジャンル}</span>}
                                  </>}
                                  {row._type === 'writing'   && <span className="text-sm text-gray-500">{row.英作文タイプ}</span>}
                                  {row._type === 'listening' && <span className="text-sm text-gray-500">{row.解答形式}</span>}
                                  {row._type === 'grammar'   && <span className="text-sm text-gray-500">{row.問題タイプ}</span>}
                                  {isReadingLink && <ExternalLink size={12} className="ml-auto text-gray-300 shrink-0" />}
                                </>;
                                return isReadingLink ? (
                                  <a key={row.大問ID}
                                    href={`/mondai/${row.識別名}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className={`flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-emerald-50 transition-colors cursor-pointer ${rowClass}`}
                                  >
                                    {rowContent}
                                  </a>
                                ) : (
                                  <div key={row.大問ID}
                                    className={`flex flex-wrap items-center gap-3 px-5 py-3 ${rowClass}`}
                                  >
                                    {rowContent}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
