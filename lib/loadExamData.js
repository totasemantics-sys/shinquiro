import Papa from 'papaparse';

let examCache = null;

export async function loadExamData() {
  if (examCache) return examCache;
  try {
    const response = await fetch('/data/exam.csv');
    if (!response.ok) return [];
    const csvText = await response.text();
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          examCache = results.data;
          resolve(results.data);
        },
        error: () => resolve([])
      });
    });
  } catch {
    return [];
  }
}

// 試験IDから試験情報を取得
export function getExamById(examData, examId) {
  return examData.find(e => e.試験ID === examId) || null;
}

// 識別名から試験IDを抽出（_ 前の部分）
export function getExamIdFromIdentifier(識別名) {
  if (!識別名) return '';
  return 識別名.split('_')[0];
}
