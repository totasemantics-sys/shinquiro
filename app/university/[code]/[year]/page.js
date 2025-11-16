'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, ExternalLink, ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import { loadAllData, getUniversityName, getUniversityCodeFromId } from '@/lib/loadData';

export default function UniversityYearPage({ params }) {
  const [mondai, setMondai] = useState([]);
  const [filteredMondai, setFilteredMondai] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [universityName, setUniversityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState(null);
  
  // ソート状態
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // フィルター状態
  const [filters, setFilters] = useState({
    日程: [],
    方式: [],
    学部: [],
    ジャンル: [],
    本文レベル: []
  });
  
  const [showFilters, setShowFilters] = useState({
    日程: false,
    方式: false,
    学部: false,
    ジャンル: false,
    本文レベル: false
  });

  // 外側クリック検知用のref
  const filterRefs = {
    ジャンル: useRef(null),
    本文レベル: useRef(null)
  };

  // 外側クリックでフィルターを閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(filterRefs).forEach(key => {
        if (filterRefs[key].current && !filterRefs[key].current.contains(event.target)) {
          setShowFilters(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // paramsを解決
  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams?.code || !resolvedParams?.year) return;
    
    async function fetchData() {
      const data = await loadAllData();
      setUniversities(data.universities);
      
      // 大学名を取得
      const name = getUniversityName(resolvedParams.code, data.universities);
      setUniversityName(name);
      
      // 該当する大学・年度の大問を取得
      const targetYear = parseInt(resolvedParams.year);
      const filtered = data.mondai.filter(m => {
        const code = getUniversityCodeFromId(m.識別名, data.universities);
        const mondaiYear = parseInt(m.年度);
        return code === resolvedParams.code && mondaiYear === targetYear;
      });
      
      // 各大問に文章記述数を追加
      const enrichedMondai = filtered.map(m => {
        // 設問データがある場合のみカウント
        let bunshoJapanese = 0;
        let bunshoEnglish = 0;
        
        if (data.setsumon && Array.isArray(data.setsumon)) {
          const mondaiSetsumon = data.setsumon.filter(s => s.大問ID === m.大問ID);
          bunshoJapanese = mondaiSetsumon.filter(s => s.設問カテゴリ === '文章記述(日本語)').length;
          bunshoEnglish = mondaiSetsumon.filter(s => s.設問カテゴリ === '文章記述(英語)').length;
        }
        
        return {
          ...m,
          文章記述日本語: bunshoJapanese,
          文章記述英語: bunshoEnglish
        };
      });
      
      setMondai(enrichedMondai);
      setFilteredMondai(enrichedMondai);
      setLoading(false);
    }
    fetchData();
  }, [resolvedParams]);

  // ソート処理
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredMondai].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];
      
      // 数値の場合
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // 文字列の場合
      aVal = String(aVal || '');
      bVal = String(bVal || '');
      
      if (direction === 'asc') {
        return aVal.localeCompare(bVal, 'ja');
      } else {
        return bVal.localeCompare(aVal, 'ja');
      }
    });
    
    setFilteredMondai(sorted);
  };

  // フィルター処理
  useEffect(() => {
    if (!mondai || mondai.length === 0) {
      return;
    }
    
    let result = [...mondai];
    
    if (filters.日程.length > 0) {
      result = result.filter(m => filters.日程.includes(m.日程));
    }
    if (filters.方式.length > 0) {
      result = result.filter(m => filters.方式.includes(m.方式));
    }
    if (filters.学部.length > 0) {
      result = result.filter(m => filters.学部.includes(m.学部));
    }
    if (filters.ジャンル.length > 0) {
      result = result.filter(m => filters.ジャンル.includes(m.ジャンル));
    }
    if (filters.本文レベル.length > 0) {
      result = result.filter(m => filters.本文レベル.includes(m.本文レベル));
    }
    
    setFilteredMondai(result);
  }, [filters, mondai]);

  // フィルター選択肢を取得
  const getFilterOptions = (key) => {
    return [...new Set(mondai.map(m => m[key]).filter(Boolean))].sort();
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

  // ソートアイコン
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ChevronUp size={14} className="text-gray-300" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-emerald-600" />
      : <ChevronDown size={14} className="text-emerald-600" />;
  };

  if (loading || !resolvedParams) {
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
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <Home size={16} />
            検索画面
          </Link>
          <ChevronRight size={16} className="text-gray-400" />
          <Link href={`/university/${resolvedParams.code}`} className="hover:text-emerald-600 transition-colors">
            {universityName}
          </Link>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="text-gray-800 font-medium">{resolvedParams.year}年度</span>
        </nav>

        {/* ページタイトル */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{universityName} {resolvedParams.year}年度</h2>
          <p className="text-sm text-gray-600">全{mondai.length}件の大問</p>
        </div>

        {/* 上部フィルターエリア */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
          {/* 日程フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">日程</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">方式</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">学部</label>
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

        {/* 説明テキスト */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">大問番号をクリックすると詳細ページに移動します</p>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  {/* 大問番号 */}
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('大問番号')}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-emerald-600"
                    >
                      大問
                      <SortIcon column="大問番号" />
                    </button>
                  </th>

                  {/* ジャンル/本文Lv */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => handleSort('ジャンル')}
                          className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-emerald-600"
                        >
                          ジャンル
                          <SortIcon column="ジャンル" />
                        </button>
                        <div className="relative" ref={filterRefs.ジャンル}>
                          <button
                            onClick={() => setShowFilters(prev => ({ ...prev, ジャンル: !prev.ジャンル }))}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Filter size={14} className={filters.ジャンル.length > 0 ? 'text-emerald-600' : 'text-gray-400'} />
                          </button>
                          {showFilters.ジャンル && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10 min-w-[150px] max-h-[300px] overflow-y-auto">
                              {getFilterOptions('ジャンル').map(option => (
                                <label key={option} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer text-sm text-gray-900">
                                  <input
                                    type="checkbox"
                                    checked={filters.ジャンル.includes(option)}
                                    onChange={() => toggleFilter('ジャンル', option)}
                                    className="rounded"
                                  />
                                  {option}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => handleSort('本文レベル')}
                          className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-emerald-600"
                        >
                          本文Lv
                          <SortIcon column="本文レベル" />
                        </button>
                        <div className="relative" ref={filterRefs.本文レベル}>
                          <button
                            onClick={() => setShowFilters(prev => ({ ...prev, 本文レベル: !prev.本文レベル }))}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Filter size={14} className={filters.本文レベル.length > 0 ? 'text-emerald-600' : 'text-gray-400'} />
                          </button>
                          {showFilters.本文レベル && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10 min-w-[80px]">
                              {getFilterOptions('本文レベル').map(option => (
                                <label key={option} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer text-sm text-gray-900">
                                  <input
                                    type="checkbox"
                                    checked={filters.本文レベル.includes(option)}
                                    onChange={() => toggleFilter('本文レベル', option)}
                                    className="rounded"
                                  />
                                  {option}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </th>

                  {/* 本文語数 */}
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('本文語数')}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-emerald-600"
                    >
                      語数
                      <SortIcon column="本文語数" />
                    </button>
                  </th>

                  {/* 設問数/文章記述 */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleSort('設問数')}
                        className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-emerald-600"
                      >
                        設問
                        <SortIcon column="設問数" />
                      </button>
                      <span className="text-sm font-semibold text-gray-700">文章記述</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMondai.map((m, index) => (
                  <tr key={m.大問ID} className={`hover:bg-emerald-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <Link 
                        href={`/mondai/${m.識別名}`}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        {m.大問番号}
                      </Link>
                    </td>
                    {/* ジャンルと本文Lvを縦積み */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded whitespace-nowrap">
                          {m.ジャンル}
                        </span>
                        {m.本文レベル && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                            {m.本文レベル}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{m.本文語数}</td>
                    {/* 設問と文章記述を縦積み */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-sm text-gray-900">
                        <div>{m.設問数}問</div>
                        <div>
                          {m.文章記述日本語 === 0 && m.文章記述英語 === 0 ? (
                            '0'
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMondai.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center mt-6">
            <p className="text-gray-500 text-lg">条件に一致するデータが見つかりませんでした</p>
            {Object.values(filters).some(f => f.length > 0) && (
              <button
                onClick={() => setFilters({
                  日程: [], 方式: [], 学部: [], ジャンル: [], 本文レベル: []
                })}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                フィルターをクリア
              </button>
            )}
          </div>
        )}
      </div>

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>
    </div>
  );
}