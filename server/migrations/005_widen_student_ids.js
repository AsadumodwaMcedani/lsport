export async function up(knex) {
  await knex.schema.alterTable('students', (t) => {
    t.string('student_number', 30).notNullable().alter();
    t.string('id_number', 50).nullable().alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('students', (t) => {
    t.string('student_number', 20).notNullable().alter();
    t.string('id_number', 20).nullable().alter();
  });
}
