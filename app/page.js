'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Hash, X, RotateCcw, ChevronUp, Info } from 'lucide-react';
import { loadAllData } from '@/lib/loadData';

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
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [hashtagSearchInput, setHashtagSearchInput] = useState('');
  const [tempSelectedHashtags, setTempSelectedHashtags] = useState([]);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [knowledgeSearchInput, setKnowledgeSearchInput] = useState('');
  const [tempSelectedKnowledge, setTempSelectedKnowledge] = useState([]);
  const [showBunshoTooltip, setShowBunshoTooltip] = useState(false);
  const [showLevelTooltip, setShowLevelTooltip] = useState(false);
  
  const [universityInput, setUniversityInput] = useState('');
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);
  const universityInputRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      const data = await loadAllData();
      setMondai(data.mondai);
      setSetumon(data.setsumon);
      setHashtags(data.hashtags);
      setKnowledge(data.knowledge);
      setUniversities(data.universities);
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
        return filters.hashtags.some(tag => mondaiHashtags.includes(tag));
      });
    }
    
    // 設問カテゴリと設問形式のフィルタリング
    if (filters.questionCategories.length > 0 || filters.questionFormats.length > 0) {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        
        return mondaiSetumon.some(s => {
          let categoryMatch = true;
          let formatMatch = true;
          
          if (filters.questionCategories.length > 0) {
            categoryMatch = filters.questionCategories.includes(s.設問カテゴリ);
          }
          
          if (filters.questionFormats.length > 0) {
            formatMatch = filters.questionFormats.includes(s.設問形式);
          }
          
          return categoryMatch && formatMatch;
        });
      });
    }
    
    // 知識・文法のフィルタリング
    if (filters.knowledgeGrammar.length > 0) {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        const setumonIds = mondaiSetumon.map(s => s.設問ID);
        const mondaiKnowledge = knowledge.filter(k => setumonIds.includes(k.設問ID));
        return filters.knowledgeGrammar.some(kg => 
          mondaiKnowledge.some(mk => mk['知識・文法'] === kg)
        );
      });
    }
    
    // 文章記述(日本語)のフィルタリング
    if (filters.bunshoJapanese === 'required') {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        return mondaiSetumon.some(s => s.設問カテゴリ === '文章記述(日本語)');
      });
    } else if (filters.bunshoJapanese === 'excluded') {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        return !mondaiSetumon.some(s => s.設問カテゴリ === '文章記述(日本語)');
      });
    }
    
    // 文章記述(英語)のフィルタリング
    if (filters.bunshoEnglish === 'required') {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        return mondaiSetumon.some(s => s.設問カテゴリ === '文章記述(英語)');
      });
    } else if (filters.bunshoEnglish === 'excluded') {
      results = results.filter(m => {
        const mondaiSetumon = setumon.filter(s => s.大問ID === m.大問ID);
        return !mondaiSetumon.some(s => s.設問カテゴリ === '文章記述(英語)');
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
        case 'year-desc': return b.年度 - a.年度;
        case 'year-asc': return a.年度 - b.年度;
        case 'words-desc': return b.本文語数 - a.本文語数;
        case 'words-asc': return a.本文語数 - b.本文語数;
        default: return 0;
      }
    });
    
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

  const resetFilters = () => {
    setFilters({
      examTypes: [], university: '', wordCountRange: [0, 1500], vocabLevels: [],
      genre: '', hashtags: [], questionCategories: [], questionFormats: [],
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
      <header className="bg-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">SHINQUIRO（シンキロウ）</h1>
          <p className="text-sm text-gray-600 mt-2">大学受験英語長文検索システム</p>
        </div>
      </header>

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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
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
                      className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
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
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={filters.wordCountRange[0]}
                  onChange={(e) => setFilters({...filters, wordCountRange: [parseInt(e.target.value), filters.wordCountRange[1]]})}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={filters.wordCountRange[1]}
                  onChange={(e) => setFilters({...filters, wordCountRange: [filters.wordCountRange[0], parseInt(e.target.value)]})}
                  className="w-full"
                />
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
                    <div className="absolute left-6 top-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-xs w-64">
                      <div className="space-y-1">
                        <div><strong>S:</strong> 英検1級上位レベル</div>
                        <div><strong>A:</strong> 英検1級下位レベル</div>
                        <div><strong>B:</strong> 英検準1級上位レベル</div>
                        <div><strong>C:</strong> 英検準1級下位レベル</div>
                        <div><strong>D:</strong> 英検2級レベル</div>
                      </div>
                    </div>
                  )}
                </div>
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
                  <div className="text-xs text-gray-600 mb-2">選択中のハッシュタグ</div>
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
                    <div className="absolute left-6 top-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-xs w-72">
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
                {/* 文章記述(日本語) */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">文章記述(日本語)</div>
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
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      除外
                    </button>
                  </div>
                </div>
                
                {/* 文章記述(英語) */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">文章記述(英語)</div>
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
                          ? 'bg-red-500 text-white'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">設問形式(複数選択可)</label>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                placeholder="キーワードを入力..."
                value={filters.freeWord}
                onChange={(e) => setFilters({...filters, freeWord: e.target.value})}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button 
              onClick={resetFilters}
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
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="year-desc">年度順(新しい順)</option>
            <option value="year-asc">年度順(古い順)</option>
            <option value="words-desc">語数順(多い順)</option>
            <option value="words-asc">語数順(少ない順)</option>
          </select>
        </div>

        {/* 検索結果 */}
        <div className="space-y-4">
          {filteredResults.map((m) => (
            <div key={m.大問ID} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-800">{m.大学名}</h3>
                    <span className="text-lg text-gray-600">{m.学部}</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded">
                      {m.試験区分}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="font-semibold text-base text-gray-700">{m.年度}年度</span>
                    <span>{m.日程}</span>
                    <span>{m.方式}</span>
                    <span className="font-medium text-gray-700">{m.大問番号}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">本文:</span>
                      <span className="font-semibold text-gray-800">{m.本文語数}語</span>
                      {m.本文レベル && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded ml-1">
                          Lv.{m.本文レベル}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">設問:</span>
                      <span className="font-semibold text-gray-800">{m.設問数}問</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                      {m.ジャンル}
                    </span>
                  </div>
                </div>
                <Link 
                  href={`/mondai/${m.識別名}`}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm flex-shrink-0"
                >
                  詳細を見る
                </Link>
              </div>
            </div>
          ))}
          
          {filteredResults.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">条件に一致する教材が見つかりませんでした</p>
              <p className="text-gray-400 text-sm mt-2">検索条件を変更してお試しください</p>
            </div>
          )}
        </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
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

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>
    </div>
  );
}