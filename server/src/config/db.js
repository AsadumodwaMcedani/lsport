import knex from 'knex';
import config from '../../knexfile.js';

const env = process.env.NODE_ENV === 'test' ? 'test' : (process.env.NODE_ENV || 'development');
export const db = knex(config[env]);

export async function logAudit(userId, action, entityType = null, entityId = null, details = null, ip = null) {
  try {
    await insertAudit(userId, action, entityType, entityId, details, ip);
  } catch (err) {
    console.error('audit_log write failed:', err.message); // never break the request
  }
}

async function insertAudit(userId, action, entityType, entityId, details, ip) {
  await db('audit_logs').insert({
    user_id: userId, action, entity_type: entityType, entity_id: entityId,
    details_json: details ? JSON.stringify(details) : null, ip_address: ip
  });
}
