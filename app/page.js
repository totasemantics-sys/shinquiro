'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Hash, X, RotateCcw, ChevronUp, ChevronDown, Info, ExternalLink } from 'lucide-react';
import { loadAllData, getUniversityCodeFromId } from '@/lib/loadData';
import ReactMarkdown from 'react-markdown';
import Header from './components/Header';
import { loadKeywordData } from '@/lib/loadKeywordData';

export default function Home() {
  const [mondai, setMondai] = useState([]);
  const [setumon, setSetumon] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    examTypes: [],
    university: '',
    wordCountRange: [0, 1500],
    vocabLevels: [],
    genre: '',
    hashtags: [],
    hashtagMatchMode: 'any',
    questionCategories: [],
    questionFormats: [],
    knowledgeGrammar: [],
    bunshoJapanese: 'any',
    bunshoEnglish: 'any',
    freeWord: ''
  });
  
  const [sortBy, setSortBy] = useState('year-desc');
  const [filteredResults, setFilteredResults] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [scrollY, setScrollY] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [hashtagSearchInput, setHashtagSearchInput] = useState('');
  const [tempSelectedHashtags, setTempSelectedHashtags] = useState([]);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [knowledgeSearchInput, setKnowledgeSearchInput] = useState('');
  const [tempSelectedKnowledge, setTempSelectedKnowledge] = useState([]);
  const [showBunshoTooltip, setShowBunshoTooltip] = useState(false);
  const [showLevelTooltip, setShowLevelTooltip] = useState(false);
  const [displayCount, setDisplayCount] = useState(50);
  const [universityInput, setUniversityInput] = useState('');
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);
  const universityInputRef = useRef(null);
  const [showQuestionFormatsModal, setShowQuestionFormatsModal] = useState(false);
  const [showPassageLevelsModal, setShowPassageLevelsModal] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
  const [keywords, setKeywords] = useState([]);

    // マークダウンを読み込む関数
  const loadMarkdown = async (filename, setModalFunction) => {
    setIsLoadingMarkdown(true);
    try {
      const response = await fetch(`/docs/${filename}`);
      if (!response.ok) throw new Error('ファイルの読み込みに失敗しました');
      const text = await response.text();
      setMarkdownContent(text);
      setModalFunction(true);
    } catch (error) {
      console.error('マークダウンの読み込みエラー:', error);
      setMarkdownContent('# エラー\n\nファイルの読み込みに失敗しました。');
      setModalFunction(true);
    } finally {
      setIsLoadingMarkdown(false);
    }
  };

  // 設問形式の説明を開く
  const openQuestionFormatsModal = () => {
    loadMarkdown('question-formats.md', setShowQuestionFormatsModal);
  };

  // 本文レベルの説明を開く
  const openPassageLevelsModal = () => {
    loadMarkdown('passage-levels.md', setShowPassageLevelsModal);
  };

  // モーダルを閉じる
  const closeMarkdownModal = () => {
    setShowQuestionFormatsModal(false);
    setShowPassageLevelsModal(false);
    setMarkdownContent('');
  };

  useEffect(() => {
    async function fetchData() {
      const data = await loadAllData();
      const keywordsData = await loadKeywordData();

      setMondai(data.mondai);
      setSetumon(data.setsumon);
      setHashtags(data.hashtags);
      setKnowledge(data.knowledge);
      setUniversities(data.universities);
      setKeywords(keywordsData);
      setFilteredResults(data.mondai);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (universityInputRef.current && !universityInputRef.current.contains(event.target)) {
        setShowUniversitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let results = [...mondai];
    
    if (filters.examTypes.length > 0) {
      results = results.filter(m => filters.examTypes.includes(m.試験区分));
    }
    if (filters.university) {
      results = results.filter(m => m.大学名 === filters.university);
    }
    if (filters.wordCountRange[0] > 0) {
      results = results.filter(m => m.本文語数 >= filters.wordCountRange[0]);
    }
    if (filters.wordCountRange[1] < 1500) {
      results = results.filter(m => m.本文語数 <= filters.wordCountRange[1]);
    }
    if (filters.vocabLevels.length > 0) {
      results = results.filter(m => filters.vocabLevels.includes(m.本文レベル));
    }
    if (filters.genre) {
      results = results.filter(m => m.ジャンル === filters.genre);
    }
    if (filters.hashtags.length > 0) {
      results = results.filter(m => {
        const mondaiHashtags = hashtags.filter(h => h.大問ID === m.大問ID).map(h => h.ハッシュタグ);
        
        if (filters.hashtagMatchMode === 'all') {
          // すべてに当てはまる（AND条件）
          return filters.hashtags.every(tag => mondaiHashtags.includes(tag));
        } else {
          // どれかに当てはまる（OR条件）
          return filters.hashtags.some(tag => mondaiHashtags.includes(tag));
        }
      });
    }
    
    // 設問カテゴリ・設問形式・知識文法の統合フィルタリング（同一設問で条件を満たす必要がある）
      if (filters.questionCategories.length > 0 || filters.questionFormats.length > 0 || filters.knowledgeGrammar.length > 0) {
        results = results.filter(m => {
          const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
          
          // 各設問について条件をチェック
          return mondaiSetumon.some(s => {
            let categoryMatch = true;
            let formatMatch = true;
            let knowledgeMatch = true;
            
            // 設問カテゴリのチェック
            if (filters.questionCategories.length > 0) {
              categoryMatch = filters.questionCategories.includes(s.設問カテゴリ);
            }
            
            // 設問形式のチェック
            if (filters.questionFormats.length > 0) {
              formatMatch = filters.questionFormats.includes(s.設問形式);
            }
            
            // 知識・文法のチェック（この設問に紐づく知識・文法を取得）
            if (filters.knowledgeGrammar.length > 0) {
              const setumonKnowledge = knowledge
                .filter(k => k.設問ID === s.設問ID)
                .map(k => k['知識・文法']);
              knowledgeMatch = filters.knowledgeGrammar.some(kg => setumonKnowledge.includes(kg));
            }
            
            // 同一設問で全ての条件を満たす必要がある（AND条件）
            return categoryMatch && formatMatch && knowledgeMatch;
          });
        });
      }
    
    // 文章記述(日)のフィルタリング
    if (filters.bunshoJapanese === 'required') {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        return mondaiSetumon.some(s => s.設問カテゴリ === '文章記述(日)');
      });
    } else if (filters.bunshoJapanese === 'excluded') {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        return !mondaiSetumon.some(s => s.設問カテゴリ === '文章記述(日)');
      });
    }
    
    // 文章記述(英)のフィルタリング
    if (filters.bunshoEnglish === 'required') {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        return mondaiSetumon.some(s => s.設問カテゴリ === '文章記述(英)');
      });
    } else if (filters.bunshoEnglish === 'excluded') {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        return !mondaiSetumon.some(s => s.設問カテゴリ === '文章記述(英)');
      });
    }
    
    if (filters.freeWord) {
      const keyword = filters.freeWord.toLowerCase();
      results = results.filter(m => {
        const mondaiHashtags = hashtags.filter(h => h.大問ID === m.大問ID).map(h => h.ハッシュタグ);
        return (
          m.大学名.toLowerCase().includes(keyword) ||
          m.学部.toLowerCase().includes(keyword) ||
          m.ジャンル.toLowerCase().includes(keyword) ||
          mondaiHashtags.some(tag => tag.toLowerCase().includes(keyword))
        );
      });
    }
    
    results.sort((a, b) => {
      switch(sortBy) {
        case 'year-desc': 
          return b.年度 - a.年度;
        case 'year-asc': 
          return a.年度 - b.年度;
        case 'words-desc': 
          return b.本文語数 - a.本文語数;
        case 'words-asc': 
          return a.本文語数 - b.本文語数;
        case 'level-desc': {
          // S → A → B → C → D の順（難しい順）
          const levelOrder = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
          return (levelOrder[b.本文レベル] || 0) - (levelOrder[a.本文レベル] || 0);
        }
        case 'level-asc': {
          // D → C → B → A → S の順（易しい順）
          const levelOrder = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
          return (levelOrder[a.本文レベル] || 0) - (levelOrder[b.本文レベル] || 0);
        }
        default: 
          return 0;
      }
    });
    
    // displayCountをリセット
    setDisplayCount(50);

    setFilteredResults(results);
  }, [filters, sortBy, mondai, setumon, hashtags, knowledge]);

  const examTypes = ['国公立', '私立', '共通テスト', '資格'];
  const vocabLevels = ['S', 'A', 'B', 'C', 'D'];
  const genres = [...new Set(mondai.map(m => m.ジャンル))].filter(Boolean).sort();
  
  const hashtagFrequency = {};
  hashtags.forEach(h => {
    hashtagFrequency[h.ハッシュタグ] = (hashtagFrequency[h.ハッシュタグ] || 0) + 1;
  });
  const sortedHashtags = Object.entries(hashtagFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  const knowledgeFrequency = {};
  knowledge.forEach(k => {
    knowledgeFrequency[k['知識・文法']] = (knowledgeFrequency[k['知識・文法']] || 0) + 1;
  });
  const sortedKnowledge = Object.entries(knowledgeFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([kg]) => kg);

  const questionCategories = [...new Set(setumon.map(s => s.設問カテゴリ))].filter(Boolean).sort();
  const questionFormats = [...new Set(setumon.map(s => s.設問形式))].filter(Boolean).sort();

  const openHashtagModal = () => {
    setTempSelectedHashtags([...filters.hashtags]);
    setHashtagSearchInput('');
    setShowHashtagModal(true);
  };

  const confirmHashtagSelection = () => {
    setFilters({...filters, hashtags: tempSelectedHashtags});
    setShowHashtagModal(false);
  };

  const toggleHashtagInModal = (tag) => {
    if (tempSelectedHashtags.includes(tag)) {
      setTempSelectedHashtags(tempSelectedHashtags.filter(t => t !== tag));
    } else {
      setTempSelectedHashtags([...tempSelectedHashtags, tag]);
    }
  };

  const filteredHashtagsForModal = hashtagSearchInput
    ? sortedHashtags.filter(tag => tag.includes(hashtagSearchInput))
    : sortedHashtags;

  const openKnowledgeModal = () => {
    setTempSelectedKnowledge([...filters.knowledgeGrammar]);
    setKnowledgeSearchInput('');
    setShowKnowledgeModal(true);
  };

  const confirmKnowledgeSelection = () => {
    setFilters({...filters, knowledgeGrammar: tempSelectedKnowledge});
    setShowKnowledgeModal(false);
  };

  const toggleKnowledgeInModal = (kg) => {
    if (tempSelectedKnowledge.includes(kg)) {
      setTempSelectedKnowledge(tempSelectedKnowledge.filter(k => k !== kg));
    } else {
      setTempSelectedKnowledge([...tempSelectedKnowledge, kg]);
    }
  };

  const filteredKnowledgeForModal = knowledgeSearchInput
    ? sortedKnowledge.filter(kg => kg.includes(knowledgeSearchInput))
    : sortedKnowledge;

  const filteredUniversities = universities.filter(u => 
    u.大学名.toLowerCase().includes(universityInput.toLowerCase())
  );

// 設問形式クリック時の処理
  const handleQuestionFormatClick = (format) => {
    if (!filters.questionFormats.includes(format)) {
      setFilters({...filters, questionFormats: [...filters.questionFormats, format]});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 知識・文法クリック時の処理
  const handleKnowledgeClick = (kg) => {
    if (!filters.knowledgeGrammar.includes(kg)) {
      setFilters({...filters, knowledgeGrammar: [...filters.knowledgeGrammar, kg]});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ハッシュタグクリック時の処理
  const handleHashtagClick = (tag) => {
    if (!filters.hashtags.includes(tag)) {
      setFilters({...filters, hashtags: [...filters.hashtags, tag]});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setFilters({
      examTypes: [], university: '', wordCountRange: [0, 1500], vocabLevels: [],
      genre: '', hashtags: [], hashtagMatchMode: 'any', questionCategories: [], questionFormats: [],
      knowledgeGrammar: [], bunshoJapanese: 'any', bunshoEnglish: 'any', freeWord: ''
    });
    setUniversityInput('');
    setSortBy('year-desc');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header 
        pageTitle="長文検索"
        pageDescription="シンキロウ/分野や問題形式から英語長文を絞り込み"
      />

      {/* 現在の検索条件バー（スクロール時に表示） */}
      {scrollY > 300 && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-md z-50 animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Search className="text-emerald-600 flex-shrink-0" size={20} />
              <div className="text-sm text-gray-700 flex-1 min-w-0 overflow-hidden" style={{ maxHeight: '4.5rem', lineHeight: '1.5rem' }}>
                <span className="font-medium">現在の検索条件: </span>
                {filters.examTypes.length > 0 && (
                  <span>試験区分: {filters.examTypes.join('、')} / </span>
                )}
                {filters.university && (
                  <span>大学: {filters.university} / </span>
                )}
                {(filters.wordCountRange[0] > 0 || filters.wordCountRange[1] < 1500) && (
                  <span>語数: {filters.wordCountRange[0] === 0 ? '下限なし' : `${filters.wordCountRange[0]}`}〜{filters.wordCountRange[1] === 1500 ? '上限なし' : `${filters.wordCountRange[1]}`}語 / </span>
                )}
                {filters.vocabLevels.length > 0 && (
                  <span>レベル: {filters.vocabLevels.join('、')} / </span>
                )}
                {filters.genre && (
                  <span>ジャンル: {filters.genre} / </span>
                )}
                {filters.hashtags.length > 0 && (
                  <span>#{filters.hashtags.join(' #')} / </span>
                )}
                {(filters.bunshoJapanese !== 'any' || filters.bunshoEnglish !== 'any') && (
                  <span>文章記述: {
                    [
                      filters.bunshoJapanese === 'required' ? '日本語必須' : filters.bunshoJapanese === 'excluded' ? '日本語除外' : null,
                      filters.bunshoEnglish === 'required' ? '英語必須' : filters.bunshoEnglish === 'excluded' ? '英語除外' : null
                    ].filter(Boolean).join('、') || 'どちらでも'
                  } / </span>
                )}
                {filters.questionCategories.length > 0 && (
                  <span>設問カテゴリ: {filters.questionCategories.join('、')} / </span>
                )}
                {filters.questionFormats.length > 0 && (
                  <span>形式: {filters.questionFormats.join('、')} / </span>
                )}
                {filters.knowledgeGrammar.length > 0 && (
                  <span>文法: {filters.knowledgeGrammar.join('、')} / </span>
                )}
                {filters.freeWord && (
                  <span>「{filters.freeWord}」 / </span>
                )}
                {filters.examTypes.length === 0 && !filters.university && filters.wordCountRange[0] === 0 && filters.wordCountRange[1] === 1500 && filters.vocabLevels.length === 0 && !filters.genre && filters.hashtags.length === 0 && filters.bunshoJapanese === 'any' && filters.bunshoEnglish === 'any' && filters.questionCategories.length === 0 && filters.questionFormats.length === 0 && filters.knowledgeGrammar.length === 0 && !filters.freeWord && (
                  <span className="text-gray-500">すべての条件</span>
                )}
              </div>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="ml-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex-shrink-0 text-sm whitespace-nowrap"
            >
              条件変更
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="text-emerald-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">検索条件</h2>
          </div>
          
          <div className="space-y-6">
            {/* 試験区分 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">試験区分(複数選択可)</label>
              <div className="flex flex-wrap gap-2">
                {examTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      if (filters.examTypes.includes(type)) {
                        setFilters({...filters, examTypes: filters.examTypes.filter(t => t !== type)});
                      } else {
                        setFilters({...filters, examTypes: [...filters.examTypes, type]});
                      }
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      filters.examTypes.includes(type)
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 大学名 */}
            <div ref={universityInputRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">大学名・試験名</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-500"
                placeholder="東京大学、英検1級、共通テスト..."
                value={universityInput}
                onChange={(e) => {
                  setUniversityInput(e.target.value);
                  setShowUniversitySuggestions(true);
                }}
                onFocus={() => setShowUniversitySuggestions(true)}
              />
              {showUniversitySuggestions && universityInput && filteredUniversities.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-w-md bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredUniversities.map((u, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-gray-800"
                      onClick={() => {
                        setFilters({...filters, university: u.大学名});
                        setUniversityInput(u.大学名);
                        setShowUniversitySuggestions(false);
                      }}
                    >
                      <span className="text-xs text-gray-500">[{u.試験区分}]</span> {u.大学名}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 本文語数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">本文語数</label>
              <div className="text-center text-sm text-gray-600 mb-3">
                {filters.wordCountRange[0] === 0 ? '下限なし' : `${filters.wordCountRange[0]}語`} 〜 {filters.wordCountRange[1] === 1500 ? '上限なし' : `${filters.wordCountRange[1]}語`}
              </div>
              <div className="px-2">
                <div className="relative" style={{ height: '60px' }}>
                  <div className="absolute w-full h-2 bg-gray-200 rounded-lg pointer-events-none" style={{ top: '29px' }} />
                  <div 
                    className="absolute h-2 bg-emerald-500 rounded-lg pointer-events-none"
                    style={{
                      top: '29px',
                      left: `${(filters.wordCountRange[0] / 1500) * 100}%`,
                      right: `${100 - (filters.wordCountRange[1] / 1500) * 100}%`
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1500"
                    step="50"
                    value={filters.wordCountRange[0]}
                    onChange={(e) => setFilters({...filters, wordCountRange: [parseInt(e.target.value), filters.wordCountRange[1]]})}
                    className="range-slider-bottom absolute w-full bg-transparent appearance-none cursor-pointer"
                    style={{ zIndex: 2, top: '29px' }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1500"
                    step="50"
                    value={filters.wordCountRange[1]}
                    onChange={(e) => setFilters({...filters, wordCountRange: [filters.wordCountRange[0], parseInt(e.target.value)]})}
                    className="range-slider-top absolute w-full bg-transparent appearance-none cursor-pointer"
                    style={{ zIndex: 2, top: '29px' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <div>0</div>
                  <div>500</div>
                  <div>1000</div>
                  <div>1500+</div>
                </div>
              </div>
            </div>

            {/* 本文レベル */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">本文レベル(複数選択可)</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowLevelTooltip(!showLevelTooltip)}
                      onMouseEnter={() => setShowLevelTooltip(true)}
                      onMouseLeave={() => setShowLevelTooltip(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Info size={16} />
                    </button>
                    {showLevelTooltip && (
                      <div className="absolute left-6 top-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-xs w-64 text-gray-800">
                        <div className="space-y-1">
                          <div><strong>S:</strong> 英検1級上位レベル</div>
                          <div><strong>A:</strong> 英検1級下位レベル</div>
                          <div><strong>B:</strong> 英検準1級上位レベル</div>
                          <div><strong>C:</strong> 英検準1級下位レベル</div>
                          <div><strong>D:</strong> 〜英検2級レベル</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/about/passage-levels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 text-xs underline ml-2"
                  >
                    詳しい説明を見る
                  </Link>
                </div>
                <div className="flex flex-wrap gap-3">
                  {vocabLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        if (filters.vocabLevels.includes(level)) {
                          setFilters({...filters, vocabLevels: filters.vocabLevels.filter(l => l !== level)});
                        } else {
                          setFilters({...filters, vocabLevels: [...filters.vocabLevels, level]});
                        }
                      }}
                      className={`px-4 py-2 rounded-md font-medium transition ${
                        filters.vocabLevels.includes(level)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

            {/* ジャンル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ジャンル</label>
              <div className="flex flex-wrap gap-3">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => setFilters({...filters, genre: filters.genre === genre ? '' : genre})}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      filters.genre === genre
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* ハッシュタグ */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Hash size={18} className="text-emerald-600" />
                  ハッシュタグ
                </label>
                
                {filters.hashtags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-600">選択中のハッシュタグ</div>
                      {filters.hashtags.length > 1 && (
                        <div className="inline-flex rounded-lg border border-gray-300 bg-white">
                          <button
                            onClick={() => setFilters({...filters, hashtagMatchMode: 'any'})}
                            className={`px-3 py-1 text-xs font-medium transition-colors rounded-l-lg ${
                              filters.hashtagMatchMode === 'any'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            どれかに当てはまる
                          </button>
                          <button
                            onClick={() => setFilters({...filters, hashtagMatchMode: 'all'})}
                            className={`px-3 py-1 text-xs font-medium transition-colors border-l border-gray-300 rounded-r-lg ${
                              filters.hashtagMatchMode === 'all'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            すべてに当てはまる
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filters.hashtags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setFilters({...filters, hashtags: filters.hashtags.filter(t => t !== tag)})}
                          className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs flex items-center gap-1 hover:bg-emerald-600"
                        >
                          #{tag}
                          <X size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              
              <div className="text-xs text-gray-600 mb-2">上位のハッシュタグ</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {sortedHashtags.slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (filters.hashtags.includes(tag)) {
                        setFilters({...filters, hashtags: filters.hashtags.filter(t => t !== tag)});
                      } else {
                        setFilters({...filters, hashtags: [...filters.hashtags, tag]});
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs transition ${
                      filters.hashtags.includes(tag)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              
              <button
                onClick={openHashtagModal}
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Search size={16} />
                すべてのハッシュタグから検索
              </button>
            </div>

            {/* 文章記述問題 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium text-gray-700">文章記述問題</label>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowBunshoTooltip(true)}
                    onMouseLeave={() => setShowBunshoTooltip(false)}
                    onClick={() => setShowBunshoTooltip(!showBunshoTooltip)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Info size={16} />
                  </button>
                  {showBunshoTooltip && (
                    <div className="absolute left-6 top-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-xs w-72 text-gray-800">
                      <div className="space-y-1">
                        <div>大問中の、1文以上の記述問題の有無。</div>
                        <div>(学習者が自己採点できるかどうかを判断基準にしています。)</div>
                        <div>たとえば文章記述問題のない大問だけを検索したい場合は、両方とも「除外」してください。</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {/* 文章記述(日) */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">文章記述(日)</div>
                  <div className="inline-flex rounded-lg border border-gray-300 bg-white">
                    <button
                      onClick={() => setFilters({...filters, bunshoJapanese: 'required'})}
                      className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-lg ${
                        filters.bunshoJapanese === 'required'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      必須
                    </button>
                    <button
                      onClick={() => setFilters({...filters, bunshoJapanese: 'any'})}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-x border-gray-300 ${
                        filters.bunshoJapanese === 'any'
                          ? 'bg-gray-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      どちらでも
                    </button>
                    <button
                      onClick={() => setFilters({...filters, bunshoJapanese: 'excluded'})}
                      className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-lg ${
                        filters.bunshoJapanese === 'excluded'
                          ? 'bg-red-400 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      除外
                    </button>
                  </div>
                </div>
                
                {/* 文章記述(英) */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">文章記述(英)</div>
                  <div className="inline-flex rounded-lg border border-gray-300 bg-white">
                    <button
                      onClick={() => setFilters({...filters, bunshoEnglish: 'required'})}
                      className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-lg ${
                        filters.bunshoEnglish === 'required'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      必須
                    </button>
                    <button
                      onClick={() => setFilters({...filters, bunshoEnglish: 'any'})}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-x border-gray-300 ${
                        filters.bunshoEnglish === 'any'
                          ? 'bg-gray-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      どちらでも
                    </button>
                    <button
                      onClick={() => setFilters({...filters, bunshoEnglish: 'excluded'})}
                      className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-lg ${
                        filters.bunshoEnglish === 'excluded'
                          ? 'bg-red-400 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      除外
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 設問カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">設問カテゴリ(複数選択可)</label>
              <div className="flex flex-wrap gap-2">
                {questionCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      if (filters.questionCategories.includes(category)) {
                        setFilters({...filters, questionCategories: filters.questionCategories.filter(c => c !== category)});
                      } else {
                        setFilters({...filters, questionCategories: [...filters.questionCategories, category]});
                      }
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      filters.questionCategories.includes(category)
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 設問形式 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">設問形式(複数選択可)</label>
                <button
                  onClick={openQuestionFormatsModal}
                  className="text-emerald-600 hover:text-emerald-700 text-xs underline flex items-center gap-1"
                >
                  <Info size={14} />
                  設問形式の説明を見る
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {questionFormats.map(format => (
                  <button
                    key={format}
                    onClick={() => {
                      if (filters.questionFormats.includes(format)) {
                        setFilters({...filters, questionFormats: filters.questionFormats.filter(f => f !== format)});
                      } else {
                        setFilters({...filters, questionFormats: [...filters.questionFormats, format]});
                      }
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      filters.questionFormats.includes(format)
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            {/* 知識・文法 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">知識・文法</label>
              
              {filters.knowledgeGrammar.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-600 mb-2">選択中の知識・文法</div>
                  <div className="flex flex-wrap gap-2">
                    {filters.knowledgeGrammar.map(kg => (
                      <button
                        key={kg}
                        onClick={() => setFilters({...filters, knowledgeGrammar: filters.knowledgeGrammar.filter(k => k !== kg)})}
                        className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs flex items-center gap-1 hover:bg-emerald-600"
                      >
                        {kg}
                        <X size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-600 mb-2">上位の知識・文法</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {sortedKnowledge.slice(0, 5).map(kg => (
                  <button
                    key={kg}
                    onClick={() => {
                      if (filters.knowledgeGrammar.includes(kg)) {
                        setFilters({...filters, knowledgeGrammar: filters.knowledgeGrammar.filter(k => k !== kg)});
                      } else {
                        setFilters({...filters, knowledgeGrammar: [...filters.knowledgeGrammar, kg]});
                      }
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      filters.knowledgeGrammar.includes(kg)
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {kg}
                  </button>
                ))}
              </div>
              
              <button
                onClick={openKnowledgeModal}
                className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Search size={16} />
                すべての知識・文法から検索
              </button>
            </div>

            {/* フリーワード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">フリーワード検索</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-500"
                placeholder="キーワードを入力..."
                value={filters.freeWord}
                onChange={(e) => setFilters({...filters, freeWord: e.target.value})}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
            >
              <RotateCcw size={18} />
              条件をリセット
            </button>
          </div>
        </div>

        {/* ヒット数表示 */}
        <div className="fixed bottom-6 left-6 bg-white border-2 border-emerald-500 rounded-lg shadow-lg px-4 py-3 z-40">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700">
              ヒット数: <span className="font-bold text-emerald-600 text-lg">{filteredResults.length}</span> 件
            </span>
          </div>
        </div>

        {/* 検索結果とソート */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            検索結果: <span className="font-bold text-emerald-600 text-lg">{filteredResults.length}</span> 件
          </p>
          <select
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 font-medium"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="year-desc">年度順(新しい順)</option>
            <option value="year-asc">年度順(古い順)</option>
            <option value="words-desc">語数順(多い順)</option>
            <option value="words-asc">語数順(少ない順)</option>
            <option value="level-desc">本文レベル順(難しい順)</option>
            <option value="level-asc">本文レベル順(易しい順)</option>
          </select>
        </div>

        {/* 検索結果 */}
        <div className="space-y-4">
          {filteredResults.slice(0, displayCount).map((m) => {
            const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
            const mondaiHashtags = hashtags.filter(h => h.大問ID === m.大問ID).map(h => h.ハッシュタグ);
            const isExpanded = expandedCards.has(m.大問ID);
            
            const bunshoJapaneseCount = mondaiSetumon.filter(s => s.設問カテゴリ === '文章記述(日)').length;
            const bunshoEnglishCount = mondaiSetumon.filter(s => s.設問カテゴリ === '文章記述(英)').length;
            const totalBunsho = bunshoJapaneseCount + bunshoEnglishCount;
            
            return (
              <div key={m.大問ID} className="bg-white rounded-lg shadow-md hover:shadow-lg transition">
                <div className="p-5">
                  {/* メイン情報エリア - PC時は横並び、スマホ時は縦並び */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    {/* 左側: 試験情報 */}
                      <div className="flex-1 min-w-0">
                        {/* 第1行: 試験情報（太字）+ 語数・設問数 */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mb-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                            {m.試験区分}
                          </span>
                          <span className="text-xl font-bold text-gray-900">{m.大学名}</span>
                          <span className="text-lg font-bold text-gray-900">{m.年度}年度</span>
                          <span className="text-lg font-bold text-gray-800">{m.日程}</span>
                          <span className="text-lg font-bold text-gray-800">{m.方式}</span>
                          <span className="text-lg font-bold text-gray-800">{m.学部}</span>
                          <span className="text-lg font-bold text-gray-800">【{m.大問番号}】</span>
                          
                          {/* 語数 */}
                          <span className="font-semibold text-gray-900">{m.本文語数}語</span>
                          
                          {/* 設問数 */}
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-900">設問数:{m.設問数}問</span>
                            {totalBunsho > 0 ? (
                              <span className="text-gray-600 text-xs">
                                (記述
                                {bunshoJapaneseCount > 0 && `日${bunshoJapaneseCount}`}
                                {bunshoJapaneseCount > 0 && bunshoEnglishCount > 0 && '・'}
                                {bunshoEnglishCount > 0 && `英${bunshoEnglishCount}`})
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">(文章記述なし)</span>
                            )}
                          </div>
                        </div>

                        {/* 第2行: 本文レベル・ジャンル・ハッシュタグ */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          {/* 本文レベル */}
                          {m.本文レベル && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Lv.{m.本文レベル}
                            </span>
                          )}
                          
                          {/* ジャンル */}
                          <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded">
                            {m.ジャンル}
                          </span>
                          
                          {/* ハッシュタグ */}
                            {mondaiHashtags.length > 0 && (
                              <>
                                {mondaiHashtags
                                  .sort((a, b) => {
                                    const aSelected = filters.hashtags.includes(a);
                                    const bSelected = filters.hashtags.includes(b);
                                    if (aSelected && !bSelected) return -1;
                                    if (!aSelected && bSelected) return 1;
                                    return 0;
                                  })
                                  .slice(0, 6)
                                  .map((tag, idx) => {
                                    const isSelected = filters.hashtags.includes(tag);
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => handleHashtagClick(tag)}
                                        className={`px-2 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                                          isSelected
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                        }`}
                                      >
                                        #{tag}
                                      </button>
                                    );
                                  })}
                                {mondaiHashtags.length > 6 && (
                                  <span className="text-xs text-gray-500 self-center">+{mondaiHashtags.length - 6}</span>
                                )}
                              </>
                            )}
                        </div>
                      </div>

                    {/* 右側: ボタンエリア - 常に横並び */}
                      <div className="flex gap-2 flex-wrap items-center">
                        <Link 
                          href={`/mondai/${m.識別名}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-700 text-sm font-medium whitespace-nowrap"
                        >
                          大問詳細を見る
                        </Link>
                        
                        <a href={m.ASIN ? `https://www.amazon.co.jp/dp/${m.ASIN}` : 'https://www.amazon.co.jp/'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500 text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <ExternalLink size={14} />
                          Amazon
                        </a>
                      </div>
                  </div>

                  {/* 設問サマリーボタン - カード下部中央 */}
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedCards);
                          if (newExpanded.has(m.大問ID)) {
                            newExpanded.delete(m.大問ID);
                          } else {
                            newExpanded.add(m.大問ID);
                          }
                          setExpandedCards(newExpanded);
                        }}
                        className="px-6 py-1.5 bg-white hover:bg-emerald-100 text-emerald-700 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-colors border-0"
                      >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={16} />
                          設問構成を閉じる
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          設問構成を見る
                        </>
                      )}
                    </button>
                  </div>

                  {/* 展開エリア: 設問構成 */}
                  {isExpanded && mondaiSetumon.length > 0 && (
                    <div className="mt-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 w-20">設問名</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">設問カテゴリ</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">設問形式</th>
                              <th className="px-3 py-2 text-left font-semibold text-gray-700">知識・文法・重要単語</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {mondaiSetumon.map((s) => {
                              const setumonKnowledge = knowledge
                                .filter(k => k.設問ID === s.設問ID)
                                .map(k => k['知識・文法']);
                              return (
                                <tr key={s.設問ID} className="hover:bg-gray-50">
                                  <td className="px-3 py-3 text-left text-gray-800">{s.設問名}</td>
                                  <td className="px-3 py-3 text-left text-gray-800">{s.設問カテゴリ}</td>
                                  <td className="px-3 py-3 text-left">
                                    <button
                                      onClick={() => handleQuestionFormatClick(s.設問形式)}
                                      className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                                        filters.questionFormats.includes(s.設問形式)
                                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                      }`}
                                    >
                                      {s.設問形式}
                                    </button>
                                  </td>
                                  <td className="px-3 py-3 text-left">
                                    <div className="flex flex-wrap gap-1 justify-start overflow-hidden max-h-7">
                                      {(() => {

                                        // 知識・文法を取得
                                        const setumonKnowledge = knowledge
                                          .filter(k => k.設問ID === s.設問ID)
                                          .map(k => k['知識・文法']);
                                        
                                        // 設問IDが付与されている重要単語を取得
                                        const setumonKeywords = keywords
                                          .filter(kw => kw.設問ID && String(kw.設問ID) === String(s.設問ID))
                                          .map(kw => kw.単語);
                                        
                                        const hasKnowledge = setumonKnowledge.length > 0;
                                        const hasKeywords = setumonKeywords.length > 0;
                                        
                                        if (!hasKnowledge && !hasKeywords) {
                                          return <span className="text-gray-500">-</span>;
                                        }
                                        
                                        return (
                                          <>
                                            {/* 知識・文法（緑） */}
                                            {setumonKnowledge
                                              .sort((a, b) => {
                                                const aSelected = filters.knowledgeGrammar.includes(a);
                                                const bSelected = filters.knowledgeGrammar.includes(b);
                                                if (aSelected && !bSelected) return -1;
                                                if (!aSelected && bSelected) return 1;
                                                return 0;
                                              })
                                              .map((kg, idx) => {
                                                const isSelected = filters.knowledgeGrammar.includes(kg);
                                                return (
                                                  <button
                                                    key={`kg-${idx}`}
                                                    onClick={() => handleKnowledgeClick(kg)}
                                                    className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                                                      isSelected
                                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                                    }`}
                                                  >
                                                    {kg}
                                                  </button>
                                                );
                                              })}
                                            
                                            {/* 重要単語（青） */}
                                            {setumonKeywords.map((word, idx) => (
                                              <span
                                                key={`kw-${idx}`}
                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                              >
                                                {word}
                                              </span>
                                            ))}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* 3つのボタン */}
                        <div className="mt-4 flex flex-col md:flex-row gap-2 justify-center">
                          <Link 
                            href={`/mondai/${m.識別名}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-emerald-500 hover:text-white text-sm font-medium text-center"
                          >
                            この大問の詳細を見る
                          </Link>
                          
                          <Link 
                            href={`/university/${getUniversityCodeFromId(m.識別名, universities)}?year=${m.年度}&gakubu=${encodeURIComponent(m.学部)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-emerald-500 hover:text-white text-sm font-medium text-center"
                          >
                            {m.大学名}{m.学部}{m.年度}年度の一覧
                          </Link>
                          
                          <Link 
                            href={`/university/${getUniversityCodeFromId(m.識別名, universities)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-emerald-500 hover:text-white text-sm font-medium text-center"
                          >
                            {m.大学名}の過去問一覧
                          </Link>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
          
          {filteredResults.length > displayCount && (
            <div className="text-center py-6">
              <button
                onClick={() => setDisplayCount(prev => prev + 50)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-base shadow-md"
              >
                さらに50件表示 (残り{filteredResults.length - displayCount}件)
              </button>
            </div>
          )}
          
          {filteredResults.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">条件に一致する教材が見つかりませんでした</p>
              <p className="text-gray-400 text-sm mt-2">検索条件を変更してお試しください</p>
            </div>
          )}
        </div>
      {/* スクロールトップボタン */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 z-50"
        >
          <ChevronUp size={24} />
        </button>
      )}

      {/* ハッシュタグ検索モーダル */}
      {showHashtagModal && (
        <div className="fixed inset-0 bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Hash size={24} className="text-emerald-600" />
                ハッシュタグを検索
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {tempSelectedHashtags.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">選択中のハッシュタグ ({tempSelectedHashtags.length}件)</div>
                  <div className="flex flex-wrap gap-2">
                    {tempSelectedHashtags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleHashtagInModal(tag)}
                        className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm flex items-center gap-1 hover:bg-emerald-600"
                      >
                        #{tag}
                        <X size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">ハッシュタグを検索</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={hashtagSearchInput}
                    onChange={(e) => setHashtagSearchInput(e.target.value)}
                    placeholder="例: AI, 環境問題"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {hashtagSearchInput ? `検索結果 (${filteredHashtagsForModal.length}件)` : '上位のハッシュタグ'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredHashtagsForModal.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleHashtagInModal(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        tempSelectedHashtags.includes(tag)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                {hashtagSearchInput && filteredHashtagsForModal.length === 0 && (
                  <p className="text-gray-500 text-sm mt-4">該当するハッシュタグが見つかりませんでした</p>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowHashtagModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={confirmHashtagSelection}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 知識・文法検索モーダル */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">知識・文法を検索</h3>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {tempSelectedKnowledge.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">選択中の知識・文法 ({tempSelectedKnowledge.length}件)</div>
                  <div className="flex flex-wrap gap-2">
                    {tempSelectedKnowledge.map(kg => (
                      <button
                        key={kg}
                        onClick={() => toggleKnowledgeInModal(kg)}
                        className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm flex items-center gap-1 hover:bg-emerald-600"
                      >
                        {kg}
                        <X size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">知識・文法を検索</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={knowledgeSearchInput}
                    onChange={(e) => setKnowledgeSearchInput(e.target.value)}
                    placeholder="例: 関係代名詞, 不定詞"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {knowledgeSearchInput ? `検索結果 (${filteredKnowledgeForModal.length}件)` : '上位の知識・文法'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredKnowledgeForModal.map(kg => (
                    <button
                      key={kg}
                      onClick={() => toggleKnowledgeInModal(kg)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                        tempSelectedKnowledge.includes(kg)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {kg}
                    </button>
                  ))}
                </div>
                {knowledgeSearchInput && filteredKnowledgeForModal.length === 0 && (
                  <p className="text-gray-500 text-sm mt-4">該当する知識・文法が見つかりませんでした</p>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowKnowledgeModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={confirmKnowledgeSelection}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* マークダウン説明モーダル */}
        {(showQuestionFormatsModal || showPassageLevelsModal) && (
          <div className="fixed inset-0 bg-opacity-80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b flex items-center justify-between bg-emerald-50">
                <h3 className="text-xl font-bold text-gray-800">
                  {showQuestionFormatsModal ? '設問形式について' : '本文レベルについて'}
                </h3>
                <button
                  onClick={closeMarkdownModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 markdown-content text-gray-900">
                {isLoadingMarkdown ? (
                  <div className="text-center py-12 text-gray-500">読み込み中...</div>
                ) : (
                  <ReactMarkdown>{markdownContent}</ReactMarkdown>
                )}
              </div>
              
              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={closeMarkdownModal}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

      {/* リセット確認ダイアログ */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">条件をリセット</h3>
              <p className="text-sm text-gray-600 mb-6">すべての検索条件がリセットされます。よろしいですか？</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                  現在の条件を継続
                </button>
                <button
                  onClick={() => {
                    resetFilters();
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium"
                >
                  リセットする
                </button>
              </div>
            </div>
          </div>
        )}  

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          width: 100%;
        }
        input[type="range"]::-webkit-slider-track {
          background: transparent;
          height: 0;
        }
        input[type="range"]::-moz-range-track {
          background: transparent;
          height: 0;
        }
        .range-slider-top::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #10b981;
          cursor: pointer;
          clip-path: polygon(0% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          margin-top: -22px;
        }
        .range-slider-top::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #10b981;
          cursor: pointer;
          clip-path: polygon(0% 0%, 100% 0%, 100% 65%, 50% 100%, 0% 65%);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          border: none;
          border-radius: 0;
        }
        .range-slider-bottom::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #10b981;
          cursor: pointer;
          clip-path: polygon(50% 0%, 100% 35%, 100% 100%, 0% 100%, 0% 35%);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          margin-top: 10px;
        }
        .range-slider-bottom::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #10b981;
          cursor: pointer;
          clip-path: polygon(50% 0%, 100% 35%, 100% 100%, 0% 100%, 0% 35%);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          border: none;
          border-radius: 0;
        }

        /* マークダウンコンテンツのスタイル */
        .markdown-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 3px solid #10b981;
        }
        .markdown-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #10b981;
        }
        .markdown-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .markdown-content p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .markdown-content ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin-bottom: 1rem;
        }
        .markdown-content li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .markdown-content strong {
          color: #10b981;
          font-weight: 600;
        }
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .markdown-content th {
          background-color: #f3f4f6;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          border: 1px solid #d1d5db;
        }
        .markdown-content td {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
        }
        .markdown-content hr {
          margin: 2rem 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }

      `}</style>
    </div> 
　  </div>
  );
}