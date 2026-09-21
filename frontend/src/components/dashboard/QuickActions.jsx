import { CalendarPlus, FileText, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuickActions({ onTask }) {
  return <section className="dashboard-panel card quick-actions-panel"><div className="panel-heading"><span><PlusCircle /></span><div><h2>Actions rapides</h2><p>Raccourcis opérationnels</p></div></div><div className="quick-actions"><button type="button" onClick={onTask}><PlusCircle /> Créer une tâche</button><Link to="/admin/calendrier"><CalendarPlus /> Planifier une réunion</Link><Link to="/admin/documents"><FileText /> Documents partagés</Link></div></section>;
}
