const entities = {
  projects: {
    table: 'projects', entityName: 'projet', referencePrefix: 'PRJ', actorField: 'created_by', softDelete: true,
    fields: ['reference', 'name', 'description', 'objectives', 'status', 'priority', 'start_date', 'end_date', 'budget', 'currency', 'country', 'province', 'territory', 'locality', 'progress_percent', 'manager_id'],
    required: ['name'], search: ['reference', 'name', 'description'], filters: ['status', 'priority', 'manager_id', 'province'],
    readPermission: 'projects.read', createPermission: 'projects.create', updatePermission: 'projects.update', deletePermission: 'projects.delete'
  },
  tasks: {
    table: 'tasks', entityName: 'tache', referencePrefix: 'TSK', actorField: 'created_by', softDelete: true,
    fields: ['reference', 'project_id', 'parent_task_id', 'title', 'description', 'status', 'priority', 'start_date', 'due_date', 'progress_percent', 'estimated_hours', 'actual_hours'],
    // A task is a personal or team to-do by default.  It may optionally be
    // linked to a project, but planning work must never require a project.
    required: ['title'], search: ['reference', 'title', 'description'], filters: ['project_id', 'parent_task_id', 'status', 'priority'],
    readPermission: 'tasks.read', createPermission: 'tasks.create', updatePermission: 'tasks.update', deletePermission: 'tasks.delete'
  },
  events: {
    table: 'events', entityName: 'evenement', actorField: 'organizer_id', softDelete: true,
    fields: ['project_id', 'title', 'description', 'event_type', 'status', 'starts_at', 'ends_at', 'reminder_minutes', 'location', 'meeting_url', 'is_public', 'organizer_id'],
    required: ['title', 'starts_at', 'ends_at'], search: ['title', 'description', 'location'], filters: ['project_id', 'event_type', 'status', 'is_public'],
    readPermission: 'projects.read', createPermission: 'events.manage', updatePermission: 'events.manage', deletePermission: 'events.manage'
  },
  partners: {
    table: 'partners', entityName: 'partenaire', softDelete: true,
    fields: ['name', 'partner_type', 'description', 'email', 'phone', 'website', 'address', 'contact_person', 'logo_url', 'status'],
    required: ['name'], search: ['name', 'description', 'contact_person', 'email'], filters: ['partner_type', 'status'],
    readPermission: 'projects.read', createPermission: 'partners.manage', updatePermission: 'partners.manage', deletePermission: 'partners.manage'
  },
  interventions: {
    table: 'interventions', entityName: 'intervention', referencePrefix: 'INT', actorField: 'created_by', softDelete: true,
    fields: ['reference', 'project_id', 'domain_id', 'title', 'description', 'intervention_date', 'province', 'territory', 'locality', 'beneficiaries_men', 'beneficiaries_women', 'beneficiaries_children', 'status'],
    required: ['domain_id', 'title', 'intervention_date'], search: ['reference', 'title', 'description', 'locality'], filters: ['project_id', 'domain_id', 'status', 'province'],
    readPermission: 'projects.read', createPermission: 'interventions.manage', updatePermission: 'interventions.manage', deletePermission: 'interventions.manage'
  },
  articles: {
    table: 'articles', entityName: 'article', referencePrefix: 'ART', actorField: 'author_id', softDelete: true,
    autoSlugField: 'slug', autoSlugSource: 'title',
    fields: ['reference', 'category_id', 'author_id', 'title', 'slug', 'excerpt', 'content', 'featured_image_url', 'status', 'is_featured', 'published_at'],
    required: ['title', 'content'], search: ['reference', 'title', 'excerpt', 'content'], filters: ['category_id', 'author_id', 'status', 'is_featured'],
    readPermission: 'projects.read', createPermission: 'articles.manage', updatePermission: 'articles.manage', deletePermission: 'articles.manage', publicRead: true, publicFilter: { status: 'published' }
  },
  media: {
    table: 'media', entityName: 'media', actorField: 'uploaded_by', softDelete: true,
    fields: ['article_id', 'uploaded_by', 'media_type', 'original_name', 'stored_name', 'file_path', 'public_url', 'mime_type', 'file_size', 'title', 'alt_text'],
    required: ['media_type', 'original_name', 'stored_name', 'file_path', 'mime_type'], search: ['original_name', 'title', 'alt_text'], filters: ['article_id', 'media_type', 'uploaded_by'],
    readPermission: 'projects.read', createPermission: 'media.manage', updatePermission: 'media.manage', deletePermission: 'media.manage'
  },
  newsletters: {
    table: 'newsletters', entityName: 'newsletter', actorField: 'created_by', softDelete: false,
    fields: ['subject', 'preview_text', 'content', 'status', 'scheduled_at', 'sent_at'],
    required: ['subject', 'content'], search: ['subject', 'preview_text', 'content'], filters: ['status', 'created_by'],
    readPermission: 'newsletter.manage', createPermission: 'newsletter.manage', updatePermission: 'newsletter.manage', deletePermission: 'newsletter.manage'
  },
  documents: {
    table: 'documents', entityName: 'document', actorField: 'uploaded_by', softDelete: true,
    fields: ['project_id', 'task_id', 'uploaded_by', 'title', 'description', 'document_type', 'original_name', 'stored_name', 'file_path', 'mime_type', 'file_size', 'version_number', 'is_public'],
    required: ['title', 'original_name', 'stored_name', 'file_path', 'mime_type'], search: ['title', 'description', 'original_name'], filters: ['project_id', 'task_id', 'document_type', 'is_public'],
    readPermission: 'documents.read', createPermission: 'documents.manage', updatePermission: 'documents.manage', deletePermission: 'documents.manage'
  },
  reports: {
    table: 'reports', entityName: 'rapport', referencePrefix: 'RPT', actorField: 'generated_by', softDelete: true,
    fields: ['reference', 'project_id', 'title', 'report_type', 'period_start', 'period_end', 'summary', 'content', 'status', 'approved_by', 'approved_at'],
    required: ['title', 'report_type'], search: ['reference', 'title', 'summary'], filters: ['project_id', 'report_type', 'status', 'generated_by'],
    readPermission: 'reports.read', createPermission: 'reports.manage', updatePermission: 'reports.manage', deletePermission: 'reports.manage'
  },
  contact: {
    table: 'contact_messages', entityName: 'message', softDelete: false,
    fields: ['name', 'email', 'phone', 'subject', 'message', 'status', 'assigned_to', 'replied_at'],
    required: ['name', 'email', 'subject', 'message'], search: ['name', 'email', 'subject', 'message'], filters: ['status', 'assigned_to'],
    readPermission: 'contact.manage', createPermission: null, updatePermission: 'contact.manage', deletePermission: 'contact.manage', publicCreate: true,
    publicCreateFields: ['name', 'email', 'phone', 'subject', 'message']
  },
  settings: {
    table: 'settings', entityName: 'parametre', actorField: 'updated_by', softDelete: false,
    fields: ['setting_key', 'setting_value', 'value_type', 'setting_group', 'description', 'is_public'],
    required: ['setting_key'], search: ['setting_key', 'setting_value', 'description'], filters: ['setting_group', 'value_type', 'is_public'],
    readPermission: 'settings.manage', createPermission: 'settings.manage', updatePermission: 'settings.manage', deletePermission: 'settings.manage'
  }
};

module.exports = entities;
