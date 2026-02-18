import { getArticleBySlugServer, getArticleImagePathServer } from '@/lib/loadArticlesDataServer';
import ArticleDetailClient from './ArticleDetailClient';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getArticleBySlugServer(slug);

  if (!article) {
    return {
      title: '記事が見つかりません | SHINQUIRO',
    };
  }

  const imagePath = getArticleImagePathServer(article);
  const siteUrl = 'https://shinquiro.com';

  return {
    title: `${article.title} | SHINQUIRO`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.date,
      url: `${siteUrl}/articles/${slug}`,
      images: [
        {
          url: `${siteUrl}${imagePath}`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [`${siteUrl}${imagePath}`],
    },
  };
}

export default async function ArticleDetailPage({ params }) {
  const { slug } = await params;
  return <ArticleDetailClient slug={slug} />;
}
