'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Home, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { loadAllData, getUniversityName, getUniversityCodeFromId } from '@/lib/loadData';
import Header from '@/app/components/Header';

export default function UniversityPage({ params }) {
  const searchParams = useSearchParams(); 
  const [mondai, setMondai] = useState([]);
  const [filteredMondai, setFilteredMondai] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [universityName, setUniversityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState(null);
  
  // ソート状態
  const [sortConfig, setSortConfig] = useState({ key: '年度', direction: 'desc' });
  
  // フィルター状態
  const [filters, setFilters] = useState({
    年度: [],
    日程: [],
    方式: [],
    学部: [],
    ジャンル: [],
    本文レベル: [],
    大問番号: [] 
  });
  
  const [showFilters, setShowFilters] = useState({
    年度: false,
    ジャンル: false,
    本文レベル: false,
    大問番号: false
  });

  // 外側クリック検知用のref
  const filterRefs = {
    年度: useRef(null),
    ジャンル: useRef(null),
    本文レベル: useRef(null),
    大問番号: useRef(null)
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
    if (!resolvedParams?.code) return;
    
    async function fetchData() {
        const data = await loadAllData();
        setUniversities(data.universities);
        
        // 大学名を取得
        const name = getUniversityName(resolvedParams.code, data.universities);
        setUniversityName(name);
        
        // 該当する大学の全大問を取得
        const filtered = data.mondai.filter(m => {
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
        学部: [],
        ジャンル: [],
        本文レベル: [],
        大問番号: []
        };
        
        const yearParam = searchParams.get('year');
        const gakubuParam = searchParams.get('gakubu');

        console.log('yearParam:', yearParam);      // ← デバッグ用に追加
        console.log('gakubuParam:', gakubuParam);  // ← デバッグ用に追加
        
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

  // フィルター処理
    useEffect(() => {
    console.log('フィルター処理開始');
    console.log('mondai:', mondai);
    console.log('filters:', filters);
    
    if (!mondai || mondai.length === 0) {
        console.log('mondaiが空です');
        return;
    }
    
    let result = [...mondai];
    console.log('フィルター前の件数:', result.length);
    
    if (filters.年度.length > 0) {
        console.log('年度フィルタ適用:', filters.年度);
        result = result.filter(m => filters.年度.includes(m.年度));
        console.log('年度フィルタ後の件数:', result.length);
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
    if (filters.ジャンル.length > 0) {
        result = result.filter(m => filters.ジャンル.includes(m.ジャンル));
    }
    if (filters.本文レベル.length > 0) {
        result = result.filter(m => filters.本文レベル.includes(m.本文レベル));
    }
    if (filters.大問番号.length > 0) {
    result = result.filter(m => filters.大問番号.includes(m.大問番号));
    }
    
    console.log('フィルター後の件数:', result.length);
    
    // ソートを適用
    if (sortConfig.key) {
        result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // 大問番号の特別処理
        if (sortConfig.key === '大問番号') {
            // "第1問" → 1, "第2問" → 2 のように数値を抽出
            const aNum = parseInt(aVal.replace(/[^0-9]/g, '')) || 0;
            const bNum = parseInt(bVal.replace(/[^0-9]/g, '')) || 0;
            return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        aVal = String(aVal || '');
        bVal = String(bVal || '');
        
        return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal, 'ja')
            : bVal.localeCompare(aVal, 'ja');
        });
    }
    
    console.log('最終結果:', result);
    setFilteredMondai(result);
    }, [filters, mondai, sortConfig]); // sortConfigを依存配列に追加

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

  // ソート処理
    const handleSort = (key) => {
    setSortConfig(prev => {
        if (prev.key === key) {
        // 同じカラムをクリックした場合は昇順/降順を切り替え
        return {
            key,
            direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
        } else {
        // 違うカラムをクリックした場合は降順でスタート
        return {
            key,
            direction: 'desc'
        };
        }
    });
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{universityName}</h2>
          <p className="text-sm text-gray-600">全{mondai.length}件の大問</p>
        </div>

        {/* 上部フィルターエリア */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
            {/* 年度フィルター */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">年度</label>
                <button
                    onClick={() => {
                    const allYears = getFilterOptions('年度');
                    setFilters(prev => ({
                        ...prev,
                        年度: allYears
                    }));
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
                    setFilters(prev => ({
                        ...prev,
                        日程: allNittei
                    }));
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
                    setFilters(prev => ({
                        ...prev,
                        方式: allHoushiki
                    }));
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
                    setFilters(prev => ({
                        ...prev,
                        学部: allGakubu
                    }));
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
                  {/* 年度/大問番号 */}
                  <th className="px-4 py-3 text-left">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => handleSort('年度')}
                          className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-emerald-600"
                        >
                          年度
                          <SortIcon column="年度" />
                        </button>
                        <div className="relative" ref={filterRefs.年度}>
                          <button
                            onClick={() => setShowFilters(prev => ({ ...prev, 年度: !prev.年度 }))}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Filter size={14} className={filters.年度.length > 0 ? 'text-emerald-600' : 'text-gray-400'} />
                          </button>
                          {showFilters.年度 && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10 min-w-[100px] max-h-[300px] overflow-y-auto">
                              {getFilterOptions('年度').map(option => (
                                <label key={option} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer text-sm text-gray-900">
                                  <input
                                    type="checkbox"
                                    checked={filters.年度.includes(option)}
                                    onChange={() => toggleFilter('年度', option)}
                                    className="rounded"
                                  />
                                  {option}年度
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <button
                            onClick={() => handleSort('大問番号')}
                            className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-emerald-600"
                        >
                            大問
                            <SortIcon column="大問番号" />
                        </button>
                        <div className="relative" ref={filterRefs.大問番号}>
                            <button
                            onClick={() => setShowFilters(prev => ({ ...prev, 大問番号: !prev.大問番号 }))}
                            className="p-1 hover:bg-gray-200 rounded"
                            >
                            <Filter size={14} className={filters.大問番号.length > 0 ? 'text-emerald-600' : 'text-gray-400'} />
                            </button>
                            {showFilters.大問番号 && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10 min-w-[120px] max-h-[300px] overflow-y-auto">
                                {getFilterOptions('大問番号').map(option => (
                                <label key={option} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer text-sm text-gray-900">
                                    <input
                                    type="checkbox"
                                    checked={filters.大問番号.includes(option)}
                                    onChange={() => toggleFilter('大問番号', option)}
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
                    {/* 年度と大問番号を縦積み */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm text-gray-600">{m.年度}年度</div>
                        <Link 
                          href={`/mondai/${m.識別名}`}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          {m.大問番号}
                        </Link>
                      </div>
                    </td>
                    {/* ジャンルと本文Lvを縦積み */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded whitespace-nowrap">
                          {m.ジャンル}
                        </span>
                        {m.本文レベル && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
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