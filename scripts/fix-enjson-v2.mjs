import fs from 'fs';

const en = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
const es = JSON.parse(fs.readFileSync('./messages/es.json', 'utf8'));

/**
 * Correcciones de valores incorrectos en en.json.
 * Causa raíz: el fix original usaba matching por key name, entonces claves
 * duplicadas como "title" y "subtitle" recibieron el valor de la última
 * ocurrencia extraída del JSON corrupto, resultando en "Spaces Hierarchy"
 * en 12 secciones diferentes.
 *
 * Estrategia: para cada path, establecemos el valor correcto en inglés.
 * Usamos el español como referencia semántica.
 */

const fixes = {
  // ============ admin ============
  'admin.title': 'Visual Governance',
  'admin.subtitle': 'Monitor, validate and adjust your satellite branding.',
  'admin.audit_view_telemetry_title': 'View Telemetry',
  'admin.audit_metrics_label': 'Metrics',

  // ============ settings ============
  'settings.title': 'System Settings',

  // ============ questions ============
  'questions.title': 'Question Repository',
  'questions.subtitle': 'Management, editing and historical traceability of individual questions.',

  // ============ analytics ============
  'analytics.title': 'Tactical Analytics Center',
  'analytics.subtitle': 'Cognitive performance evolution, topic heat maps, and simulation history.',

  // ============ allegations ============
  'allegations.title': 'Allegations & Claims',
  'allegations.subtitle': 'Management of technical student claims, question annulment, and grade recalculation.',

  // ============ logoutSuccess ============
  'logoutSuccess.title': 'Logout Successful',
  'logoutSuccess.subtitle': 'You have logged out successfully.',

  // ============ quizRoles (top-level) ============
  'quizRoles.title': 'Contextual Roles (Quiz)',
  'quizRoles.subtitle': 'Manage contextual roles (CREATOR / AUDITOR) by scope (Space, Course, ExamConfig).',
  'quizRoles.bulkSuccess': 'Roles assigned: {assigned} successful, {skipped} skipped',
  'quizRoles.total': 'TOTAL: {count}',

  // ============ admin.permissions ============
  'admin.permissions.title': 'Groups & Permissions',
  'admin.permissions.subtitle': 'Manage access groups with recursive hierarchy and ABAC policies for the tenant.',

  // ============ admin.marketplace ============
  'admin.marketplace.title': 'Satellite Marketplace',
  'admin.marketplace.subtitle': 'Module catalog and federated license management for the ecosystem.',
  'admin.marketplace.toastSuccess': 'License request submitted successfully.',
  'admin.marketplace.toastError': 'Failed to process license request.',
  'admin.marketplace.toastResolved': 'Request resolved successfully.',
  'admin.marketplace.modules.logs.name': 'Log Center',
  'admin.marketplace.modules.logs.desc': 'Immutable chain auditing and SOC2 logging.',
  'admin.marketplace.modules.gobernanza.name': 'Governance Portal',
  'admin.marketplace.modules.gobernanza.desc': 'IAM control, ABAC, and federated white-labeling.',
  'admin.marketplace.modules.quiz.name': 'ABD Quiz Engine',
  'admin.marketplace.modules.quiz.desc': 'Technical evaluation with anti-fraud validation and traceability.',
  'admin.marketplace.modules.rag.name': 'Smart Assistant (RAG)',
  'admin.marketplace.modules.rag.desc': 'Augmented AI for real-time query resolution.',

  // ============ admin.quizRoles ============
  'admin.quizRoles.title': 'Quiz Role Management',
  'admin.quizRoles.subtitle': 'Assign and revoke contextual roles (Creator, Auditor) to users within specific scopes.',
  'admin.quizRoles.loadError': 'Error loading quiz roles',
  'admin.quizRoles.validationError': 'Select a user and specify a scope ID',
  'admin.quizRoles.bulkValidationError': 'Select at least one user and specify a scope ID',
  'admin.quizRoles.assignSuccess': 'Quiz role assigned successfully',
  'admin.quizRoles.revokeSuccess': 'Quiz role revoked successfully',
  'admin.quizRoles.selectUser': '— SELECT USER —',
  'admin.quizRoles.scopeIdPlaceholder': 'ObjectId of Space, Course or ExamConfig',
  'admin.quizRoles.cancel': 'Cancel',
  'admin.quizRoles.assigning': 'ASSIGNING...',
  'admin.quizRoles.close': 'Close',
  'admin.quizRoles.noUsers': 'NO USERS AVAILABLE',
  'admin.quizRoles.revokeConfirmTitle': 'REVOKE QUIZ ROLE',
  'admin.quizRoles.confirmRevoke': 'Are you sure you want to revoke the quiz role for user {userId}...?',
  'admin.quizRoles.userLabel': 'USER',
  'admin.quizRoles.underFilters': 'UNDER THESE FILTERS',
  'admin.quizRoles.backButton': 'Back to quiz roles',
  'admin.quizRoles.filterPlaceholder': 'Filter by ID...',
  'admin.quizRoles.assigningToCount': 'ASSIGNING TO {count}...',
  'admin.quizRoles.assignToCount': 'ASSIGN TO {count} USER(S)',
  'admin.quizRoles.selectUsers': 'SELECT USERS ({count} of {total})',
  'admin.quizRoles.allUsers': 'ALL',
  'admin.quizRoles.scopeTypeLabel': 'SCOPE TYPE',
  'admin.quizRoles.allScopeTypes': '— ALL —',
  'admin.quizRoles.filterScopeId': 'SCOPE ID',
  'admin.quizRoles.filterScopeType': 'SCOPE TYPE',
  'admin.quizRoles.actions': 'ACTIONS',
  'admin.quizRoles.scope': 'SCOPE',
  'admin.quizRoles.scopeId': 'SCOPE ID',
  'admin.quizRoles.role': 'ROLE',
  'admin.quizRoles.assignedBy': 'ASSIGNED BY',
  'admin.quizRoles.date': 'DATE',
  'admin.quizRoles.user': 'USER',
  'admin.quizRoles.refresh': 'Refresh',
  'admin.quizRoles.assignRole': 'ASSIGN ROLE',
  'admin.quizRoles.bulkAssign': 'BULK ASSIGN',
  'admin.quizRoles.clearFilters': 'CLEAR FILTERS',
  'admin.quizRoles.noRoles': 'NO QUIZ ROLES FOUND',
  'admin.quizRoles.loading': 'Loading quiz roles...',
  'admin.quizRoles.revoke': 'REVOKE',
  'admin.quizRoles.assignModalTitle': 'ASSIGN QUIZ ROLE',
  'admin.quizRoles.bulkTitle': 'BULK ASSIGNMENT',

  // ============ admin.users (nested) ============
  'admin.users.table_id': 'USER_ID',
  'admin.users.table_email_name': 'EMAIL / NAME',
  'admin.users.table_role_apps': 'ROLE / APPS',
  'admin.users.table_groups': 'GROUPS',
  'admin.users.table_status': 'STATUS',
  'admin.users.table_actions': 'ACTIONS',
  'admin.users.table_loading': 'LOADING IDENTITIES...',
  'admin.users.table_empty': 'NO USERS FOUND IN THIS TENANT',
  'admin.users.suspend_btn': 'SUSPEND',
  'admin.users.reactivate_btn': 'REACTIVATE',
  'admin.users.manage_groups_btn': 'MANAGE GROUPS',

  // ============ dashboard.tenants ============
  'dashboard.tenants.title': 'Organization Governance',
  'dashboard.tenants.subtitle': 'Federated Tenant Ecosystem',
  'dashboard.tenants.name_label': 'Corporate / Commercial Name',
  'dashboard.tenants.id_label': 'Tenant Identifier (Uppercase)',
  'dashboard.tenants.actions.save': 'Save Changes',
  'dashboard.tenants.actions.cancel': 'Cancel',
  'dashboard.tenants.apps.auth': 'Identity Console (ABDAuth)',
  'dashboard.tenants.apps.quiz': 'Evaluation Platform (ABDQuiz)',
  'dashboard.tenants.apps.gobernanza': 'Governance Portal (Control Plane)',
  'dashboard.tenants.apps.elevators': 'Elevator Manager (ABDElevators)',

  // ============ dashboard.users ============
  'dashboard.users.table_id': 'USER_ID',
  'dashboard.users.table_email_name': 'EMAIL / NAME',
  'dashboard.users.table_role_apps': 'ROLE / APPS',
  'dashboard.users.table_groups': 'GROUPS',
  'dashboard.users.table_status': 'STATUS',
  'dashboard.users.table_actions': 'ACTIONS',
  'dashboard.users.table_loading': 'LOADING IDENTITIES...',
  'dashboard.users.table_empty': 'NO USERS FOUND IN THIS TENANT',
  'dashboard.users.suspend_btn': 'SUSPEND',
  'dashboard.users.reactivate_btn': 'REACTIVATE',
  'dashboard.users.manage_groups_btn': 'MANAGE GROUPS',

  // ============ dashboard.spaces ============
  'dashboard.spaces.title': 'Space Hierarchy',
  'dashboard.spaces.subtitle': 'Structured management of areas and departments',
  'dashboard.spaces.saving': 'Saving...',
  'dashboard.spaces.save': 'Save',
  'dashboard.spaces.cancel': 'Cancel',
  'dashboard.spaces.close': 'Close',
  'dashboard.spaces.collapse': 'Collapse',
  'dashboard.spaces.expand': 'Expand',
  'dashboard.spaces.verifying_sovereignty': 'Verifying ownership...',
  'dashboard.spaces.unlinking': 'Unlinking...',
  'dashboard.spaces.linking': 'Linking...',

  // ============ widgets ============
  'widgets.tenant_selector_select': 'Select organization',
  'widgets.tenant_selector_title': 'ORGANIZATION',
  'widgets.tenant_selector_search': 'Search...',
  'widgets.tenant_selector_empty': 'No results',
  'widgets.tenant_selector_active': 'Active Organization',
  'widgets.system_settings_title': 'SYSTEM SETTINGS',
  'widgets.system_settings_close': 'Close',
  'widgets.system_settings_language': 'LANGUAGE',
  'widgets.system_settings_theme': 'THEME',
  'widgets.system_settings_theme_light': 'LIGHT',
  'widgets.system_settings_theme_dark': 'DARK',
  'widgets.system_settings_theme_system': 'SYSTEM',
  'widgets.system_settings_logout': 'Sign Out',
};

