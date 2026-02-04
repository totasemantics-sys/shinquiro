'use client';

import { useState, useEffect } from 'react';
import { Search, Info, ChevronUp, ChevronDown, Filter, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { loadWordData, searchWord, getAvailableBooks, getWordBookMatrix } from '@/lib/loadWordData';
import { loadKeywordData } from '@/lib/loadKeywordData';
import { loadAllData } from '@/lib/loadData';
import { loadWordMasterData, getWordInfoGrouped } from '@/lib/loadWordMasterData';
import { loadTangochoMasterData, getAmazonLinkByBookName } from '@/lib/loadTangochoMasterData';

export default function WordSearch() {
  const router = useRouter();
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

  // 出題大問用のstate
  const [keywordData, setKeywordData] = useState([]);
  const [mondaiData, setMondaiData] = useState([]);
  const [appearedMondai, setAppearedMondai] = useState([]);
  const [mondaiSortConfig, setMondaiSortConfig] = useState({ key: '年度', direction: 'desc' });
  const [mondaiFilters, setMondaiFilters] = useState({
    大学名: [],
    年度: [],
    日程: [],
    学部: []
  });
  const [openFilter, setOpenFilter] = useState(null);

  // 単語マスター用のstate
  const [wordMasterData, setWordMasterData] = useState([]);
  const [searchedWordInfo, setSearchedWordInfo] = useState([]);

  // 単語帳マスター用のstate（ASIN）
  const [tangochoMasterData, setTangochoMasterData] = useState([]);

  // 大学別検索用のstate
  const [uniSearchFilters, setUniSearchFilters] = useState({
    yearFrom: '',
    yearTo: '',
    universities: [],
    faculties: [],
    partsOfSpeech: [],
    levels: []
  });
  const [uniSearchResults, setUniSearchResults] = useState([]);
  const [uniSearchPage, setUniSearchPage] = useState(1);
  const [hasUniSearched, setHasUniSearched] = useState(false);
  const [showWordDetailModal, setShowWordDetailModal] = useState(false);
  const [selectedWordDetail, setSelectedWordDetail] = useState(null);
  const [wordDetailMondai, setWordDetailMondai] = useState([]);
  const [hashtagsData, setHashtagsData] = useState([]);
  const [selectedUniWords, setSelectedUniWords] = useState([]);  // 一括比較用チェック
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
      
      // キーワードデータと大問データを読み込み
      const keywords = await loadKeywordData();
      setKeywordData(keywords);
      
      const allData = await loadAllData();
      setMondaiData(allData.mondai);
      setHashtagsData(allData.hashtags);
      
      // 単語マスターデータを読み込み
      const wordMaster = await loadWordMasterData();
      setWordMasterData(wordMaster);
      
      // 単語帳マスターデータを読み込み（ASIN）
      const tangochoMaster = await loadTangochoMasterData();
      setTangochoMasterData(tangochoMaster);

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
            
            // キーワードデータと大問データを読み込み
            const keywords = await loadKeywordData();
            setKeywordData(keywords);
            
            const allData = await loadAllData();
            setMondaiData(allData.mondai);
            setHashtagsData(allData.hashtags);
            
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

  // 検索した単語が出題された大問を取得
  const findAppearedMondai = (word) => {
    if (!keywordData || keywordData.length === 0 || !mondaiData || mondaiData.length === 0) {
      return [];
    }
    
    const searchTerm = word.toLowerCase().trim();
    
    // その単語がkeywordとして登録されている大問IDを取得
    const matchedKeywords = keywordData.filter(k => k.単語?.toLowerCase() === searchTerm);
    const mondaiIds = [...new Set(matchedKeywords.map(k => k.大問ID))];
    
    // 大問データと結合
    const results = mondaiIds.map(id => {
      const mondai = mondaiData.find(m => m.大問ID === id);
      if (mondai) {
        return {
          ...mondai,
          識別名: mondai.識別名
        };
      }
      return null;
    }).filter(Boolean);
    
    return results;
  };

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
    
    // 品詞・意味情報を取得
    const wordInfo = getWordInfoGrouped(wordMasterData, word);
    setSearchedWordInfo(wordInfo);
    
    // 出題された大問を検索
    const appeared = findAppearedMondai(word);
    setAppearedMondai(appeared);
    
    // フィルターをリセット
    setMondaiFilters({
      大学名: [],
      年度: [],
      日程: [],
      学部: []
    });
    setMondaiSortConfig({ key: '年度', direction: 'desc' });
    
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
    
    // 品詞・意味情報を取得
    const wordInfo = getWordInfoGrouped(wordMasterData, historyWord);
    setSearchedWordInfo(wordInfo);
    
    // 出題された大問を検索
    const appeared = findAppearedMondai(historyWord);
    setAppearedMondai(appeared);
    
    // フィルターをリセット
    setMondaiFilters({
      大学名: [],
      年度: [],
      日程: [],
      学部: []
    });
    setMondaiSortConfig({ key: '年度', direction: 'desc' });
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

  // 出題大問のソート処理
  const handleMondaiSort = (key) => {
    setMondaiSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // 出題大問のフィルター選択肢を取得
  const getMondaiFilterOptions = (key) => {
    const values = [...new Set(appearedMondai.map(m => m[key]))].filter(Boolean);
    if (key === '年度') {
      return values.sort((a, b) => b - a);
    }
    return values.sort();
  };

  // 出題大問のフィルターを適用
  const getFilteredMondai = () => {
    let filtered = [...appearedMondai];
    
    // フィルター適用
    Object.keys(mondaiFilters).forEach(key => {
      if (mondaiFilters[key].length > 0) {
        filtered = filtered.filter(m => mondaiFilters[key].includes(m[key]));
      }
    });
    
    // ソート適用
    filtered.sort((a, b) => {
      const aVal = a[mondaiSortConfig.key];
      const bVal = b[mondaiSortConfig.key];
      
      if (mondaiSortConfig.key === '年度') {
        const diff = parseInt(bVal) - parseInt(aVal);
        if (diff !== 0) return mondaiSortConfig.direction === 'desc' ? diff : -diff;
        // 同一年度ならIDで比較
        return parseInt(a.大問ID) - parseInt(b.大問ID);
      }
      
      if (mondaiSortConfig.key === '大問番号') {
        const aNum = parseInt(aVal?.replace(/[^0-9]/g, '')) || 0;
        const bNum = parseInt(bVal?.replace(/[^0-9]/g, '')) || 0;
        return mondaiSortConfig.direction === 'desc' ? bNum - aNum : aNum - bNum;
      }
      
      const comparison = String(aVal).localeCompare(String(bVal), 'ja');
      return mondaiSortConfig.direction === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  };

  // フィルター切り替え
  const toggleMondaiFilter = (key, value) => {
    setMondaiFilters(prev => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  // 大学別検索：利用可能な年度リストを取得
  const getAvailableYears = () => {
    const years = [...new Set(mondaiData.map(m => m.年度))].filter(Boolean);
    return years.sort((a, b) => b - a);
  };

  // 大学別検索：利用可能な大学リストを取得
  const getAvailableUniversities = () => {
    const universities = [...new Set(mondaiData.map(m => m.大学名))].filter(Boolean);
    return universities.sort((a, b) => a.localeCompare(b, 'ja'));
  };

  // 大学別検索：選択された大学に基づく学部リストを取得
  const getAvailableFaculties = () => {
    let filtered = mondaiData;
    if (uniSearchFilters.universities.length > 0) {
      filtered = mondaiData.filter(m => uniSearchFilters.universities.includes(m.大学名));
    }
    const faculties = [...new Set(filtered.map(m => m.学部))].filter(Boolean);
    return faculties.sort((a, b) => a.localeCompare(b, 'ja'));
  };

  // 大学別検索：利用可能な品詞リストを取得
  const getAvailablePartsOfSpeech = () => {
    const parts = [...new Set(keywordData.map(k => k.品詞))].filter(Boolean);
    return parts.sort((a, b) => a.localeCompare(b, 'ja'));
  };

  // 大学別検索：検索実行
  const handleUniSearch = () => {
    // フィルター条件に合う大問IDを取得
    let filteredMondai = [...mondaiData];
    
    // 年度フィルター
    if (uniSearchFilters.yearFrom) {
      filteredMondai = filteredMondai.filter(m => parseInt(m.年度) >= parseInt(uniSearchFilters.yearFrom));
    }
    if (uniSearchFilters.yearTo) {
      filteredMondai = filteredMondai.filter(m => parseInt(m.年度) <= parseInt(uniSearchFilters.yearTo));
    }
    
    // 大学フィルター
    if (uniSearchFilters.universities.length > 0) {
      filteredMondai = filteredMondai.filter(m => uniSearchFilters.universities.includes(m.大学名));
    }
    
    // 学部フィルター
    if (uniSearchFilters.faculties.length > 0) {
      filteredMondai = filteredMondai.filter(m => uniSearchFilters.faculties.includes(m.学部));
    }
    
    const filteredMondaiIds = filteredMondai.map(m => m.大問ID);
    
    // フィルター条件に合うキーワードを取得
    let filteredKeywords = keywordData.filter(k => filteredMondaiIds.includes(k.大問ID));
    
    // 品詞フィルター
    if (uniSearchFilters.partsOfSpeech.length > 0) {
      filteredKeywords = filteredKeywords.filter(k => uniSearchFilters.partsOfSpeech.includes(k.品詞));
    }
    
    // レベルフィルター
    if (uniSearchFilters.levels.length > 0) {
      filteredKeywords = filteredKeywords.filter(k => uniSearchFilters.levels.includes(k.レベル));
    }
    
    // 単語ごとに出題回数をカウント
    const wordCounts = {};
    filteredKeywords.forEach(k => {
      const word = k.単語?.toLowerCase();
      if (!word) return;
      
      if (!wordCounts[word]) {
        wordCounts[word] = {
          単語: k.単語,
          品詞: k.品詞,
          レベル: k.レベル,
          意味: k.意味,
          出題回数: 0,
          大問IDs: []
        };
      }
      wordCounts[word].出題回数++;
      if (!wordCounts[word].大問IDs.includes(k.大問ID)) {
        wordCounts[word].大問IDs.push(k.大問ID);
      }
      // 意味が空の場合は他のエントリから補完
      if (!wordCounts[word].意味 && k.意味) {
        wordCounts[word].意味 = k.意味;
      }
    });
    
    // 出題回数順にソート
    const results = Object.values(wordCounts).sort((a, b) => b.出題回数 - a.出題回数);
    
    setUniSearchResults(results);
    setUniSearchPage(1);
    setHasUniSearched(true);
  };

  // 大学別検索：フィルター切り替え
  const toggleUniSearchFilter = (key, value) => {
    setUniSearchFilters(prev => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  // 大学別検索：ページネーション
  const getPagedUniSearchResults = () => {
    const start = (uniSearchPage - 1) * 50;
    const end = start + 50;
    return uniSearchResults.slice(start, end);
  };

  const getTotalPages = () => {
    return Math.ceil(uniSearchResults.length / 50);
  };

  // 大学別検索：チェックボックストグル
  const toggleUniWordSelection = (word) => {
    setSelectedUniWords(prev => {
      if (prev.includes(word)) {
        return prev.filter(w => w !== word);
      } else {
        return [...prev, word];
      }
    });
  };

  // 大学別検索：全選択/全解除（現在のページのみ）
  const toggleAllCurrentPage = () => {
    const currentPageWords = getPagedUniSearchResults().map(item => item.単語);
    const allSelected = currentPageWords.every(word => selectedUniWords.includes(word));
    
    if (allSelected) {
      // 全解除
      setSelectedUniWords(prev => prev.filter(w => !currentPageWords.includes(w)));
    } else {
      // 全選択
      setSelectedUniWords(prev => [...new Set([...prev, ...currentPageWords])]);
    }
  };

  // 大学別検索：一括比較へ遷移（新規タブで開く）
  const handleUniBulkCompare = () => {
    if (selectedUniWords.length === 0) return;
    
    const wordsJson = JSON.stringify(selectedUniWords);
    const url = `/words?mode=compare&words=${encodeURIComponent(wordsJson)}`;
    window.open(url, '_blank');
  };

  // 単語詳細モーダル：出題大問を取得
  const handleWordDetailClick = (wordData) => {
    setSelectedWordDetail(wordData);
    
    // その単語が出題された大問の詳細を取得
    const mondaiDetails = wordData.大問IDs.map(id => {
      return mondaiData.find(m => m.大問ID === id);
    }).filter(Boolean).sort((a, b) => {
      // 年度新しい順
      const yearDiff = parseInt(b.年度) - parseInt(a.年度);
      if (yearDiff !== 0) return yearDiff;
      return parseInt(a.大問ID) - parseInt(b.大問ID);
    });
    
    setWordDetailMondai(mondaiDetails);
    setShowWordDetailModal(true);
  };

  // 単語帳名をレンダリング（Amazonリンク付き）
  const renderBookName = (bookName) => {
    const amazonLink = getAmazonLinkByBookName(tangochoMasterData, bookName);
    
    if (amazonLink) {
      return (<a
        
          href={amazonLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-800 hover:text-orange-600 transition-colors inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {bookName}
          <ExternalLink size={14} className="text-orange-500" />
        </a>
      );
    }
    
    return <span className="text-gray-800">{bookName}</span>;
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
          <button
            onClick={() => setPageMode('university')}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              pageMode === 'university'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            大学別検索
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
                    
                    {/* 品詞・意味情報 */}
                    {searchedWordInfo.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {searchedWordInfo.map((info, idx) => (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              info.品詞 === '動詞' ? 'bg-blue-100 text-blue-700' :
                              info.品詞 === '名詞' ? 'bg-green-100 text-green-700' :
                              info.品詞 === '形容詞' ? 'bg-orange-100 text-orange-700' :
                              info.品詞 === '副詞' ? 'bg-purple-100 text-purple-700' :
                              info.品詞 === '前置詞' ? 'bg-pink-100 text-pink-700' :
                              info.品詞 === '接続詞' ? 'bg-cyan-100 text-cyan-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {info.品詞}
                            </span>
                            {info.意味 && (
                              <span className="text-gray-700">{info.意味}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
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
                            {/* スマホ用ヘッダー */}
                            <th className="md:hidden px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              単語帳名 / 掲載状況
                            </th>
                            <th className="md:hidden px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              関連語(☆は見出し語)
                            </th>

                            {/* PC用ヘッダー */}
                            <th className="hidden md:table-cell px-6 py-4 text-left text-base font-semibold text-gray-700 w-1/4">
                              単語帳名
                            </th>
                            <th className="hidden md:table-cell px-6 py-4 text-center text-base font-semibold text-gray-700 w-1/4">
                              掲載状況
                            </th>
                            <th className="hidden md:table-cell px-6 py-4 text-left text-base font-semibold text-gray-700 w-1/2">
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
                                {/* スマホ用: 単語帳名と掲載状況 */}
                                <td className="md:hidden px-4 py-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium">
                                      {renderBookName(book)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-2xl font-bold ${statusInfo.color}`}>
                                        {statusInfo.symbol}
                                      </span>
                                      {bookData?.status !== 'none' && (bookData?.number || bookData?.page) && (
                                        <span className="text-xs text-gray-600">
                                          {bookData.number && <span>{bookData.number}</span>}
                                          {bookData.number && bookData.page && <span> </span>}
                                          {bookData.page && <span>(p.{bookData.page})</span>}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* スマホ用: 関連語 */}
                                <td className="md:hidden px-4 py-4">
                                  {bookData?.status === 'none' || !bookData ? (
                                    <span className="text-xs text-gray-400">-</span>
                                  ) : detailInfo ? (
                                    <div className="text-xs text-gray-700">
                                      {detailInfo.isMain ? (
                                        detailInfo.relatedWords.length > 0 ? (
                                          <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                                            {detailInfo.relatedWords.map((word, idx) => (
                                              <span key={idx} className="text-gray-600">
                                                {word}
                                                {idx < detailInfo.relatedWords.length - 1 && ','}
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-gray-400">-</span>
                                        )
                                      ) : (
                                        <div className="space-y-0.5">
                                          {detailInfo.mainWords.length > 0 && (
                                            <div className="font-medium text-emerald-700">
                                              ☆ {detailInfo.mainWords.join(', ')}
                                            </div>
                                          )}
                                          {detailInfo.relatedWords.filter(w => w.toLowerCase() !== searchResult.word).length > 0 && (
                                            <div className="flex flex-wrap gap-x-1 gap-y-0.5">
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
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </td>

                                {/* PC用: 単語帳名 */}
                                <td className="hidden md:table-cell px-6 py-5">
                                  <span className="text-base font-medium">
                                    {renderBookName(book)}
                                  </span>
                                </td>
                                {/* PC用: 掲載状況 */}
                                <td className="hidden md:table-cell px-6 py-5 text-center">
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
                                {/* PC用: 関連語 */}
                                <td className="hidden md:table-cell px-6 py-5">
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
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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

                {/* 出題された大問 */}
                {appearedMondai.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                      <Search className="text-emerald-600" size={20} />
                      出題された大問 ({getFilteredMondai().length}件)
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {/* スマホ用ヘッダー */}
                            <th className="md:hidden px-3 py-2 text-left font-semibold text-gray-700">大学名 / 年度</th>
                            <th className="md:hidden px-3 py-2 text-left font-semibold text-gray-700">日程 / 学部</th>
                            <th className="md:hidden px-3 py-2 text-left font-semibold text-gray-700">大問番号</th>
                            <th className="md:hidden px-3 py-2 text-left font-semibold text-gray-700">ジャンル</th>

                            {/* PC用ヘッダー */}
                            {['大学名', '年度', '日程', '学部', '大問番号'].map((col) => (
                              <th key={col} className="hidden md:table-cell px-3 py-2 text-left font-semibold text-gray-700 relative">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleMondaiSort(col)}
                                    className="flex items-center gap-1 hover:text-emerald-600"
                                  >
                                    {col}
                                    {mondaiSortConfig.key === col && (
                                      mondaiSortConfig.direction === 'desc' 
                                        ? <ChevronDown size={14} /> 
                                        : <ChevronUp size={14} />
                                    )}
                                  </button>
                                  {col !== '大問番号' && (
                                    <div className="relative">
                                      <button
                                        onClick={() => setOpenFilter(openFilter === col ? null : col)}
                                        className={`p-1 rounded hover:bg-gray-200 ${
                                          mondaiFilters[col]?.length > 0 ? 'text-emerald-600' : 'text-gray-400'
                                        }`}
                                      >
                                        <Filter size={14} />
                                      </button>
                                      {openFilter === col && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px] max-h-60 overflow-y-auto">
                                          <div className="p-2 border-b">
                                            <button
                                              onClick={() => setMondaiFilters(prev => ({ ...prev, [col]: [] }))}
                                              className="text-xs text-gray-500 hover:text-emerald-600"
                                            >
                                              すべて解除
                                            </button>
                                          </div>
                                          {getMondaiFilterOptions(col).map((option) => (
                                            <label
                                              key={option}
                                              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={mondaiFilters[col]?.includes(option)}
                                                onChange={() => toggleMondaiFilter(col, option)}
                                                className="rounded text-emerald-600 focus:ring-emerald-500"
                                              />
                                              <span className="text-sm">{option}</span>
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </th>
                            ))}
                            <th className="hidden md:table-cell px-3 py-2 text-left font-semibold text-gray-700">ジャンル</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getFilteredMondai().map((mondai, idx) => {
                            const firstHashtag = hashtagsData.find(h => h.大問ID === mondai.大問ID);
                            return (
                              <tr
                                key={idx}
                                onClick={() => router.push(`/mondai/${mondai.識別名}`)}
                                className="hover:bg-emerald-50 cursor-pointer transition-colors"
                              >
                                {/* スマホ用: 大学名と年度 */}
                                <td className="md:hidden px-3 py-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-800 font-medium">{mondai.大学名}</span>
                                    <span className="text-gray-600 text-xs">{mondai.年度}年度</span>
                                  </div>
                                </td>

                                {/* スマホ用: 日程と学部 */}
                                <td className="md:hidden px-3 py-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-800">{mondai.日程}</span>
                                    <span className="text-gray-600 text-xs">{mondai.学部}</span>
                                  </div>
                                </td>

                                {/* スマホ用: 大問番号 */}
                                <td className="md:hidden px-3 py-3">
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                    {mondai.大問番号}
                                  </span>
                                </td>

                                {/* スマホ用: ジャンル */}
                                <td className="md:hidden px-3 py-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-800">{mondai.ジャンル || '-'}</span>
                                    {firstHashtag && (
                                      <span className="text-xs text-emerald-600">#{firstHashtag.ハッシュタグ}</span>
                                    )}
                                  </div>
                                </td>

                                {/* PC用: 大学名 */}
                                <td className="hidden md:table-cell px-3 py-3 text-gray-800">{mondai.大学名}</td>
                                {/* PC用: 年度 */}
                                <td className="hidden md:table-cell px-3 py-3 text-gray-800">{mondai.年度}</td>
                                {/* PC用: 日程 */}
                                <td className="hidden md:table-cell px-3 py-3 text-gray-800">{mondai.日程}</td>
                                {/* PC用: 学部 */}
                                <td className="hidden md:table-cell px-3 py-3 text-gray-800">{mondai.学部}</td>
                                {/* PC用: 大問番号 */}
                                <td className="hidden md:table-cell px-3 py-3">
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                    {mondai.大問番号}
                                  </span>
                                </td>
                                {/* PC用: ジャンル */}
                                <td className="hidden md:table-cell px-3 py-3">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-800">{mondai.ジャンル || '-'}</span>
                                    {firstHashtag && (
                                      <span className="text-xs text-emerald-600">#{firstHashtag.ハッシュタグ}</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {getFilteredMondai().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        フィルター条件に一致する大問がありません
                      </div>
                    )}
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
        ) : pageMode === 'compare' ? (
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
              <div className="flex items-center justify-center gap-8 text-sm mb-3">
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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">※単語帳を変更したら、「比較実行」を押してください</p>
                <button
                  onClick={handleCompare}
                  className="hidden sm:flex px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors items-center gap-2 font-medium text-sm"
                >
                  <Search size={18} />
                  比較実行
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 w-32">
                        <div className="flex flex-col gap-2">
                          <span>単語</span>
                          <button
                            onClick={() => {
                              setCompareWords(Array(compareRowCount).fill(''));
                              setCompareResults({});
                            }}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                          >
                            すべてクリア
                          </button>
                        </div>
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
        ) : pageMode === 'university' ? (
          <>
            {/* 大学別検索フィルター */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="text-emerald-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">大学別検索</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                指定した条件で出題された単語を、出題回数が多い順に表示します
              </p>

              {/* 年度フィルター */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">年度</label>
                <div className="flex items-center gap-2">
                  <select
                    value={uniSearchFilters.yearFrom}
                    onChange={(e) => setUniSearchFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">指定なし</option>
                    {getAvailableYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="text-gray-500">〜</span>
                  <select
                    value={uniSearchFilters.yearTo}
                    onChange={(e) => setUniSearchFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">指定なし</option>
                    {getAvailableYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 大学名フィルター */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  大学名
                  {uniSearchFilters.universities.length > 0 && (
                    <span className="ml-2 text-emerald-600">({uniSearchFilters.universities.length}件選択中)</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {getAvailableUniversities().map(uni => (
                    <button
                      key={uni}
                      onClick={() => toggleUniSearchFilter('universities', uni)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        uniSearchFilters.universities.includes(uni)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {uni}
                    </button>
                  ))}
                </div>
              </div>

              {/* 学部フィルター */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  学部
                  {uniSearchFilters.faculties.length > 0 && (
                    <span className="ml-2 text-emerald-600">({uniSearchFilters.faculties.length}件選択中)</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                  {getAvailableFaculties().map(fac => (
                    <button
                      key={fac}
                      onClick={() => toggleUniSearchFilter('faculties', fac)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        uniSearchFilters.faculties.includes(fac)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {fac}
                    </button>
                  ))}
                </div>
              </div>

              {/* 品詞フィルター */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">品詞</label>
                <div className="flex flex-wrap gap-2">
                  {getAvailablePartsOfSpeech().map(pos => (
                    <button
                      key={pos}
                      onClick={() => toggleUniSearchFilter('partsOfSpeech', pos)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        uniSearchFilters.partsOfSpeech.includes(pos)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* レベルフィルター */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">レベル</label>
                <div className="flex flex-wrap gap-2">
                  {['修練', '上級', '標準', '基礎'].map(level => (
                    <button
                      key={level}
                      onClick={() => toggleUniSearchFilter('levels', level)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        uniSearchFilters.levels.includes(level)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level === '修練' && '🚀 '}
                      {level === '上級' && '🔬 '}
                      {level === '標準' && '🖋️ '}
                      {level === '基礎' && '📘 '}
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 検索ボタン */}
              <div className="flex justify-center">
                <button
                  onClick={handleUniSearch}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Search size={20} />
                  検索
                </button>
              </div>
            </div>

            {/* 検索結果 */}
            {hasUniSearched && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    検索結果: {uniSearchResults.length}件
                  </h3>
                  {selectedUniWords.length > 0 && (
                    <button
                      onClick={handleUniBulkCompare}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <span>✓ {selectedUniWords.length}件を一括比較</span>
                    </button>
                  )}
                </div>

                {uniSearchResults.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            {/* スマホ用ヘッダー */}
                            <th className="md:hidden px-2 py-3 text-center font-semibold text-gray-700 w-8">#</th>
                            <th className="md:hidden px-2 py-3 text-center font-semibold text-gray-700 w-14">回数</th>
                            <th className="md:hidden px-2 py-3 text-center font-semibold text-gray-700">品詞 / Lv</th>
                            <th className="md:hidden px-2 py-3 text-left font-semibold text-gray-700">単語 / 意味</th>
                            <th className="md:hidden px-2 py-3 text-center font-semibold text-gray-700 w-12">
                              <button
                                onClick={toggleAllCurrentPage}
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                  getPagedUniSearchResults().length > 0 && getPagedUniSearchResults().every(item => selectedUniWords.includes(item.単語))
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-gray-300 hover:border-emerald-400'
                                }`}
                              >
                                {getPagedUniSearchResults().length > 0 && getPagedUniSearchResults().every(item => selectedUniWords.includes(item.単語)) && (
                                  <span className="text-xs">✓</span>
                                )}
                              </button>
                            </th>

                            {/* PC用ヘッダー */}
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-14">順位</th>
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-20">出題回数</th>
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-20">品詞</th>
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-20">レベル</th>
                            <th className="hidden md:table-cell px-4 py-3 text-left font-semibold text-gray-700">単語</th>
                            <th className="hidden md:table-cell px-4 py-3 text-left font-semibold text-gray-700">意味</th>
                            <th className="hidden md:table-cell px-3 py-3 text-center font-semibold text-gray-700 w-16">
                              <button
                                onClick={toggleAllCurrentPage}
                                className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
                                  getPagedUniSearchResults().length > 0 && getPagedUniSearchResults().every(item => selectedUniWords.includes(item.単語))
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-gray-300 hover:border-emerald-400'
                                }`}
                              >
                                {getPagedUniSearchResults().length > 0 && getPagedUniSearchResults().every(item => selectedUniWords.includes(item.単語)) && (
                                  <span className="text-sm font-bold">✓</span>
                                )}
                              </button>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getPagedUniSearchResults().map((item, idx) => {
                            const rank = (uniSearchPage - 1) * 50 + idx + 1;
                            const isSelected = selectedUniWords.includes(item.単語);
                            return (
                              <tr
                                key={idx}
                                className={`hover:bg-emerald-50 transition-colors ${isSelected ? 'bg-emerald-50' : ''}`}
                              >
                                {/* スマホ用: 順位 */}
                                <td 
                                  className="md:hidden px-2 py-3 text-center text-gray-500 text-xs cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  {rank}
                                </td>
                                {/* スマホ用: 出題回数 */}
                                <td 
                                  className="md:hidden px-2 py-3 text-center cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                    {item.出題回数}
                                  </span>
                                </td>
                                {/* スマホ用: 品詞とレベル */}
                                <td 
                                  className="md:hidden px-2 py-3 cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  <div className="flex flex-col gap-1 items-center">
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                      {item.品詞}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      item.レベル === '修練' ? 'bg-purple-100 text-purple-700' :
                                      item.レベル === '上級' ? 'bg-red-100 text-red-700' :
                                      item.レベル === '標準' ? 'bg-blue-100 text-blue-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {item.レベル}
                                    </span>
                                  </div>
                                </td>
                                {/* スマホ用: 単語と意味 */}
                                <td 
                                  className="md:hidden px-2 py-3 cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-gray-900 font-medium">{item.単語}</span>
                                    <span className="text-xs text-gray-500">{item.意味 || '-'}</span>
                                  </div>
                                </td>
                                {/* スマホ用: チェックボックス */}
                                <td className="md:hidden px-2 py-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleUniWordSelection(item.単語);
                                    }}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-gray-300 hover:border-emerald-400'
                                    }`}
                                  >
                                    {isSelected && <span className="text-xs">✓</span>}
                                  </button>
                                </td>

                                {/* PC用: 順位 */}
                                <td 
                                  className="hidden md:table-cell px-3 py-3 text-center text-gray-600 font-medium cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  {rank}
                                </td>
                                {/* PC用: 出題回数 */}
                                <td 
                                  className="hidden md:table-cell px-3 py-3 text-center cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                                    {item.出題回数}
                                  </span>
                                </td>
                                {/* PC用: 品詞 */}
                                <td 
                                  className="hidden md:table-cell px-3 py-3 text-center cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {item.品詞}
                                  </span>
                                </td>
                                {/* PC用: レベル */}
                                <td 
                                  className="hidden md:table-cell px-3 py-3 text-center cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    item.レベル === '修練' ? 'bg-purple-100 text-purple-700' :
                                    item.レベル === '上級' ? 'bg-red-100 text-red-700' :
                                    item.レベル === '標準' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {item.レベル}
                                  </span>
                                </td>
                                {/* PC用: 単語 */}
                                <td 
                                  className="hidden md:table-cell px-4 py-3 text-gray-900 font-medium cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  {item.単語}
                                </td>
                                {/* PC用: 意味 */}
                                <td 
                                  className="hidden md:table-cell px-4 py-3 text-gray-600 cursor-pointer"
                                  onClick={() => handleWordDetailClick(item)}
                                >
                                  {item.意味 || '-'}
                                </td>
                                {/* PC用: チェックボックス */}
                                <td className="hidden md:table-cell px-3 py-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleUniWordSelection(item.単語);
                                    }}
                                    className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                        : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {isSelected && <span className="text-sm font-bold">✓</span>}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* ページネーション */}
                    {getTotalPages() > 1 && (
                      <div className="p-4 border-t bg-gray-50 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setUniSearchPage(prev => Math.max(1, prev - 1))}
                          disabled={uniSearchPage === 1}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          前へ
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                            let pageNum;
                            if (getTotalPages() <= 5) {
                              pageNum = i + 1;
                            } else if (uniSearchPage <= 3) {
                              pageNum = i + 1;
                            } else if (uniSearchPage >= getTotalPages() - 2) {
                              pageNum = getTotalPages() - 4 + i;
                            } else {
                              pageNum = uniSearchPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setUniSearchPage(pageNum)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                  uniSearchPage === pageNum
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setUniSearchPage(prev => Math.min(getTotalPages(), prev + 1))}
                          disabled={uniSearchPage === getTotalPages()}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          次へ
                        </button>
                        <span className="ml-4 text-sm text-gray-600">
                          {uniSearchPage} / {getTotalPages()} ページ
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500 text-lg">条件に一致する単語がありません</p>
                    <p className="text-gray-400 text-sm mt-2">フィルター条件を変更してみてください</p>
                  </div>
                )}
              </div>
            )}

            {/* 未検索時の説明 */}
            {!hasUniSearched && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Info className="text-emerald-600" size={20} />
                  使い方
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p>1. 年度、大学名、学部などの条件を指定します</p>
                  <p>2. 「検索」ボタンをクリックします</p>
                  <p>3. 指定した条件で出題された単語が、出題回数の多い順に表示されます</p>
                  <p>4. 単語をクリックすると、その単語が出題された大問の一覧が表示されます</p>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* 単語詳細モーダル */}
      {showWordDetailModal && selectedWordDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedWordDetail.単語}</h3>
                    {selectedWordDetail.意味 && (
                      <span className="text-lg text-gray-600">: {selectedWordDetail.意味}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {selectedWordDetail.品詞}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedWordDetail.レベル === '修練' ? 'bg-purple-100 text-purple-700' :
                      selectedWordDetail.レベル === '上級' ? 'bg-red-100 text-red-700' :
                      selectedWordDetail.レベル === '標準' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {selectedWordDetail.レベル}
                    </span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                      出題 {selectedWordDetail.出題回数}回
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowWordDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">出題された大問</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">大学名</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">年度</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">日程</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">学部</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">大問</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">ジャンル</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {wordDetailMondai.map((mondai, idx) => {
                      // この大問の1つ目のハッシュタグを取得
                      const firstHashtag = hashtagsData.find(h => h.大問ID === mondai.大問ID);
                      
                      return (
                        <tr
                          key={idx}
                          onClick={() => {
                            setShowWordDetailModal(false);
                            router.push(`/mondai/${mondai.識別名}`);
                          }}
                          className="hover:bg-emerald-50 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-3 text-gray-800">{mondai.大学名}</td>
                          <td className="px-3 py-3 text-gray-800">{mondai.年度}</td>
                          <td className="px-3 py-3 text-gray-800">{mondai.日程}</td>
                          <td className="px-3 py-3 text-gray-800">{mondai.学部}</td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                              {mondai.大問番号}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-800">{mondai.ジャンル || '-'}</span>
                              {firstHashtag && (
                                <span className="text-xs text-emerald-600">#{firstHashtag.ハッシュタグ}</span>
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
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowWordDetailModal(false)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* フィルタードロップダウンを閉じるためのオーバーレイ */}
      {openFilter && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenFilter(null)}
        />
      )}

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>
    </div>
  );
}