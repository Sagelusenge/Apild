import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Eye, FileClock, RefreshCw, Search } from 'lucide-react';
import { api, getApiMessage } from '../../api/axios';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import './AuditLogs.css';

const actionNames = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  login: 'Connexion',
  logout: 'Déconnexion',
  block: 'Blocage',
  unblock: 'Déblocage',
  unpublish: 'Retrait du site public',
  publish: 'Publication',
  read: 'Consultation',
  view: 'Consultation'
};

const entityNames = {
  article: 'Article',
  document: 'Document',
  event: 'Événement',
  media: 'Média',
  newsletter: 'Newsletter',
  project: 'Projet',
  report: 'Rapport',
  role: 'Rôle',
  subscriber: 'Abonné',
  task: 'Tâche',
  user: 'Utilisateur'
};

const fieldNames = {
  name: 'Nom', title: 'Titre', first_name: 'Prénom', last_name: 'Nom', email: 'Adresse e-mail',
  status: 'Statut', description: 'Description', content: 'Contenu', role_ids: 'Rôles',
  permissions: 'Autorisations', project_id: 'Projet', article_id: 'Article',
  starts_at: 'Début', ends_at: 'Fin', start_date: 'Date de début', end_date: 'Date de fin',
  published_at: 'Date de publication', updated_at: 'Dernière modification',
  job_title: 'Fonction', priority: 'Priorité', progress_percent: 'Temps écoulé (%)'
};
const hiddenField = (key) => /password|token|secret|authorization|credential|private_key/i.test(key);
const friendlyField = (key) => fieldNames[key] || formatName(key);
const friendlyValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Non renseigné';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.length ? value.map(friendlyValue).join(', ') : 'Aucun';
  if (typeof value === 'object') return 'Détails enregistrés';
  const statuses = { draft: 'Brouillon', published: 'Publié', active: 'Actif', completed: 'Terminé', suspended: 'Bloqué', cancelled: 'Annulé', scheduled: 'Planifié' };
  return statuses[value] || String(value);
};

const formatName = (value) => String(value || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const actionLabel = (action) => actionNames[action] || formatName(action);
const entityLabel = (entity) => entityNames[entity] || formatName(entity);

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, withTime = true) {
  const date = parseDate(value);
  if (!date) return 'Date indisponible';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {})
  }).format(date);
}

function formatActor(log) {
  const name = [log.first_name, log.last_name].filter(Boolean).join(' ').trim();
  return name || log.email || 'Système';
}

function parseValues(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function summary(log) {
  const before = parseValues(log.old_values);
  const after = parseValues(log.new_values);
  const fields = new Set([
    ...(before && typeof before === 'object' && !Array.isArray(before) ? Object.keys(before) : []),
    ...(after && typeof after === 'object' && !Array.isArray(after) ? Object.keys(after) : [])
  ]);
  const safeFields = [...fields].filter((key) => !hiddenField(key));
  if (!safeFields.length) return `${actionLabel(log.action)} · ${entityLabel(log.entity_type).toLowerCase()}`;
  return `${safeFields.slice(0, 3).map(friendlyField).join(', ')}${safeFields.length > 3 ? '…' : ''}`;
}

function changes(log) {
  const before = parseValues(log.old_values);
  const after = parseValues(log.new_values);
  if (!before && !after) return [];
  if (typeof before !== 'object' || typeof after !== 'object') return [];
  return [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])]
    .filter((key) => !hiddenField(key) && JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
    .map((key) => ({ key, before: friendlyValue(before?.[key]), after: friendlyValue(after?.[key]) }));
}

