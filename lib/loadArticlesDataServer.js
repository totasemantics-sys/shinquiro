import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

/**
 * サーバーサイドで articles.csv を読み込む（generateMetadata用）
 */
export function loadArticlesDataServer() {
  const csvPath = path.join(process.cwd(), 'public', 'data', 'articles.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');

  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return results.data.map(article => ({
    ...article,
    tags: article.tags ? article.tags.split('|') : [],
  }));
}

/**
 * サーバーサイドでslugから記事を取得
 */
export function getArticleBySlugServer(slug) {
  const articles = loadArticlesDataServer();
  return articles.find(a => a.slug === slug) || null;
}

/**
 * 記事の画像パスを取得（サーバー用）
 */
export function getArticleImagePathServer(article) {
  if (article.image) return article.image;

  const defaultImages = {
    '出題分析': '/images/articles/defaults/default-analysis.svg',
    '書籍レビュー': '/images/articles/defaults/default-review.svg',
    'コラム': '/images/articles/defaults/default-column.svg',
  };
  return defaultImages[article.category] || '/images/articles/defaults/default-analysis.svg';
}
