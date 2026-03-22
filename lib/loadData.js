import Papa from 'papaparse';

export async function loadCSV(filename) {
  const response = await fetch(`/data/${filename}`);
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}

// exam.csvを安全に読み込む（ファイルが存在しない場合は空配列を返す）
async function loadExamCSVSafe() {
  try {
    const response = await fetch('/data/exam.csv');
    if (!response.ok) return [];
    const csvText = await response.text();
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: () => resolve([])
      });
    });
  } catch {
    return [];
  }
}

export async function loadAllData() {
  try {
    const [reading, exam, setsumon, knowledge, hashtags, universities] = await Promise.all([
      loadCSV('reading.csv'),
      loadExamCSVSafe(),
      loadCSV('setsumon.csv'),
      loadCSV('knowledge.csv'),
      loadCSV('hashtags.csv'),
      loadCSV('universities.csv')
    ]);

    // exam.csvをMap化（試験IDをキーに）
    const examMap = new Map(exam.map(e => [e.試験ID, e]));

    // reading.csvの各行にexam情報をマージ
    // 識別名の _ 前が試験ID（例: tokyo2025kzen_1A → tokyo2025kzen）
    const enrichedReading = reading.map(r => {
      const examId = r.識別名 ? r.識別名.split('_')[0] : '';
      const examData = examMap.get(examId) || {};
      // examDataをベースにreadingで上書き（大問IDなどreadingフィールドが優先）
      return { ...examData, ...r };
    });

    return {
      reading: enrichedReading,
      setsumon,
      knowledge,
      hashtags,
      universities
    };
  } catch (error) {
    console.error('CSVデータの読み込みに失敗:', error);
    return {
      reading: [],
      setsumon: [],
      knowledge: [],
      hashtags: [],
      universities: []
    };
  }
}

// 識別名から大学コードを取得
export function getUniversityCodeFromId(識別名, universities) {
  // universitiesが配列でない場合は空文字を返す
  if (!Array.isArray(universities)) {
    return '';
  }

  // 識別名が空の場合は空文字を返す
  if (!識別名) {
    return '';
  }

  // コードが存在するレコードのみをフィルターし、長い順にソートしてからマッチング
  const validUniversities = universities.filter(u => u.コード && u.コード.length > 0);
  const sortedUniversities = [...validUniversities].sort((a, b) =>
    b.コード.length - a.コード.length
  );

  for (const uni of sortedUniversities) {
    if (識別名.startsWith(uni.コード)) {
      return uni.コード;
    }
  }

  return '';
}

// 識別名から年度を取得
export function getYearFromId(識別名, 大学コード) {
  // 大学コードの後の4桁を年度として取得
  // 例: "kyotsu2021hon1A" → "kyotsu"を除去 → "2021hon1A" → 2021
  if (!識別名 || !大学コード) {
    return null;
  }
  const afterCode = 識別名.substring(大学コード.length);
  const yearMatch = afterCode.match(/^(\d{4})/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

// 大学コードから大学名を取得
export function getUniversityName(code, universities) {
  if (!code || !Array.isArray(universities)) {
    return '';
  }
  const uni = universities.find(u => u.コード === code);
  return uni?.名称 || '';
}

// 大学名から大学コードを取得
export function getUniversityCode(name, universities) {
  if (!name || !Array.isArray(universities)) {
    return '';
  }
  const uni = universities.find(u => u.名称 === name);
  return uni?.コード || '';
}