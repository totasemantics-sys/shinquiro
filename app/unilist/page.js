'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { loadCSV } from '@/lib/loadData';

const REGIONS = ['北海道', '東北', '北関東', '南関東', '甲信越', '北陸', '東海', '関西', '中国', '四国', '九州・沖縄'];

export default function UnilistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('univ'); // 'univ' | 'other'
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  // フィルター（URLパラメータで初期値を設定）
  const [qFilter,      setQFilter]      = useState(() => searchParams.get('q') || '');
  const [kubunFilter,  setKubunFilter]  = useState(() => {
    const cat = searchParams.get('category');
    return (cat === '国公立' || cat === '私立') ? [cat] : [];
  });
  const [regionFilter, setRegionFilter] = useState(() => {
    const r = searchParams.get('region');
    return r && REGIONS.includes(r) ? [r] : [];
  });
  const [medFilter,    setMedFilter]    = useState('すべて'); // あり / なし / すべて

  useEffect(() => {
    loadCSV('universities.csv').then(data => {
      setUniversities(data);
      setLoading(false);
    });
  }, []);

  const toggle = (setter, current, value) =>
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);

  // 大学（国公立・私立）
  const univList = useMemo(() => {
    let rows = universities.filter(u => u.区分 === '国公立' || u.区分 === '私立');

    if (qFilter.trim())
      rows = rows.filter(u => u.名称?.includes(qFilter.trim()));
    if (kubunFilter.length > 0)
      rows = rows.filter(u => kubunFilter.includes(u.区分));
    if (regionFilter.length > 0)
      rows = rows.filter(u => regionFilter.includes(u.地方));
    if (medFilter === 'あり')
      rows = rows.filter(u => u.医学部 === 'TRUE');
    if (medFilter === 'なし')
      rows = rows.filter(u => u.医学部 !== 'TRUE');

    return [...rows].sort((a, b) => a.名称.localeCompare(b.名称, 'ja'));
  }, [universities, qFilter, kubunFilter, regionFilter, medFilter]);

  // その他の試験（共通テスト・資格）
  const otherList = useMemo(() =>
    universities.filter(u => u.区分 === '共通テスト' || u.区分 === '資格'),
    [universities]
  );

  const btnActive   = 'bg-emerald-600 text-white';
  const btnInactive = 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  const kubunBadge = (kubun) =>
    kubun === '国公立' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';

  const otherBadge = (kubun) =>
    kubun === '共通テスト' ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header pageTitle="大学検索" pageDescription="シンキロウ/条件から大学を絞り込み" />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">

        {/* タブ切替 */}
        <div className="flex gap-1 bg-white rounded-xl shadow-md p-1 w-fit">
          {[['univ', '大学検索'], ['other', '共通テスト・その他試験']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-emerald-50'
              }`}
            >{label}</button>
          ))}
        </div>

        {/* ══ 大学検索タブ ══ */}
        {activeTab === 'univ' && <section>

          {/* フィルター */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-5 mb-4">

            {/* 名称検索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">名称</label>
              <input
                type="text"
                value={qFilter}
                onChange={e => setQFilter(e.target.value)}
                placeholder="例: 東京"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* 区分 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">区分</label>
              <div className="flex gap-2">
                {['国公立', '私立'].map(k => (
                  <button key={k}
                    onClick={() => toggle(setKubunFilter, kubunFilter, k)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      kubunFilter.includes(k) ? btnActive : btnInactive
                    }`}
                  >{k}</button>
                ))}
              </div>
            </div>

            {/* 地方 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">地方</label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map(r => (
                  <button key={r}
                    onClick={() => toggle(setRegionFilter, regionFilter, r)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      regionFilter.includes(r) ? btnActive : btnInactive
                    }`}
                  >{r}</button>
                ))}
              </div>
            </div>

            {/* 医学部 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">医学部</label>
              <div className="flex gap-2">
                {['すべて', 'あり', 'なし'].map(opt => (
                  <button key={opt}
                    onClick={() => setMedFilter(opt)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      medFilter === opt ? btnActive : btnInactive
                    }`}
                  >{opt}</button>
                ))}
              </div>
            </div>
          </div>

          {/* 件数 */}
          <p className="text-sm text-gray-500 mb-2 px-1">
            {loading ? '読み込み中...' : <><span className="font-bold text-emerald-600">{univList.length}</span> 件</>}
          </p>

          {/* 一覧 */}
          {!loading && (
            univList.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-400 text-sm">
                条件に合う大学が見つかりませんでした
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {univList.map((u, i) => (
                  <button key={u.コード}
                    onClick={() => router.push(`/university/${u.コード}`)}
                    className={`w-full flex items-center gap-2 px-5 py-3 text-left hover:bg-emerald-50 transition-colors ${
                      i !== 0 ? 'border-t border-gray-100' : ''
                    }`}
                  >
                    {/* 区分バッジ: 固定幅で名前位置を揃える */}
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded text-center shrink-0 w-[3.5rem] ${kubunBadge(u.区分)}`}>
                      {u.区分}
                    </span>
                    {/* 地方バッジ: 固定幅（空でもスペーサーとして確保） */}
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded text-center shrink-0 w-[5.5rem] ${
                      u.地方 ? 'bg-emerald-100 text-emerald-700' : ''
                    }`}>
                      {u.地方 || ''}
                    </span>
                    {/* 大学名 */}
                    <span className="font-medium text-gray-800 flex-1">{u.名称}</span>
                    {/* 医バッジ（名前の右） */}
                    {u.医学部 === 'TRUE' && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded shrink-0 bg-gray-100 text-gray-500">
                        医
                      </span>
                    )}
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            )
          )}
        </section>}

        {/* ══ 共通テスト・その他試験タブ ══ */}
        {activeTab === 'other' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <p className="text-sm text-gray-400 px-5 py-4">読み込み中...</p>
            ) : (
              otherList.map((u, i) => (
                <button key={u.コード}
                  onClick={() => router.push(`/university/${u.コード}`)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-emerald-50 transition-colors ${
                    i !== 0 ? 'border-t border-gray-100' : ''
                  }`}
                >
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${otherBadge(u.区分)}`}>
                    {u.区分}
                  </span>
                  <span className="font-medium text-gray-800">{u.名称}</span>
                  <ChevronRight size={14} className="ml-auto text-gray-300 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