/**
 * Apply a fix at a dotted path in the en object.
 */
function setByPath(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      console.error(`  ❌ Cannot set ${path}: intermediate ${keys.slice(0, i+1).join('.')} not found`);
      return false;
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return true;
}

// Apply all fixes
let applied = 0;
let failed = 0;
for (const [path, value] of Object.entries(fixes)) {
  if (setByPath(en, path, value)) {
    console.log(`  ✅ ${path}: "${value.substring(0, 60)}"`);
    applied++;
  } else {
    failed++;
  }
}

// Write the corrected file
fs.writeFileSync('./messages/en.json', JSON.stringify(en, null, 4) + '\n', 'utf8');

console.log(`\n📝 Applied ${applied} fixes, ${failed} failed.`);

// Verify
try {
  JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
  console.log('✅ en.json is VALID JSON');
} catch (e) {
  console.error('❌ en.json is INVALID:', e.message);
}

// Quick sanity check: count unique title values
const enCheck = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
const titles = [];
function findTitles(obj, path = '') {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (key === 'title' && typeof value === 'string') {
      titles.push({ path: fullPath, value });
    }
    if (value !== null && typeof value === 'object') {
      findTitles(value, fullPath);
    }
  }
}
findTitles(enCheck);
console.log(`\n📊 Title distribution:`);
const titleGroups = {};
for (const t of titles) {
  if (!titleGroups[t.value]) titleGroups[t.value] = [];
  titleGroups[t.value].push(t.path);
}
for (const [val, paths] of Object.entries(titleGroups)) {
  console.log(`  [${paths.length}x] "${val.substring(0, 50)}"`);
}
