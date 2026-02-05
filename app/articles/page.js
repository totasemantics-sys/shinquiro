'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Calendar, Tag, Filter } from 'lucide-react';
import Header from '../components/Header';
import { loadArticlesData, getCategories, filterByCategory, sortByDate } from '@/lib/loadArticlesData';

export default function ArticlesList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await loadArticlesData();
      setArticles(data);
      setCategories(getCategories(data));
      setLoading(false);
    }
    fetchData();
  }, []);

  // フィルタリングとソート
  const filteredArticles = sortByDate(filterByCategory(articles, selectedCategory));

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header 
        pageTitle="記事一覧"
        pageDescription="出題分析・書籍レビュー・コラムなど"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* カテゴリフィルター */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={20} className="text-emerald-600" />
            <span className="font-medium text-gray-700">カテゴリで絞り込み</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 記事件数 */}
        <p className="text-sm text-gray-600 mb-4">
          {filteredArticles.length}件の記事
        </p>

        {/* 記事一覧 */}
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`}>
              <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar size={14} />
                    {article.date}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-2 hover:text-emerald-600 transition-colors">
                  {article.title}
                </h2>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {article.description}
                </p>

                {article.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag size={14} className="text-gray-400" />
                    {article.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </Link>
          ))}

          {filteredArticles.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">該当する記事がありません</p>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2025 SHINQUIRO</p>
        </div>
      </footer>
    </div>
  );
}