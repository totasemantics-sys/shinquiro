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