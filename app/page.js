'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Sparkles, X } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import { loadKeywordData } from '@/lib/loadKeywordData';
import { loadWordMasterData, getWordInfoGrouped } from '@/lib/loadWordMasterData';
import { loadWordData, searchWord } from '@/lib/loadWordData';
import { loadTangochoMasterData, getAmazonLinkByBookName } from '@/lib/loadTangochoMasterData';
import { loadAllData } from '@/lib/loadData';

function getDailyWord(words) {
  const dateStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return words[Math.abs(hash) % words.length];
}

export default function Home() {
  const [dailyWord, setDailyWord] = useState(null);
  const [showDailyWordModal, setShowDailyWordModal] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [wordMaster, setWordMaster] = useState([]);
  const [wordData, setWordData] = useState([]);
  const [tangochoMaster, setTangochoMaster] = useState([]);
  const [mondaiData, setMondaiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDailyWordData() {
      try {
        const kw = await loadKeywordData();
        setKeywords(kw);

        // 修練・上級レベルの単語をユニーク化
        const hardWords = [];
        const seen = new Set();
        kw.forEach(row => {
          if ((row.レベル === '修練' || row.レベル === '上級') && row.単語 && !seen.has(row.単語)) {
            seen.add(row.単語);
            hardWords.push(row);
          }
        });

        if (hardWords.length > 0) {
          setDailyWord(getDailyWord(hardWords));
        }

        const [wm, wd, tm, allData] = await Promise.all([
          loadWordMasterData(),
          loadWordData(),
          loadTangochoMasterData(),
          loadAllData()
        ]);
        setWordMaster(wm);
        setWordData(wd);
        setTangochoMaster(tm);
        setMondaiData(allData.mondai);
      } catch (error) {
        console.error('Error loading daily word data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDailyWordData();
  }, []);

  // モーダル用: 品詞ごとにグルーピングした意味一覧
  const getGroupedMeanings = (word) => {
    if (!word || !wordMaster.length) return [];
    const infos = getWordInfoGrouped(wordMaster, word);
    // 品詞でグルーピング
    const groups = new Map();
    infos.forEach(info => {
      const pos = info.品詞 || 'その他';
      if (!groups.has(pos)) groups.set(pos, []);
      groups.get(pos).push(info);
    });
    return groups;
  };

  // モーダル用: 単語帳掲載状況
  const getBookStatuses = (word) => {
    if (!word || !wordData.length) return [];
    const results = searchWord(wordData, word);
    return results.map(r => ({
      book: r.単語帳名称,
      status: r.掲載区分 === '見出し語' ? 'main' : 'related',
      number: r.単語帳内番号 || null,
      page: r.ページ数 || null
    }));
  };

  // モーダル用: 出現した大問一覧
  const getAppearingMondai = (word) => {
    if (!word || !keywords.length || !mondaiData.length) return [];
    const mondaiIds = [...new Set(keywords.filter(k => k.単語 === word).map(k => k.大問ID))];
    return mondaiIds
      .map(id => mondaiData.find(m => m.大問ID === id))
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header
        pageTitle=""
        pageDescription=""
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* ヒーローセクション */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            大学受験英語の
            <span className="text-emerald-600">検索・分析</span>
            システム
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            過去問の長文検索、単語帳の掲載状況チェックなど、
            大学受験英語の学習・指導をサポートするツールを提供しています。
          </p>
        </div>

        {/* 機能カード */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* 長文検索 */}
          <Link href="/search" className="group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-emerald-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 transition-colors">
                  <Search className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">長文検索</h2>
              </div>
              <p className="text-gray-600 mb-4">
                大学・年度・設問形式・テーマなど、多角的な条件で英語長文を検索できます。
              </p>
              <span className="text-emerald-600 font-medium group-hover:underline">
                検索する →
              </span>
            </div>
          </Link>

          {/* 単語検索 */}
          <Link href="/words" className="group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-emerald-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                  <BookOpen className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">単語検索</h2>
              </div>
              <p className="text-gray-600 mb-4">
                英単語が各単語帳に掲載されているかを一括チェック。大学別の頻出単語も検索できます。
              </p>
              <span className="text-blue-600 font-medium group-hover:underline">
                検索する →
              </span>
            </div>
          </Link>

          {/* 今日の難単語 */}
          <div className="group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-amber-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 transition-colors">
                  <Sparkles className="w-7 h-7 text-amber-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">今日の難単語</h2>
              </div>
              {loading ? (
                <div className="text-gray-400 mb-4 text-center">読み込み中...</div>
              ) : dailyWord ? (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800 mb-4">{dailyWord.単語}</p>
                  <button
                    onClick={() => setShowDailyWordModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors text-sm"
                  >
                    意味を見る
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 mb-4 text-center">データを取得できませんでした</p>
              )}
            </div>
          </div>
        </div>

        {/* 最新記事セクション（準備中） */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">最新記事</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-gray-200">
                <div className="bg-gray-100 h-40 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-gray-300" />
                </div>
                <div className="p-4">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">記事コンテンツを準備中です</p>
        </div>
      </div>

      {/* 今日の難単語モーダル */}
      {showDailyWordModal && dailyWord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* ヘッダー */}
            <div className="p-6 border-b bg-emerald-50">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">{dailyWord.単語}</h3>
                <button
                  onClick={() => setShowDailyWordModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* 品詞と意味 */}
              {(() => {
                const groups = getGroupedMeanings(dailyWord.単語);
                if (groups.size === 0) return null;
                return (
                  <div className="mb-6">
                    <div className="space-y-3">
                      {[...groups.entries()].map(([pos, meanings], i) => (
                        <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-white bg-emerald-600 px-2 py-0.5 rounded">{pos}</span>
                            {meanings[0]?.レベル && (
                              <span className="text-xs text-gray-400">{meanings[0].レベル}</span>
                            )}
                          </div>
                          <div className="text-base text-gray-800">
                            {meanings.map((m, j) => (
                              <span key={j}>
                                {j > 0 && <span className="text-gray-300 mx-1">/</span>}
                                <span>{m.意味}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 出現した大問一覧 */}
              {(() => {
                const mondaiList = getAppearingMondai(dailyWord.単語);
                if (mondaiList.length === 0) return null;
                return (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">出現した大問</h4>
                    <div className="space-y-2">
                      {mondaiList.map((m, idx) => (
                        <Link
                          key={idx}
                          href={`/mondai/${m.識別名}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                          onClick={() => setShowDailyWordModal(false)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {m.年度} {m.大学名} {m.学部}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 単語帳掲載状況 */}
              {(() => {
                const statuses = getBookStatuses(dailyWord.単語);
                if (statuses.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">単語帳の掲載状況</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      {statuses.map((item, idx) => {
                        const amazonLink = getAmazonLinkByBookName(tangochoMaster, item.book);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className={`font-bold ${item.status === 'main' ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {item.status === 'main' ? '◯' : '△'}
                            </span>
                            {amazonLink ? (
                              <a href={amazonLink} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 hover:underline">
                                {item.book}
                              </a>
                            ) : (
                              <span>{item.book}</span>
                            )}
                            {(item.number || item.page) && (
                              <span className="text-xs text-gray-400">
                                {item.number && `No.${item.number}`}
                                {item.number && item.page && ' / '}
                                {item.page && `p.${item.page}`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* フッター */}
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDailyWordModal(false)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
