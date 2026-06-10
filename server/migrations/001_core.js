export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').unsigned();
    t.string('student_number', 20).unique().notNullable();
    t.string('full_name', 150).notNullable();
    t.string('email', 200);
    t.string('password_hash', 255).notNullable();
    t.enu('role', ['super_admin', 'staff', 'tutor', 'student']).notNullable();
    t.json('permissions_json');
    t.boolean('is_active').defaultTo(true);
    t.boolean('force_pw_change').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('last_login').nullable();
    t.date('data_expires_at').nullable();
    t.index('role');
  });

  await knex.schema.createTable('system_config', (t) => {
    t.string('config_key', 100).primary();
    t.text('config_value').notNullable();
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('audit_logs', (t) => {
    t.bigIncrements('id').unsigned();
    t.integer('user_id').unsigned();
    t.string('action', 100).notNullable();
    t.string('entity_type', 50);
    t.bigInteger('entity_id').unsigned();
    t.json('details_json');
    t.string('ip_address', 45);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['action', 'created_at']);
  });

  await knex.schema.createTable('password_otps', (t) => {
    t.increments('id').unsigned();
    t.string('student_number', 20).notNullable().index();
    t.string('otp_hash', 255).notNullable();
    t.timestamp('expires_at').notNullable();
    t.boolean('used').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('password_otps');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('system_config');
  await knex.schema.dropTableIfExists('users');
}
