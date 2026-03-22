import Papa from 'papaparse';

let writingCache = null;

export async function loadWritingData() {
  if (writingCache) return writingCache;
  try {
    const response = await fetch('/data/writing.csv');
    if (!response.ok) return [];
    const csvText = await response.text();
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          writingCache = results.data;
          resolve(results.data);
        },
        error: () => resolve([])
      });
    });
  } catch {
    return [];
  }
}

// 識別名から英作文問題を取得
export function getWritingByIdentifier(writingData, 識別名) {
  return writingData.filter(w => w.識別名 === 識別名);
}

// 試験IDに紐づく英作文問題を取得（識別名の_前が試験ID）
export function getWritingByExamId(writingData, examId) {
  return writingData.filter(w => w.識別名 && w.識別名.split('_')[0] === examId);
}
