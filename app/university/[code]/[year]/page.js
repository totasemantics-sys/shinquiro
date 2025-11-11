'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, ExternalLink } from 'lucide-react';
import { loadAllData, getUniversityName, getUniversityCodeFromId, getYearFromId } from '@/lib/loadData';

export default function UniversityYearPage({ params }) {
  const [mondai, setMondai] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [universityName, setUniversityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState(null);

// paramsを解決
  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
    }, [params]);

useEffect(() => {
    if (!resolvedParams?.code || !resolvedParams?.year) return;
    
    async function fetchData() {
        const data = await loadAllData();
        setUniversities(data.universities);
        
        console.log('=== デバッグ情報 ===');
        console.log('resolvedParams:', resolvedParams);
        console.log('全大問数:', data.mondai.length);
        
        // 大学名を取得
        const name = getUniversityName(resolvedParams.code, data.universities);
        setUniversityName(name);
        console.log('大学名:', name);
        
        // 該当する大学・年度の大問を取得
        const targetYear = parseInt(resolvedParams.year);
        const filteredMondai = data.mondai.filter(m => {
        const code = getUniversityCodeFromId(m.識別名, data.universities);
        const mondaiYear = parseInt(m.年度);
        return code === resolvedParams.code && mondaiYear === targetYear;
        });
        
        setMondai(filteredMondai);
        setLoading(false);
        }
    fetchData();
    }, [resolvedParams]);

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

        {/* 大問リスト */}
        <div className="space-y-4">
          {mondai.map((m) => (
            <div key={m.大問ID} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* 左側: 問題情報 */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">
                      {m.試験区分}
                    </span>
                    <span className="text-base font-bold text-gray-800">{m.日程}</span>
                    <span className="text-base font-bold text-gray-800">{m.方式}</span>
                    <span className="text-base font-bold text-gray-800">{m.学部}</span>
                    <span className="text-lg font-bold text-gray-900">{m.大問番号}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span className="font-semibold text-gray-900">{m.本文語数}語</span>
                    {m.本文レベル && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                        Lv.{m.本文レベル}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900">{m.設問数}問</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {m.ジャンル}
                    </span>
                  </div>
                </div>

                {/* 右側: ボタン */}
                <div className="flex lg:flex-col gap-2">
                  <Link 
                    href={`/mondai/${m.識別名}`}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium whitespace-nowrap"
                  >
                    詳細を見る
                  </Link>
                  
                  <a href={m.ASIN ? `https://www.amazon.co.jp/dp/${m.ASIN}` : 'https://www.amazon.co.jp/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <ExternalLink size={14} />
                    Amazon
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mondai.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">データが見つかりませんでした</p>
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