export default function AuditLogs() {
  const [state, setState] = useState({ rows: [], meta: {}, loading: true, error: '' });
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [grouping, setGrouping] = useState('day');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ actions: [], entities: [] });
  const [selectedLog, setSelectedLog] = useState(null);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const response = await api.get('/audit-logs', {
        params: {
          page,
          limit: 25,
          search: search.trim() || undefined,
          action: action || undefined,
          entity_type: entity || undefined
        }
      });
      setState({
        rows: Array.isArray(response.data?.data) ? response.data.data : [],
        meta: response.data?.meta || {},
        loading: false,
        error: ''
      });
    } catch (error) {
      setState({ rows: [], meta: {}, loading: false, error: getApiMessage(error, 'Chargement du journal impossible.') });
    }
  }, [action, entity, page, search]);

  useEffect(() => {
    const timer = window.setTimeout(load, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    const receiveContextualSearch = (event) => {
      setSearch(event.detail?.query || '');
      setPage(1);
    };
    window.addEventListener('apild:portal-search', receiveContextualSearch);
    return () => window.removeEventListener('apild:portal-search', receiveContextualSearch);
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/audit-logs/filters')
      .then((response) => {
        if (active) setFilters({
          actions: response.data?.data?.actions || [],
          entities: response.data?.data?.entities || []
        });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const actions = useMemo(() => [...new Set([...filters.actions, ...state.rows.map((row) => row.action)].filter(Boolean))], [filters.actions, state.rows]);
  const entities = useMemo(() => [...new Set([...filters.entities, ...state.rows.map((row) => row.entity_type)].filter(Boolean))], [filters.entities, state.rows]);
  const groups = useMemo(() => {
    if (grouping !== 'day') return [{ key: 'all', label: 'Toutes les opérations', rows: state.rows }];
    return state.rows.reduce((result, row) => {
      const date = parseDate(row.created_at);
      const key = date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : 'unknown';
      const existing = result.find((group) => group.key === key);
      if (existing) existing.rows.push(row);
      else result.push({ key, label: date ? formatDate(row.created_at, false) : 'Date indisponible', rows: [row] });
      return result;
    }, []);
  }, [grouping, state.rows]);

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return <section className="audit-page">
    <header className="audit-page__header">
      <div>
        <span className="eyebrow"><FileClock size={14} /> Traçabilité</span>
        <h1>Journal d’audit</h1>
        <p>Qui a fait quoi, et quand ? Consultez les changements importants de la plateforme.</p>
      </div>
      <button className="sync-button" type="button" onClick={load} disabled={state.loading}>
        <RefreshCw size={17} className={state.loading ? 'spinning' : undefined} /> Actualiser
      </button>
    </header>

    <section className="audit-filters card" aria-label="Filtres du journal d’audit">
      <label className="audit-search">
        <Search size={20} aria-hidden="true" />
        <input value={search} onChange={updateFilter(setSearch)} placeholder="Rechercher une action, une entité ou un utilisateur…" aria-label="Rechercher dans le journal" />
      </label>
      <label className="audit-select">
        <span className="sr-only">Action</span>
        <select value={action} onChange={updateFilter(setAction)}>
          <option value="">Toutes les actions</option>
          {actions.map((value) => <option key={value} value={value}>{actionLabel(value)}</option>)}
        </select>
        <ChevronDown size={17} aria-hidden="true" />
      </label>
      <label className="audit-select">
        <span className="sr-only">Entité</span>
        <select value={entity} onChange={updateFilter(setEntity)}>
          <option value="">Toutes les entités</option>
          {entities.map((value) => <option key={value} value={value}>{entityLabel(value)}</option>)}
        </select>
        <ChevronDown size={17} aria-hidden="true" />
      </label>
      <label className="audit-select">
        <span className="sr-only">Groupement</span>
        <select value={grouping} onChange={(event) => setGrouping(event.target.value)}>
          <option value="day">Grouper par jour</option>
          <option value="none">Ne pas grouper</option>
        </select>
        <ChevronDown size={17} aria-hidden="true" />
      </label>
    </section>

    <section className="audit-table card" aria-live="polite">
      {state.loading ? <Loader label="Chargement du journal…" /> : state.error ? <EmptyState title={state.error} text="Vérifiez la connexion à l’API, puis actualisez la liste." /> : state.rows.length ? <div className="table-wrap">
        <table>
          <thead><tr><th>Action</th><th>Entité</th><th>Utilisateur</th><th>Détails</th><th>Date</th></tr></thead>
          <tbody>{groups.map((group) => <Fragment key={group.key}>
            {grouping === 'day' && <tr className="audit-table__group" key={`group-${group.key}`}><th colSpan="5">{group.label}</th></tr>}
            {group.rows.map((log) => <tr key={log.id}>
              <td><strong>{actionLabel(log.action)}</strong></td>
              <td><span className="audit-entity">{entityLabel(log.entity_type)}</span></td>
              <td><strong>{formatActor(log)}</strong><small>{log.email || 'Action système'}</small></td>
              <td><button className="audit-detail-button" type="button" onClick={() => setSelectedLog(log)}><Eye size={15} /> Voir le détail</button><small>{summary(log)}</small></td>
              <td className="audit-date">{formatDate(log.created_at)}</td>
            </tr>)}
          </Fragment>)}</tbody>
        </table>
      </div> : <EmptyState title="Aucune opération trouvée" text="Modifiez ou réinitialisez les filtres pour consulter le journal." />}
      <Pagination page={page} pages={state.meta.totalPages || 1} onChange={setPage} />
    </section>

    <Modal open={Boolean(selectedLog)} title="Détail de l’opération" onClose={() => setSelectedLog(null)}>
      {selectedLog && <div className="audit-detail">
        <dl className="audit-detail__meta">
          <div><dt>Action</dt><dd>{actionLabel(selectedLog.action)}</dd></div>
          <div><dt>Élément concerné</dt><dd>{entityLabel(selectedLog.entity_type)}</dd></div>
          <div><dt>Utilisateur</dt><dd>{formatActor(selectedLog)}</dd></div>
          <div><dt>Date</dt><dd>{formatDate(selectedLog.created_at)}</dd></div>
          <div><dt>Adresse IP</dt><dd>{selectedLog.ip_address || 'Non enregistrée'}</dd></div>
        </dl>
        <div className="audit-detail__changes"><h3>Changements enregistrés</h3>{changes(selectedLog).length ? <table><thead><tr><th>Champ</th><th>Avant</th><th>Après</th></tr></thead><tbody>{changes(selectedLog).map((change) => <tr key={change.key}><th>{friendlyField(change.key)}</th><td>{change.before}</td><td>{change.after}</td></tr>)}</tbody></table> : <p>Aucun changement de champ affichable pour cette opération.</p>}</div>
      </div>}
    </Modal>
  </section>;
}
