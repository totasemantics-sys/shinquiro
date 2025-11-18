import Papa from 'papaparse';

let cache = null;

export async function loadWordData() {
  if (cache !== null) {
    return cache;
  }

  try {
    const response = await fetch('/data/tangocho.csv');
    if (!response.ok) {
      throw new Error('CSV file not found');
    }
    
    const csvText = await response.text();
    
    const result = await new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      });
    });
    
    cache = result;
    return result;
  } catch (error) {
    console.error('Error loading word data:', error);
    cache = [];
    return [];
  }
}

export function searchWord(wordData, word) {
  if (!wordData || wordData.length === 0) return [];
  const searchTerm = word.toLowerCase().trim();
  return wordData.filter(row => row.単語?.toLowerCase() === searchTerm);
}

export function getAvailableBooks(wordData) {
  if (!wordData || wordData.length === 0) return [];
  const books = [...new Set(wordData.map(row => row.単語帳名称))];
  const filteredBooks = books.filter(Boolean);
  
  // カスタムソート：優先順位を設定
  const priority = [
    'ターゲット1900[6訂版]',
    'システム英単語<5訂版>',
    '改訂版LEAP'
  ];
  
  return filteredBooks.sort((a, b) => {
    const indexA = priority.indexOf(a);
    const indexB = priority.indexOf(b);
    
    // 両方とも優先リストにある場合
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // aだけ優先リストにある場合
    if (indexA !== -1) {
      return -1;
    }
    // bだけ優先リストにある場合
    if (indexB !== -1) {
      return 1;
    }
    // どちらも優先リストにない場合はアルファベット順
    return a.localeCompare(b, 'ja');
  });
}

export function getWordBookMatrix(wordData, words, books) {
  if (!wordData || wordData.length === 0) return {};
  
  const results = {};
  
  words.forEach(word => {
    const searchTerm = word.toLowerCase().trim();
    if (!searchTerm) return;
    
    results[word] = {};
    
    books.forEach(book => {
      const entry = wordData.find(
        row => row.単語?.toLowerCase() === searchTerm && row.単語帳名称 === book
      );
      
      if (entry) {
        results[word][book] = {
          status: entry.掲載区分 === '見出し語' ? 'main' : 'related',
          number: entry.単語帳内番号 || null,
          page: entry.ページ数 || null
        };
      } else {
        results[word][book] = {
          status: 'none',
          number: null,
          page: null
        };
      }
    });
  });
  
  return results;
}