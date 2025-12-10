import Papa from 'papaparse';

let cache = null;

/**
 * keywords.csv のデータ構造
 * 
 * 列構造:
 * - 大問ID: 大問の識別ID
 * - 設問ID: 設問の識別ID（Optional - 空の場合は本文全体の重要語彙）
 * - 単語: 英単語
 * - 品詞: 品詞（名詞、動詞、形容詞など）
 * - レベル: 基礎 / 標準 / 上級 / 修練
 * - 意味: 日本語の意味
 */

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
    '修練': 0
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

// 品詞でフィルタリング（将来の機能拡張用）
export function filterKeywordsByPartOfSpeech(keywords, partOfSpeech) {
  if (!partOfSpeech) return keywords;
  return keywords.filter(k => k.品詞 === partOfSpeech);
}

// 利用可能な品詞一覧を取得（将来の機能拡張用）
export function getAvailablePartsOfSpeech(keywords) {
  const parts = new Set();
  keywords.forEach(k => {
    if (k.品詞) parts.add(k.品詞);
  });
  return Array.from(parts).sort();
}