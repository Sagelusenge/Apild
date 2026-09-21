import { CalendarDays, MapPin } from 'lucide-react';
import Badge from '../common/Badge';
export default function ProjectProgress({ project }) {
  const progress = project.progress_percent || 0;
  return <article className="dash-project"><div className="dash-project-top"><div><Badge tone="success">{project.status === 'active' ? 'Projet actif' : project.status}</Badge><small>{project.reference}</small><h3>{project.name}</h3></div><b>{progress}%</b></div><div className="dash-project-meta"><span><CalendarDays size={15} /> {project.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR') : 'Calendrier ouvert'}</span><span><MapPin size={15} /> {project.territory || project.province || 'RDC'}</span></div><div className="progress"><span><i style={{ width: `${progress}%` }} /></span></div></article>;
}
