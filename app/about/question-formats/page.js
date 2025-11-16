'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Header from '@/app/components/Header';

export default function QuestionFormats() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header />

      {/* 戻るボタン */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4"
        >
          <ChevronLeft size={20} />
          戻る
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">設問形式について</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">準備中</h2>
              <p className="text-gray-700">
                設問形式の詳しい説明は現在準備中です。近日公開予定です。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}