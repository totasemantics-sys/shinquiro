'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Hash, X, RotateCcw, ChevronUp } from 'lucide-react';
import { loadAllData } from '@/lib/loadData';

export default function Home() {
  const [mondai, setMondai] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    examTypes: [],
    university: '',
    wordCountRange: [0, 1500],
    vocabLevels: [],
    genre: '',
    hashtags: [],
    freeWord: ''
  });
  
  const [sortBy, setSortBy] = useState('year-desc');
  const [filteredResults, setFilteredResults] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showHashtagModal, setShowHashtagModal] = useState(false);
  const [hashtagSearchInput, setHashtagSearchInput] = useState('');
  const [tempSelectedHashtags, setTempSelectedHashtags] = useState([]);
  
  const [universityInput, setUniversityInput] = useState('');
  const [showUniversitySuggestions, setShowUniversitySuggestions] = useState(false);
  const universityInputRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      const data = await loadAllData();
      setMondai(data.mondai);
      setHashtags(data.hashtags);
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
      results = results.filter(m => m.カテゴリ === filters.genre);
    }
    if (filters.hashtags.length > 0) {
      results = results.filter(m => {
        const mondaiHashtags = hashtags.filter(h => h.大問ID === m.大問ID).map(h => h.ハッシュタグ);
        return filters.hashtags.some(tag => mondaiHashtags.includes(tag));
      });
    }
    if (filters.freeWord) {
      const keyword = filters.freeWord.toLowerCase();
      results = results.filter(m => {
        const mondaiHashtags = hashtags.filter(h => h.大問ID === m.大問ID).map(h => h.ハッシュタグ);
        return (
          m.大学名.toLowerCase().includes(keyword) ||
          m.学部.toLowerCase().includes(keyword) ||
          m.カテゴリ.toLowerCase().includes(keyword) ||
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
  }, [filters, sortBy, mondai, hashtags]);

  const examTypes = ['国公立', '私立', '共通テスト', '資格'];
  const vocabLevels = ['S', 'A', 'B', 'C', 'D'];
  const categories = [...new Set(mondai.map(m => m.カテゴリ))].filter(Boolean).sort();
  
  const hashtagFrequency = {};
  hashtags.forEach(h => {
    hashtagFrequency[h.ハッシュタグ] = (hashtagFrequency[h.ハッシュタグ] || 0) + 1;
  });
  const sortedHashtags = Object.entries(hashtagFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

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

  const filteredUniversities = universities.filter(u => 
    u.大学名.toLowerCase().includes(universityInput.toLowerCase())
  );

  const resetFilters = () => {
    setFilters({
      examTypes: [], university: '', wordCountRange: [0, 1500], vocabLevels: [],
      genre: '', hashtags: [], freeWord: ''
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
              <label className="block text-sm font-medium text-gray-700 mb-2">大学名</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">本文レベル(複数選択可)</label>
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
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilters({...filters, genre: filters.genre === cat ? '' : cat})}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      filters.genre === cat
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
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
                      {m.カテゴリ}
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

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>
    </div>
  );
}