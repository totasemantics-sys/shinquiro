'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export default function Header({ pageTitle, pageDescription }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'トップ' },
    { href: '/search', label: '長文検索' },
    { href: '/words', label: '単語検索' },
    { href: '/articles', label: '記事', comingSoon: true },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

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
                <div className="border-l-2 border-gray-300 pl-4 hidden sm:block">
                  <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
                  {pageDescription && (
                    <p className="text-sm text-gray-600 mt-1">{pageDescription}</p>
                  )}
                </div>
              )}
            </div>

            {/* PC用ナビゲーション */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.comingSoon ? '#' : link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    link.comingSoon
                      ? 'text-gray-400 cursor-not-allowed'
                      : isActive(link.href)
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                  onClick={(e) => link.comingSoon && e.preventDefault()}
                >
                  {link.label}
                  {link.comingSoon && (
                    <span className="ml-1 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                      準備中
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* スマホ用ハンバーガーメニューボタン */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
              aria-label="メニュー"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* サブタイトル（ページタイトルがない場合のみ表示） */}
          {!pageTitle && (
            <p className="text-sm text-gray-600 mt-2">SHINQUIRO - シンキロウ</p>
          )}

          {/* スマホ用ページタイトル */}
          {pageTitle && (
            <div className="sm:hidden mt-2 pt-2 border-t border-gray-100">
              <h1 className="text-lg font-bold text-gray-800">{pageTitle}</h1>
              {pageDescription && (
                <p className="text-xs text-gray-600 mt-0.5">{pageDescription}</p>
              )}
            </div>
          )}
        </div>
      </header>

      {/* スマホ用ドロップダウンメニュー */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-emerald-100 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.comingSoon ? '#' : link.href}
                  onClick={(e) => {
                    if (link.comingSoon) {
                      e.preventDefault();
                    } else {
                      setIsMenuOpen(false);
                    }
                  }}
                  className={`block px-4 py-3 rounded-md transition-colors ${
                    link.comingSoon
                      ? 'text-gray-400 cursor-not-allowed'
                      : isActive(link.href)
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  {link.label}
                  {link.comingSoon && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">
                      準備中
                    </span>
                  )}
                </Link>
              ))}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <Link
                  href="/about/passage-levels"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-md transition-colors text-sm"
                >
                  本文レベルとは
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}