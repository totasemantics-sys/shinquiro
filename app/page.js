'use client';

import React from 'react';
import Link from 'next/link';
import { Search, BookOpen, FileText } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header 
        pageTitle=""
        pageDescription=""
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* ヒーローセクション */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            大学受験英語の
            <span className="text-emerald-600">検索・分析</span>
            システム
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            過去問の長文検索、単語帳の掲載状況チェックなど、
            大学受験英語の学習・指導をサポートするツールを提供しています。
          </p>
        </div>

        {/* 機能カード */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* 長文検索 */}
          <Link href="/search" className="group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-emerald-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500 transition-colors">
                  <Search className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">長文検索</h2>
              </div>
              <p className="text-gray-600 mb-4">
                大学・年度・設問形式・テーマなど、多角的な条件で英語長文を検索できます。
              </p>
              <span className="text-emerald-600 font-medium group-hover:underline">
                検索する →
              </span>
            </div>
          </Link>

          {/* 単語検索 */}
          <Link href="/words" className="group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-emerald-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                  <BookOpen className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">単語検索</h2>
              </div>
              <p className="text-gray-600 mb-4">
                英単語が各単語帳に掲載されているかを一括チェック。大学別の頻出単語も検索できます。
              </p>
              <span className="text-blue-600 font-medium group-hover:underline">
                検索する →
              </span>
            </div>
          </Link>

          {/* 記事（準備中） */}
          <div className="group">
            <div className="bg-white rounded-xl shadow-md p-8 h-full border-2 border-transparent opacity-60">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  記事
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">準備中</span>
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                出題傾向の分析や学習法など、大学受験英語に役立つ情報を発信予定です。
              </p>
              <span className="text-gray-400 font-medium">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* 特徴セクション */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">SHINQUIROの特徴</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-gray-800 mb-2">詳細な検索条件</h3>
              <p className="text-sm text-gray-600">
                本文レベル、設問形式、知識・文法など、細かい条件で絞り込みが可能
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="font-bold text-gray-800 mb-2">単語帳横断検索</h3>
              <p className="text-sm text-gray-600">
                ターゲット、シス単、LEAPなど複数の単語帳での掲載状況を一括確認
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🏫</div>
              <h3 className="font-bold text-gray-800 mb-2">大学別分析</h3>
              <p className="text-sm text-gray-600">
                大学ごとの出題傾向や頻出単語を把握して効率的な対策が可能
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}