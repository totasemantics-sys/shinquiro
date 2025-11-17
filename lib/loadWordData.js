import Papa from 'papaparse';

let cachedWordData = null;

export async function loadWordData() {
  if (cachedWordData) {
    return cachedWordData;
  }

  try {
    const response = await fetch('/data/tangocho.csv');
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          cachedWordData = results.data;
          resolve(cachedWordData);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('単語帳データの読み込みエラー:', error);
    return [];
  }
}

// 単語検索用の関数
export function searchWord(wordData, word) {
  const searchTerm = word.toLowerCase().trim();
  return wordData.filter(row => row.単語?.toLowerCase() === searchTerm);
}

// 単語帳リストを取得
export function getAvailableBooks(wordData) {
  const books = [...new Set(wordData.map(row => row.単語帳名称))];
  return books.filter(Boolean).sort();
}

// 単語×単語帳のマトリクスデータを生成
export function getWordBookMatrix(wordData, words, books) {
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