'use client';

import { useState, useEffect } from 'react';
import { Search, Info } from 'lucide-react';
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
  const [selectionOrder, setSelectionOrder] = useState([]);
  
  const [compareWords, setCompareWords] = useState(Array(10).fill(''));
  const [compareBooks, setCompareBooks] = useState([]);
  const [compareResults, setCompareResults] = useState({});

  useEffect(() => {
    async function fetchData() {
      const data = await loadWordData();
      setWordData(data);
      
      const books = getAvailableBooks(data);
      setAvailableBooks(books);
      
      const initialSelection = {};
      const initialOrder = [];
      books.forEach((book, idx) => {
        if (idx < 3) {
          initialSelection[book] = true;
          initialOrder.push(book);
        } else {
          initialSelection[book] = false;
        }
      });
      setSelectedBooks(initialSelection);
      setSelectionOrder(initialOrder);
      
      setCompareBooks(books.slice(0, 3));
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSearch = () => {
    const word = searchInput.trim().toLowerCase();
    if (!word) return;

    const results = searchWord(wordData, word);
    
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
      books: bookData,
      allResults: results // 全データを保持
    });
    setHasSearched(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleBook = (book) => {
    if (selectedBooks[book]) {
      setSelectedBooks(prev => ({ ...prev, [book]: false }));
      setSelectionOrder(prev => prev.filter(b => b !== book));
    } else {
      setSelectedBooks(prev => ({ ...prev, [book]: true }));
      setSelectionOrder(prev => [...prev, book]);
    }
  };

  // 詳細情報を取得する関数
  const getDetailInfo = (book, bookData) => {
    if (!searchResult || !searchResult.allResults || !bookData) return null;
    
    const currentWord = searchResult.word;
    
    // まず、この単語帳のデータだけにフィルタ
    const bookResults = searchResult.allResults.filter(r => r.単語帳名称 === book);
    
    // 現在の単語の情報を取得
    const currentEntry = bookResults.find(r => r.単語?.toLowerCase() === currentWord);
    if (!currentEntry) return null;

    const currentNumber = currentEntry.単語帳内番号;
    if (!currentNumber) return null;
    
    // 同じ単語帳 かつ 同じ単語帳内番号 の全単語を取得
    const sameNumberEntries = wordData.filter(
      r => r.単語帳名称 === book && r.単語帳内番号 === currentNumber
    );
    
    // 見出し語と関連語に分類
    const mainWords = sameNumberEntries
      .filter(r => r.掲載区分 === '見出し語')
      .map(r => r.単語);
    
    const relatedWords = sameNumberEntries
      .filter(r => r.掲載区分 === '関連語')
      .map(r => r.単語);

    return {
      isMain: currentEntry.掲載区分 === '見出し語',
      mainWords,
      relatedWords
    };
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
        return { 
            symbol: '◯', 
            label: '見出し語', 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-20',
            border: 'border-l-emerald-500' // 追加
        };
        case 'related':
        return { 
            symbol: '△', 
            label: '関連語', 
            color: 'text-amber-600', 
            bg: 'bg-amber-50',
            border: 'border-l-amber-500' // 追加
        };
        case 'none':
        default:
        return { 
            symbol: '-', 
            label: '掲載なし', 
            color: 'text-gray-400', 
            bg: 'bg-gray-50',
            border: 'border-l-transparent' // 追加
        };
    }
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header 
        pageTitle="単語検索" 
        pageDescription="シンキロウ/英単語帳での掲載状況を一括検索"
      />

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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    検索対象の単語帳を選択（選択順に並びます）
                </label>
                <div className="flex flex-wrap gap-2">
                    {/* 選択中の単語帳を先に表示 */}
                    {selectionOrder.map(book => (
                    <button
                        key={book}
                        onClick={() => toggleBook(book)}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                    >
                        {book}
                    </button>
                    ))}
                    {/* 未選択の単語帳を後に表示 */}
                    {availableBooks
                    .filter(book => !selectedBooks[book])
                    .map(book => (
                        <button
                        key={book}
                        onClick={() => toggleBook(book)}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                        {book}
                        </button>
                    ))}
                </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600">◯</span>
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

            {hasSearched && searchResult && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b bg-white">
                  <h3 className="text-2xl font-bold text-gray-800">
                    &quot;{searchResult.word}&quot;
                  </h3>
                  {!searchResult.found && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded mt-2 inline-block">
                      データなし
                    </span>
                  )}
                </div>

                {searchResult.found ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-base font-semibold text-gray-700 w-1/4">
                            単語帳名
                          </th>
                          <th className="px-6 py-4 text-center text-base font-semibold text-gray-700 w-1/4">
                            掲載状況
                          </th>
                          <th className="px-6 py-4 text-left text-base font-semibold text-gray-700 w-1/2">
                            関連語(☆は見出し語)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {selectionOrder.map((book) => {
                            const bookData = searchResult.books[book];
                            const statusInfo = getStatusSymbol(bookData?.status || 'none');
                            const detailInfo = getDetailInfo(book, bookData);
                            
                            return (
                            <tr key={book} className={`hover:bg-gray-100 ${statusInfo.bg} border-l-4 ${statusInfo.border} transition-colors`}>
                                {/* 単語帳名の列 */}
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
                                    {bookData?.status !== 'none' && (bookData?.number || bookData?.page) && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        {bookData.number && <span>{bookData.number}</span>}
                                        {bookData.number && bookData.page && <span> </span>}
                                        {bookData.page && <span>(p.{bookData.page})</span>}
                                    </div>
                                    )}
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                {bookData?.status === 'none' || !bookData ? (
                                    <span className="text-sm text-gray-400">-</span>
                                ) : detailInfo ? (
                                    <div className="text-sm text-gray-700">
                                    {detailInfo.isMain ? (
                                        // 見出し語の場合：関連語を表示
                                        detailInfo.relatedWords.length > 0 ? (
                                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                                            {detailInfo.relatedWords.map((word, idx) => (
                                            <span key={idx} className="text-gray-600">
                                                {word}
                                                {idx < detailInfo.relatedWords.length - 1 && ','}
                                            </span>
                                            ))}
                                        </div>
                                        ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                        )
                                    ) : (
                                        // 関連語の場合：見出し語（☆付き）と他の関連語を表示
                                        <div className="space-y-1">
                                        {detailInfo.mainWords.length > 0 && (
                                            <div className="font-medium text-emerald-700">
                                            ☆ {detailInfo.mainWords.join(', ')}
                                            </div>
                                        )}
                                        {detailInfo.relatedWords.filter(w => w.toLowerCase() !== searchResult.word).length > 0 && (
                                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                            {detailInfo.relatedWords
                                                .filter(w => w.toLowerCase() !== searchResult.word)
                                                .map((word, idx) => (
                                                <span key={idx} className="text-gray-600">
                                                    {word}
                                                    {idx < detailInfo.relatedWords.filter(w => w.toLowerCase() !== searchResult.word).length - 1 && ','}
                                                </span>
                                                ))}
                                            </div>
                                        )}
                                        </div>
                                    )}
                                    </div>
                                ) : (
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
                      &quot;{searchResult.word}&quot; のデータは登録されていません
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      別の単語で検索してみてください
                    </p>
                  </div>
                )}
              </div>
            )}

            {!hasSearched && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Info className="text-emerald-600" size={20} />
                  使い方
                </h3>
                <div className="space-y-3 text-gray-700 mb-6">
                  <p>1. 検索したい英単語を1つ入力します</p>
                  <p>2. 検索対象の単語帳を選択します（複数選択可）</p>
                  <p>3. 選択した順番で結果が表示されます</p>
                  <p className="text-sm text-gray-600 ml-4">
                    ◯ = 見出し語として掲載 / △ = 関連語として掲載 / - = 掲載なし
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="text-emerald-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">単語帳比較</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                最大10個の単語を入力して、選択した3つの単語帳での掲載状況を比較できます
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600">◯</span>
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

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 w-32">
                        単語
                      </th>
                      {compareBooks.map((book, idx) => (
                        <th key={idx} className="px-2 py-4 text-center">
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
                            <td className="px-2 py-3">
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
                                    <td key={bookIdx} className="px-2 py-3 text-center">
                                        <span className="text-gray-300">-</span>
                                    </td>
                                    );
                                }

                                const bookData = result[book];
                                const statusInfo = getStatusSymbol(bookData?.status || 'none');
                                
                                // 関連語の場合、見出し語を取得
                                let mainWordsForRelated = [];
                                if (bookData?.status === 'related' && bookData?.number) {
                                    const sameNumberEntries = wordData.filter(
                                    r => r.単語帳名称 === book && r.単語帳内番号 === bookData.number
                                    );
                                    mainWordsForRelated = sameNumberEntries
                                    .filter(r => r.掲載区分 === '見出し語')
                                    .map(r => r.単語);
                                }
                                
                                return (
                                    <td key={bookIdx} className={`px-2 py-3 text-center ${statusInfo.bg}`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`text-3xl font-bold ${statusInfo.color}`}>
                                        {statusInfo.symbol}
                                        </span>
                                        {bookData?.status !== 'none' && (
                                        <div className="text-xs text-gray-600 whitespace-nowrap">
                                            {/* 番号・ページの表示 */}
                                            {(bookData.number || bookData.page) && (
                                            <>
                                                {bookData.number && <span>{bookData.number}</span>}
                                                {bookData.number && bookData.page && <span> </span>}
                                                {bookData.page && <span>(p.{bookData.page})</span>}
                                            </>
                                            )}
                                            
                                            {/* 関連語の場合：見出し語を常に表示 */}
                                            {bookData?.status === 'related' && mainWordsForRelated.length > 0 && (
                                            <>
                                                {(bookData.number || bookData.page) && <span> / </span>}
                                                <span>{mainWordsForRelated.join(', ')}</span>
                                            </>
                                            )}
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