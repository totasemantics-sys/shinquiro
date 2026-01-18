// lib/loadWordMasterData.js
// word_master.csv を読み込んで単語の品詞・意味情報を提供

let cache = null;

export async function loadWordMasterData() {
  if (cache !== null) {
    return cache;
  }

  try {
    const response = await fetch('/data/word_master.csv');
    const text = await response.text();
    
    const Papa = (await import('papaparse')).default;
    
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // 空白行や不正なデータをフィルタリング
          const validData = results.data.filter(row => 
            row.原形 && row.原形.trim() !== '' &&
            row.出現 && row.出現.trim() !== ''
          );
          cache = validData;
          resolve(validData);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Failed to load word master data:', error);
    return [];
  }
}

/**
 * 検索した単語（出現形）から原形・品詞・意味を取得
 * @param {Array} wordMasterData - word_master.csvのデータ
 * @param {string} searchWord - 検索する単語（小文字に正規化される）
 * @returns {Array} - マッチした情報の配列 [{原形, 出現, 品詞, レベル, 優先度, 意味}, ...]
 */
export function getWordInfo(wordMasterData, searchWord) {
  if (!wordMasterData || !searchWord) return [];
  
  const normalizedWord = searchWord.toLowerCase().trim();
  
  // 出現形で検索
  const matches = wordMasterData.filter(row => 
    row.出現 && row.出現.toLowerCase().trim() === normalizedWord
  );
  
  return matches;
}

/**
 * 検索した単語の品詞・意味をグループ化して取得
 * 同じ原形・品詞でも意味が異なる場合は別々に表示
 * @param {Array} wordMasterData - word_master.csvのデータ
 * @param {string} searchWord - 検索する単語
 * @returns {Array} - グループ化された情報 [{品詞, 意味, レベル, 原形}, ...]
 */
export function getWordInfoGrouped(wordMasterData, searchWord) {
  const matches = getWordInfo(wordMasterData, searchWord);
  
  if (matches.length === 0) return [];
  
  // 品詞・意味・原形でユニーク化（優先度でソート）
  const uniqueMap = new Map();
  
  matches.forEach(match => {
    const key = `${match.原形}|${match.品詞}|${match.意味 || ''}`;
    
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        原形: match.原形,
        品詞: match.品詞,
        レベル: match.レベル,
        意味: match.意味 || '',
        優先度: parseInt(match.優先度) || 999
      });
    }
  });
  
  // 優先度でソートして返す
  return Array.from(uniqueMap.values()).sort((a, b) => a.優先度 - b.優先度);
}

/**
 * 原形から全ての出現形を取得
 * @param {Array} wordMasterData - word_master.csvのデータ
 * @param {string} baseForm - 原形
 * @returns {Array} - 出現形の配列
 */
export function getWordForms(wordMasterData, baseForm) {
  if (!wordMasterData || !baseForm) return [];
  
  const normalizedBase = baseForm.toLowerCase().trim();
  
  return wordMasterData
    .filter(row => row.原形 && row.原形.toLowerCase().trim() === normalizedBase)
    .map(row => row.出現)
    .filter((value, index, self) => self.indexOf(value) === index); // ユニーク化
}
