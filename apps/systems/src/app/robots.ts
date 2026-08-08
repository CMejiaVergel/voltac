import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      /*
       * El panel administrativo NO se lista aqui a proposito. robots.txt es
       * publico: escribir "Disallow: /admin/" es publicar un mapa hacia la
       * puerta que se quiere esconder. Esas rutas quedan fuera del indice por
       * la cabecera X-Robots-Tag que pone el middleware, y ademas responden 404
       * a quien no tenga sesion.
       */
      { userAgent: '*', allow: '/', disallow: ['/api/'] },
      { userAgent: 'GPTBot', allow: '/' },         // ChatGPT
      { userAgent: 'ClaudeBot', allow: '/' },      // Anthropic
      { userAgent: 'PerplexityBot', allow: '/' },  // Perplexity
      { userAgent: 'GoogleOther', allow: '/' },    // Gemini crawling
    ],
    sitemap: 'https://voltac.com.co/sitemap.xml',
  }
}
