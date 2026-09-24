import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, EyeOff, FileDown, ImagePlus, Pencil, Plus, Printer, RotateCcw, Search, Trash2, Unlock } from 'lucide-react';
import { api, getApiMessage, unwrap } from '../../api/axios';
import { articlesApi } from '../../api/articles.api';
import { resourceApi } from '../../api/resource.api';
import { getResourceForm } from '../../config/resourceForms';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import useNotifications from '../../hooks/useNotifications';
import useAuth from '../../hooks/useAuth';
import './ResourcePage.css';

const preferred = ['reference', 'name', 'title', 'subject', 'email', 'role_name', 'status', 'priority', 'created_at', 'updated_at'];
const labels = { reference: 'Référence', name: 'Nom', title: 'Intitulé', subject: 'Objet', email: 'E-mail', role_name: 'Rôle', user_name: 'Acteur', department: 'Service', position_title: 'Fonction', contract_end_date: 'Fin du contrat', contract_type: 'Type de contrat', starts_on: 'Début', ends_on: 'Fin prévue', report_type: 'Type', period_start: 'Du', period_end: 'Au', leave_type: 'Type de congé', start_date: 'Début', end_date: 'Fin', status: 'Statut', priority: 'Priorité', created_at: 'Création', updated_at: 'Modification' };
const columnsByResource = {
  'hr/employees': ['reference', 'user_name', 'department', 'position_title', 'contract_end_date'],
  'hr/leaves': ['reference', 'user_name', 'leave_type', 'start_date', 'end_date', 'status'],
  'hr/contracts': ['reference', 'user_name', 'position_title', 'starts_on', 'ends_on', 'status'],
  reports: ['reference', 'title', 'report_type', 'period_start', 'period_end', 'status']
};
const actionPermissions = {
  users: { create: 'users.create', update: 'users.update', delete: 'users.delete' },
  roles: { create: 'roles.manage', update: 'roles.manage', delete: 'roles.manage' },
  projects: { create: 'projects.create', update: 'projects.update', delete: 'projects.delete' },
  interventions: { create: 'interventions.create', update: 'interventions.update', delete: 'interventions.manage' },
  'hr/employees': { create: 'hr.manage', update: 'hr.manage', delete: 'hr.manage' },
  'hr/leaves': { create: 'hr.manage', update: 'hr.manage', delete: 'hr.manage' },
  'hr/contracts': { create: 'hr.manage', update: 'hr.manage', delete: 'hr.manage' },
  tasks: { create: 'tasks.create', update: 'tasks.update', delete: 'tasks.delete' },
  events: { create: 'events.manage', update: 'events.manage', delete: 'events.manage' },
  reports: { create: 'reports.manage', update: 'reports.manage', delete: 'reports.manage' },
  articles: { create: 'articles.manage', update: 'articles.manage', delete: 'articles.manage' },
  newsletter: { create: 'newsletter.manage', update: 'newsletter.manage', delete: 'newsletter.manage' },
  'newsletter/subscribers': { create: 'newsletter.manage', update: 'newsletter.manage', delete: 'newsletter.manage' },
  media: { create: 'media.manage', update: 'media.manage', delete: 'media.manage' },
  documents: { create: 'documents.manage', update: 'documents.manage', delete: 'documents.manage' }
};

const display = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).length > 70 ? `${String(value).slice(0, 70)}…` : String(value);
};

const optionLabel = (option, type) => {
  if (type === 'role') return option.name || option.code;
  if (type === 'permission') return `${option.code}${option.description ? ` — ${option.description}` : ''}`;
  if (type === 'project') return `${option.reference ? `${option.reference} · ` : ''}${option.name}`;
  if (type === 'task') return `${option.reference ? `${option.reference} · ` : ''}${option.title}`;
  if (type === 'article') return option.title;
  if (type === 'category') return option.name;
  if (type === 'user') return `${option.first_name || ''} ${option.last_name || ''}`.trim() || option.email;
  return option.name || option.title || option.label || String(option.id);
};

