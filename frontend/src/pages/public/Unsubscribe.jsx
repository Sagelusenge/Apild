import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, MailX } from 'lucide-react';
import { newsletterApi } from '../../api/newsletter.api';
import { useUi } from '../../context/UiContext';
import Reveal from '../../components/public/Reveal';
import './Unsubscribe.css';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const { text } = useUi();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState(token ? 'ready' : 'missing');

  const submit = async () => {
    setState('processing');
    try {
      await newsletterApi.unsubscribe(token);
      setState('success');
    } catch {
      setState('error');
    }
  };

  const isSuccess = state === 'success';
  const isIssue = state === 'missing' || state === 'error';
  const Icon = isSuccess ? CheckCircle2 : isIssue ? AlertCircle : MailX;
  const title = isSuccess ? text.unsubscribe.successTitle : isIssue ? (state === 'missing' ? text.unsubscribe.missingTitle : text.unsubscribe.errorTitle) : text.unsubscribe.title;
  const description = isSuccess ? text.unsubscribe.successText : isIssue ? (state === 'missing' ? text.unsubscribe.missingText : text.unsubscribe.errorText) : text.unsubscribe.intro;

  return <section className="unsubscribe-page">
    <div className="container unsubscribe-page__container">
      <Reveal as="article" className={`unsubscribe-card card unsubscribe-card--${state}`} aria-live="polite">
        <span className="unsubscribe-card__icon"><Icon size={28} aria-hidden="true" /></span>
        <span className="eyebrow">{text.unsubscribe.eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {state === 'ready' && <>
          <p className="unsubscribe-card__notice">{text.unsubscribe.notice}</p>
          <button className="button button--primary" type="button" onClick={submit}>{text.unsubscribe.action}</button>
        </>}
        {state === 'processing' && <p className="unsubscribe-card__processing"><span className="spinner" aria-hidden="true" />{text.unsubscribe.processing}</p>}
        {(isSuccess || isIssue) && <Link className="button button--ghost unsubscribe-card__back" to="/"><ArrowLeft size={17} /> {text.unsubscribe.backHome}</Link>}
      </Reveal>
    </div>
  </section>;
}
