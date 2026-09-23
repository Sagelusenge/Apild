import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { projectsApi } from '../../api/projects.api';
import { SITE_IMAGES } from '../../data/siteMedia';
import { useUi } from '../../context/UiContext';
import { localizeRecord } from '../../data/localizedContent';
import Reveal from '../../components/public/Reveal';

export default function ProjectDetails() {
  const { id } = useParams();
  const { language, text } = useUi();
  const [project, setProject] = useState();
  useEffect(() => { projectsApi.publicOne(id).then(setProject).catch(() => setProject(null)); }, [id]);
  if (project === undefined) return <Loader fullPage/>;
  if (project === null) return <div className="not-found"><div><h1>{text.details.projectMissing}</h1><Link to="/projets">{text.details.backProjects}</Link></div></div>;

  const locale = language === 'fr' ? 'fr-FR' : language === 'sw' ? 'sw-CD' : 'en-US';
  const localizedProject = localizeRecord(language, 'projects', project);
  return <article className="detail-page">
    <div className="detail-photo-hero" style={{ '--detail-image': `url("${localizedProject.image_url || SITE_IMAGES.projects}")` }}>
      <div className="container"><Link className="back-link" to="/projets"><ArrowLeft size={17}/> {text.details.allProjects}</Link><span className="eyebrow">{localizedProject.reference}</span><h1>{localizedProject.name}</h1><div className="detail-meta"><span><MapPin/> {localizedProject.locality || localizedProject.territory || localizedProject.province || 'RDC'}</span><span><CalendarDays/> {localizedProject.start_date ? new Date(localizedProject.start_date).toLocaleDateString(locale) : text.cards.ongoing}</span></div></div>
    </div>
    <div className="container"><Reveal as="section" className="detail-content card"><h2>{text.details.aboutProject}</h2><p>{localizedProject.description}</p>{localizedProject.objectives && <><h2>{text.details.objectives}</h2><p>{localizedProject.objectives}</p></>}<small className="progress-caption">{language === 'fr' ? 'Temps écoulé selon les dates prévues — ne représente pas les travaux réalisés.' : language === 'sw' ? 'Muda wa ratiba uliopita — si kiwango cha kazi iliyokamilika.' : 'Scheduled time elapsed — not a measure of completed work.'}</small><div className="progress"><span><i style={{ width: `${localizedProject.progress_percent || 0}%` }}/></span><b>{localizedProject.progress_percent || 0}%</b></div></Reveal></div>
  </article>;
}
