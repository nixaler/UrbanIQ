/**
 * Answer Engine Optimization (#28): structured NewsArticle markup so AI
 * discovery surfaces (Perplexity, ChatGPT, Gemini) and traditional rich
 * results can parse the daily stack directly, without scraping prose.
 */
export function buildNewsArticleJsonLd(params: {
  headline: string;
  datePublished: string;
  topicName: string;
  editorName?: string;
  url: string;
  summary?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: params.headline,
    datePublished: params.datePublished,
    articleSection: params.topicName,
    url: params.url,
    ...(params.editorName && {
      author: { '@type': 'Person', name: params.editorName },
    }),
    ...(params.summary && { description: params.summary }),
    publisher: {
      '@type': 'Organization',
      name: 'Intellectus',
    },
  };
}
