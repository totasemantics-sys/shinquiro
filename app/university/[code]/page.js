'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { loadAllData, getUniversityName, getUniversityCodeFromId } from '@/lib/loadData';
import Header from '@/app/components/Header';

export default function UniversityPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams(); 
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
      return parseInt(a.大問ID) - parseInt(b.大問ID);
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
      </div>

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>
    </div>
  );
}