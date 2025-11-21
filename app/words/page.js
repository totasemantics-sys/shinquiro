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
  const [searchHistory, setSearchHistory] = useState([]);
  const [shouldAutoCompare, setShouldAutoCompare] = useState(false);
  
  const [selectedBooks, setSelectedBooks] = useState({});
  const [selectionOrder, setSelectionOrder] = useState([]);

  
  const [compareWords, setCompareWords] = useState([]);
  const [compareBooks, setCompareBooks] = useState([]);
  const [compareResults, setCompareResults] = useState({});
  const [compareRowCount, setCompareRowCount] = useState(10);

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

  // 行数が変更されたらcompareWordsを更新
  useEffect(() => {
    setCompareWords(prev => {
      const newWords = Array(compareRowCount).fill('');
      // 既存の入力を保持
      for (let i = 0; i < Math.min(prev.length, compareRowCount); i++) {
        newWords[i] = prev[i];
      }
      return newWords;
    });
  }, [compareRowCount]);

  useEffect(() => {
    if (shouldAutoCompare && compareWords.length > 0 && pageMode === 'compare') {
        handleCompare();
        setShouldAutoCompare(false);
    }
    }, [compareWords, pageMode, shouldAutoCompare]);

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
            
            // URLパラメータから単語を受け取る処理を追加
            const urlParams = new URLSearchParams(window.location.search);
            const mode = urlParams.get('mode');
            const wordsParam = urlParams.get('words');
            
            if (mode === 'compare' && wordsParam) {
            try {
                const words = JSON.parse(decodeURIComponent(wordsParam));
                const wordCount = Math.max(10, words.length);
                
                setPageMode('compare');
                setCompareRowCount(wordCount);
                
                const newWords = Array(wordCount).fill('');
                words.forEach((word, idx) => {
                if (idx < wordCount) {
                    newWords[idx] = word;
                }
                });
                setCompareWords(newWords);
                
                // 自動で比較実行
                setTimeout(() => {
                const filledWords = newWords.filter(w => w.trim().length > 0);
                const results = getWordBookMatrix(data, filledWords, books.slice(0, 3));
                setCompareResults(results);
                }, 100);
            } catch (error) {
                console.error('URLパラメータの解析に失敗:', error);
            }
            }
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
      allResults: results
    });
    setHasSearched(true);
    
    // 検索履歴に追加（重複を避け、最新10件のみ保持）
    setSearchHistory(prev => {
      const newHistory = [word, ...prev.filter(w => w !== word)].slice(0, 10);
      return newHistory;
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleHistoryClick = (historyWord) => {
    setSearchInput(historyWord);
    const results = searchWord(wordData, historyWord);
    
    const bookData = {};
    results.forEach(row => {
      bookData[row.単語帳名称] = {
        status: row.掲載区分 === '見出し語' ? 'main' : 'related',
        number: row.単語帳内番号 || null,
        page: row.ページ数 || null
      };
    });

    setSearchResult({
      word: historyWord,
      found: results.length > 0,
      books: bookData,
      allResults: results
    });
    setHasSearched(true);
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

  const getDetailInfo = (book, bookData) => {
    if (!searchResult || !searchResult.allResults || !bookData) return null;
    
    const currentWord = searchResult.word;
    const bookResults = searchResult.allResults.filter(r => r.単語帳名称 === book);
    const currentEntry = bookResults.find(r => r.単語?.toLowerCase() === currentWord);
    if (!currentEntry) return null;

    const currentNumber = currentEntry.単語帳内番号;
    if (!currentNumber) return null;
    
    const sameNumberEntries = wordData.filter(
      r => r.単語帳名称 === book && r.単語帳内番号 === currentNumber
    );
    
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

  const handleBulkCompare = () => {
    // 履歴の件数に応じて行数を設定
  const historyCount = searchHistory.length;
    setCompareRowCount(Math.max(10, historyCount));
    
    // 履歴を compareWords に設定
  const newWords = Array(Math.max(10, historyCount)).fill('');
  searchHistory.forEach((word, idx) => {
    newWords[idx] = word;
    });
    setCompareWords(newWords);
    
    // 単語帳比較モードに切り替え
    setPageMode('compare');
    setShouldAutoCompare(true); // フラグを立てる
    };

  const getStatusSymbol = (status) => {
    switch (status) {
      case 'main':
        return { 
          symbol: '◯', 
          label: '見出し語', 
          color: 'text-emerald-600', 
          bg: 'bg-white',
          border: 'border-l-emerald-500'
        };
      case 'related':
        return { 
          symbol: '△', 
          label: '関連語', 
          color: 'text-amber-600', 
          bg: 'bg-amber-50',
          border: 'border-l-amber-500'
        };
      case 'none':
      default:
        return { 
          symbol: '-', 
          label: '掲載なし', 
          color: 'text-gray-400', 
          bg: 'bg-gray-50',
          border: 'border-l-transparent'
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
                  {selectionOrder.map(book => (
                    <button
                      key={book}
                      onClick={() => toggleBook(book)}
                      className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                    >
                      {book}
                    </button>
                  ))}
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
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
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

                {/* 検索履歴 */}
                {searchHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Info className="text-emerald-600" size={20} />
                        検索履歴
                    </h3>
                    <button
                        onClick={handleBulkCompare}
                        className="px-4 py-2 bg-gray-50 text-emerald-600 border-2 border-emerald-600 rounded-md hover:bg-emerald-50 transition-colors text-sm font-medium"
                    >
                        履歴を一括比較
                    </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                    {searchHistory.map((historyWord, idx) => (
                        <div
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            historyWord === searchResult.word
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        >
                        <button
                            onClick={() => handleHistoryClick(historyWord)}
                            className="flex-1"
                        >
                            {historyWord}
                        </button>
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            setSearchHistory(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-gray-500 hover:text-gray-700 ml-1"
                        >
                            ×
                        </button>
                        </div>
                    ))}
                    </div>
                </div>
                )}
              </>
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
                最大50個の単語を入力して、選択した3つの単語帳での掲載状況を比較できます
              </p>
              
              {/* 件数選択 */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-700">表示件数:</span>
                <div className="flex gap-2">
                  {[10, 20, 30, 50].map(count => (
                    <button
                      key={count}
                      onClick={() => setCompareRowCount(count)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        compareRowCount === count
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {count}件
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
                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    {Array.from({ length: compareRowCount }, (_, idx) => {
                      const word = compareWords[idx] || '';
                      const result = compareResults[word];
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-3">
                            <input
                              type="text"
                              value={word}
                              onChange={(e) => handleCompareWordChange(idx, e.target.value)}
                              placeholder={`単語 ${idx + 1}`}
                              className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                                      {(bookData.number || bookData.page) && (
                                        <>
                                          {bookData.number && <span>{bookData.number}</span>}
                                          {bookData.number && bookData.page && <span> </span>}
                                          {bookData.page && <span>(p.{bookData.page})</span>}
                                        </>
                                      )}
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

      {/* スマホ用の固定比較実行ボタン */}
      {pageMode === 'compare' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 sm:hidden">
          <button
            onClick={handleCompare}
            className="px-8 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 font-medium"
          >
            <Search size={20} />
            比較実行
          </button>
        </div>
      )}

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>
    </div>
  );
}