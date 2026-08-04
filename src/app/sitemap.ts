import { MetadataRoute } from 'next'
import { getDB } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDB()
  const articles = await db.all(
    "SELECT slug, fecha_publicacion FROM news_entries WHERE estado = 1"
  )

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: 'https://voltac.com.co', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://voltac.com.co/servicios', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: 'https://voltac.com.co/proyectos', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://voltac.com.co/noticias', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://voltac.com.co/cotizar', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.7 },
    { url: 'https://voltac.com.co/politica-de-privacidad', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://voltac.com.co/terminos-y-condiciones', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a: any) => ({
    url: `https://voltac.com.co/noticias/${a.slug}`,
    lastModified: new Date(a.fecha_publicacion),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...articleRoutes]
}
