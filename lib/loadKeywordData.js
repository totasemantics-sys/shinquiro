import Papa from 'papaparse';

let cache = null;

export async function loadKeywordData() {
  if (cache !== null) {
    return cache;
  }

  try {
    const response = await fetch('/data/keywords.csv');
    if (!response.ok) {
      throw new Error('keywords.csv not found');
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
    console.error('Error loading keyword data:', error);
    cache = [];
    return [];
  }
}

// 大問IDで絞り込み
export function getKeywordsByMondaiId(keywordData, mondaiId) {
  if (!keywordData || keywordData.length === 0) return [];
  return keywordData.filter(row => row.大問ID === String(mondaiId));
}

// レベル別に集計
export function getKeywordCountByLevel(keywords) {
  const counts = {
    '基礎': 0,
    '標準': 0,
    '上級': 0,
    '豪傑': 0
  };
  
  keywords.forEach(k => {
    if (counts[k.レベル] !== undefined) {
      counts[k.レベル]++;
    }
  });
  
  return counts;
}

// レベルでフィルタリング
export function filterKeywordsByLevels(keywords, selectedLevels) {
  if (selectedLevels.length === 0) return keywords;
  return keywords.filter(k => selectedLevels.includes(k.レベル));
}