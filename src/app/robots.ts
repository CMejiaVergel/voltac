import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'GPTBot', allow: '/' },         // ChatGPT
      { userAgent: 'ClaudeBot', allow: '/' },      // Anthropic
      { userAgent: 'PerplexityBot', allow: '/' },  // Perplexity
      { userAgent: 'GoogleOther', allow: '/' },    // Gemini crawling
    ],
    sitemap: 'https://voltac.com.co/sitemap.xml',
  }
}
