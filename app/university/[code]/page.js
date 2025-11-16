'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { loadAllData, getUniversityName, getUniversityCodeFromId } from '@/lib/loadData';

export default function UniversityPage({ params }) {
  const [mondai, setMondai] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [universityName, setUniversityName] = useState('');
  const [groupedByYear, setGroupedByYear] = useState({});
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState(null);

  // paramsを解決
  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
    }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    
    async function fetchData() {
        const data = await loadAllData();
        setUniversities(data.universities);
        
        // 大学名を取得
        const name = getUniversityName(resolvedParams.code, data.universities);
        setUniversityName(name);
        
        // 該当する大学の大問を取得
        const filteredMondai = data.mondai.filter(m => {
        const code = getUniversityCodeFromId(m.識別名, data.universities);
        return code === resolvedParams.code;
        });
        
        // 年度でグループ化
        const grouped = filteredMondai.reduce((acc, m) => {
        if (!acc[m.年度]) acc[m.年度] = [];
        acc[m.年度].push(m);
        return acc;
        }, {});
        
        setMondai(filteredMondai);
        setGroupedByYear(grouped);
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
          <h1 className="text-3xl font-bold text-gray-800">SHINQUIRO</h1>
          <p className="text-sm text-gray-600 mt-2">シンキロウ 大学受験英語長文検索システム</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href={`/university/${resolvedParams.code}`} className="hover:text-emerald-600 transition-colors">
            <Home size={16} />
            検索画面
          </Link>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="text-gray-800 font-medium">{universityName}</span>
        </nav>

        {/* ページタイトル */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{universityName} 過去問一覧</h2>
          <p className="text-sm text-gray-600">全{mondai.length}件の大問</p>
        </div>

        {/* 年度別リスト */}
        <div className="space-y-4">
          {Object.entries(groupedByYear)
            .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 年度の新しい順
            .map(([year, problems]) => (
              <Link 
                key={year}
                href={`/university/${resolvedParams.code}/${year}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{year}年度</h3>
                    <p className="text-sm text-gray-600">{problems.length}件の大問</p>
                  </div>
                  <ChevronRight size={24} className="text-emerald-600" />
                </div>
              </Link>
            ))
          }
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