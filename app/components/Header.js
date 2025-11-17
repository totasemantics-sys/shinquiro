'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* ロゴ */}
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png"  // ← ロゴファイルのパス
                alt="SHINQUIRO"
                width={200}      // ← ロゴの幅（調整してください）
                height={100}      // ← ロゴの高さ（調整してください）
                priority
              />
            </Link>

            {/* ハンバーガーメニューボタン */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
              aria-label="メニュー"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* サブタイトル */}
          <p className="text-sm text-gray-600 mt-2">大学受験英語情報 SHINQUIRO</p>
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