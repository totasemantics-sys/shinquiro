import Papa from 'papaparse';

let listeningCache = null;

export async function loadListeningData() {
  if (listeningCache) return listeningCache;
  try {
    const response = await fetch('/data/listening.csv');
    if (!response.ok) return [];
    const csvText = await response.text();
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          listeningCache = results.data;
          resolve(results.data);
        },
        error: () => resolve([])
      });
    });
  } catch {
    return [];
  }
}

// 識別名からリスニング問題を取得
export function getListeningByIdentifier(listeningData, 識別名) {
  return listeningData.filter(l => l.識別名 === 識別名);
}

// 試験IDに紐づくリスニング問題を取得
export function getListeningByExamId(listeningData, examId) {
  return listeningData.filter(l => l.識別名 && l.識別名.split('_')[0] === examId);
}

// 解答形式をパイプ区切りで配列化（例: "選択問題|日本語記述" → ["選択問題", "日本語記述"]）
export function parseAnswerFormats(解答形式) {
  if (!解答形式) return [];
  return 解答形式.split('|').map(f => f.trim()).filter(Boolean);
}
