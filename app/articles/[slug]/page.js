'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Calendar, Tag, ArrowLeft, Home } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Header from '../../components/Header';
import { loadArticlesData, getArticleBySlug } from '@/lib/loadArticlesData';

export default function ArticleDetail({ params }) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // カテゴリの色を取得
  const getCategoryColor = (category) => {
    switch (category) {
      case '出題分析':
        return 'bg-blue-100 text-blue-800';
      case '書籍レビュー':
        return 'bg-orange-100 text-orange-800';
      case 'コラム':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // 記事メタ情報を取得
        const articles = await loadArticlesData();
        const articleData = getArticleBySlug(articles, resolvedParams.slug);
        
        if (!articleData) {
          setError('記事が見つかりませんでした');
          setLoading(false);
          return;
        }
        
        setArticle(articleData);

        // Markdownコンテンツを取得
        const response = await fetch(`/articles/${resolvedParams.slug}.md`);
        if (!response.ok) {
          throw new Error('記事コンテンツの読み込みに失敗しました');
        }
        const text = await response.text();
        setContent(text);
        setLoading(false);
      } catch (err) {
        console.error('記事の読み込みエラー:', err);
        setError('記事の読み込みに失敗しました');
        setLoading(false);
      }
    }
    fetchData();
  }, [resolvedParams.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <Header pageTitle="エラー" pageDescription="" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-6">{error}</p>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              <ArrowLeft size={18} />
              記事一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header 
        pageTitle="記事"
        pageDescription=""
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            <Home size={16} />
          </Link>
          <span>/</span>
          <Link href="/articles" className="hover:text-emerald-600 transition-colors">
            記事一覧
          </Link>
          <span>/</span>
          <span className="text-gray-400 truncate max-w-[200px]">{article.title}</span>
        </nav>

        {/* 記事ヘッダー */}
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8 border-b">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar size={16} />
                {article.date}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {article.title}
            </h1>

            <p className="text-gray-600 mb-4">
              {article.description}
            </p>

            {article.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={16} className="text-gray-400" />
                {article.tags.map((tag, idx) => (
                  <span key={idx} className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 記事本文 */}
          <div className="p-8">
            <div className="prose prose-emerald max-w-none markdown-article">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </article>

        {/* 記事一覧に戻るボタン */}
        <div className="mt-8 text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-emerald-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            記事一覧に戻る
          </Link>
        </div>
      </div>

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>

      <style jsx global>{`
        .markdown-article h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #10b981;
        }
        .markdown-article h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #d1d5db;
        }
        .markdown-article h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .markdown-article p {
          margin-bottom: 1rem;
          line-height: 1.8;
          color: #374151;
        }
        .markdown-article ul, .markdown-article ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .markdown-article li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .markdown-article ul {
          list-style-type: disc;
        }
        .markdown-article ol {
          list-style-type: decimal;
        }
        .markdown-article strong {
          font-weight: 600;
          color: #10b981;
        }
        .markdown-article a {
          color: #10b981;
          text-decoration: underline;
        }
        .markdown-article a:hover {
          color: #059669;
        }
        .markdown-article blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #6b7280;
          font-style: italic;
        }
        .markdown-article code {
          background-color: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .markdown-article pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .markdown-article pre code {
          background-color: transparent;
          padding: 0;
        }
        .markdown-article table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .markdown-article th, .markdown-article td {
          border: 1px solid #d1d5db;
          padding: 0.75rem;
          text-align: left;
        }
        .markdown-article th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        .markdown-article hr {
          margin: 2rem 0;
          border: none;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}