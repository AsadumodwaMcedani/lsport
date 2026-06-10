export async function seed(knex) {
  const defaults = {
    system_name: 'LBBS Student Portal',
    system_short_name: 'LS Port',
    active_academic_year: '2026',
    active_semester: '1',
    popia_retention_months: '13',
    backup_retention_weeks: '8',
    query_categories: 'Marks/Grade Query,Submission Issue,Academic/Content Question,General/Other',
    query_statuses: 'new,acknowledged,in_progress,resolved,closed',
    email_from_name: 'LS Port — LBBS',
    max_file_upload_mb: '10',
    allowed_file_types: 'pdf,doc,docx,jpg,jpeg,png,xlsx'
  };
  for (const [config_key, config_value] of Object.entries(defaults)) {
    await knex('system_config').insert({ config_key, config_value }).onConflict('config_key').ignore();
  }
}
