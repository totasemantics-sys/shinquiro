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

export async function loadAllData() {
  try {
    const [mondai, setsumon, knowledge, hashtags, universities] = await Promise.all([
      loadCSV('mondai.csv'),
      loadCSV('setsumon.csv'),
      loadCSV('knowledge.csv'),
      loadCSV('hashtags.csv'),
      loadCSV('universities.csv')
    ]);

    return {
      mondai,
      setsumon,
      knowledge,
      hashtags,
      universities
    };
  } catch (error) {
    console.error('CSVデータの読み込みに失敗:', error);
    return {
      mondai: [],
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
  
  // 大学コードが存在するレコードのみをフィルターし、長い順にソートしてからマッチング
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