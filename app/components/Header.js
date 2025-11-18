'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export default function Header({ pageTitle, pageDescription }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* ロゴとページタイトル */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Image 
                  src="/logo.png"
                  alt="SHINQUIRO"
                  width={200}
                  height={100}
                  priority
                />
              </Link>
              {pageTitle && (
                <div className="border-l-2 border-gray-300 pl-4">
                  <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
                  {pageDescription && (
                    <p className="text-sm text-gray-600 mt-1">{pageDescription}</p>
                  )}
                </div>
              )}
            </div>

            {/* ハンバーガーメニューボタン */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
              aria-label="メニュー"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* サブタイトル（ページタイトルがない場合のみ表示） */}
          {!pageTitle && (
            <p className="text-sm text-gray-600 mt-2">SHINQUIRO - シンキロウ</p>
          )}
        </div>
      </header>

      {/* ドロップダウンメニュー */}
      {isMenuOpen && (
        <div className="bg-white border-b border-emerald-100 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-md transition-colors"
              >
                長文検索
              </Link>
              <Link
                href="/words"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-md transition-colors"
              >
                単語検索
              </Link>
              <Link
                href="/about/passage-levels"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-md transition-colors"
              >
                本文レベルとは
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}