const getSources = (form) => [...new Set((form?.fields || []).map((field) => field.optionSource).filter(Boolean))];

async function loadLookup(source) {
  if (source === 'permissions') return unwrap(api.get('/roles/permissions'));
  if (source === 'articleCategories') return unwrap(api.get('/articles/categories', { params: { limit: 100 } }));
  if (source === 'interventionDomains') {
    const result = await resourceApi.list('interventions/domains', { page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
    return Array.isArray(result.data) ? result.data.filter((domain) => Boolean(Number(domain.is_active))) : [];
  }
  if (source === 'hrUsers') return unwrap(api.get('/hr/users'));

  const resources = { roles: 'roles', users: 'users', projects: 'projects', tasks: 'tasks', articles: 'articles' };
  const resource = resources[source];
  if (!resource) return [];
  const response = await resourceApi.list(resource, { page: 1, limit: 100, sortBy: 'created_at', sortOrder: 'desc' });
  return Array.isArray(response.data) ? response.data : [];
}

function valueForInput(field, value) {
  if (field.type === 'checkbox') return Boolean(Number(value)) || value === true;
  if (field.type === 'multi-select' || field.type === 'checkbox-grid' || field.type === 'role-select') {
    if (value === null || value === undefined) return undefined;
    if (Array.isArray(value)) return value.map((item) => Number(item?.id ?? item));
    return [];
  }
  if (value === null || value === undefined) return field.defaultValue ?? '';
  if (field.type === 'date') return String(value).slice(0, 10);
  if (field.type === 'datetime-local') return String(value).replace(' ', 'T').slice(0, 16);
  return value;
}

function initialValues(form, record) {
  return Object.fromEntries(form.fields.map((field) => {
    const relatedValues = field.name === 'role_ids' ? record?.roles : field.name === 'permission_ids' ? record?.permissions : undefined;
    return [field.name, valueForInput(field, relatedValues ?? record?.[field.name])];
  }));
}

function validateValues(form, values, mode) {
  const errors = {};
  for (const field of form.fields) {
    if (field.special || field.autoCalculated || field.autoGenerated) continue;
    const value = values[field.name];
    const required = field.required || (mode === 'create' && field.requiredOnCreate);
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
    if (required && empty) errors[field.name] = 'Ce champ est obligatoire.';
    if (value && field.type === 'email' && !/^\S+@\S+\.\S+$/.test(String(value))) errors[field.name] = 'Adresse e-mail invalide.';
    if (value && field.pattern && !(new RegExp(field.pattern)).test(String(value))) errors[field.name] = 'Le format saisi est invalide.';
    if (value && field.passwordPolicy && !/^(?=.{12,72}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])(?!.*\s).*$/.test(String(value))) errors[field.name] = 'Le mot de passe doit contenir 12 caractères minimum, une majuscule, une minuscule, un chiffre, un caractère spécial et aucun espace.';
  }
  return errors;
}

function buildPayload(form, values) {
  const payload = {};
  for (const field of form.fields) {
    if (field.special || field.autoCalculated || field.autoGenerated || field.type === 'file') continue;
    const raw = values[field.name];
    if (field.type === 'checkbox') {
      payload[field.name] = Boolean(raw);
      continue;
    }
    if (field.type === 'multi-select' || field.type === 'checkbox-grid' || field.type === 'role-select') {
      if (Array.isArray(raw)) payload[field.name] = raw.map(Number);
      continue;
    }
    if (raw === undefined || raw === null || raw === '') continue;
    if (field.type === 'number') {
      payload[field.name] = Number(raw);
      continue;
    }
    if (field.type === 'datetime-local') {
      payload[field.name] = `${String(raw).replace('T', ' ')}:00`;
      continue;
    }
    payload[field.name] = typeof raw === 'string' ? raw.trim() : raw;
  }
  return payload;
}

async function uploadArticleImage(article, file) {
  if (!file || !article?.id) return article;
  const data = new FormData();
  data.append('file', file);
  data.append('article_id', String(article.id));
  data.append('title', article.title || file.name);
  data.append('alt_text', article.title || 'Image de publication APILD');
  const media = await unwrap(api.post('/media/upload', data));
  if (!media?.public_url) throw new Error('La photo a été téléversée, mais son adresse est indisponible.');
  return resourceApi.update('articles', article.id, { featured_image_url: media.public_url });
}

async function uploadInterventionImage(intervention, file) {
  if (!file || !intervention?.id) return intervention;
  const data = new FormData();
  data.append('file', file);
  data.append('title', intervention.title || file.name);
  data.append('alt_text', intervention.title || 'Intervention APILD');
  const media = await unwrap(api.post('/media/upload', data));
  if (!media?.public_url || !String(media.mime_type || '').startsWith('image/')) throw new Error('La photo téléversée est indisponible ou invalide.');
  return resourceApi.update('interventions', intervention.id, { image_url: media.public_url });
}

async function uploadArticleAttachments(article, files) {
  if (!article?.id || !files?.length) return;
  for (const file of files) {
    const data = new FormData();
    data.append('file', file);
    data.append('article_id', String(article.id));
    data.append('title', file.name);
    await unwrap(api.post('/media/upload', data));
  }
}

function ResourceForm({ form, mode, record, lookups, lookupsError, onCancel, onSave, canManageUserAccounts = false }) {
  const [values, setValues] = useState(() => initialValues(form, record));
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [saving, setSaving] = useState(false);
  const initial = useMemo(() => initialValues(form, record), [form, record]);

  useEffect(() => {
    setValues(initial);
    setErrors({});
    setRequestError('');
  }, [initial]);

  const setValue = (field, value) => {
    setValues((current) => {
      const next = { ...current, [field.name]: value };
      return next;
    });
    setErrors((current) => ({ ...current, [field.name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validateValues(form, values, mode);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    setRequestError('');
    try {
      await onSave(values);
    } catch (error) {
      setRequestError(getApiMessage(error, 'Enregistrement impossible.'));
      setSaving(false);
    }
  };

  return <form className={`form-grid${form.layout ? ` resource-form--${form.layout}` : ''}`} noValidate onSubmit={submit}>
    {requestError && <div className="form-error" role="alert">{requestError}</div>}
    {lookupsError && <div className="form-error" role="alert">{lookupsError}</div>}
    {form.fields.filter((field) => {
      const isUserAdministrationField = form === getResourceForm('users') && ['role_ids', 'status'].includes(field.name);
      return !isUserAdministrationField || canManageUserAccounts;
    }).map((field) => {
      if (field.autoGenerated || field.autoCalculated) return null;
      const id = `resource-${field.name}`;
      const fieldError = errors[field.name];
      const fieldOptions = field.options || lookups[field.optionSource] || [];
      const isFile = field.type === 'file';
      const isCheckbox = field.type === 'checkbox';
      const isMulti = field.type === 'multi-select';
      const isGrid = field.type === 'checkbox-grid';
      const isRoleSelect = field.type === 'role-select';
      const fieldClassName = `field${field.layout ? ` field--${field.layout}` : ''}`;

      if (isFile && mode === 'edit' && !field.allowOnEdit) return null;
      if (isCheckbox) return <div className={fieldClassName} key={field.name}>
        <label htmlFor={id}><input id={id} type="checkbox" checked={Boolean(values[field.name])} onChange={(event) => setValue(field, event.target.checked)} /> {field.label}</label>
        {field.help && <small>{field.help}</small>}
      </div>;
      if (isGrid) return <fieldset className={fieldClassName} key={field.name}>
        <legend>{field.label}</legend>
        <div className="permission-grid">
          {fieldOptions.map((option) => <label key={option.id} className="permission-choice">
            <input type="checkbox" checked={(values[field.name] || []).includes(Number(option.id))} onChange={(event) => {
              const selected = new Set(values[field.name] || []);
              if (event.target.checked) selected.add(Number(option.id)); else selected.delete(Number(option.id));
              setValue(field, [...selected]);
            }} />
            <span>{optionLabel(option, field.optionLabel)}</span>
          </label>)}
        </div>
        {fieldError && <small className="field-error">{fieldError}</small>}
      </fieldset>;
      if (isMulti) return <div className={fieldClassName} key={field.name}>
        <label htmlFor={id}>{field.label}</label>
        <select id={id} multiple value={values[field.name] || []} onChange={(event) => setValue(field, [...event.target.selectedOptions].map((option) => Number(option.value)))}>
          {fieldOptions.map((option) => <option key={option.id} value={option.id}>{optionLabel(option, field.optionLabel)}</option>)}
        </select>
        {field.help && <small>{field.help}</small>}
        {fieldError && <small className="field-error">{fieldError}</small>}
      </div>;
      if (isRoleSelect) return <div className={fieldClassName} key={field.name}>
        <label htmlFor={id}>{field.label}{field.required && ' *'}</label>
        <select id={id} value={(values[field.name] || [])[0] ?? ''} onChange={(event) => setValue(field, event.target.value ? [Number(event.target.value)] : [])}>
          <option value="">— Choisir un rôle —</option>
          {fieldOptions.map((option) => <option key={option.id} value={option.id}>{optionLabel(option, field.optionLabel)}</option>)}
        </select>
        {field.help && <small>{field.help}</small>}
        {fieldError && <small className="field-error">{fieldError}</small>}
      </div>;
      if (field.type === 'select') return <div className={fieldClassName} key={field.name}>
        <label htmlFor={id}>{field.label}{field.required && ' *'}</label>
        <select id={id} value={values[field.name] ?? ''} onChange={(event) => setValue(field, event.target.value)}>
          <option value="">— Aucun —</option>
          {fieldOptions.map((option) => <option key={option.value ?? option.id} value={option.value ?? option.id}>{option.label ?? optionLabel(option, field.optionLabel)}</option>)}
        </select>
        {field.help && <small>{field.help}</small>}
        {fieldError && <small className="field-error">{fieldError}</small>}
      </div>;
      if (isFile) return <div className={fieldClassName} key={field.name}>
        <span className="field-label">{field.label}{field.required && ' *'}</span>
        <input id={id} className="file-picker-input" type="file" multiple={Boolean(field.multiple)} onChange={(event) => setValue(field, field.multiple ? Array.from(event.target.files || []) : event.target.files?.[0] || null)} required={field.required || (mode === 'create' && field.requiredOnCreate)} accept={field.accept} />
        <label className="file-picker" htmlFor={id}>
          <ImagePlus size={20} aria-hidden="true" />
          <span><strong>{Array.isArray(values[field.name]) ? values[field.name].length ? `${values[field.name].length} fichier(s) sélectionné(s)` : 'Choisir des fichiers depuis cet appareil' : values[field.name]?.name || `Choisir ${field.accept?.startsWith('image/') ? 'une image' : 'un fichier'} depuis cet appareil`}</strong><small>{values[field.name]?.name || values[field.name]?.length ? 'Fichier(s) prêt(s) à être téléversé(s).' : field.accept?.startsWith('image/') ? 'PNG, JPEG, WebP ou GIF' : 'Choisissez un fichier compatible.'}</small></span>
        </label>
        {field.help && <small>{field.help}</small>}
        {fieldError && <small className="field-error">{fieldError}</small>}
      </div>;
      if (field.type === 'textarea') return <div className={fieldClassName} key={field.name}>
        <label htmlFor={id}>{field.label}{field.required && ' *'}</label>
        <textarea id={id} value={values[field.name] ?? ''} onChange={(event) => setValue(field, event.target.value)} />
        {field.help && <small>{field.help}</small>}
        {fieldError && <small className="field-error">{fieldError}</small>}
      </div>;
      return <div className={fieldClassName} key={field.name}>
        <label htmlFor={id}>{field.label}{field.required && ' *'}</label>
        <input id={id} type={field.type || 'text'} value={isFile ? undefined : values[field.name] ?? ''} onChange={(event) => setValue(field, isFile ? event.target.files?.[0] || null : event.target.value)} required={field.required || (mode === 'create' && field.requiredOnCreate)} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength} pattern={field.pattern} accept={field.accept} autoComplete={field.autoComplete} />
        {field.help && <small>{field.help}</small>}
        {fieldError && <small className="field-error">{fieldError}</small>}
      </div>;
    })}
    <div className="form-actions">
      <button className="button button--ghost" type="button" disabled={saving} onClick={onCancel}>Annuler</button>
      <button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
    </div>
  </form>;
}

export default function ResourcePage({ title, description, resource, canCreate = true, canEdit = true, canDelete = false, canManageAccountStatus = false, printable = false, secondaryAction = null }) {
  const { notify } = useNotifications();
  const { user } = useAuth();
  const form = getResourceForm(resource);
  const [state, setState] = useState({ rows: [], meta: {}, loading: true, error: '' });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(() => Object.fromEntries((form?.filters || []).map((filter) => [filter.name, filter.defaultValue ?? ''])));
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [lookups, setLookups] = useState({ loading: false, values: {}, error: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [accountActionTarget, setAccountActionTarget] = useState(null);
  const [changingAccountStatus, setChangingAccountStatus] = useState(false);
  const [unpublishTarget, setUnpublishTarget] = useState(null);
  const [unpublishing, setUnpublishing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const sources = useMemo(() => getSources(form), [form]);
  const actionsEnabled = Boolean(form);
  const hasOperationPermission = (operation) => {
    const permission = actionPermissions[resource]?.[operation];
    return !permission || user?.roles?.includes('admin') || user?.permissions?.includes(permission);
  };
  const allowCreate = canCreate && actionsEnabled && hasOperationPermission('create');
  const allowEdit = canEdit && actionsEnabled && hasOperationPermission('update');
  const allowDelete = canDelete && actionsEnabled && hasOperationPermission('delete');
  const isActualAdmin = user?.roles?.includes('admin');
  const allowAccountStatusAction = resource === 'users' && canManageAccountStatus && isActualAdmin;
  const filterDefinitions = form?.filters || [];
  const hasActiveFilters = Object.values(filters).some((value) => value !== '' && value !== undefined && value !== null);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined && value !== null));
      const result = await resourceApi.list(resource, { page, limit: 15, search: search || undefined, ...activeFilters });
      setState({ rows: Array.isArray(result.data) ? result.data : [], meta: result.meta || {}, loading: false, error: '' });
    } catch (error) {
      setState({ rows: [], meta: {}, loading: false, error: getApiMessage(error, 'Chargement impossible.') });
    }
  }, [filters, page, search, resource]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const receiveContextualSearch = (event) => {
      setSearch(event.detail?.query || '');
      setPage(1);
    };
    window.addEventListener('apild:portal-search', receiveContextualSearch);
    return () => window.removeEventListener('apild:portal-search', receiveContextualSearch);
  }, []);

  useEffect(() => {
    if (!editor || !sources.length) {
      setLookups({ loading: false, values: {}, error: '' });
      return undefined;
    }
    let active = true;
    setLookups({ loading: true, values: {}, error: '' });
    Promise.all(sources.map(async (source) => [source, await loadLookup(source)]))
      .then((items) => {
        if (active) setLookups({ loading: false, values: Object.fromEntries(items), error: '' });
      })
      .catch((error) => {
        if (active) setLookups({ loading: false, values: {}, error: getApiMessage(error, 'Certaines options du formulaire sont indisponibles.') });
      });
    return () => { active = false; };
  }, [editor, sources]);

  const columns = useMemo(() => {
    const row = state.rows[0] || {};
    const selected = (columnsByResource[resource] || preferred).filter((key) => key in row).slice(0, 6);
    if (!selected.length) selected.push(...Object.keys(row).filter((key) => !key.endsWith('_id') && key !== 'id').slice(0, 5));
    return selected;
  }, [resource, state.rows]);

  const openCreate = () => setEditor({ mode: 'create', record: null, loading: false });
  const openEdit = async (row) => {
    setEditor({ mode: 'edit', record: row, loading: true });
    try {
      const record = await resourceApi.one(resource, row.id);
      setEditor({ mode: 'edit', record, loading: false });
    } catch (error) {
      setEditor(null);
      notify(getApiMessage(error, 'Impossible de charger cet élément.'), 'error');
    }
  };

  const save = async (values) => {
    const payload = buildPayload(form, values);
    let saved;
    if (editor.mode === 'create' && form.uploadEndpoint) {
      const file = values.file;
      if (!file) throw new Error('Fichier requis.');
      const data = new FormData();
      Object.entries(payload).forEach(([key, value]) => data.append(key, String(value)));
      data.append('file', file);
      saved = await unwrap(api.post(`/${form.uploadEndpoint}`, data));
    } else if (editor.mode === 'create') {
      saved = await resourceApi.create(resource, payload);
    } else {
      saved = await resourceApi.update(resource, editor.record.id, payload);
    }

    if (editor.mode === 'create' && ['articles', 'interventions'].includes(resource)) setEditor({ mode: 'edit', record: saved, loading: false });

    if (resource === 'articles' && values.featured_image_file) {
      saved = await uploadArticleImage(saved, values.featured_image_file);
    }
    if (resource === 'articles' && values.attachment_files?.length) await uploadArticleAttachments(saved, values.attachment_files);
    if (resource === 'interventions' && values.intervention_image_file) saved = await uploadInterventionImage(saved, values.intervention_image_file);

    if (resource === 'roles' && Array.isArray(values.permission_ids)) {
      const roleId = saved?.id || editor.record?.id;
      await unwrap(api.put(`/roles/${roleId}/permissions`, { permission_ids: values.permission_ids.map(Number) }));
    }

    setEditor(null);
    notify(editor.mode === 'create' ? 'Élément ajouté.' : 'Modifications enregistrées.', 'success');
    if (editor.mode === 'create' && page !== 1) setPage(1); else load();
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await resourceApi.remove(resource, deleteTarget.id);
      setDeleteTarget(null);
      notify('Élément supprimé.', 'success');
      if (state.rows.length === 1 && page > 1) setPage((current) => current - 1); else load();
    } catch (error) {
      notify(getApiMessage(error, 'Suppression impossible.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const changeAccountStatus = async () => {
    if (!accountActionTarget) return;
    setChangingAccountStatus(true);
    try {
      if (accountActionTarget.action === 'block') await resourceApi.blockUser(accountActionTarget.user.id);
      else await resourceApi.unblockUser(accountActionTarget.user.id);
      setAccountActionTarget(null);
      notify(accountActionTarget.action === 'block' ? 'Utilisateur bloqué.' : 'Utilisateur débloqué.', 'success');
      load();
    } catch (error) {
      notify(getApiMessage(error, 'Modification du statut impossible.'), 'error');
    } finally {
      setChangingAccountStatus(false);
    }
  };

  const unpublish = async () => {
    if (!unpublishTarget) return;
    setUnpublishing(true);
    try {
      await articlesApi.unpublish(unpublishTarget.id);
      setUnpublishTarget(null);
      notify('Publication retirée du site public. L’article reste disponible dans l’espace éditorial.', 'success');
      load();
    } catch (error) {
      notify(getApiMessage(error, 'Impossible de retirer cette publication.'), 'error');
    } finally {
      setUnpublishing(false);
    }
  };

  const downloadPdf = async (row) => {
    setDownloadingPdf(row.id);
    try {
      const response = await api.get(`/${resource}/${row.id}/pdf`, { responseType: 'blob' });
      const objectUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${String(row.reference || 'apild').replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      notify(getApiMessage(error, 'Téléchargement du PDF impossible.'), 'error');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const accountAction = accountActionTarget?.action;
  const accountActionLabel = accountAction === 'block' ? 'Bloquer' : 'Débloquer';
  const canDownloadPdf = resource === 'reports' || resource === 'hr/contracts';
  const showActions = allowEdit || allowDelete || allowAccountStatusAction || canDownloadPdf;

  return <div className={`resource-page${printable ? ' report-print-area' : ''}`}>
    <div className="resource-title"><div><span className="eyebrow">Gestion APILD</span><h1>{title}</h1><p>{description}</p></div><div className="resource-title-actions">{secondaryAction && <Link className="button button--ghost" to={secondaryAction.to}><Plus size={17} /> {secondaryAction.label}</Link>}{printable && <button className="button button--ghost print-report-button" type="button" onClick={() => window.print()}><Printer size={17} /> Imprimer</button>}{allowCreate && <button className="button button--primary" type="button" onClick={openCreate}><Plus /> {form?.createLabel || 'Ajouter'}</button>}</div></div>
    <div className="resource-toolbar card"><div className="resource-toolbar__controls"><div className="resource-toolbar__search"><Search /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={`Rechercher dans ${title.toLowerCase()}…`} /></div>{filterDefinitions.length > 0 && <div className="resource-toolbar__filters">{filterDefinitions.map((filter) => <label key={filter.name} className="resource-filter"><span>{filter.label}</span><select value={filters[filter.name] ?? ''} onChange={(event) => { setFilters((current) => ({ ...current, [filter.name]: event.target.value })); setPage(1); }}><option value="">Tous les statuts</option>{(filter.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}{hasActiveFilters && <button className="button button--ghost resource-filter-reset" type="button" onClick={() => { setFilters(Object.fromEntries(filterDefinitions.map((filter) => [filter.name, filter.defaultValue ?? '']))); setPage(1); }}><RotateCcw size={15} /> Réinitialiser</button>}</div>}</div></div>
    <section className="resource-table card">
      {state.loading ? <Loader /> : state.error ? <EmptyState title={state.error} text="Vérifiez que l’API et la base de données sont démarrées." /> : state.rows.length ? <>
        <div className="table-wrap"><table><thead><tr>{columns.map((key) => <th key={key}>{labels[key] || key}</th>)}{showActions && <th>Actions</th>}</tr></thead><tbody>{state.rows.map((row) => {
          const canDeleteRow = allowDelete && !(resource === 'roles' && Boolean(Number(row.is_system)));
          const isCurrentUser = String(row.id) === String(user?.id);
          const canBlockRow = allowAccountStatusAction && !isCurrentUser && row.status !== 'suspended';
          const canUnblockRow = allowAccountStatusAction && !isCurrentUser && row.status === 'suspended';
          const canUnpublishRow = resource === 'articles' && allowEdit && row.status === 'published';
          return <tr key={row.id}>{columns.map((key) => <td key={key}>{display(row[key])}</td>)}{showActions && <td><div className="table-actions">
            {allowEdit && <button className="icon-button resource-table-action resource-table-action--edit" type="button" onClick={() => openEdit(row)} aria-label="Modifier" title="Modifier"><Pencil size={17} /></button>}
            {canDownloadPdf && <button className="icon-button resource-table-action" type="button" onClick={() => downloadPdf(row)} disabled={downloadingPdf === row.id} aria-label="Télécharger le PDF" title="Télécharger le PDF"><FileDown size={17} /></button>}
            {canUnpublishRow && <button className="icon-button resource-table-action resource-table-action--unpublish" type="button" onClick={() => setUnpublishTarget(row)} aria-label="Retirer du site public" title="Retirer du site public"><EyeOff size={17} /></button>}
            {canBlockRow && <button className="icon-button resource-table-action resource-status-action resource-status-action--block" type="button" onClick={() => setAccountActionTarget({ action: 'block', user: row })} aria-label="Bloquer l’utilisateur" title="Bloquer"><Ban size={17} /></button>}
            {canUnblockRow && <button className="icon-button resource-table-action resource-status-action resource-status-action--unblock" type="button" onClick={() => setAccountActionTarget({ action: 'unblock', user: row })} aria-label="Débloquer l’utilisateur" title="Débloquer"><Unlock size={17} /></button>}
            {canDeleteRow && <button className="icon-button resource-table-action resource-table-action--delete danger-icon" type="button" onClick={() => setDeleteTarget(row)} aria-label="Supprimer" title="Supprimer"><Trash2 size={17} /></button>}
          </div></td>}</tr>;
        })}</tbody></table></div>
        <Pagination page={page} pages={state.meta.totalPages || 1} onChange={setPage} />
      </> : <EmptyState />}
    </section>
    <Modal open={Boolean(editor)} title={editor?.mode === 'create' ? form?.createLabel || 'Ajouter' : form?.editLabel || 'Modifier'} onClose={() => setEditor(null)}>
      {editor?.loading || lookups.loading ? <Loader /> : editor && <ResourceForm form={form} mode={editor.mode} record={editor.record} lookups={lookups.values} lookupsError={lookups.error} onCancel={() => setEditor(null)} onSave={save} canManageUserAccounts={isActualAdmin} />}
    </Modal>
    <Modal open={Boolean(deleteTarget)} title="Confirmer la suppression" onClose={() => !deleting && setDeleteTarget(null)}>
      <div className="form-grid"><p>Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.</p><div className="form-actions"><button className="button button--ghost" type="button" disabled={deleting} onClick={() => setDeleteTarget(null)}>Annuler</button><button className="button button--danger" type="button" disabled={deleting} onClick={remove}>{deleting ? 'Suppression…' : 'Supprimer'}</button></div></div>
    </Modal>
    <Modal open={Boolean(accountActionTarget)} title={`${accountActionLabel} un utilisateur`} onClose={() => !changingAccountStatus && setAccountActionTarget(null)}>
      <div className="form-grid"><p>{accountAction === 'block' ? `Bloquer ${accountActionTarget?.user?.first_name || ''} ${accountActionTarget?.user?.last_name || ''} ? Cette personne ne pourra plus se connecter.` : `Débloquer ${accountActionTarget?.user?.first_name || ''} ${accountActionTarget?.user?.last_name || ''} ? Cette personne pourra de nouveau se connecter.`}</p><div className="form-actions"><button className="button button--ghost" type="button" disabled={changingAccountStatus} onClick={() => setAccountActionTarget(null)}>Annuler</button><button className={`button ${accountAction === 'block' ? 'button--danger' : 'button--primary'}`} type="button" disabled={changingAccountStatus} onClick={changeAccountStatus}>{changingAccountStatus ? 'Mise à jour…' : accountActionLabel}</button></div></div>
    </Modal>
    <Modal open={Boolean(unpublishTarget)} title="Retirer une publication" onClose={() => !unpublishing && setUnpublishTarget(null)}>
      <div className="form-grid"><p>Retirer « {unpublishTarget?.title} » du site public ? L’article sera conservé dans l’espace éditorial et pourra être modifié ou publié de nouveau.</p><div className="form-actions"><button className="button button--ghost" type="button" disabled={unpublishing} onClick={() => setUnpublishTarget(null)}>Annuler</button><button className="button button--primary" type="button" disabled={unpublishing} onClick={unpublish}>{unpublishing ? 'Retrait…' : 'Retirer du site public'}</button></div></div>
    </Modal>
  </div>;
}
