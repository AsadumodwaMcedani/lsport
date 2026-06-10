export async function up(knex) {
  await knex.schema.alterTable('courses', (t) => {
    t.enu('delivery_type', ['year_round', 'online_always']).nullable();
    t.enu('course_provider', ['lbbs', 'ufh', 'other']).notNullable().defaultTo('lbbs');
    t.string('course_provider_other', 200).nullable();
  });

  await knex.schema.createTable('student_consents', (t) => {
    t.increments('id').unsigned();
    t.integer('student_id').unsigned().notNullable()
      .references('id').inTable('students').onDelete('CASCADE');
    t.boolean('terms_accepted').notNullable().defaultTo(false);
    t.boolean('popia_accepted').notNullable().defaultTo(false);
    t.timestamp('accepted_at').notNullable();
    t.string('ip_address', 45).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('student_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('student_consents');
  await knex.schema.alterTable('courses', (t) => {
    t.dropColumn('delivery_type');
    t.dropColumn('course_provider');
    t.dropColumn('course_provider_other');
  });
}
