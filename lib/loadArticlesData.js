import Papa from 'papaparse';

let cache = null;

export async function loadArticlesData() {
  if (cache !== null) return cache;
  
  const response = await fetch('/data/articles.csv');
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // tagsをパイプ区切りから配列に変換
        const articles = results.data.map(article => ({
          ...article,
          tags: article.tags ? article.tags.split('|') : []
        }));
        cache = articles;
        resolve(articles);
      },
      error: (error) => reject(error)
    });
  });
}

/**
 * カテゴリ一覧を取得
 */
export function getCategories(articles) {
  return [...new Set(articles.map(a => a.category))].filter(Boolean);
}

/**
 * slugから記事を取得
 */
export function getArticleBySlug(articles, slug) {
  return articles.find(a => a.slug === slug) || null;
}

/**
 * カテゴリでフィルタリング
 */
export function filterByCategory(articles, category) {
  if (!category) return articles;
  return articles.filter(a => a.category === category);
}

/**
 * 日付順でソート（新しい順）
 */
export function sortByDate(articles) {
  return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 記事の画像パスを取得（image列があればそれを、なければカテゴリ別デフォルト）
 */
export function getArticleImagePath(article) {
  if (article.image) return article.image;

  const defaultImages = {
    '出題分析': '/images/articles/defaults/default-analysis.svg',
    '書籍レビュー': '/images/articles/defaults/default-review.svg',
    'コラム': '/images/articles/defaults/default-column.svg',
  };
  return defaultImages[article.category] || '/images/articles/defaults/default-analysis.svg';
}