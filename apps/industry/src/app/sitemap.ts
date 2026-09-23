import { MetadataRoute } from 'next'
import { CONTACT } from '@/content/services'

/*
 * Solo rutas estaticas: esta linea todavia no publica proyectos ni noticias
 * —esas secciones se alimentan del panel, que aqui no esta montado— y anunciar
 * en el sitemap direcciones que devuelven 404 es una forma rapida de perder
 * confianza con los buscadores.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date()
  const ruta = (path: string, changeFrequency: 'weekly' | 'monthly' | 'yearly', priority: number) => ({
    url: `${CONTACT.site}${path}`,
    lastModified: ahora,
    changeFrequency,
    priority,
  })

  return [
    ruta('', 'weekly', 1),
    ruta('/servicios', 'monthly', 0.9),
    ruta('/cotizar', 'yearly', 0.7),
    ruta('/politica-de-privacidad', 'yearly', 0.3),
    ruta('/terminos-y-condiciones', 'yearly', 0.3),
  ]
}
