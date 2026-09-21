import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PublicPage from './PublicPage';
import ArticleCard from '../../components/public/ArticleCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { articlesApi } from '../../api/articles.api';
import { useUi } from '../../context/UiContext';
import { NEWS_IMAGES, SITE_IMAGES } from '../../data/siteMedia';

const PAGE_SIZE = 10;

function normalizeMeta(meta, requestedPage, itemCount) {
  return {
    page: Math.max(Number(meta?.page) || requestedPage, 1),
    total: Math.max(Number(meta?.total) || itemCount, 0),
    totalPages: Math.max(Number(meta?.totalPages) || 1, 1)
  };
}

function NewsPagination({ page, pages, onChange, disabled, labels }) {
  if (pages <= 1) return null;

  return <nav className="public-pagination" aria-label={labels.label}>
    <button className="public-pagination__button" type="button" onClick={() => onChange(page - 1)} disabled={disabled || page <= 1}>
      <ChevronLeft size={16} aria-hidden="true" />
      <span>{labels.previous}</span>
    </button>
    <span className="public-pagination__status" aria-live="polite">{labels.page} {page} / {pages}</span>
    <button className="public-pagination__button" type="button" onClick={() => onChange(page + 1)} disabled={disabled || page >= pages}>
      <span>{labels.next}</span>
      <ChevronRight size={16} aria-hidden="true" />
    </button>
  </nav>;
}

export default function News() {
  const { text } = useUi();
  const resultsRef = useRef(null);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ items: null, meta: { page: 1, total: 0, totalPages: 1 } });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    articlesApi.publicList({ page, limit: PAGE_SIZE, sortBy: 'published_at', sortOrder: 'desc' })
      .then((result) => {
        if (!active) return;
        const items = Array.isArray(result?.data) ? result.data : [];
        setState({ items, meta: normalizeMeta(result?.meta, page, items.length) });
      })
      .catch(() => {
        if (active) setState({ items: [], meta: normalizeMeta(null, page, 0) });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [page]);

  const changePage = (nextPage) => {
    if (isLoading || nextPage < 1 || nextPage > state.meta.totalPages || nextPage === page) return;
    setPage(nextPage);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  };

  const { items, meta } = state;
  const activePage = meta.page || page;

  return <PublicPage image={SITE_IMAGES.news} eyebrow={text.newsPage.eyebrow} title={text.newsPage.title} intro={text.newsPage.intro}>
    <div className="news-page-results" ref={resultsRef}>
      {items === null ? <Loader/> : items.length ? <>
        <div className={`news-cards news-cards--paginated${isLoading ? ' is-updating' : ''}`} aria-busy={isLoading}>
          {items.map((item, index) => <ArticleCard
            key={item.id}
            article={item}
            image={NEWS_IMAGES[((activePage - 1) * PAGE_SIZE + index) % NEWS_IMAGES.length]}
            delay={Math.min(index, 4) * 65}
          />)}
        </div>
        <NewsPagination
          page={activePage}
          pages={meta.totalPages}
          onChange={changePage}
          disabled={isLoading}
          labels={text.newsPage.pagination}
        />
      </> : (
        <EmptyState title={text.newsPage.empty}/>
      )}
    </div>
  </PublicPage>;
}
