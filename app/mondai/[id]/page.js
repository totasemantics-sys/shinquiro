'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ExternalLink, ChevronRight, Home } from 'lucide-react';
import { loadAllData, getUniversityCodeFromId, getUniversityName } from '@/lib/loadData';
import Header from '@/app/components/Header';

export default function MondaiDetail() {
  const params = useParams();
  const router = useRouter();
  const [mondaiData, setMondaiData] = useState(null);
  const [setumonData, setSetumonData] = useState([]);
  const [hashtagData, setHashtagData] = useState([]);
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [universities, setUniversities] = useState([]);
  const [universityCode, setUniversityCode] = useState('');
  const [universityName, setUniversityName] = useState('');

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
        
        // 大学情報を取得
        setUniversities(data.universities);
        const code = getUniversityCodeFromId(found.識別名, data.universities);  // ← data.universitiesを追加
        setUniversityCode(code);
        setUniversityName(getUniversityName(code, data.universities));
      }
      
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!mondaiData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700">データが見つかりません</p>
          <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            検索ページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header />
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* パンくずリスト */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <button onClick={() => router.push('/')} className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <Home size={16} />
              検索画面
            </button>
            <ChevronRight size={16} className="text-gray-400" />
            <button onClick={() => router.push(`/university/${universityCode}`)} className="hover:text-emerald-600 transition-colors">
              {universityName}
            </button>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-gray-800 font-medium">
              {mondaiData.年度}年度 {mondaiData.日程}{mondaiData.方式}{mondaiData.学部}{mondaiData.大問番号}
            </span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900">{mondaiData.大学名} {mondaiData.年度}年度　{mondaiData.学部} 【{mondaiData.大問番号}】</h1>
          <p className="text-sm text-gray-600 mt-2"> {mondaiData.日程} / {mondaiData.方式}</p>
        </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">基本情報</h2>
            {mondaiData.ASIN && (
              <a href={`https://www.amazon.co.jp/dp/${mondaiData.ASIN}`} target="_blank" rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500">
                <ExternalLink size={16} />
                Amazonで見る
              </a>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 w-40">本文語数</th>
                  <td className="px-4 py-3 text-gray-900">{mondaiData.本文語数}語</td>
                </tr>
                {mondaiData.本文レベル && (
                  <tr className="hover:bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">本文レベル</th>
                    <td className="px-4 py-3 text-gray-900 flex items-center justify-between">
                      <span>
                        {mondaiData.本文レベル === 'S' && 'S:英検1級上位レベル'}
                        {mondaiData.本文レベル === 'A' && 'A:英検1級下位レベル'}
                        {mondaiData.本文レベル === 'B' && 'B:英検準1級上位レベル'}
                        {mondaiData.本文レベル === 'C' && 'C:英検準1級下位レベル'}
                        {mondaiData.本文レベル === 'D' && 'D:英検2級レベル'}
                      </span>
                      <button
                        onClick={() => router.push('/about/passage-levels')}
                        className="text-xs text-emerald-600 hover:text-emerald-700 underline whitespace-nowrap ml-4"
                      >
                        本文レベルについて
                      </button>
                    </td>
                  </tr>
                )}
                <tr className="hover:bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">設問数</th>
                  <td className="px-4 py-3 text-gray-900">
                    {mondaiData.設問数}問　
                    {(() => {
                      const bunshoJapanese = setumonData.filter(s => s.設問カテゴリ === '文章記述(日)').length;
                      const bunshoEnglish = setumonData.filter(s => s.設問カテゴリ === '文章記述(英)').length;
                      
                      if (bunshoJapanese === 0 && bunshoEnglish === 0) {
                        return <span className="text-gray-600">（文章記述なし）</span>;
                      }
                      
                      return (
                        <span className="text-gray-600">
                          （うち文章記述:
                          {bunshoJapanese > 0 && `日本語${bunshoJapanese}問`}
                          {bunshoJapanese > 0 && bunshoEnglish > 0 && '　'}
                          {bunshoEnglish > 0 && `英語${bunshoEnglish}問`}
                          ）
                        </span>
                      );
                    })()}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">ジャンル</th>
                  <td className="px-4 py-3 text-gray-900">{mondaiData.ジャンル}</td>
                </tr>
                {hashtagData.length > 0 && (
                  <tr className="hover:bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">テーマ・キーワード</th>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {hashtagData.map((h, idx) => (
                          <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                            #{h.ハッシュタグ}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                <tr className="hover:bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50">出典</th>
                  <td className="px-4 py-3 text-gray-900">{mondaiData.出典}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {setumonData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">設問構成</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-20">設問名</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">設問カテゴリ</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 w-32">設問形式</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">知識・文法</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {setumonData.map((s) => {
                    const setumonKnowledge = knowledgeData
                      .filter(k => k.設問ID === s.設問ID)
                      .map(k => k['知識・文法']);
                    return (
                      <tr key={s.設問ID} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-left text-gray-800">{s.設問名}</td>
                        <td className="px-3 py-3 text-left text-gray-800">{s.設問カテゴリ}</td>
                        <td className="px-3 py-3 text-left">
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                            {s.設問形式}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-left">
                          <div className="flex flex-wrap gap-1 justify-start">
                            {setumonKnowledge.length > 0 ? (
                              setumonKnowledge.map((kg, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {kg}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}