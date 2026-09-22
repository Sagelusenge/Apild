import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUi } from '../../context/UiContext';
import { localizeRecord, plainText } from '../../data/localizedContent';
import Reveal from './Reveal';

export function resolveFeaturedImage(source, fallback) {
  const value = String(source || '').trim();
  if (!value) return fallback;
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('data:')) return value;

  // Images bundled with the React site are intentionally served by Vite/the
  // public host, unlike uploaded media which belongs to the API host.
  if (value.startsWith('/images/site/')) return value;

  // Uploaded files are exposed by the API host, while static fallback imagery
  // remains served by the public React application.
  if (value.startsWith('/') || value.startsWith('uploads/')) {
    try {
      const apiUrl = import.meta.env.VITE_API_ORIGIN || import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const origin = new URL(apiUrl, window.location.origin).origin;
      return `${origin}${value.startsWith('/') ? value : `/${value}`}`;
    } catch {
      return value;
    }
  }

  return value;
}

export default function ArticleCard({ article, image, delay = 0 }) {
  const { language, text } = useUi();
  const localizedArticle = localizeRecord(language, 'articles', article);
  const locale = language === 'fr' ? 'fr-FR' : language === 'sw' ? 'sw-CD' : 'en-US';
  const imageSource = resolveFeaturedImage(article.featured_image_url, image);
  const contentPreview = plainText(localizedArticle.content).replace(/\s+/g, ' ').trim();
  const articlePreview = contentPreview || localizedArticle.excerpt || text.cards.articleFallback;

  return <Reveal as="article" className="article-card card" delay={delay}>
    <div className="article-image">
      <img
        src={imageSource}
        alt={localizedArticle.title}
        loading="lazy"
        onError={(event) => {
          if (!image || event.currentTarget.dataset.fallbackApplied) return;
          event.currentTarget.dataset.fallbackApplied = 'true';
          event.currentTarget.src = image;
        }}
      />
    </div>
    <div className="article-card__body">
      <span className="article-meta"><CalendarDays size={14} /> {localizedArticle.published_at ? new Date(localizedArticle.published_at).toLocaleDateString(locale) : text.cards.publication}</span>
      <h3>{localizedArticle.title}</h3>
      <p>{articlePreview}</p>
      <Link to={`/actualites/${localizedArticle.id}`}>{text.cards.readMore} <ArrowRight size={15} /></Link>
    </div>
  </Reveal>;
}
