-- ============================================================================
-- APILD Platform - Base de donnees principale
-- Compatible MySQL 8+ et MariaDB 10.6+
-- Ce script est idempotent et ne supprime aucune base ni aucune table.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS apild_platform
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE apild_platform;

SET NAMES utf8mb4;
SET time_zone = '+02:00';

-- ============================================================================
-- 1. SECURITE, UTILISATEURS ET CONTROLE D'ACCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_roles_code UNIQUE (code),
    CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_permissions_code UNIQUE (code),
    INDEX idx_permissions_module (module)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(30) NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    job_title VARCHAR(150) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    email_verified_at DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_status CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
    INDEX idx_users_name (last_name, first_name),
    INDEX idx_users_status (status),
    INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_password_reset_token UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_password_reset_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user_expiry (user_id, expires_at)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. PROJETS, TACHES, EVENEMENTS ET INTERVENTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS intervention_domains (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    color VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_intervention_domains_code UNIQUE (code),
    CONSTRAINT uq_intervention_domains_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(40) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    objectives TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    start_date DATE NULL,
    end_date DATE NULL,
    budget DECIMAL(18,2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    country VARCHAR(100) NOT NULL DEFAULT 'Republique democratique du Congo',
    province VARCHAR(100) NULL,
    territory VARCHAR(100) NULL,
    locality VARCHAR(150) NULL,
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    manager_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_projects_reference UNIQUE (reference),
    CONSTRAINT chk_projects_status CHECK (status IN ('draft', 'planned', 'active', 'on_hold', 'completed', 'cancelled')),
    CONSTRAINT chk_projects_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT chk_projects_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_projects_progress CHECK (progress_percent BETWEEN 0 AND 100),
    CONSTRAINT chk_projects_budget CHECK (budget >= 0),
    CONSTRAINT fk_projects_manager
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_projects_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_projects_status (status),
    INDEX idx_projects_manager (manager_id),
    INDEX idx_projects_dates (start_date, end_date),
    INDEX idx_projects_location (province, territory),
    INDEX idx_projects_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_domains (
    project_id BIGINT UNSIGNED NOT NULL,
    domain_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (project_id, domain_id),
    CONSTRAINT fk_project_domains_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_domains_domain
        FOREIGN KEY (domain_id) REFERENCES intervention_domains(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_members (
    project_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    project_role VARCHAR(100) NULL,
    joined_at DATE NOT NULL,
    left_at DATE NULL,
    allocation_percent DECIMAL(5,2) NOT NULL DEFAULT 100,
    PRIMARY KEY (project_id, user_id),
    CONSTRAINT chk_project_members_dates CHECK (left_at IS NULL OR left_at >= joined_at),
    CONSTRAINT chk_project_members_allocation CHECK (allocation_percent BETWEEN 0 AND 100),
    CONSTRAINT fk_project_members_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_members_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_members_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(40) NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    parent_task_id BIGINT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    start_date DATE NULL,
    due_date DATE NULL,
    completed_at DATETIME NULL,
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    estimated_hours DECIMAL(8,2) NULL,
    actual_hours DECIMAL(8,2) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_tasks_reference UNIQUE (reference),
    CONSTRAINT chk_tasks_status CHECK (status IN ('todo', 'in_progress', 'blocked', 'review', 'completed', 'cancelled')),
    CONSTRAINT chk_tasks_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT chk_tasks_dates CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date),
    CONSTRAINT chk_tasks_progress CHECK (progress_percent BETWEEN 0 AND 100),
    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_parent
        FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tasks_project_status (project_id, status),
    INDEX idx_tasks_due_date (due_date),
    INDEX idx_tasks_deleted_at (deleted_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS task_assignees (
    task_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    assigned_by BIGINT UNSIGNED NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id),
    CONSTRAINT fk_task_assignees_task
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assignees_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assignees_assigner
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_task_assignees_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS task_comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT fk_task_comments_task
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_comments_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_task_comments_task_created (task_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    event_type VARCHAR(50) NOT NULL DEFAULT 'meeting',
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    location VARCHAR(255) NULL,
    meeting_url VARCHAR(500) NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    organizer_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT chk_events_status CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    CONSTRAINT chk_events_dates CHECK (ends_at >= starts_at),
    CONSTRAINT fk_events_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_organizer
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_events_dates (starts_at, ends_at),
    INDEX idx_events_project (project_id),
    INDEX idx_events_public (is_public, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_participants (
    event_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    response_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    responded_at DATETIME NULL,
    PRIMARY KEY (event_id, user_id),
    CONSTRAINT chk_event_participants_status CHECK (response_status IN ('pending', 'accepted', 'declined', 'tentative')),
    CONSTRAINT fk_event_participants_event
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_participants_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_event_participants_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS partners (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    partner_type VARCHAR(50) NOT NULL DEFAULT 'organization',
    description TEXT NULL,
    email VARCHAR(190) NULL,
    phone VARCHAR(30) NULL,
    website VARCHAR(500) NULL,
    address VARCHAR(255) NULL,
    contact_person VARCHAR(150) NULL,
    logo_url VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_partners_name UNIQUE (name),
    CONSTRAINT chk_partners_status CHECK (status IN ('prospect', 'active', 'inactive')),
    INDEX idx_partners_type_status (partner_type, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_partners (
    project_id BIGINT UNSIGNED NOT NULL,
    partner_id BIGINT UNSIGNED NOT NULL,
    partnership_role VARCHAR(150) NULL,
    contribution_description TEXT NULL,
    contribution_amount DECIMAL(18,2) NULL,
    currency CHAR(3) NULL,
    PRIMARY KEY (project_id, partner_id),
    CONSTRAINT chk_project_partners_amount CHECK (contribution_amount IS NULL OR contribution_amount >= 0),
    CONSTRAINT fk_project_partners_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_partners_partner
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    INDEX idx_project_partners_partner (partner_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interventions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(40) NOT NULL,
    project_id BIGINT UNSIGNED NULL,
    domain_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    intervention_date DATE NOT NULL,
    province VARCHAR(100) NULL,
    territory VARCHAR(100) NULL,
    locality VARCHAR(150) NULL,
    beneficiaries_men INT UNSIGNED NOT NULL DEFAULT 0,
    beneficiaries_women INT UNSIGNED NOT NULL DEFAULT 0,
    beneficiaries_children INT UNSIGNED NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'planned',
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_interventions_reference UNIQUE (reference),
    CONSTRAINT chk_interventions_status CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
    CONSTRAINT fk_interventions_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_interventions_domain
        FOREIGN KEY (domain_id) REFERENCES intervention_domains(id) ON DELETE RESTRICT,
    CONSTRAINT fk_interventions_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_interventions_date (intervention_date),
    INDEX idx_interventions_domain_status (domain_id, status),
    INDEX idx_interventions_location (province, territory)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. COMMUNICATION, CONTENUS ET NEWSLETTER
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_article_categories_name UNIQUE (name),
    CONSTRAINT uq_article_categories_slug UNIQUE (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(40) NOT NULL,
    category_id BIGINT UNSIGNED NULL,
    author_id BIGINT UNSIGNED NULL,
    title VARCHAR(250) NOT NULL,
    slug VARCHAR(280) NOT NULL,
    excerpt TEXT NULL,
    content LONGTEXT NOT NULL,
    featured_image_url VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    likes_count INT UNSIGNED NOT NULL DEFAULT 0,
    shares_count INT UNSIGNED NOT NULL DEFAULT 0,
    published_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_articles_reference UNIQUE (reference),
    CONSTRAINT uq_articles_slug UNIQUE (slug),
    CONSTRAINT chk_articles_status CHECK (status IN ('draft', 'review', 'published', 'archived')),
    CONSTRAINT fk_articles_category
        FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_articles_author
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_articles_publication (status, published_at),
    INDEX idx_articles_category (category_id),
    FULLTEXT INDEX ft_articles_content (title, excerpt, content)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT UNSIGNED NOT NULL,
    author_name VARCHAR(120) NOT NULL,
    author_email VARCHAR(190) NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_article_comments_status CHECK (status IN ('published', 'hidden')),
    CONSTRAINT fk_article_comments_article
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    INDEX idx_article_comments_public (article_id, status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_reactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT UNSIGNED NOT NULL,
    visitor_hash CHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_article_reactions_visitor UNIQUE (article_id, visitor_hash),
    CONSTRAINT fk_article_reactions_article
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    INDEX idx_article_reactions_article (article_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT UNSIGNED NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    media_type VARCHAR(30) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500) NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    title VARCHAR(200) NULL,
    alt_text VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_media_stored_name UNIQUE (stored_name),
    CONSTRAINT chk_media_type CHECK (media_type IN ('image', 'video', 'audio', 'document', 'other')),
    CONSTRAINT fk_media_article
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
    CONSTRAINT fk_media_uploader
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_media_type_created (media_type, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    confirmation_token CHAR(64) NULL,
    unsubscribe_token CHAR(64) NULL,
    confirmed_at DATETIME NULL,
    subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME NULL,
    source VARCHAR(100) NULL,
    CONSTRAINT uq_newsletter_subscribers_email UNIQUE (email),
    CONSTRAINT uq_newsletter_confirmation_token UNIQUE (confirmation_token),
    CONSTRAINT uq_newsletter_unsubscribe_token UNIQUE (unsubscribe_token),
    CONSTRAINT chk_newsletter_subscriber_status CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')),
    INDEX idx_newsletter_subscribers_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS newsletters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(250) NOT NULL,
    preview_text VARCHAR(255) NULL,
    content LONGTEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    scheduled_at DATETIME NULL,
    sent_at DATETIME NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_newsletters_status CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    CONSTRAINT fk_newsletters_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_newsletters_status_schedule (status, scheduled_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS newsletter_recipients (
    newsletter_id BIGINT UNSIGNED NOT NULL,
    subscriber_id BIGINT UNSIGNED NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at DATETIME NULL,
    opened_at DATETIME NULL,
    clicked_at DATETIME NULL,
    error_message VARCHAR(500) NULL,
    PRIMARY KEY (newsletter_id, subscriber_id),
    CONSTRAINT chk_newsletter_delivery_status CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced')),
    CONSTRAINT fk_newsletter_recipients_newsletter
        FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE,
    CONSTRAINT fk_newsletter_recipients_subscriber
        FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    INDEX idx_newsletter_recipients_status (delivery_status)
) ENGINE=InnoDB;

-- Diffusion automatique d'un article nouvellement publie aux abonnes actifs.
CREATE TABLE IF NOT EXISTS article_publication_notifications (
    article_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    notification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at DATETIME NULL,
    recipients_prepared_at DATETIME NULL,
    completed_at DATETIME NULL,
    total_recipients INT UNSIGNED NOT NULL DEFAULT 0,
    sent_count INT UNSIGNED NOT NULL DEFAULT 0,
    failed_count INT UNSIGNED NOT NULL DEFAULT 0,
    last_error VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_article_publication_notification_status
        CHECK (notification_status IN ('pending', 'sending', 'sent', 'failed')),
    CONSTRAINT fk_article_publication_notifications_article
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_publication_recipients (
    article_id BIGINT UNSIGNED NOT NULL,
    subscriber_id BIGINT UNSIGNED NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at DATETIME NULL,
    last_attempt_at DATETIME NULL,
    attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    next_attempt_at DATETIME NULL,
    error_message VARCHAR(500) NULL,
    PRIMARY KEY (article_id, subscriber_id),
    CONSTRAINT chk_article_publication_recipient_status
        CHECK (delivery_status IN ('pending', 'sending', 'sent', 'failed')),
    CONSTRAINT fk_article_publication_recipients_article
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_article_publication_recipients_subscriber
        FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    INDEX idx_article_publication_recipients_status (article_id, delivery_status),
    INDEX idx_article_publication_recipients_retry (delivery_status, next_attempt_at)
) ENGINE=InnoDB;

-- ============================================================================
-- 4. ANALYTIQUE WEB ANONYME
-- ============================================================================

-- Les evenements ne contiennent ni adresse IP, ni user agent, ni URL avec
-- parametres. visitor_hash est une empreinte d'un identifiant local anonyme.
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(20) NOT NULL,
    page_path VARCHAR(240) NOT NULL,
    target_path VARCHAR(240) NULL,
    visitor_hash CHAR(64) NOT NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_analytics_event_type CHECK (event_type IN ('page_view', 'cta_click')),
    INDEX idx_analytics_event_date (event_type, occurred_at),
    INDEX idx_analytics_page_date (page_path, occurred_at),
    INDEX idx_analytics_visitor_date (visitor_hash, occurred_at)
) ENGINE=InnoDB;

-- ============================================================================
-- 5. NOTIFICATIONS, DOCUMENTS, RAPPORTS ET PARAMETRES
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(500) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_unread (user_id, is_read, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NULL,
    task_id BIGINT UNSIGNED NULL,
    uploaded_by BIGINT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'other',
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    version_number INT UNSIGNED NOT NULL DEFAULT 1,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    share_scope VARCHAR(20) NOT NULL DEFAULT 'private',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_documents_stored_name UNIQUE (stored_name),
    CONSTRAINT fk_documents_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_documents_task
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_documents_uploader
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_documents_project (project_id),
    INDEX idx_documents_task (task_id),
    INDEX idx_documents_public (is_public)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS document_recipients (
    document_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    shared_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id, user_id),
    CONSTRAINT fk_document_recipients_document
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_recipients_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_recipients_sharer
        FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_document_recipients_user (user_id, document_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(40) NOT NULL,
    project_id BIGINT UNSIGNED NULL,
    title VARCHAR(250) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    period_start DATE NULL,
    period_end DATE NULL,
    summary TEXT NULL,
    content LONGTEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    generated_by BIGINT UNSIGNED NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    CONSTRAINT uq_reports_reference UNIQUE (reference),
    CONSTRAINT chk_reports_status CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'archived')),
    CONSTRAINT chk_reports_dates CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start),
    CONSTRAINT fk_reports_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_reports_generator
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_reports_approver
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reports_project_type (project_id, report_type),
    INDEX idx_reports_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(30) NULL,
    subject VARCHAR(250) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    assigned_to BIGINT UNSIGNED NULL,
    replied_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_contact_messages_status CHECK (status IN ('new', 'in_progress', 'replied', 'closed', 'spam')),
    CONSTRAINT fk_contact_messages_assignee
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_contact_messages_status_created (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(120) NOT NULL,
    setting_value LONGTEXT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'string',
    setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
    description VARCHAR(255) NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_settings_key UNIQUE (setting_key),
    CONSTRAINT chk_settings_value_type CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'text')),
    CONSTRAINT fk_settings_updater
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_settings_group (setting_group)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT UNSIGNED NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    old_values LONGTEXT NULL,
    new_values LONGTEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_actor_created (actor_user_id, created_at),
    INDEX idx_audit_logs_created (created_at)
) ENGINE=InnoDB;

-- ============================================================================
-- 5. DECLENCHEURS
-- La variable de session @apild_actor_id peut etre definie par le backend.
-- ============================================================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_projects_before_insert$$
CREATE TRIGGER trg_projects_before_insert
BEFORE INSERT ON projects
FOR EACH ROW
BEGIN
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        SET NEW.reference = CONCAT('PRJ-', YEAR(CURRENT_DATE), '-', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8)));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_tasks_before_insert$$
CREATE TRIGGER trg_tasks_before_insert
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        SET NEW.reference = CONCAT('TSK-', YEAR(CURRENT_DATE), '-', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8)));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_tasks_before_update$$
CREATE TRIGGER trg_tasks_before_update
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        SET NEW.completed_at = COALESCE(NEW.completed_at, CURRENT_TIMESTAMP);
        SET NEW.progress_percent = 100;
    ELSEIF NEW.status <> 'completed' AND OLD.status = 'completed' THEN
        SET NEW.completed_at = NULL;
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_task_assignees_after_insert$$
CREATE TRIGGER trg_task_assignees_after_insert
AFTER INSERT ON task_assignees
FOR EACH ROW
BEGIN
    DECLARE v_task_title VARCHAR(200);
    DECLARE v_task_reference VARCHAR(40);

    SELECT title, reference
      INTO v_task_title, v_task_reference
      FROM tasks
     WHERE id = NEW.task_id;

    INSERT INTO notifications (user_id, notification_type, title, message, link_url)
    VALUES (
        NEW.user_id,
        'task_assigned',
        'Nouvelle tache assignee',
        CONCAT('La tache ', v_task_reference, ' - ', v_task_title, ' vous a ete assignee.'),
        CONCAT('/tasks/', NEW.task_id)
    );
END$$

DROP TRIGGER IF EXISTS trg_projects_after_update$$
CREATE TRIGGER trg_projects_after_update
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
    IF NOT (OLD.status <=> NEW.status) OR NOT (OLD.progress_percent <=> NEW.progress_percent) THEN
        INSERT INTO audit_logs (
            actor_user_id, action, entity_type, entity_id, old_values, new_values
        ) VALUES (
            @apild_actor_id,
            'update',
            'project',
            NEW.id,
            JSON_OBJECT('status', OLD.status, 'progress_percent', OLD.progress_percent),
            JSON_OBJECT('status', NEW.status, 'progress_percent', NEW.progress_percent)
        );
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_tasks_after_update$$
CREATE TRIGGER trg_tasks_after_update
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    IF NOT (OLD.status <=> NEW.status) OR NOT (OLD.progress_percent <=> NEW.progress_percent) THEN
        INSERT INTO audit_logs (
            actor_user_id, action, entity_type, entity_id, old_values, new_values
        ) VALUES (
            @apild_actor_id,
            'update',
            'task',
            NEW.id,
            JSON_OBJECT('status', OLD.status, 'progress_percent', OLD.progress_percent),
            JSON_OBJECT('status', NEW.status, 'progress_percent', NEW.progress_percent)
        );
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_articles_before_insert$$
CREATE TRIGGER trg_articles_before_insert
BEFORE INSERT ON articles
FOR EACH ROW
BEGIN
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        SET NEW.reference = CONCAT('ART-', YEAR(CURRENT_DATE), '-', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8)));
    END IF;

    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
        SET NEW.published_at = CURRENT_TIMESTAMP;
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_articles_before_update$$
CREATE TRIGGER trg_articles_before_update
BEFORE UPDATE ON articles
FOR EACH ROW
BEGIN
    IF NEW.status = 'published' AND OLD.status <> 'published' AND NEW.published_at IS NULL THEN
        SET NEW.published_at = CURRENT_TIMESTAMP;
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_interventions_before_insert$$
CREATE TRIGGER trg_interventions_before_insert
BEFORE INSERT ON interventions
FOR EACH ROW
BEGIN
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        SET NEW.reference = CONCAT('INT-', YEAR(CURRENT_DATE), '-', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8)));
    END IF;
END$$

DROP TRIGGER IF EXISTS trg_reports_before_insert$$
CREATE TRIGGER trg_reports_before_insert
BEFORE INSERT ON reports
FOR EACH ROW
BEGIN
    IF NEW.reference IS NULL OR TRIM(NEW.reference) = '' THEN
        SET NEW.reference = CONCAT('RPT-', YEAR(CURRENT_DATE), '-', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8)));
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- 6. VUES
-- ============================================================================

CREATE OR REPLACE VIEW v_users_with_roles AS
SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.job_title,
    u.status,
    GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',') AS role_codes,
    GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS role_names,
    u.last_login_at,
    u.created_at
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.job_title,
         u.status, u.last_login_at, u.created_at;

CREATE OR REPLACE VIEW v_user_permissions AS
SELECT DISTINCT
    u.id AS user_id,
    u.email,
    r.code AS role_code,
    p.code AS permission_code,
    p.module,
    p.action
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE u.deleted_at IS NULL
  AND u.status = 'active';

CREATE OR REPLACE VIEW v_project_dashboard AS
SELECT
    p.id,
    p.reference,
    p.name,
    p.status,
    p.priority,
    p.start_date,
    p.end_date,
    p.budget,
    p.currency,
    p.progress_percent,
    CONCAT_WS(' ', manager.first_name, manager.last_name) AS manager_name,
    (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id AND pm.left_at IS NULL) AS active_members,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL) AS total_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL AND t.status = 'completed') AS completed_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL AND t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled')) AS overdue_tasks,
    (SELECT COALESCE(SUM(i.beneficiaries_men + i.beneficiaries_women + i.beneficiaries_children), 0)
       FROM interventions i WHERE i.project_id = p.id AND i.deleted_at IS NULL) AS total_beneficiaries
