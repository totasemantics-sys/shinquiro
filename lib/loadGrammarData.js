import Papa from 'papaparse';

let grammarCache = null;

export async function loadGrammarData() {
  if (grammarCache) return grammarCache;
  try {
    const response = await fetch('/data/grammar.csv');
    if (!response.ok) return [];
    const csvText = await response.text();
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          grammarCache = results.data;
          resolve(results.data);
        },
        error: () => resolve([])
      });
    });
  } catch {
    return [];
  }
}

// 識別名から文法問題を取得
export function getGrammarByIdentifier(grammarData, 識別名) {
  return grammarData.filter(g => g.識別名 === 識別名);
}

// 試験IDに紐づく文法問題を取得
export function getGrammarByExamId(grammarData, examId) {
  return grammarData.filter(g => g.識別名 && g.識別名.split('_')[0] === examId);
}
