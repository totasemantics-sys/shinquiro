import Papa from 'papaparse';

let cache = null;

export async function loadTangochoMasterData() {
  if (cache !== null) return cache;
  
  const response = await fetch('/data/tangocho_master.csv');
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        cache = results.data;
        resolve(results.data);
      },
      error: (error) => reject(error)
    });
  });
}

/**
 * 単語帳名からASINを取得
 */
export function getAsinByBookName(tangochoMasterData, bookName) {
  const entry = tangochoMasterData.find(row => row.単語帳名称 === bookName);
  return entry ? entry.ASIN : null;
}

/**
 * 単語帳名からAmazonリンクを生成
 */
export function getAmazonLinkByBookName(tangochoMasterData, bookName) {
  const asin = getAsinByBookName(tangochoMasterData, bookName);
  if (!asin) return null;
  return `https://www.amazon.co.jp/dp/${asin}`;
}