FROM projects p
LEFT JOIN users manager ON manager.id = p.manager_id
WHERE p.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_task_dashboard AS
SELECT
    t.id,
    t.reference,
    t.title,
    t.status,
    t.priority,
    t.start_date,
    t.due_date,
    t.progress_percent,
    p.id AS project_id,
    p.reference AS project_reference,
    p.name AS project_name,
    GROUP_CONCAT(DISTINCT CONCAT_WS(' ', u.first_name, u.last_name) ORDER BY u.last_name SEPARATOR ', ') AS assignees,
    CASE
        WHEN t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled') THEN TRUE
        ELSE FALSE
    END AS is_overdue
FROM tasks t
JOIN projects p ON p.id = t.project_id
LEFT JOIN task_assignees ta ON ta.task_id = t.id
LEFT JOIN users u ON u.id = ta.user_id
WHERE t.deleted_at IS NULL
  AND p.deleted_at IS NULL
GROUP BY t.id, t.reference, t.title, t.status, t.priority, t.start_date,
         t.due_date, t.progress_percent, p.id, p.reference, p.name;

CREATE OR REPLACE VIEW v_communication_statistics AS
SELECT
    (SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL) AS total_articles,
    (SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL AND status = 'published') AS published_articles,
    (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'active') AS active_subscribers,
    (SELECT COUNT(*) FROM newsletters WHERE status = 'sent') AS sent_newsletters,
    (SELECT COUNT(*) FROM media WHERE deleted_at IS NULL) AS total_media,
    (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') AS new_contact_messages;

CREATE OR REPLACE VIEW v_newsletter_statistics AS
SELECT
    n.id,
    n.subject,
    n.status,
    n.sent_at,
    COUNT(nr.subscriber_id) AS recipient_count,
    SUM(nr.delivery_status IN ('sent', 'delivered', 'opened', 'clicked')) AS successful_deliveries,
    SUM(nr.opened_at IS NOT NULL) AS opens,
    SUM(nr.clicked_at IS NOT NULL) AS clicks,
    SUM(nr.delivery_status IN ('failed', 'bounced')) AS failures
FROM newsletters n
LEFT JOIN newsletter_recipients nr ON nr.newsletter_id = n.id
GROUP BY n.id, n.subject, n.status, n.sent_at;

-- ============================================================================
-- 7. PROCEDURES STOCKEES
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_assign_task$$
CREATE PROCEDURE sp_assign_task(
    IN p_task_id BIGINT UNSIGNED,
    IN p_user_id BIGINT UNSIGNED,
    IN p_assigned_by BIGINT UNSIGNED
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tasks WHERE id = p_task_id AND deleted_at IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tache introuvable';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND deleted_at IS NULL AND status = 'active') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Utilisateur actif introuvable';
    END IF;

    INSERT INTO task_assignees (task_id, user_id, assigned_by)
    VALUES (p_task_id, p_user_id, p_assigned_by)
    ON DUPLICATE KEY UPDATE
        assigned_by = VALUES(assigned_by),
        assigned_at = CURRENT_TIMESTAMP;
END$$

DROP PROCEDURE IF EXISTS sp_update_task_status$$
CREATE PROCEDURE sp_update_task_status(
    IN p_task_id BIGINT UNSIGNED,
    IN p_status VARCHAR(30),
    IN p_progress_percent DECIMAL(5,2),
    IN p_actor_user_id BIGINT UNSIGNED
)
BEGIN
    IF p_status NOT IN ('todo', 'in_progress', 'blocked', 'review', 'completed', 'cancelled') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Statut de tache invalide';
    END IF;

    IF p_progress_percent < 0 OR p_progress_percent > 100 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Progression invalide';
    END IF;

    SET @apild_actor_id = p_actor_user_id;

    UPDATE tasks
       SET status = p_status,
           progress_percent = CASE WHEN p_status = 'completed' THEN 100 ELSE p_progress_percent END
     WHERE id = p_task_id
       AND deleted_at IS NULL;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tache introuvable';
    END IF;

    SET @apild_actor_id = NULL;
END$$

DROP PROCEDURE IF EXISTS sp_subscribe_newsletter$$
CREATE PROCEDURE sp_subscribe_newsletter(
    IN p_email VARCHAR(190),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_source VARCHAR(100)
)
BEGIN
    IF p_email IS NULL OR TRIM(p_email) = '' OR p_email NOT LIKE '%_@_%._%' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Adresse email invalide';
    END IF;

    INSERT INTO newsletter_subscribers (
        email, first_name, last_name, status, confirmed_at, source
    ) VALUES (
        LOWER(TRIM(p_email)), p_first_name, p_last_name, 'active', CURRENT_TIMESTAMP, p_source
    )
    ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        status = 'active',
        confirmed_at = COALESCE(confirmed_at, CURRENT_TIMESTAMP),
        unsubscribed_at = NULL,
        source = VALUES(source);
END$$

DROP PROCEDURE IF EXISTS sp_project_summary$$
CREATE PROCEDURE sp_project_summary(IN p_project_id BIGINT UNSIGNED)
BEGIN
    SELECT *
      FROM v_project_dashboard
     WHERE id = p_project_id;

    SELECT
        status,
        COUNT(*) AS task_count
      FROM tasks
     WHERE project_id = p_project_id
       AND deleted_at IS NULL
     GROUP BY status
     ORDER BY status;

    SELECT
        d.name AS intervention_domain,
        COUNT(i.id) AS intervention_count,
        COALESCE(SUM(i.beneficiaries_men + i.beneficiaries_women + i.beneficiaries_children), 0) AS beneficiaries
      FROM intervention_domains d
      LEFT JOIN interventions i
        ON i.domain_id = d.id
       AND i.project_id = p_project_id
       AND i.deleted_at IS NULL
     GROUP BY d.id, d.name
     HAVING intervention_count > 0
     ORDER BY d.name;
END$$

DELIMITER ;

-- ============================================================================
-- 8. DONNEES INITIALES ET DONNEES DE DEMONSTRATION
-- Les comptes de demonstration partagent le hash bcrypt du mot de passe
-- "password". Ils doivent etre supprimes ou modifies avant la production.
-- ============================================================================

INSERT INTO roles (code, name, description, is_system) VALUES
    ('admin', 'Administration et coordination', 'Pilotage global, administration et coordination operationnelle de la plateforme', TRUE),
    ('communication', 'Communication', 'Gestion des contenus, medias et newsletters', TRUE),
    ('rh', 'Ressources humaines', 'Gestion des dossiers du personnel, contrats et conges', TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    is_system = VALUES(is_system);

INSERT INTO permissions (code, module, action, description) VALUES
    ('users.read', 'users', 'read', 'Consulter les utilisateurs'),
    ('users.create', 'users', 'create', 'Creer des utilisateurs'),
    ('users.update', 'users', 'update', 'Modifier les utilisateurs'),
    ('users.delete', 'users', 'delete', 'Archiver des utilisateurs'),
    ('roles.manage', 'roles', 'manage', 'Gerer les roles et permissions'),
    ('projects.read', 'projects', 'read', 'Consulter les projets'),
    ('projects.create', 'projects', 'create', 'Creer des projets'),
    ('projects.update', 'projects', 'update', 'Modifier les projets'),
    ('projects.delete', 'projects', 'delete', 'Archiver des projets'),
    ('tasks.read', 'tasks', 'read', 'Consulter les taches'),
    ('tasks.create', 'tasks', 'create', 'Creer des taches'),
    ('tasks.update', 'tasks', 'update', 'Modifier les taches'),
    ('tasks.assign', 'tasks', 'assign', 'Assigner les taches'),
    ('tasks.delete', 'tasks', 'delete', 'Archiver les taches'),
    ('events.manage', 'events', 'manage', 'Gerer les evenements'),
    ('partners.manage', 'partners', 'manage', 'Gerer les partenaires'),
    ('interventions.manage', 'interventions', 'manage', 'Gerer les interventions'),
    ('articles.manage', 'articles', 'manage', 'Gerer les articles'),
    ('media.manage', 'media', 'manage', 'Gerer les medias'),
    ('newsletter.manage', 'newsletter', 'manage', 'Gerer les newsletters'),
    ('documents.read', 'documents', 'read', 'Consulter les documents'),
    ('documents.manage', 'documents', 'manage', 'Gerer les documents'),
    ('reports.read', 'reports', 'read', 'Consulter les rapports'),
    ('reports.manage', 'reports', 'manage', 'Gerer les rapports'),
    ('statistics.read', 'statistics', 'read', 'Consulter les statistiques'),
    ('notifications.read', 'notifications', 'read', 'Consulter ses notifications'),
    ('contact.manage', 'contact', 'manage', 'Traiter les messages de contact'),
    ('settings.manage', 'settings', 'manage', 'Gerer les parametres'),
    ('audit.read', 'audit', 'read', 'Consulter le journal d audit')
ON DUPLICATE KEY UPDATE
    module = VALUES(module),
    action = VALUES(action),
    description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'projects.read', 'articles.manage', 'media.manage', 'newsletter.manage',
    'statistics.read', 'contact.manage', 'notifications.read'
)
WHERE r.code = 'communication';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'documents.read'
WHERE r.code IN ('communication', 'rh');

INSERT INTO users (
    first_name, last_name, email, phone, password_hash, job_title, status, email_verified_at
) VALUES
    ('Amina', 'Kalala', 'admin@apild.test', '+243970000001', '$2b$12$WqdUU14qe/KfFor4LGb53umuZY5DWG7WcxkJBD/NMilwz8uUp2dX2', 'Administratrice de la plateforme', 'active', CURRENT_TIMESTAMP),
    ('Patrick', 'Mwamba', 'manager@apild.test', '+243970000002', '$2b$12$WqdUU14qe/KfFor4LGb53umuZY5DWG7WcxkJBD/NMilwz8uUp2dX2', 'Responsable de coordination', 'active', CURRENT_TIMESTAMP),
    ('Grace', 'Ilunga', 'communication@apild.test', '+243970000003', '$2b$12$WqdUU14qe/KfFor4LGb53umuZY5DWG7WcxkJBD/NMilwz8uUp2dX2', 'Chargee de communication', 'active', CURRENT_TIMESTAMP),
    ('David', 'Kabongo', 'staff1@apild.test', '+243970000004', '$2b$12$WqdUU14qe/KfFor4LGb53umuZY5DWG7WcxkJBD/NMilwz8uUp2dX2', 'Agent de terrain', 'inactive', CURRENT_TIMESTAMP),
    ('Sarah', 'Mutombo', 'staff2@apild.test', '+243970000005', '$2b$12$WqdUU14qe/KfFor4LGb53umuZY5DWG7WcxkJBD/NMilwz8uUp2dX2', 'Assistante de projet', 'inactive', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    phone = VALUES(phone),
    job_title = VALUES(job_title),
    status = VALUES(status);

INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT u.id, r.id, admin_user.id
FROM users u
JOIN roles r ON r.code = CASE
    WHEN u.email = 'admin@apild.test' THEN 'admin'
    WHEN u.email = 'manager@apild.test' THEN 'admin'
    WHEN u.email = 'communication@apild.test' THEN 'communication'
    ELSE 'rh'
END
CROSS JOIN users admin_user
WHERE u.email IN ('admin@apild.test', 'manager@apild.test', 'communication@apild.test')
  AND admin_user.email = 'admin@apild.test';

INSERT INTO intervention_domains (code, name, description, color) VALUES
    ('education', 'Education', 'Acces a une education inclusive et de qualite', '#2563EB'),
    ('health', 'Sante', 'Sante communautaire et prevention', '#DC2626'),
    ('protection', 'Protection', 'Protection des personnes vulnerables', '#7C3AED'),
    ('livelihoods', 'Moyens de subsistance', 'Autonomisation economique et resilience', '#059669'),
    ('wash', 'Eau, hygiene et assainissement', 'Acces a l eau potable, hygiene et assainissement', '#0891B2')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    color = VALUES(color),
    is_active = TRUE;

INSERT INTO projects (
    reference, name, description, objectives, status, priority,
    start_date, end_date, budget, currency, province, territory, locality,
    progress_percent, manager_id, created_by
) VALUES
    (
        'PRJ-DEMO-001', 'Education numerique pour les jeunes',
        'Projet pilote d initiation au numerique dans les ecoles communautaires.',
        'Former les jeunes aux outils numeriques et renforcer les capacites des enseignants.',
        'active', 'high', '2026-01-15', '2026-12-15', 85000, 'USD',
        'Haut-Katanga', 'Lubumbashi', 'Kamalondo', 42.50,
        (SELECT id FROM users WHERE email = 'manager@apild.test'),
        (SELECT id FROM users WHERE email = 'admin@apild.test')
    ),
    (
        'PRJ-DEMO-002', 'Sante communautaire et prevention',
        'Sensibilisation et depistage communautaire dans les zones periurbaines.',
        'Ameliorer la prevention et l orientation vers les structures de sante.',
        'active', 'medium', '2026-03-01', '2027-02-28', 120000, 'USD',
        'Haut-Katanga', 'Kipushi', 'Kipushi Centre', 25.00,
        (SELECT id FROM users WHERE email = 'manager@apild.test'),
        (SELECT id FROM users WHERE email = 'admin@apild.test')
    ),
    (
        'PRJ-DEMO-003', 'Autonomisation des femmes rurales',
        'Accompagnement de groupements feminins et soutien aux activites generatrices de revenus.',
        'Renforcer les competences entrepreneuriales et faciliter l acces aux moyens de production.',
        'planned', 'high', '2027-01-10', '2027-12-20', 150000, 'USD',
        'Lualaba', 'Kolwezi', 'Manika', 0,
        (SELECT id FROM users WHERE email = 'manager@apild.test'),
        (SELECT id FROM users WHERE email = 'admin@apild.test')
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    objectives = VALUES(objectives),
    status = VALUES(status),
    priority = VALUES(priority),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    budget = VALUES(budget),
    progress_percent = VALUES(progress_percent),
    manager_id = VALUES(manager_id);

INSERT IGNORE INTO project_domains (project_id, domain_id)
SELECT p.id, d.id
FROM projects p
JOIN intervention_domains d ON
    (p.reference = 'PRJ-DEMO-001' AND d.code = 'education') OR
    (p.reference = 'PRJ-DEMO-002' AND d.code IN ('health', 'wash')) OR
    (p.reference = 'PRJ-DEMO-003' AND d.code IN ('protection', 'livelihoods'));

INSERT IGNORE INTO project_members (project_id, user_id, project_role, joined_at, allocation_percent)
SELECT p.id, u.id,
       CASE
           WHEN u.email = 'manager@apild.test' THEN 'Chef de projet'
           WHEN u.email = 'staff1@apild.test' THEN 'Agent de terrain'
           ELSE 'Assistante de projet'
       END,
       COALESCE(p.start_date, CURRENT_DATE),
       CASE WHEN u.email = 'manager@apild.test' THEN 50 ELSE 100 END
FROM projects p
JOIN users u ON
    (p.reference IN ('PRJ-DEMO-001', 'PRJ-DEMO-002', 'PRJ-DEMO-003') AND u.email = 'manager@apild.test') OR
    (p.reference IN ('PRJ-DEMO-001', 'PRJ-DEMO-002') AND u.email = 'staff1@apild.test') OR
    (p.reference IN ('PRJ-DEMO-001', 'PRJ-DEMO-003') AND u.email = 'staff2@apild.test');

INSERT INTO tasks (
    reference, project_id, title, description, status, priority,
    start_date, due_date, progress_percent, estimated_hours, created_by
) VALUES
    ('TSK-DEMO-001', (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-001'), 'Identifier les ecoles pilotes', 'Selectionner les etablissements beneficiaires.', 'completed', 'high', '2026-01-15', '2026-02-15', 100, 40, (SELECT id FROM users WHERE email = 'manager@apild.test')),
    ('TSK-DEMO-002', (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-001'), 'Former les enseignants', 'Organiser les ateliers de prise en main des outils numeriques.', 'in_progress', 'high', '2026-06-01', '2026-10-15', 55, 120, (SELECT id FROM users WHERE email = 'manager@apild.test')),
    ('TSK-DEMO-003', (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-001'), 'Installer les equipements', 'Installer et tester le materiel informatique.', 'todo', 'medium', '2026-10-01', '2026-11-15', 0, 80, (SELECT id FROM users WHERE email = 'manager@apild.test')),
    ('TSK-DEMO-004', (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-002'), 'Campagne de sensibilisation', 'Preparer les supports et mobiliser les relais communautaires.', 'in_progress', 'high', '2026-08-01', '2026-10-31', 35, 100, (SELECT id FROM users WHERE email = 'manager@apild.test')),
    ('TSK-DEMO-005', (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-002'), 'Collecter les donnees de depistage', 'Consolider les fiches anonymisees des beneficiaires.', 'todo', 'medium', '2026-10-01', '2026-12-15', 0, 60, (SELECT id FROM users WHERE email = 'manager@apild.test'))
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    status = VALUES(status),
    priority = VALUES(priority),
    start_date = VALUES(start_date),
    due_date = VALUES(due_date),
    progress_percent = VALUES(progress_percent),
    estimated_hours = VALUES(estimated_hours);

INSERT IGNORE INTO task_assignees (task_id, user_id, assigned_by)
SELECT t.id, u.id, manager_user.id
FROM tasks t
JOIN users u ON
    (t.reference IN ('TSK-DEMO-001', 'TSK-DEMO-002', 'TSK-DEMO-004') AND u.email = 'staff1@apild.test') OR
    (t.reference IN ('TSK-DEMO-002', 'TSK-DEMO-003', 'TSK-DEMO-005') AND u.email = 'staff2@apild.test')
CROSS JOIN users manager_user
WHERE manager_user.email = 'manager@apild.test';

INSERT INTO events (
    project_id, title, description, event_type, status, starts_at, ends_at,
    location, is_public, organizer_id
) SELECT
    p.id, 'Atelier de formation des enseignants',
    'Atelier pratique sur les outils numeriques pedagogiques.',
    'training', 'scheduled', '2026-10-05 09:00:00', '2026-10-05 16:00:00',
    'Centre communautaire de Kamalondo', TRUE, u.id
FROM projects p
JOIN users u ON u.email = 'manager@apild.test'
WHERE p.reference = 'PRJ-DEMO-001'
  AND NOT EXISTS (
      SELECT 1 FROM events e
      WHERE e.project_id = p.id AND e.title = 'Atelier de formation des enseignants'
  );

INSERT INTO events (
    project_id, title, description, event_type, status, starts_at, ends_at,
    location, is_public, organizer_id
) SELECT
    p.id, 'Journee de sensibilisation sante',
    'Activite communautaire de sensibilisation et orientation.',
    'community', 'scheduled', '2026-11-12 08:30:00', '2026-11-12 15:30:00',
    'Kipushi Centre', TRUE, u.id
FROM projects p
JOIN users u ON u.email = 'manager@apild.test'
WHERE p.reference = 'PRJ-DEMO-002'
  AND NOT EXISTS (
      SELECT 1 FROM events e
      WHERE e.project_id = p.id AND e.title = 'Journee de sensibilisation sante'
  );

INSERT INTO partners (
    name, partner_type, description, email, phone, website, address, contact_person, status
) VALUES
    ('Fondation Horizon', 'foundation', 'Partenaire financier des programmes educatifs.', 'contact@fondation-horizon.test', '+243970100001', 'https://fondation-horizon.test', 'Lubumbashi', 'Jean Kasongo', 'active'),
    ('Centre Medical Umoja', 'health_facility', 'Partenaire technique pour les activites de sante.', 'info@umoja-sante.test', '+243970100002', 'https://umoja-sante.test', 'Kipushi', 'Dr Marie Kanku', 'active'),
    ('Cooperative Tuendelee', 'community_organization', 'Organisation communautaire de femmes entrepreneures.', 'contact@tuendelee.test', '+243970100003', NULL, 'Kolwezi', 'Chantal Lwamba', 'active')
ON DUPLICATE KEY UPDATE
    partner_type = VALUES(partner_type),
    description = VALUES(description),
    email = VALUES(email),
    phone = VALUES(phone),
    status = VALUES(status);

INSERT IGNORE INTO project_partners (
    project_id, partner_id, partnership_role, contribution_description, contribution_amount, currency
)
SELECT p.id, pa.id,
       CASE
           WHEN pa.name = 'Fondation Horizon' THEN 'Bailleur'
           WHEN pa.name = 'Centre Medical Umoja' THEN 'Partenaire technique'
           ELSE 'Partenaire communautaire'
       END,
       CASE
           WHEN pa.name = 'Fondation Horizon' THEN 'Financement et equipements'
           WHEN pa.name = 'Centre Medical Umoja' THEN 'Personnel medical et orientation des patients'
           ELSE 'Mobilisation communautaire'
       END,
       CASE WHEN pa.name = 'Fondation Horizon' THEN 50000 ELSE NULL END,
       CASE WHEN pa.name = 'Fondation Horizon' THEN 'USD' ELSE NULL END
FROM projects p
JOIN partners pa ON
    (p.reference = 'PRJ-DEMO-001' AND pa.name = 'Fondation Horizon') OR
    (p.reference = 'PRJ-DEMO-002' AND pa.name = 'Centre Medical Umoja') OR
    (p.reference = 'PRJ-DEMO-003' AND pa.name = 'Cooperative Tuendelee');

INSERT INTO interventions (
    reference, project_id, domain_id, title, description, intervention_date,
    province, territory, locality, beneficiaries_men, beneficiaries_women,
    beneficiaries_children, status, created_by
) VALUES
    ('INT-DEMO-001', (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-001'), (SELECT id FROM intervention_domains WHERE code = 'education'), 'Initiation au numerique', 'Premiere session de formation des eleves.', '2026-06-20', 'Haut-Katanga', 'Lubumbashi', 'Kamalondo', 45, 52, 80, 'completed', (SELECT id FROM users WHERE email = 'staff1@apild.test')),
    ('INT-DEMO-002', (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-002'), (SELECT id FROM intervention_domains WHERE code = 'health'), 'Depistage communautaire', 'Depistage volontaire et orientation medicale.', '2026-08-18', 'Haut-Katanga', 'Kipushi', 'Kipushi Centre', 63, 89, 24, 'completed', (SELECT id FROM users WHERE email = 'staff1@apild.test')),
    ('INT-DEMO-003', (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-002'), (SELECT id FROM intervention_domains WHERE code = 'wash'), 'Sensibilisation hygiene', 'Demonstration des bonnes pratiques d hygiene.', '2026-11-12', 'Haut-Katanga', 'Kipushi', 'Kipushi Centre', 0, 0, 0, 'planned', (SELECT id FROM users WHERE email = 'staff2@apild.test'))
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    intervention_date = VALUES(intervention_date),
    beneficiaries_men = VALUES(beneficiaries_men),
    beneficiaries_women = VALUES(beneficiaries_women),
    beneficiaries_children = VALUES(beneficiaries_children),
    status = VALUES(status);

INSERT INTO article_categories (name, slug, description) VALUES
    ('Actualites', 'actualites', 'Actualites de l organisation et de ses projets'),
    ('Temoignages', 'temoignages', 'Histoires et temoignages des beneficiaires'),
    ('Publications', 'publications', 'Rapports, analyses et publications institutionnelles')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO articles (
    reference, category_id, author_id, title, slug, excerpt, content,
    featured_image_url, status, is_featured, published_at
) VALUES
    (
        'ART-DEMO-001',
        (SELECT id FROM article_categories WHERE slug = 'actualites'),
        (SELECT id FROM users WHERE email = 'communication@apild.test'),
        'APILD lance son programme d education numerique',
        'apild-lance-programme-education-numerique',
        'Un nouveau programme accompagne les jeunes et les enseignants dans la transition numerique.',
        '<p>APILD a lance un programme pilote d education numerique dans plusieurs ecoles communautaires de Lubumbashi.</p>',
        '/images/demo/education-numerique.jpg', 'published', TRUE, '2026-06-25 10:00:00'
    ),
    (
        'ART-DEMO-002',
        (SELECT id FROM article_categories WHERE slug = 'actualites'),
        (SELECT id FROM users WHERE email = 'communication@apild.test'),
        'Une campagne de sante au plus pres des communautes',
        'campagne-sante-communautes',
        'Les equipes APILD et leurs partenaires renforcent la prevention a Kipushi.',
        '<p>La campagne combine sensibilisation, depistage volontaire et orientation vers les structures de sante partenaires.</p>',
        '/images/demo/sante-communautaire.jpg', 'published', FALSE, '2026-08-22 09:30:00'
    )
ON DUPLICATE KEY UPDATE
    category_id = VALUES(category_id),
    author_id = VALUES(author_id),
    title = VALUES(title),
    excerpt = VALUES(excerpt),
    content = VALUES(content),
    status = VALUES(status),
    is_featured = VALUES(is_featured),
    published_at = VALUES(published_at);

INSERT INTO newsletter_subscribers (
    email, first_name, last_name, status, confirmed_at, source
) VALUES
    ('alice@example.test', 'Alice', 'K.', 'active', CURRENT_TIMESTAMP, 'website'),
    ('boris@example.test', 'Boris', 'M.', 'active', CURRENT_TIMESTAMP, 'event'),
    ('celine@example.test', 'Celine', 'T.', 'active', CURRENT_TIMESTAMP, 'website'),
    ('daniel@example.test', 'Daniel', 'L.', 'unsubscribed', CURRENT_TIMESTAMP, 'website')
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    status = VALUES(status),
    confirmed_at = VALUES(confirmed_at),
    source = VALUES(source);

INSERT INTO newsletters (
    subject, preview_text, content, status, sent_at, created_by
) SELECT
    'Les nouvelles d APILD - Septembre 2026',
    'Decouvrez les avancees de nos projets sur le terrain.',
    '<h1>Les nouvelles d APILD</h1><p>Merci de suivre nos actions en faveur des communautes.</p>',
    'sent', '2026-09-05 08:00:00', u.id
FROM users u
WHERE u.email = 'communication@apild.test'
  AND NOT EXISTS (
      SELECT 1 FROM newsletters n WHERE n.subject = 'Les nouvelles d APILD - Septembre 2026'
  );

INSERT IGNORE INTO newsletter_recipients (
    newsletter_id, subscriber_id, delivery_status, sent_at, opened_at, clicked_at
)
SELECT n.id, s.id,
       CASE WHEN s.email = 'alice@example.test' THEN 'clicked' ELSE 'opened' END,
       n.sent_at,
       DATE_ADD(n.sent_at, INTERVAL 2 HOUR),
       CASE WHEN s.email = 'alice@example.test' THEN DATE_ADD(n.sent_at, INTERVAL 3 HOUR) ELSE NULL END
FROM newsletters n
JOIN newsletter_subscribers s ON s.status = 'active'
WHERE n.subject = 'Les nouvelles d APILD - Septembre 2026';

INSERT INTO documents (
    project_id, uploaded_by, title, description, document_type,
    original_name, stored_name, file_path, mime_type, file_size, is_public
) SELECT
    p.id, u.id, 'Guide de formation numerique',
    'Document de demonstration associe au projet educatif.', 'training_material',
    'guide-formation-numerique.pdf', 'demo-guide-formation-numerique.pdf',
    'uploads/documents/demo-guide-formation-numerique.pdf', 'application/pdf', 245760, TRUE
FROM projects p
JOIN users u ON u.email = 'manager@apild.test'
WHERE p.reference = 'PRJ-DEMO-001'
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    file_size = VALUES(file_size),
    is_public = VALUES(is_public);

INSERT INTO reports (
    reference, project_id, title, report_type, period_start, period_end,
    summary, content, status, generated_by, approved_by, approved_at
) VALUES
    (
        'RPT-DEMO-001',
        (SELECT id FROM projects WHERE reference = 'PRJ-DEMO-001'),
        'Rapport semestriel - Education numerique', 'progress',
        '2026-01-01', '2026-06-30',
        'Le projet a demarre conformement au calendrier et les premieres ecoles ont ete identifiees.',
        '<p>Rapport de demonstration du premier semestre 2026.</p>',
        'approved',
        (SELECT id FROM users WHERE email = 'manager@apild.test'),
        (SELECT id FROM users WHERE email = 'admin@apild.test'),
        '2026-07-10 14:00:00'
    )
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    summary = VALUES(summary),
    content = VALUES(content),
    status = VALUES(status),
    approved_by = VALUES(approved_by),
    approved_at = VALUES(approved_at);

INSERT INTO contact_messages (
    name, email, phone, subject, message, status
) SELECT
    'Visiteur Demo', 'visiteur@example.test', '+243970200001',
    'Demande de partenariat',
    'Bonjour, notre organisation souhaite en savoir plus sur les possibilites de partenariat.',
    'new'
WHERE NOT EXISTS (
    SELECT 1 FROM contact_messages
    WHERE email = 'visiteur@example.test' AND subject = 'Demande de partenariat'
);

INSERT INTO settings (
    setting_key, setting_value, value_type, setting_group, description, is_public
) VALUES
    ('organization.name', 'APILD', 'string', 'organization', 'Nom public de l organisation', TRUE),
    ('organization.email', 'contact@apild.test', 'string', 'organization', 'Adresse email generale', TRUE),
    ('organization.phone', '+243 970 000 000', 'string', 'organization', 'Numero de telephone general', TRUE),
    ('organization.address', 'Lubumbashi, Haut-Katanga, RDC', 'string', 'organization', 'Adresse de l organisation', TRUE),
    ('platform.timezone', 'Africa/Lubumbashi', 'string', 'platform', 'Fuseau horaire par defaut', FALSE),
    ('platform.default_currency', 'USD', 'string', 'platform', 'Devise par defaut', FALSE),
    ('newsletter.double_opt_in', 'false', 'boolean', 'newsletter', 'Exiger la confirmation des abonnements', FALSE),
    ('uploads.max_file_size_mb', '10', 'number', 'uploads', 'Taille maximale des fichiers', FALSE)
ON DUPLICATE KEY UPDATE
    setting_value = VALUES(setting_value),
    value_type = VALUES(value_type),
    setting_group = VALUES(setting_group),
    description = VALUES(description),
    is_public = VALUES(is_public);

-- Verification rapide apres import.
SELECT 'roles' AS entity, COUNT(*) AS row_count FROM roles
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'interventions', COUNT(*) FROM interventions
UNION ALL SELECT 'articles', COUNT(*) FROM articles
UNION ALL SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers;
