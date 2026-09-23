import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, FileText, Heart, LoaderCircle, MessageCircle, Share2, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { articlesApi } from '../../api/articles.api';
import { NEWS_IMAGES } from '../../data/siteMedia';
import { useUi } from '../../context/UiContext';
import { localizeRecord, plainText } from '../../data/localizedContent';
import Reveal from '../../components/public/Reveal';
import { resolveFeaturedImage } from '../../components/public/ArticleCard';
import useNotifications from '../../hooks/useNotifications';
import { ARTICLE_ENGAGEMENT_COPY } from '../../data/publicEngagementContent';
import { publicVisitorId } from '../../utils/visitorIdentity';

const emptyFeedback = { likes_count: 0, shares_count: 0, comments_count: 0, liked: false };

export default function ArticleDetails() {
  const { id } = useParams();
  const { language, text } = useUi();
  const { notify } = useNotifications();
  const [article, setArticle] = useState();
  const [feedback, setFeedback] = useState(emptyFeedback);
  const [comments, setComments] = useState();
  const [attachments, setAttachments] = useState([]);
  const [commentForm, setCommentForm] = useState(() => ({ author_name: '', author_email: '', content: '' }));
  const [pendingAction, setPendingAction] = useState('');
  const commentContentRef = useRef(null);
  const commentsRef = useRef(null);
  const visitorId = useMemo(() => publicVisitorId(), []);
  const copy = ARTICLE_ENGAGEMENT_COPY[language] || ARTICLE_ENGAGEMENT_COPY.fr;
  const locale = language === 'fr' ? 'fr-FR' : language === 'sw' ? 'sw-CD' : 'en-US';

  const loadFeedback = useCallback(async () => {
    try { setFeedback(await articlesApi.engagement(id, visitorId)); } catch { setFeedback(emptyFeedback); }
  }, [id, visitorId]);

  useEffect(() => {
    let active = true;
    setArticle(undefined);
    setComments(undefined);
    setFeedback(emptyFeedback);
    articlesApi.publicOne(id).then((value) => { if (active) setArticle(value); }).catch(() => { if (active) setArticle(null); });
    articlesApi.comments(id, { page: 1, limit: 50 }).then((response) => { if (active) setComments(response.data || []); }).catch(() => { if (active) setComments([]); });
    articlesApi.attachments(id).then((items) => { if (active) setAttachments(items || []); }).catch(() => { if (active) setAttachments([]); });
    loadFeedback();
    return () => { active = false; };
  }, [id, loadFeedback]);

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => commentContentRef.current?.focus(), 350);
  };

  const toggleLike = async () => {
    if (pendingAction) return;
    setPendingAction('like');
    try { setFeedback(await articlesApi.toggleLike(id, visitorId)); }
    catch { notify(copy.likeError, 'error'); }
    finally { setPendingAction(''); }
  };

  const shareArticle = async () => {
    if (pendingAction || !article) return;
    const shareUrl = window.location.href;
    const shareData = { title: article.title, text: article.excerpt || article.title, url: shareUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        notify(copy.copied, 'success');
      } else {
        notify(copy.shareUnavailable, 'error');
        return;
      }
      setPendingAction('share');
      try {
        const nextFeedback = await articlesApi.recordShare(id);
        setFeedback((current) => ({ ...nextFeedback, liked: current.liked }));
      } catch { /* The share itself succeeded; only its metric was unavailable. */ }
    } catch (error) {
      if (error?.name !== 'AbortError') notify(copy.shareError, 'error');
    } finally { setPendingAction(''); }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (pendingAction === 'comment') return;
    setPendingAction('comment');
    try {
      const payload = {
        author_name: commentForm.author_name,
        content: commentForm.content,
        ...(commentForm.author_email.trim() ? { author_email: commentForm.author_email.trim() } : {})
      };
      const result = await articlesApi.createComment(id, payload);
      setComments((current) => [result.comment, ...(current || [])]);
      setFeedback((current) => ({ ...result.feedback, liked: current.liked }));
      setCommentForm((current) => ({ ...current, content: '' }));
      notify(copy.sent, 'success');
    } catch (error) {
      notify(error.response?.data?.error?.message || copy.commentError, 'error');
    } finally { setPendingAction(''); }
  };

  if (article === undefined) return <Loader fullPage/>;
  if (!article) return <div className="not-found"><h1>{text.details.articleMissing}</h1></div>;

  const localizedArticle = localizeRecord(language, 'articles', article);
  const articleImage = resolveFeaturedImage(
    localizedArticle.featured_image_url,
    NEWS_IMAGES[Number(localizedArticle.id || 0) % NEWS_IMAGES.length]
  );

  return <article className="article-detail-page">
    <header className="article-detail-hero" style={{ '--detail-image': `url("${articleImage}")` }}><div className="container"><Link className="back-link" to="/actualites"><ArrowLeft size={17}/> {text.details.allNews}</Link><span className="eyebrow">{text.details.publication}</span><h1>{localizedArticle.title}</h1><p className="article-lead">{localizedArticle.excerpt}</p></div></header>
    <div className="article-detail container"><Reveal className="article-content">{plainText(localizedArticle.content).split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</Reveal>
      {attachments.length > 0 && <section className="article-attachments card" aria-label="Documents joints"><h2>Documents joints</h2><ul>{attachments.map((file) => <li key={file.id}><FileText size={19} /><a href={resolveFeaturedImage(file.public_url, '#')} target="_blank" rel="noopener noreferrer">{file.original_name}</a><small>{Math.max(1, Math.round(Number(file.file_size || 0) / 1024))} Ko</small></li>)}</ul></section>}
      <section className="article-feedback card" aria-label={copy.react}>
        <div className="article-feedback__heading"><span>{copy.react}</span><div><small>{feedback.likes_count} {copy.likes}</small><small>{feedback.comments_count} {copy.comments}</small><small>{feedback.shares_count} {copy.shares}</small></div></div>
        <div className="article-feedback__actions"><button type="button" className={`article-feedback__button${feedback.liked ? ' is-active' : ''}`} onClick={toggleLike} disabled={Boolean(pendingAction)} aria-pressed={feedback.liked}><Heart size={18} fill={feedback.liked ? 'currentColor' : 'none'} />{feedback.liked ? copy.liked : copy.like}</button><button type="button" className="article-feedback__button" onClick={scrollToComments}><MessageCircle size={18}/>{copy.comment}</button><button type="button" className="article-feedback__button" onClick={shareArticle} disabled={Boolean(pendingAction)}>{pendingAction === 'share' ? <LoaderCircle className="spinning" size={18}/> : <Share2 size={18}/>} {copy.share}</button></div>
      </section>
      <section className="article-comments" ref={commentsRef} aria-labelledby="article-comments-title"><Reveal><div className="article-comments__heading"><div><span className="eyebrow">APILD</span><h2 id="article-comments-title">{copy.commentsTitle}</h2></div><span>{feedback.comments_count}</span></div></Reveal><Reveal as="form" className="article-comment-form card" onSubmit={submitComment}><div className="form-two"><div className="field"><label htmlFor="comment-author-name">{copy.name}</label><input id="comment-author-name" value={commentForm.author_name} onChange={(event) => setCommentForm((current) => ({ ...current, author_name: event.target.value }))} minLength="2" maxLength="120" autoComplete="name" required/></div><div className="field"><label htmlFor="comment-author-email">{copy.email}</label><input id="comment-author-email" value={commentForm.author_email} onChange={(event) => setCommentForm((current) => ({ ...current, author_email: event.target.value }))} type="email" maxLength="190" autoComplete="email"/></div></div><div className="field"><label htmlFor="comment-content">{copy.message}</label><textarea ref={commentContentRef} id="comment-content" value={commentForm.content} onChange={(event) => setCommentForm((current) => ({ ...current, content: event.target.value }))} minLength="2" maxLength="2000" rows="5" required/></div><button className="button button--primary" type="submit" disabled={pendingAction === 'comment'}>{pendingAction === 'comment' && <LoaderCircle className="spinning" size={17}/>} {pendingAction === 'comment' ? copy.submitting : copy.submit}</button></Reveal><div className="article-comments__list" aria-live="polite">{comments === undefined ? <Loader label={copy.loadingComments}/> : comments.length ? comments.map((comment) => <Reveal as="article" className="article-comment card" key={comment.id}><span className="article-comment__avatar"><UserRound size={18}/></span><div><header><strong>{comment.author_name}</strong><time dateTime={comment.created_at}><CalendarDays size={14}/>{new Date(String(comment.created_at).replace(' ', 'T')).toLocaleDateString(locale, { dateStyle: 'medium' })}</time></header><p>{comment.content}</p></div></Reveal>) : <Reveal className="article-comments__empty">{copy.noComments}</Reveal>}</div></section>
    </div>
  </article>;
}
