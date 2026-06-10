export async function up(knex) {
  await knex.schema.alterTable('semesters', (t) => {
    t.string('label', 5).nullable();
  });
  // Backfill existing rows
  await knex('semesters').update({ label: knex.raw('CAST(semester_number AS CHAR)') });
}

export async function down(knex) {
  await knex.schema.alterTable('semesters', (t) => {
    t.dropColumn('label');
  });
}
