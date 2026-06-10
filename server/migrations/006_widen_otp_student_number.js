export async function up(knex) {
  await knex.schema.alterTable('password_otps', (t) => {
    t.string('student_number', 30).notNullable().alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('password_otps', (t) => {
    t.string('student_number', 20).notNullable().alter();
  });
}
