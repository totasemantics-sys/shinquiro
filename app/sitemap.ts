import { MetadataRoute } from 'next'
import Papa from 'papaparse'

async function fetchCSV(filename: string) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://shinquiro.com' 
    : 'http://localhost:3000'
  
  const res = await fetch(`${baseUrl}/data/${filename}`, { cache: 'no-store' })
  const text = await res.text()
  
  return new Promise<any[]>((resolve) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
    })
  })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shinquiro.com'

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/words`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about/passage-levels`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    // 大問ページを取得
    const mondaiData = await fetchCSV('mondai.csv')
    const mondaiPages: MetadataRoute.Sitemap = mondaiData
      .filter((m: any) => m.識別名)
      .map((m: any) => ({
        url: `${baseUrl}/mondai/${m.識別名}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))

    // 大学ページを取得
    const universitiesData = await fetchCSV('universities.csv')
    const universityPages: MetadataRoute.Sitemap = universitiesData
      .filter((u: any) => u.大学コード && u.大学コード.trim() !== '')
      .map((u: any) => ({
        url: `${baseUrl}/university/${u.大学コード}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))

    return [...staticPages, ...mondaiPages, ...universityPages]
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return staticPages
  }
}