'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Info } from 'lucide-react';
import Header from '../components/Header';
import { loadWordData, searchWord, getAvailableBooks, getWordBookMatrix } from '@/lib/loadWordData';

export default function WordSearch() {
  const [wordData, setWordData] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [pageMode, setPageMode] = useState('search');
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [selectedBooks, setSelectedBooks] = useState({});
  
  const [compareWords, setCompareWords] = useState(Array(10).fill(''));
  const [compareBooks, setCompareBooks] = useState([]);
  const [compareResults, setCompareResults] = useState({});

  useEffect(() => {
    async function fetchData() {
      const data = await loadWordData();
      setWordData(data);
      
      const books = getAvailableBooks(data);
      setAvailableBooks(books);
      
      // 初期選択（最初の6つまで選択状態に）
      const initialSelection = {};
      books.forEach((book, idx) => {
        initialSelection[book] = idx < 6;
      });
      setSelectedBooks(initialSelection);
      
      // 比較モード用の初期単語帳（最初の3つ）
      setCompareBooks(books.slice(0, 3));
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSearch = () => {
    const word = searchInput.trim().toLowerCase();
    if (!word) return;

    const results = searchWord(wordData, word);
    
    // 単語帳ごとにデータを整理
    const bookData = {};
    results.forEach(row => {
      bookData[row.単語帳名称] = {
        status: row.掲載区分 === '見出し語' ? 'main' : 'related',
        number: row.単語帳内番号 || null,
        page: row.ページ数 || null
      };
    });

    setSearchResult({
      word,
      found: results.length > 0,
      books: bookData
    });
    setHasSearched(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleBook = (book) => {
    setSelectedBooks({
      ...selectedBooks,
      [book]: !selectedBooks[book]
    });
  };

  const handleCompareWordChange = (index, value) => {
    const newWords = [...compareWords];
    newWords[index] = value;
    setCompareWords(newWords);
  };

  const handleCompareBookChange = (index, book) => {
    const newBooks = [...compareBooks];
    newBooks[index] = book;
    setCompareBooks(newBooks);
  };

  const handleCompare = () => {
    const filledWords = compareWords.filter(w => w.trim().length > 0);
    const results = getWordBookMatrix(wordData, filledWords, compareBooks);
    setCompareResults(results);
  };

  const getStatusSymbol = (status) => {
    switch (status) {
      case 'main':
        return { symbol: '○', label: '見出し語', color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'related':
        return { symbol: '△', label: '関連語', color: 'text-amber-600', bg: 'bg-amber-50' };
      case 'none':
      default:
        return { symbol: '-', label: '掲載なし', color: 'text-gray-400', bg: 'bg-gray-50' };
    }
  };

  const selectedBooksList = availableBooks.filter(book => selectedBooks[book]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header />

      {/* タイトルエリア */}
      <div className="bg-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-emerald-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">SHINQUIRO 単語検索</h1>
          </div>
          <p className="text-sm text-gray-600">主要な英単語帳での掲載状況を一括検索</p>
        </div>
      </div>

      {/* モード切り替えトグル */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="bg-white rounded-lg shadow-md p-2 inline-flex">
          <button
            onClick={() => setPageMode('search')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              pageMode === 'search'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            単語検索
          </button>
          <button
            onClick={() => setPageMode('compare')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              pageMode === 'compare'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            単語帳比較
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {pageMode === 'search' ? (
          <>
            {/* 単語検索モード */}
            {/* 検索セクション */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="text-emerald-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">単語を検索</h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  英単語を入力
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                    placeholder="例: abandon"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Search size={20} />
                    検索
                  </button>
                </div>
              </div>

              {/* 単語帳選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  検索対象の単語帳を選択
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableBooks.map(book => (
                    <label
                      key={book}
                      className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                        checked={selectedBooks[book]}
                        onChange={() => toggleBook(book)}
                      />
                      <span className="text-sm font-medium text-gray-700">{book}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 凡例 */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600">○</span>
                  <span className="text-gray-700">見出し語掲載</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-600">△</span>
                  <span className="text-gray-700">関連語掲載</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-400">-</span>
                  <span className="text-gray-700">掲載なし</span>
                </div>
              </div>
            </div>

            {/* 検索結果 */}
            {hasSearched && searchResult && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-800">
                      "{searchResult.word}"
                    </h3>
                    {!searchResult.found && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded">
                        データなし
                      </span>
                    )}
                  </div>
                </div>

                {searchResult.found ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-base font-semibold text-gray-700 w-1/2">
                            単語帳名
                          </th>
                          <th className="px-6 py-4 text-center text-base font-semibold text-gray-700">
                            掲載状況
                          </th>
                          <th className="px-6 py-4 text-center text-base font-semibold text-gray-700">
                            詳細
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedBooksList.map((book) => {
                          const bookData = searchResult.books[book];
                          const statusInfo = getStatusSymbol(bookData?.status || 'none');
                          
                          return (
                            <tr key={book} className={`hover:bg-gray-50 ${statusInfo.bg}`}>
                              <td className="px-6 py-5">
                                <span className="text-base font-medium text-gray-800">
                                  {book}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`text-4xl font-bold ${statusInfo.color}`}>
                                    {statusInfo.symbol}
                                  </span>
                                  <span className={`text-xs ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-center">
                                {bookData?.status !== 'none' && bookData?.page && (
                                  <div className="text-sm text-gray-600">
                                    <div>p.{bookData.page}</div>
                                    {bookData.number && (
                                      <div className="text-xs text-gray-500">No.{bookData.number}</div>
                                    )}
                                  </div>
                                )}
                                {(bookData?.status === 'none' || !bookData) && (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500 text-lg">
                      "{searchResult.word}" のデータは登録されていません
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      別の単語で検索してみてください
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 初回表示時のサンプル */}
            {!hasSearched && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Info className="text-emerald-600" size={20} />
                  使い方
                </h3>
                <div className="space-y-3 text-gray-700 mb-6">
                  <p>1. 検索したい英単語を1つ入力します</p>
                  <p>2. 検索対象の単語帳を選択します（複数選択可）</p>
                  <p>3. 各単語帳での掲載状況が表示されます</p>
                  <p className="text-sm text-gray-600 ml-4">
                    ○ = 見出し語として掲載 / △ = 関連語として掲載 / - = 掲載なし
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 単語帳比較モード */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="text-emerald-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">単語帳比較</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                最大10個の単語を入力して、選択した3つの単語帳での掲載状況を比較できます
              </p>
            </div>

            {/* 凡例 */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600">○</span>
                  <span className="text-gray-700">見出し語掲載</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-600">△</span>
                  <span className="text-gray-700">関連語掲載</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-400">-</span>
                  <span className="text-gray-700">掲載なし</span>
                </div>
              </div>
            </div>

            {/* 比較表 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 w-48">
                        単語
                      </th>
                      {compareBooks.map((book, idx) => (
                        <th key={idx} className="px-4 py-4 text-center">
                          <select
                            value={book}
                            onChange={(e) => handleCompareBookChange(idx, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            {availableBooks.map(bookName => (
                              <option key={bookName} value={bookName}>
                                {bookName}
                              </option>
                            ))}
                          </select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.from({ length: 10 }, (_, idx) => {
                      const word = compareWords[idx];
                      const result = compareResults[word];
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={compareWords[idx]}
                              onChange={(e) => handleCompareWordChange(idx, e.target.value)}
                              placeholder={`単語 ${idx + 1}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </td>
                          {compareBooks.map((book, bookIdx) => {
                            if (!result || !result[book]) {
                              return (
                                <td key={bookIdx} className="px-4 py-3 text-center">
                                  <span className="text-gray-300">-</span>
                                </td>
                              );
                            }

                            const bookData = result[book];
                            const statusInfo = getStatusSymbol(bookData?.status || 'none');
                            
                            return (
                              <td key={bookIdx} className={`px-4 py-3 text-center ${statusInfo.bg}`}>
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`text-3xl font-bold ${statusInfo.color}`}>
                                    {statusInfo.symbol}
                                  </span>
                                  {bookData?.status !== 'none' && bookData?.page && (
                                    <div className="text-xs text-gray-500">
                                      p.{bookData.page}
                                      {bookData.number && ` / No.${bookData.number}`}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-gray-50 border-t flex justify-center">
                <button
                  onClick={handleCompare}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Search size={20} />
                  比較実行
                </button>
              </div>
            </div>
          </>
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