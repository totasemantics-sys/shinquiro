'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Home, Clock, ExternalLink, Calendar, Tag, FileText } from 'lucide-react';
import { loadAllData, getUniversityName, getUniversityCodeFromId } from '@/lib/loadData';
import { loadExamData } from '@/lib/loadExamData';
import { loadWritingData } from '@/lib/loadWritingData';
import { loadListeningData, parseAnswerFormats } from '@/lib/loadListeningData';
import { loadGrammarData } from '@/lib/loadGrammarData';
import { loadKeywordData } from '@/lib/loadKeywordData';
import { parseIdiomNotation } from '@/lib/parseIdiomNotation';
import { loadArticlesData, getArticleImagePath } from '@/lib/loadArticlesData';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

function UniversityPageInner({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('exam'); // 'exam' | 'reading' | 'words' | 'info'

  // 試験形式タブ用データ
  const [allExamData,      setAllExamData]      = useState([]);
  const [allWritingData,   setAllWritingData]   = useState([]);
  const [allListeningData, setAllListeningData] = useState([]);
  const [allGrammarData,   setAllGrammarData]   = useState([]);

  // 試験形式タブ用 UI state
  const [selectedCombo, setSelectedCombo] = useState(''); // 日程・方式・学部の組み合わせ
  const [leftYear,      setLeftYear]      = useState('');
  const [rightYear,     setRightYear]     = useState('');

  // 単語情報タブ用state
  const [wordsKeywordData,    setWordsKeywordData]    = useState([]);
  const [wordsFilters,        setWordsFilters]        = useState({
    yearFrom: '', yearTo: '', nittei: [], houshiki: [], gakubu: [], partsOfSpeech: [], levels: []
  });
  const [wordsResults,        setWordsResults]        = useState([]);
  const [wordsDisplayCount,   setWordsDisplayCount]   = useState(50);
  const [wordsGroupByMeaning, setWordsGroupByMeaning] = useState(true);
  const [wordsGroupByPos,     setWordsGroupByPos]     = useState(true);
  const [showWordsModal,      setShowWordsModal]      = useState(false);
  const [wordsModalDetail,    setWordsModalDetail]    = useState(null);
  const [wordsModalMeanings,  setWordsModalMeanings]  = useState([]);
  const [wordsModalShowAll,   setWordsModalShowAll]   = useState(false);
  const [wordsSelectedWords,  setWordsSelectedWords]  = useState([]);

  // 基本情報タブ用state
  const [relatedArticles, setRelatedArticles] = useState([]);

  const [mondai, setMondai] = useState([]);
  const [filteredMondai, setFilteredMondai] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [universityName, setUniversityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState(null);
  const [hashtagsData, setHashtagsData] = useState([]);
  
  // フィルター状態
  const [filters, setFilters] = useState({
    年度: [],
    日程: [],
    方式: [],
    学部: []
  });

  // paramsを解決
  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams?.code) return;
    
    async function fetchData() {
      const data = await loadAllData();
      setUniversities(data.universities);
      setHashtagsData(data.hashtags || []);
      
      // 大学名を取得
      const name = getUniversityName(resolvedParams.code, data.universities);
      setUniversityName(name);
      
      // 該当する大学の全大問を取得
      const filtered = data.reading.filter(m => {
        const code = getUniversityCodeFromId(m.識別名, data.universities);
        return code === resolvedParams.code;
      });
      
      // 各大問に文章記述数を追加
      const enrichedMondai = filtered.map(m => {
        let bunshoJapanese = 0;
        let bunshoEnglish = 0;
        
        if (data.setsumon && Array.isArray(data.setsumon)) {
          const mondaiSetsumon = data.setsumon.filter(s => s.大問ID === m.大問ID);
          bunshoJapanese = mondaiSetsumon.filter(s => s.設問カテゴリ === '文章記述(日)').length;
          bunshoEnglish = mondaiSetsumon.filter(s => s.設問カテゴリ === '文章記述(英)').length;
        }
        
        return {
          ...m,
          年度: parseInt(m.年度),  
          文章記述日本語: bunshoJapanese,
          文章記述英語: bunshoEnglish
        };
      });
      
      setMondai(enrichedMondai);
      
      // URLパラメータから初期フィルタを設定
      const initialFilters = {
        年度: [],
        日程: [],
        方式: [],
        学部: []
      };
      
      const yearParam = searchParams.get('year');
      const gakubuParam = searchParams.get('gakubu');
      
      if (yearParam) {
        const year = parseInt(yearParam);
        if (!isNaN(year)) {
          initialFilters.年度 = [year];
        }
      }
      if (gakubuParam && gakubuParam.trim() !== '') {
        initialFilters.学部 = [decodeURIComponent(gakubuParam)];
      }
          
      setFilters(initialFilters);
      setLoading(false);
    }
    fetchData();
  }, [resolvedParams, searchParams]);

  // 試験形式タブ用データ読み込み
  useEffect(() => {
    if (!resolvedParams?.code) return;
    async function loadExamTabData() {
      const [exam, writing, listening, grammar] = await Promise.all([
        loadExamData(),
        loadWritingData(),
        loadListeningData(),
        loadGrammarData(),
      ]);
      setAllExamData(exam);
      setAllWritingData(writing);
      setAllListeningData(listening);
      setAllGrammarData(grammar);
    }
    loadExamTabData();
  }, [resolvedParams]);

  // 単語情報タブ用キーワードデータ読み込み
  useEffect(() => {
    if (!resolvedParams?.code) return;
    loadKeywordData().then(setWordsKeywordData);
  }, [resolvedParams]);

  // 基本情報タブ用記事データ読み込み
  useEffect(() => {
    if (!universityName) return;
    loadArticlesData().then(articles => {
      const matched = articles.filter(a => Array.isArray(a.tags) && a.tags.includes(universityName));
      // 新しい順にソート
      matched.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRelatedArticles(matched);
    });
  }, [universityName]);

  // フィルター処理
  useEffect(() => {
    if (!mondai || mondai.length === 0) {
      return;
    }
    
    let result = [...mondai];
    
    if (filters.年度.length > 0) {
      result = result.filter(m => filters.年度.includes(m.年度));
    }
    if (filters.日程.length > 0) {
      result = result.filter(m => filters.日程.includes(m.日程));
    }
    if (filters.方式.length > 0) {
      result = result.filter(m => filters.方式.includes(m.方式));
    }
    if (filters.学部.length > 0) {
      result = result.filter(m => filters.学部.includes(m.学部));
    }
    
    // デフォルトソート: 年度降順、同一年度内はID順
    result.sort((a, b) => {
      const yearDiff = b.年度 - a.年度;
      if (yearDiff !== 0) return yearDiff;
      // プレフィックス(R/W/L/G)を除去して数値比較
      return parseInt(a.大問ID.replace(/^[A-Z]+/, '')) - parseInt(b.大問ID.replace(/^[A-Z]+/, ''));
    });
    
    setFilteredMondai(result);
  }, [filters, mondai]);

  // フィルター選択肢を取得
  const getFilterOptions = (key) => {
    return [...new Set(mondai.map(m => m[key]).filter(Boolean))].sort((a, b) => {
      if (key === '年度') {
        return b - a; // 年度は降順
      }
      return String(a).localeCompare(String(b), 'ja');
    });
  };

  // フィルタートグル
  const toggleFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  // ハッシュタグを取得
  const getFirstHashtag = (mondaiId) => {
    const hashtag = hashtagsData.find(h => h.大問ID === mondaiId);
    return hashtag?.ハッシュタグ || null;
  };

  // ─── 試験形式タブ: 派生データ ────────────────────────────
  const uniExams = useMemo(() => {
    if (!universityName) return [];
    return allExamData.filter(e => e.大学名 === universityName);
  }, [allExamData, universityName]);

  const examCombos = useMemo(() => {
    const seen = new Set();
    const result = [];
    uniExams.forEach(e => {
      const key = `${e.日程 || ''}|${e.方式 || ''}|${e.学部 || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ key, 日程: e.日程 || '', 方式: e.方式 || '', 学部: e.学部 || '' });
      }
    });
    return result;
  }, [uniExams]);

  const yearsByCombo = useMemo(() => {
    const map = {};
    uniExams.forEach(e => {
      const key = `${e.日程 || ''}|${e.方式 || ''}|${e.学部 || ''}`;
      if (!map[key]) map[key] = new Set();
      map[key].add(parseInt(e.年度));
    });
    const result = {};
    Object.entries(map).forEach(([key, set]) => {
      result[key] = [...set].sort((a, b) => b - a);
    });
    return result;
  }, [uniExams]);

  const comboYears = useMemo(() =>
    yearsByCombo[selectedCombo] || [],
    [yearsByCombo, selectedCombo]
  );

  const readingByExamMap = useMemo(() => {
    const map = {};
    mondai.forEach(r => {
      const id = r.試験ID || (r.識別名 ? r.識別名.split('_')[0] : '');
      if (!map[id]) map[id] = [];
      map[id].push(r);
    });
    return map;
  }, [mondai]);

  const writingByExamMap = useMemo(() => {
    const map = {};
    allWritingData.forEach(w => {
      const id = w.識別名 ? w.識別名.split('_')[0] : '';
      if (!map[id]) map[id] = [];
      map[id].push(w);
    });
    return map;
  }, [allWritingData]);

  const listeningByExamMap = useMemo(() => {
    const map = {};
    allListeningData.forEach(l => {
      const id = l.識別名 ? l.識別名.split('_')[0] : '';
      if (!map[id]) map[id] = [];
      map[id].push(l);
    });
    return map;
  }, [allListeningData]);

  const grammarByExamMap = useMemo(() => {
    const map = {};
    allGrammarData.forEach(g => {
      const id = g.識別名 ? g.識別名.split('_')[0] : '';
      if (!map[id]) map[id] = [];
      map[id].push(g);
    });
    return map;
  }, [allGrammarData]);

  // selectedCombo のデフォルト設定
  useEffect(() => {
    if (examCombos.length === 0) return;
    setSelectedCombo(examCombos[0].key);
  }, [examCombos]);

  // leftYear / rightYear のデフォルト設定
  useEffect(() => {
    const years = yearsByCombo[selectedCombo] || [];
    setLeftYear(years[0] ? String(years[0]) : '');
    setRightYear(years[1] ? String(years[1]) : (years[0] ? String(years[0]) : ''));
  }, [selectedCombo, yearsByCombo]);

  // ─── 試験形式カード描画 ───────────────────────────────────
  const TYPE_STYLES_EXAM = {
    reading:   { emoji: '📖', label: '長文',  badge: 'text-emerald-600 bg-emerald-100' },
    writing:   { emoji: '✏️', label: '英作',  badge: 'text-yellow-700 bg-yellow-100' },
    listening: { emoji: '🎧', label: 'リス',  badge: 'text-purple-700 bg-purple-100' },
    grammar:   { emoji: '📝', label: '文法',  badge: 'text-orange-700 bg-orange-100' },
  };

  const parseExamNum = (n) => {
    const m = String(n || '').match(/^(\d+)([A-Za-z]*)$/);
    return m ? [parseInt(m[1]), m[2]] : [999, String(n || '')];
  };

  const renderExamCard = (year) => {
    if (!year || !selectedCombo) {
      return (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-400 text-sm">
          年度を選択してください
        </div>
      );
    }
    const [nittei, houshiki, gakubu] = selectedCombo.split('|');
    const exam = uniExams.find(e =>
      String(parseInt(e.年度)) === String(parseInt(year)) &&
      (e.日程 || '') === nittei &&
      (e.方式 || '') === houshiki &&
      (e.学部 || '') === gakubu
    );
    if (!exam) {
      return (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-400 text-sm">
          {year}年度のデータがありません
        </div>
      );
    }
    const id = exam.試験ID;
    const readingRows   = readingByExamMap[id]   || [];
    const writingRows   = writingByExamMap[id]   || [];
    const listeningRows = listeningByExamMap[id] || [];
    const grammarRows   = grammarByExamMap[id]   || [];
    const totalWords = readingRows.reduce((sum, r) => sum + (parseInt(r.本文語数) || 0), 0);

    const allRows = [
      ...readingRows.map(r => ({ ...r, _type: 'reading' })),
      ...writingRows.map(w => ({ ...w, _type: 'writing' })),
      ...listeningRows.map(l => ({ ...l, _type: 'listening' })),
      ...grammarRows.map(g => ({ ...g, _type: 'grammar' })),
    ];
    allRows.sort((a, b) => {
      const [an, as] = parseExamNum(a.大問番号);
      const [bn, bs] = parseExamNum(b.大問番号);
      return an !== bn ? an - bn : as.localeCompare(bs);
    });

    return (
      <div className="bg-white rounded-xl shadow-md border border-transparent overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-800 text-base">{year}年度</span>
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
                {totalWords > 0 ? `長文総語数:${totalWords}語` : '長文語数のデータなし'}
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
        <div className="divide-y divide-gray-50">
          {allRows.map(row => {
            const s = TYPE_STYLES_EXAM[row._type];
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
                className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                {rowContent}
              </a>
            ) : (
              <div key={row.大問ID} className="flex flex-wrap items-center gap-3 px-5 py-3">
                {rowContent}
              </div>
            );
          })}
          {allRows.length === 0 && (
            <div className="px-5 py-4 text-sm text-gray-400">大問データがありません</div>
          )}
        </div>
      </div>
    );
  };

  // ─── 単語情報タブ: 利用可能な選択肢 ─────────────────────────
  const wordsAvailableYears = useMemo(() =>
    [...new Set(mondai.map(m => parseInt(m.年度)).filter(Boolean))].sort((a, b) => b - a),
    [mondai]
  );
  const wordsAvailableNittei = useMemo(() =>
    [...new Set(mondai.map(m => m.日程).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja')),
    [mondai]
  );
  const wordsAvailableHoushiki = useMemo(() =>
    [...new Set(mondai.map(m => m.方式).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja')),
    [mondai]
  );
  const wordsAvailableGakubu = useMemo(() =>
    [...new Set(mondai.map(m => m.学部).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja')),
    [mondai]
  );
  const wordsAvailablePos = useMemo(() =>
    [...new Set(wordsKeywordData.map(k => k.品詞).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja')),
    [wordsKeywordData]
  );
  const isWordsFiltered = useMemo(() =>
    wordsFilters.yearFrom !== '' || wordsFilters.yearTo !== '' || wordsFilters.nittei.length > 0 ||
    wordsFilters.houshiki.length > 0 || wordsFilters.gakubu.length > 0,
    [wordsFilters]
  );

  // 単語情報タブ: 自動検索
  useEffect(() => {
    if (wordsKeywordData.length === 0 || mondai.length === 0) return;

    let filtered = [...mondai];
    if (wordsFilters.yearFrom) filtered = filtered.filter(m => parseInt(m.年度) >= parseInt(wordsFilters.yearFrom));
    if (wordsFilters.yearTo)   filtered = filtered.filter(m => parseInt(m.年度) <= parseInt(wordsFilters.yearTo));
    if (wordsFilters.nittei.length > 0)   filtered = filtered.filter(m => wordsFilters.nittei.includes(m.日程));
    if (wordsFilters.houshiki.length > 0) filtered = filtered.filter(m => wordsFilters.houshiki.includes(m.方式));
    if (wordsFilters.gakubu.length > 0)   filtered = filtered.filter(m => wordsFilters.gakubu.includes(m.学部));

    const filteredIds = new Set(filtered.map(m => m.大問ID));
    const allowedLevels = ['基礎', '標準', '上級', '修練'];
    let kw = wordsKeywordData.filter(k => filteredIds.has(k.大問ID) && allowedLevels.includes(k.レベル));

    if (wordsFilters.partsOfSpeech.length > 0) kw = kw.filter(k => wordsFilters.partsOfSpeech.includes(k.品詞));
    if (wordsFilters.levels.length > 0)         kw = kw.filter(k => wordsFilters.levels.includes(k.レベル));

    const wc = {};
    kw.forEach(k => {
      const word = k.単語?.toLowerCase();
      if (!word) return;
      const key = wordsGroupByPos      ? word
                : wordsGroupByMeaning  ? `${word}__${k.品詞 || ''}`
                :                       `${word}__${k.品詞 || ''}__${k.意味 || ''}`;

      if (!wc[key]) wc[key] = { 単語: k.単語, 品詞: k.品詞, レベル: k.レベル, 意味: k.意味, 出題回数: 0, 大問IDs: [], meaningsByPos: {}, posCounts: {} };
      wc[key].出題回数++;
      if (!wc[key].大問IDs.includes(k.大問ID)) wc[key].大問IDs.push(k.大問ID);
      if (!wc[key].意味 && k.意味) wc[key].意味 = k.意味;

      const pos = k.品詞 || '';
      wc[key].posCounts[pos] = (wc[key].posCounts[pos] || 0) + 1;
      if (!wc[key].meaningsByPos[pos]) wc[key].meaningsByPos[pos] = [];
      const mt = k.意味 || '';
      const mk = `${pos}__${mt}`;
      let ex = wc[key].meaningsByPos[pos].find(m => m.意味 === mt);
      if (!ex) {
        ex = { 意味: mt, 品詞: pos, レベル: k.レベル, 出題回数: 0, 大問IDs: [], key: mk };
        wc[key].meaningsByPos[pos].push(ex);
      }
      ex.出題回数++;
      if (!ex.大問IDs.includes(k.大問ID)) ex.大問IDs.push(k.大問ID);
    });

    Object.values(wc).forEach(entry => {
      const all = Object.values(entry.meaningsByPos).flat();
      entry.meanings = all;
      if (all.length > 0) {
        const s = [...all].sort((a, b) => b.出題回数 - a.出題回数);
        entry.意味  = s[0].意味;
        entry.レベル = s[0].レベル;
        const p = parseIdiomNotation(s[0].意味);
        entry.topIdiom = p.isIdiom ? p.displayWord : null;
      }
      const pe = Object.entries(entry.posCounts).sort((a, b) => b[1] - a[1]);
      if (pe.length > 0) { entry.品詞 = pe[0][0]; entry.extraPosCount = pe.length - 1; }
    });

    setWordsResults(Object.values(wc).sort((a, b) => b.出題回数 - a.出題回数));
    setWordsDisplayCount(50);
  }, [wordsKeywordData, mondai, wordsFilters, wordsGroupByMeaning, wordsGroupByPos]);

  // 単語情報タブ: フィルタートグル
  const toggleWordsFilter = (key, value) =>
    setWordsFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value]
    }));

  // 単語情報タブ: 詳細モーダルを開く
  const handleWordsDetailClick = (item) => {
    setWordsModalShowAll(false);
    setWordsModalMeanings(
      (wordsGroupByMeaning || wordsGroupByPos) && item.meanings?.length > 1
        ? item.meanings.map(m => m.key)
        : (item.meanings?.map(m => m.key) ?? [])
    );

    const allowedLevels = ['基礎', '標準', '上級', '修練'];
    const wordLower = item.単語.toLowerCase();
    const uniIds = new Set(mondai.map(m => m.大問ID));
    const allKw = wordsKeywordData.filter(k =>
      k.単語?.toLowerCase() === wordLower && allowedLevels.includes(k.レベル) && uniIds.has(k.大問ID)
    );

    const allMbp = {};
    const allIds = [];
    allKw.forEach(k => {
      const pos = k.品詞 || '';
      if (!allMbp[pos]) allMbp[pos] = [];
      const mt = k.意味 || '';
      const mk = `${pos}__${mt}`;
      let ex = allMbp[pos].find(m => m.意味 === mt);
      if (!ex) { ex = { 意味: mt, 品詞: pos, レベル: k.レベル, 出題回数: 0, 大問IDs: [], key: mk }; allMbp[pos].push(ex); }
      ex.出題回数++;
      if (!ex.大問IDs.includes(k.大問ID)) ex.大問IDs.push(k.大問ID);
      if (!allIds.includes(k.大問ID)) allIds.push(k.大問ID);
    });

    const sortFn = (a, b) => {
      const d = parseInt(b.年度) - parseInt(a.年度);
      return d !== 0 ? d : parseInt(a.大問ID) - parseInt(b.大問ID);
    };

    setWordsModalDetail({
      ...item,
      allMeanings: Object.values(allMbp).flat(),
      allMeaningsByPos: allMbp,
      allMondaiDetails:      allIds.map(id => mondai.find(m => m.大問ID === id)).filter(Boolean).sort(sortFn),
      filteredMondaiDetails: item.大問IDs.map(id => mondai.find(m => m.大問ID === id)).filter(Boolean).sort(sortFn),
    });
    setShowWordsModal(true);
  };

  // 単語情報タブ: 一括比較
  const toggleWordsWordSelection = (word) =>
    setWordsSelectedWords(prev => prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]);

  const handleWordsBulkCompare = () => {
    if (wordsSelectedWords.length === 0) return;
    window.open(`/words?mode=compare&words=${encodeURIComponent(JSON.stringify(wordsSelectedWords))}`, '_blank');
  };

  const wordsDisplayed = wordsResults.slice(0, wordsDisplayCount);

  if (loading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <Home size={16} />
            検索画面
          </Link>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="text-gray-800 font-medium">{universityName}</span>
        </nav>

        {/* ページタイトル */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{universityName}</h2>
        </div>

        {/* タブ切替 */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-md p-1 w-fit">
          {[
            ['exam',    '試験形式'],
            ['reading', '長文リスト'],
            ['words',   '単語情報'],
            ['info',    '基本情報'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-emerald-50'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* 試験形式タブ */}
        {activeTab === 'exam' && (
          <div className="space-y-4">
            {/* コンボ選択（複数ある場合） */}
            {examCombos.length > 1 && (
              <div className="bg-white rounded-xl shadow-md p-5">
                <label className="block text-sm font-medium text-gray-700 mb-3">日程・方式・学部</label>
                <div className="flex flex-wrap gap-2">
                  {examCombos.map(c => {
                    const label = [c.日程, c.方式, c.学部].filter(Boolean).join(' ') || '(全体)';
                    return (
                      <button key={c.key}
                        onClick={() => setSelectedCombo(c.key)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedCombo === c.key
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >{label}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {uniExams.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-400">
                <p className="text-sm">試験データがありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 左カード */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm font-medium text-gray-700">年度</label>
                    <select
                      value={leftYear}
                      onChange={e => setLeftYear(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      {comboYears.map(y => <option key={y} value={y}>{y}年度</option>)}
                    </select>
                  </div>
                  {renderExamCard(leftYear)}
                </div>
                {/* 右カード */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm font-medium text-gray-700">年度</label>
                    <select
                      value={rightYear}
                      onChange={e => setRightYear(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      {comboYears.map(y => <option key={y} value={y}>{y}年度</option>)}
                    </select>
                  </div>
                  {renderExamCard(rightYear)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 基本情報タブ */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* 関連記事 */}
            <section>
              <h3 className="text-base font-semibold text-gray-700 mb-3">関連記事</h3>
              {relatedArticles.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-10 text-center">
                  <FileText size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">関連記事はまだありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {relatedArticles.map(article => (
                    <a key={article.slug} href={`/articles/${article.slug}`}>
                      <article className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
                        <div className="aspect-[1200/630] relative bg-gray-100">
                          <img
                            src={getArticleImagePath(article)}
                            alt={article.title}
                            className="w-full h-full object-cover"
                            onError={e => {
                              const defaults = {
                                '出題分析': '/images/articles/defaults/default-analysis.svg',
                                '書籍レビュー': '/images/articles/defaults/default-review.svg',
                                'コラム': '/images/articles/defaults/default-column.svg',
                              };
                              e.target.src = defaults[article.category] || '/images/articles/defaults/default-analysis.svg';
                            }}
                          />
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              article.category === '出題分析'  ? 'bg-blue-100 text-blue-800' :
                              article.category === '書籍レビュー' ? 'bg-orange-100 text-orange-800' :
                              article.category === 'コラム'    ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {article.category}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar size={14} />
                              {article.date}
                            </div>
                          </div>
                          <h2 className="text-xl font-bold text-gray-800 mb-2 hover:text-emerald-600 transition-colors">
                            {article.title}
                          </h2>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {article.description}
                          </p>
                          {article.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag size={14} className="text-gray-400" />
                              {article.tags.map((tag, idx) => (
                                <span key={idx} className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    </a>
                  ))}
                </div>
              )}
            </section>

            {/* 将来のコンテンツ追加エリア */}
            <div className="h-8" />
          </div>
        )}

        {/* 単語情報タブ */}
        {activeTab === 'words' && (
          <div className="space-y-4">

            {/* フィルター */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-5">

              {/* 年度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">年度</label>
                <div className="flex items-center gap-2">
                  <select
                    value={wordsFilters.yearFrom}
                    onChange={e => setWordsFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">下限なし</option>
                    {wordsAvailableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span className="text-gray-500 text-sm">〜</span>
                  <select
                    value={wordsFilters.yearTo}
                    onChange={e => setWordsFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">上限なし</option>
                    {wordsAvailableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span className="text-sm text-gray-400">年度</span>
                </div>
              </div>

              {/* 日程 */}
              {wordsAvailableNittei.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日程</label>
                  <div className="flex flex-wrap gap-2">
                    {wordsAvailableNittei.map(n => (
                      <button key={n} onClick={() => toggleWordsFilter('nittei', n)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          wordsFilters.nittei.length === 0 || wordsFilters.nittei.includes(n)
                            ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* 方式 */}
              {wordsAvailableHoushiki.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">方式</label>
                  <div className="flex flex-wrap gap-2">
                    {wordsAvailableHoushiki.map(h => (
                      <button key={h} onClick={() => toggleWordsFilter('houshiki', h)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          wordsFilters.houshiki.length === 0 || wordsFilters.houshiki.includes(h)
                            ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >{h}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* 学部 */}
              {wordsAvailableGakubu.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学部</label>
                  <div className="flex flex-wrap gap-2">
                    {wordsAvailableGakubu.map(g => (
                      <button key={g} onClick={() => toggleWordsFilter('gakubu', g)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          wordsFilters.gakubu.length === 0 || wordsFilters.gakubu.includes(g)
                            ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >{g}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* 品詞 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">品詞</label>
                <div className="flex flex-wrap gap-2">
                  {wordsAvailablePos.map(pos => (
                    <button key={pos} onClick={() => toggleWordsFilter('partsOfSpeech', pos)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        wordsFilters.partsOfSpeech.length === 0 || wordsFilters.partsOfSpeech.includes(pos)
                          ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >{pos}</button>
                  ))}
                </div>
              </div>

              {/* レベル */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">レベル</label>
                <div className="flex flex-wrap gap-2">
                  {['修練', '上級', '標準', '基礎'].map(level => (
                    <button key={level} onClick={() => toggleWordsFilter('levels', level)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        wordsFilters.levels.length === 0 || wordsFilters.levels.includes(level)
                          ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level === '修練' && '🚀 '}{level === '上級' && '🔬 '}
                      {level === '標準' && '🖋️ '}{level === '基礎' && '📘 '}
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 結果 */}
            {wordsKeywordData.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-400 text-sm">読み込み中...</div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-700">{wordsResults.length}件</span>
                  <div className="flex flex-col gap-2">
                    {/* グルーピングトグル1 */}
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${wordsGroupByMeaning ? 'text-gray-800' : 'text-gray-400'}`}>
                        同じ品詞・異なる意味をまとめる
                      </span>
                      <div
                        onClick={() => { if (!wordsGroupByPos) setWordsGroupByMeaning(v => !v); }}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          wordsGroupByMeaning
                            ? wordsGroupByPos ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 cursor-pointer'
                            : 'bg-gray-300 cursor-pointer'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${wordsGroupByMeaning ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                    {/* グルーピングトグル2 */}
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${wordsGroupByPos ? 'text-gray-800' : 'text-gray-400'}`}>
                        同じ綴り・異なる品詞もまとめる
                      </span>
                      <div
                        onClick={() => { const n = !wordsGroupByPos; setWordsGroupByPos(n); if (n) setWordsGroupByMeaning(true); }}
                        className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${wordsGroupByPos ? 'bg-emerald-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${wordsGroupByPos ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                  </div>
                  {wordsSelectedWords.length > 0 && (
                    <button onClick={handleWordsBulkCompare}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      ✓ {wordsSelectedWords.length}件を一括比較
                    </button>
                  )}
                </div>

                {wordsResults.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    条件に一致する単語がありません
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="md:hidden px-2 py-3 text-center font-semibold text-gray-700 w-8">#</th>
                            <th className="md:hidden px-2 py-3 text-center font-semibold text-gray-700 w-14">回数</th>
                            <th className="md:hidden px-2 py-3 text-center font-semibold text-gray-700">品詞 / Lv</th>
                            <th className="md:hidden px-2 py-3 text-left font-semibold text-gray-700">単語 / 意味</th>
                            <th className="md:hidden px-2 py-3 text-center font-semibold text-gray-700 w-12">
                              <button onClick={() => {
                                const all = wordsDisplayed.map(i => i.単語);
                                const allSel = all.every(w => wordsSelectedWords.includes(w));
                                setWordsSelectedWords(prev => allSel ? prev.filter(w => !all.includes(w)) : [...new Set([...prev, ...all])]);
                              }}
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${wordsDisplayed.every(i => wordsSelectedWords.includes(i.単語)) ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'}`}
                              >{wordsDisplayed.every(i => wordsSelectedWords.includes(i.単語)) && <span className="text-xs">✓</span>}</button>
                            </th>

                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-14">順位</th>
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-20">出題回数</th>
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-20">品詞</th>
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-20">レベル</th>
                            <th className="hidden md:table-cell px-4 py-3 text-left font-semibold text-gray-700">単語</th>
                            <th className="hidden md:table-cell px-4 py-3 text-left font-semibold text-gray-700">意味</th>
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-16">
                              <button onClick={() => {
                                const all = wordsDisplayed.map(i => i.単語);
                                const allSel = all.every(w => wordsSelectedWords.includes(w));
                                setWordsSelectedWords(prev => allSel ? prev.filter(w => !all.includes(w)) : [...new Set([...prev, ...all])]);
                              }}
                                className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${wordsDisplayed.every(i => wordsSelectedWords.includes(i.単語)) ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'}`}
                              >{wordsDisplayed.every(i => wordsSelectedWords.includes(i.単語)) && <span className="text-sm font-bold">✓</span>}</button>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {wordsDisplayed.map((item, idx) => {
                            const isSel = wordsSelectedWords.includes(item.単語);
                            return (
                              <tr key={idx} className={`hover:bg-emerald-50 transition-colors ${isSel ? 'bg-emerald-50' : ''}`}>
                                {/* スマホ: 順位 */}
                                <td className="md:hidden px-2 py-3 text-center text-gray-500 text-xs cursor-pointer" onClick={() => handleWordsDetailClick(item)}>{idx + 1}</td>
                                {/* スマホ: 出題回数 */}
                                <td className="md:hidden px-2 py-3 text-center cursor-pointer" onClick={() => handleWordsDetailClick(item)}>
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{item.出題回数}</span>
                                </td>
                                {/* スマホ: 品詞・レベル */}
                                <td className="md:hidden px-2 py-3 cursor-pointer" onClick={() => handleWordsDetailClick(item)}>
                                  <div className="flex flex-col gap-1 items-center">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                      {item.品詞}{item.extraPosCount > 0 && <span className="ml-0.5 text-emerald-600 font-medium">+{item.extraPosCount}</span>}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.レベル === '修練' ? 'bg-purple-100 text-purple-700' : item.レベル === '上級' ? 'bg-red-100 text-red-700' : item.レベル === '標準' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{item.レベル}</span>
                                  </div>
                                </td>
                                {/* スマホ: 単語・意味 */}
                                <td className="md:hidden px-2 py-3 cursor-pointer" onClick={() => handleWordsDetailClick(item)}>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-gray-900 font-medium">
                                      {item.単語}{item.topIdiom && <span className="text-xs text-gray-400 font-normal ml-1">(※{item.topIdiom})</span>}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {item.topIdiom && <span className="text-gray-400">※</span>}
                                      {(() => { const p = parseIdiomNotation(item.意味); return p.isIdiom ? p.displayMeaning : (item.意味 || '-'); })()}
                                      {(wordsGroupByMeaning || wordsGroupByPos) && item.meanings?.length > 1 && <span className="ml-1 text-emerald-600 font-medium">+{item.meanings.length - 1}</span>}
                                    </span>
                                  </div>
                                </td>
                                {/* スマホ: チェック */}
                                <td className="md:hidden px-2 py-3 text-center">
                                  <button onClick={e => { e.stopPropagation(); toggleWordsWordSelection(item.単語); }}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSel ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'}`}
                                  >{isSel && <span className="text-xs">✓</span>}</button>
                                </td>

                                {/* PC: 順位 */}
                                <td className="hidden md:table-cell px-3 py-3 text-center text-gray-600 font-medium cursor-pointer" onClick={() => handleWordsDetailClick(item)}>{idx + 1}</td>
                                {/* PC: 出題回数 */}
                                <td className="hidden md:table-cell px-3 py-3 text-center cursor-pointer" onClick={() => handleWordsDetailClick(item)}>
                                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">{item.出題回数}</span>
                                </td>
                                {/* PC: 品詞 */}
                                <td className="hidden md:table-cell px-3 py-3 text-center cursor-pointer" onClick={() => handleWordsDetailClick(item)}>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {item.品詞}{item.extraPosCount > 0 && <span className="ml-0.5 text-emerald-600 font-medium">+{item.extraPosCount}</span>}
                                  </span>
                                </td>
                                {/* PC: レベル */}
                                <td className="hidden md:table-cell px-3 py-3 text-center cursor-pointer" onClick={() => handleWordsDetailClick(item)}>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${item.レベル === '修練' ? 'bg-purple-100 text-purple-700' : item.レベル === '上級' ? 'bg-red-100 text-red-700' : item.レベル === '標準' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{item.レベル}</span>
                                </td>
                                {/* PC: 単語 */}
                                <td className="hidden md:table-cell px-4 py-3 text-gray-900 font-medium cursor-pointer" onClick={() => handleWordsDetailClick(item)}>
                                  {item.単語}{item.topIdiom && <span className="text-xs text-gray-400 font-normal ml-1">(※{item.topIdiom})</span>}
                                </td>
                                {/* PC: 意味 */}
                                <td className="hidden md:table-cell px-4 py-3 text-gray-600 cursor-pointer" onClick={() => handleWordsDetailClick(item)}>
                                  {item.topIdiom && <span className="text-gray-400">※</span>}
                                  {(() => { const p = parseIdiomNotation(item.意味); return p.isIdiom ? p.displayMeaning : (item.意味 || '-'); })()}
                                  {(wordsGroupByMeaning || wordsGroupByPos) && item.meanings?.length > 1 && <span className="ml-1 text-emerald-600 font-medium text-xs">+{item.meanings.length - 1}</span>}
                                </td>
                                {/* PC: チェック */}
                                <td className="hidden md:table-cell px-3 py-3 text-center">
                                  <button onClick={e => { e.stopPropagation(); toggleWordsWordSelection(item.単語); }}
                                    className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${isSel ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'}`}
                                  >{isSel && <span className="text-sm font-bold">✓</span>}</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* もっと見る */}
                    {wordsDisplayCount < wordsResults.length && (
                      <div className="p-4 border-t bg-gray-50 flex flex-col items-center gap-2">
                        <button onClick={() => setWordsDisplayCount(prev => prev + 50)}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors"
                        >もっと見る</button>
                        <span className="text-xs text-gray-400">
                          {Math.min(wordsDisplayCount, wordsResults.length)} / {wordsResults.length} 件表示中
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 長文リスト */}
        {activeTab === 'reading' && <>

        {/* 上部フィルターエリア */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
          {/* 年度フィルター */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">年度</label>
              <button
                onClick={() => {
                  const allYears = getFilterOptions('年度');
                  setFilters(prev => ({ ...prev, 年度: allYears }));
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 underline"
              >
                すべて選択
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getFilterOptions('年度').map(option => (
                <button
                  key={option}
                  onClick={() => toggleFilter('年度', option)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filters.年度.length === 0 || filters.年度.includes(option)
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}年度
                </button>
              ))}
            </div>
          </div>

          {/* 日程フィルター */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">日程</label>
              <button
                onClick={() => {
                  const allNittei = getFilterOptions('日程');
                  setFilters(prev => ({ ...prev, 日程: allNittei }));
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 underline"
              >
                すべて選択
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getFilterOptions('日程').map(option => (
                <button
                  key={option}
                  onClick={() => toggleFilter('日程', option)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filters.日程.length === 0 || filters.日程.includes(option)
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 方式フィルター */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">方式</label>
              <button
                onClick={() => {
                  const allHoushiki = getFilterOptions('方式');
                  setFilters(prev => ({ ...prev, 方式: allHoushiki }));
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 underline"
              >
                すべて選択
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getFilterOptions('方式').map(option => (
                <button
                  key={option}
                  onClick={() => toggleFilter('方式', option)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filters.方式.length === 0 || filters.方式.includes(option)
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 学部フィルター */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">学部</label>
              <button
                onClick={() => {
                  const allGakubu = getFilterOptions('学部');
                  setFilters(prev => ({ ...prev, 学部: allGakubu }));
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 underline"
              >
                すべて選択
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getFilterOptions('学部').map(option => (
                <button
                  key={option}
                  onClick={() => toggleFilter('学部', option)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filters.学部.length === 0 || filters.学部.includes(option)
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 検索結果カウント */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <p className="text-sm text-gray-600">検索結果: <span className="font-bold text-emerald-600 text-lg">{filteredMondai.length}</span> 件</p>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  {/* スマホ用ヘッダー */}
                  <th className="lg:hidden px-4 py-3 text-left text-sm font-semibold text-gray-700">年度 / 大問</th>
                  <th className="lg:hidden px-4 py-3 text-left text-sm font-semibold text-gray-700">日程 / 学部</th>
                  <th className="lg:hidden px-4 py-3 text-left text-sm font-semibold text-gray-700">ジャンル</th>
                  <th className="lg:hidden px-4 py-3 text-left text-sm font-semibold text-gray-700">Lv / 語数</th>
                  <th className="lg:hidden px-4 py-3 text-left text-sm font-semibold text-gray-700">設問</th>

                  {/* PC用ヘッダー */}
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700">年度</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700">大問</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700">日程 / 方式 / 学部</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700">ジャンル</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700">本文Lv</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700">語数</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700">設問</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-gray-700">文章記述</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMondai.map((m, index) => {
                  const firstHashtag = getFirstHashtag(m.大問ID);
                  
                  return (
                    <tr 
                      key={m.大問ID} 
                      onClick={() => router.push(`/mondai/${m.識別名}`)}
                      className={`hover:bg-emerald-50 cursor-pointer transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      {/* スマホ用: 年度と大問番号 */}
                      <td className="lg:hidden px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm text-gray-600">{m.年度}年度</div>
                          <div className="text-sm font-medium text-emerald-600">{m.大問番号}</div>
                        </div>
                      </td>

                      {/* スマホ用: 日程と学部 */}
                      <td className="lg:hidden px-4 py-3">
                        <div className="flex flex-col gap-1 text-sm text-gray-700">
                          <div>{m.日程} {m.方式}</div>
                          <div>{m.学部}</div>
                        </div>
                      </td>

                      {/* スマホ用: ジャンルとハッシュタグ */}
                      <td className="lg:hidden px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded whitespace-nowrap">
                            {m.ジャンル}
                          </span>
                          {firstHashtag && (
                            <span className="text-xs text-emerald-600">#{firstHashtag}</span>
                          )}
                        </div>
                      </td>

                      {/* スマホ用: 本文Lvと語数 */}
                      <td className="lg:hidden px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          {m.本文レベル && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                              {m.本文レベル}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-gray-900">{m.本文語数}語</span>
                        </div>
                      </td>

                      {/* スマホ用: 設問と文章記述 */}
                      <td className="lg:hidden px-4 py-3">
                        <div className="flex flex-col gap-1 text-sm text-gray-900">
                          <div>{m.設問数}問</div>
                          <div className="text-xs text-gray-600">
                            {m.文章記述日本語 === 0 && m.文章記述英語 === 0 ? (
                              '記述0'
                            ) : (
                              <>
                                {m.文章記述日本語 > 0 && `日${m.文章記述日本語}`}
                                {m.文章記述日本語 > 0 && m.文章記述英語 > 0 && ' '}
                                {m.文章記述英語 > 0 && `英${m.文章記述英語}`}
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* PC用: 年度 */}
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">
                        {m.年度}年度
                      </td>

                      {/* PC用: 大問番号 */}
                      <td className="hidden lg:table-cell px-4 py-3">
                        <span className="text-sm font-medium text-emerald-600">{m.大問番号}</span>
                      </td>

                      {/* PC用: 日程・方式・学部 */}
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-700">
                        {m.日程} {m.方式} {m.学部}
                      </td>

                      {/* PC用: ジャンルとハッシュタグ */}
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded whitespace-nowrap">
                            {m.ジャンル}
                          </span>
                          {firstHashtag && (
                            <span className="text-xs text-emerald-600">#{firstHashtag}</span>
                          )}
                        </div>
                      </td>

                      {/* PC用: 本文レベル */}
                      <td className="hidden lg:table-cell px-4 py-3">
                        {m.本文レベル && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                            {m.本文レベル}
                          </span>
                        )}
                      </td>

                      {/* PC用: 語数 */}
                      <td className="hidden lg:table-cell px-4 py-3 text-sm font-semibold text-gray-900">
                        {m.本文語数}
                      </td>

                      {/* PC用: 設問数 */}
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-900">
                        {m.設問数}問
                      </td>

                      {/* PC用: 文章記述 */}
                      <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-900">
                        {m.文章記述日本語 === 0 && m.文章記述英語 === 0 ? (
                          '0'
                        ) : (
                          <>
                            {m.文章記述日本語 > 0 && `日${m.文章記述日本語}`}
                            {m.文章記述日本語 > 0 && m.文章記述英語 > 0 && ' '}
                            {m.文章記述英語 > 0 && `英${m.文章記述英語}`}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMondai.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center mt-6">
            <p className="text-gray-500 text-lg">条件に一致するデータが見つかりませんでした</p>
          </div>
        )}
        </>}
      </div>

      <Footer />
    </div>

    {/* 単語詳細モーダル */}
    {showWordsModal && wordsModalDetail && (() => {
      const curMeanings = wordsModalShowAll ? (wordsModalDetail.allMeanings || []) : (wordsModalDetail.meanings || []);
      const curMondaiAll = wordsModalShowAll ? (wordsModalDetail.allMondaiDetails || []) : (wordsModalDetail.filteredMondaiDetails || []);
      const filteredMondaiIds = new Set(curMeanings.filter(m => wordsModalMeanings.includes(m.key)).flatMap(m => m.大問IDs));
      const filteredMondai = curMondaiAll.filter(m => filteredMondaiIds.has(m.大問ID));

      const mbpGroups = {};
      curMeanings.forEach(m => {
        const pos = m.品詞 || '';
        if (!mbpGroups[pos]) mbpGroups[pos] = [];
        mbpGroups[pos].push(m);
      });
      const posGroupEntries = Object.entries(mbpGroups);

      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b bg-emerald-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">{wordsModalDetail.単語}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {wordsModalDetail.品詞}{wordsModalDetail.extraPosCount > 0 && <span className="ml-0.5 text-emerald-600 font-medium">+{wordsModalDetail.extraPosCount}</span>}
                    </span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs md:text-sm font-bold">
                      出題 {wordsModalDetail.出題回数}回
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">{universityName}</span>
                    {(wordsFilters.yearFrom || wordsFilters.yearTo) && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {wordsFilters.yearFrom || '〜'}
                        {wordsFilters.yearFrom && wordsFilters.yearTo ? '〜' : ''}
                        {wordsFilters.yearTo || (wordsFilters.yearFrom ? '〜' : '')}
                      </span>
                    )}
                    {wordsFilters.nittei.map(v => (
                      <span key={v} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{v}</span>
                    ))}
                    {wordsFilters.houshiki.map(v => (
                      <span key={v} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{v}</span>
                    ))}
                    {wordsFilters.gakubu.map(v => (
                      <span key={v} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{v}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowWordsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold shrink-0">×</button>
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1">

              {/* 意味一覧 */}
              {posGroupEntries.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">意味</h4>
                  <div className="space-y-3">
                    {posGroupEntries.map(([pos, meanings]) => (
                      <div key={pos}>
                        {posGroupEntries.length > 1 && <div className="text-xs font-semibold text-gray-500 mb-1">{pos}</div>}
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {meanings.map((m, mIdx) => {
                            const isSel = wordsModalMeanings.includes(m.key);
                            const parsed = parseIdiomNotation(m.意味);
                            return (
                              <button key={mIdx}
                                onClick={() => setWordsModalMeanings(prev => isSel ? prev.filter(v => v !== m.key) : [...prev, m.key])}
                                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm transition-colors ${isSel ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                              >
                                {parsed.isIdiom ? <><span className="font-medium">{parsed.displayWord}</span>{parsed.displayMeaning && ` ${parsed.displayMeaning}`}</> : (parsed.displayMeaning || '-')}
                                <span className="ml-1 opacity-70 text-xs">({m.出題回数})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 絞り込みトグル（フィルタが適用されている場合のみ） */}
              {isWordsFiltered && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-center">
                    <button onClick={() => { setWordsModalShowAll(false); setWordsModalMeanings(wordsModalDetail.meanings?.map(m => m.key) ?? []); }}
                      className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors ${!wordsModalShowAll ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >絞込中の年度/日程/方式/学部のみ</button>
                    <button onClick={() => { setWordsModalShowAll(true); setWordsModalMeanings(wordsModalDetail.allMeanings?.map(m => m.key) ?? []); }}
                      className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors ${wordsModalShowAll ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >{universityName}の全ての出題履歴から</button>
                  </div>
                </div>
              )}

              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                出現した大問
                {filteredMondai.length !== curMondaiAll.length && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">({filteredMondai.length} / {curMondaiAll.length}件)</span>
                )}
              </h4>

              {/* PC用テーブル */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">年度</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">日程</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">方式</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">学部</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">大問</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">ジャンル</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMondai.map((m, idx) => {
                      const ht = hashtagsData.find(h => h.大問ID === m.大問ID);
                      return (
                        <tr key={idx} onClick={() => window.open(`/mondai/${m.識別名}`, '_blank')}
                          className="hover:bg-emerald-50 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-3 text-gray-800">{m.年度}</td>
                          <td className="px-3 py-3 text-gray-800">{m.日程}</td>
                          <td className="px-3 py-3 text-gray-800">{m.方式}</td>
                          <td className="px-3 py-3 text-gray-800">{m.学部}</td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">{m.大問番号}</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-800">{m.ジャンル || '-'}</span>
                              {ht && <span className="text-xs text-emerald-600">#{ht.ハッシュタグ}</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* スマホ用カード */}
              <div className="md:hidden space-y-2">
                {filteredMondai.map((m, idx) => {
                  const ht = hashtagsData.find(h => h.大問ID === m.大問ID);
                  return (
                    <div key={idx} onClick={() => window.open(`/mondai/${m.識別名}`, '_blank')}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">{m.年度}年度</span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">{m.大問番号}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {m.日程 && <span>{m.日程}</span>}
                        {m.方式 && <><span>·</span><span>{m.方式}</span></>}
                        {m.学部 && <><span>·</span><span>{m.学部}</span></>}
                      </div>
                      {(m.ジャンル || ht) && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          {m.ジャンル && <span className="text-gray-500">{m.ジャンル}</span>}
                          {ht && <span className="text-emerald-600">#{ht.ハッシュタグ}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400">※出題回数の多すぎる意味は掲載していません</span>
              <button onClick={() => setShowWordsModal(false)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors shrink-0"
              >閉じる</button>
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}
export default function UniversityPage({ params }) { return <Suspense><UniversityPageInner params={params} /></Suspense>; }
