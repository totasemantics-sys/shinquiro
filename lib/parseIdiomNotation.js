/**
 * <<>>記法を解析して熟語表現の表示形と意味を分離する
 *
 * 例:
 *   "<<prevent A from doing>> Aにdoさせない"
 *   → { displayWord: "prevent A from doing", displayMeaning: "Aにdoさせない", isIdiom: true }
 *
 *   "妨げる"
 *   → { displayWord: null, displayMeaning: "妨げる", isIdiom: false }
 */
export function parseIdiomNotation(meaning) {
  if (!meaning) return { displayWord: null, displayMeaning: meaning || '', isIdiom: false };

  const match = meaning.match(/<<(.+?)>>/);
  if (!match) {
    return { displayWord: null, displayMeaning: meaning, isIdiom: false };
  }

  const displayWord = match[1];
  const displayMeaning = meaning.replace(/<<.+?>>/, '').trim();

  return { displayWord, displayMeaning, isIdiom: true };
}
