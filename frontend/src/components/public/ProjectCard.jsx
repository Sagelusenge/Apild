import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import { useUi } from '../../context/UiContext';
import { localizeRecord } from '../../data/localizedContent';
import Reveal from './Reveal';

export default function ProjectCard({ project, image, delay = 0, showReference = true }) {
  const { language, text } = useUi();
  const localizedProject = localizeRecord(language, 'projects', project);
  const locale = language === 'fr' ? 'fr-FR' : language === 'sw' ? 'sw-CD' : 'en-US';
  return <Reveal as="article" className="project-card card" delay={delay}><div className="project-image"><img src={image} alt="" /><Badge tone="success">{localizedProject.status === 'completed' ? text.cards.completed : text.cards.ongoing}</Badge></div>
    <div className="project-body">{showReference && <small>{localizedProject.reference}</small>}<h3>{localizedProject.name}</h3><p>{localizedProject.description || text.cards.projectFallback}</p>
      <div className="project-meta"><span><MapPin size={15} />{localizedProject.territory || localizedProject.province || 'RDC'}</span><span><CalendarDays size={15} />{localizedProject.end_date ? new Date(localizedProject.end_date).toLocaleDateString(locale) : text.cards.ongoing}</span></div>
      <small className="progress-caption">{language === 'fr' ? 'Temps écoulé selon le calendrier' : language === 'sw' ? 'Muda uliopita kulingana na ratiba' : 'Time elapsed on the schedule'}</small><div className="progress"><span><i style={{ width: `${localizedProject.progress_percent || 0}%` }} /></span><b>{localizedProject.progress_percent || 0}%</b></div>
      <Link to={`/projets/${localizedProject.id}`}>{text.cards.viewProject} <ArrowRight size={16} /></Link>
    </div></Reveal>;
}
