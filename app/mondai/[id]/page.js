'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { loadAllData } from '@/lib/loadData';

export default function MondaiDetail() {
  const params = useParams();
  const router = useRouter();
  const [mondaiData, setMondaiData] = useState(null);
  const [setumonData, setSetumonData] = useState([]);
  const [hashtagData, setHashtagData] = useState([]);
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await loadAllData();
      const found = data.mondai.find(m => m.識別名 === params.id);
      
      if (found) {
        setMondaiData(found);
        const setumon = data.setsumon.filter(s => s.大問ID === found.大問ID);
        setSetumonData(setumon);
        setHashtagData(data.hashtags.filter(h => h.大問ID === found.大問ID));
        
        const setumonIds = setumon.map(s => s.設問ID);
        setKnowledgeData(data.knowledge.filter(k => setumonIds.includes(k.設問ID)));
      }
      
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!mondaiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">データが見つかりません</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md">
            検索ページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-emerald-600 mb-4">
            <ChevronLeft size={20} />
            検索ページに戻る
          </button>
          <h1 className="text-3xl font-bold">{mondaiData.大学名} {mondaiData.年度}年度 {mondaiData.大問番号}</h1>
          <p className="text-sm text-gray-600 mt-2">{mondaiData.学部} / {mondaiData.日程} / {mondaiData.方式}</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-yellow-800">📝 詳細レビューは準備中です</h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">基本情報</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">本文語数</p>
              <p className="text-2xl font-bold text-emerald-700">{mondaiData.本文語数}語</p>
            </div>
            {mondaiData.本文レベル && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">本文レベル</p>
                <p className="text-2xl font-bold text-purple-700">Lv.{mondaiData.本文レベル}</p>
              </div>
            )}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">設問数</p>
              <p className="text-2xl font-bold text-blue-700">{mondaiData.設問数}問</p>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">カテゴリ</p>
              <p className="text-lg font-bold text-teal-700">{mondaiData.カテゴリ}</p>
            </div>
          </div>
          
          {mondaiData.ASIN && (
            <a href={`https://www.amazon.co.jp/dp/${mondaiData.ASIN}`} target="_blank" rel="noopener noreferrer" 
               className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 mt-4">
              <ExternalLink size={16} />
              Amazonで見る
            </a>
          )}
        </div>

        {hashtagData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">🏷️ テーマ・キーワード</h2>
            <div className="flex flex-wrap gap-2">
              {hashtagData.map((h, idx) => (
                <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  #{h.ハッシュタグ}
                </span>
              ))}
            </div>
          </div>
        )}

        {setumonData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📋 設問構成</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">設問名</th>
                    <th className="px-4 py-2 text-left">カテゴリ</th>
                    <th className="px-4 py-2 text-left">形式</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {setumonData.map((s) => (
                    <tr key={s.設問ID}>
                      <td className="px-4 py-3">{s.設問名}</td>
                      <td className="px-4 py-3">{s.設問カテゴリ}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                          {s.設問形式}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {knowledgeData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📚 必要な知識・文法</h2>
            <div className="flex flex-wrap gap-2">
              {[...new Set(knowledgeData.map(k => k['知識・文法']))].map((kg, idx) => (
                <span key={idx} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm">
                  {kg}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}