import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Receives the staff roster pushed by JTAP Ledger (app-to-app call) and upserts
// it into the staff roster by email, falling back to name. Anyone can reach a
// function URL, so nothing is written until the shared key in the body matches.

const ROLES = ['Manager', 'Chef', 'Sous Chef', 'Server', 'Host', 'Bartender', 'Busser', 'Dishwasher'];

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function sharedKey() {
  try {
    return String(secrets.get('staffRosterWebhook') || secrets.get('JTAP_KITCHEN_API_KEY') || '').trim();
  } catch {
    return '';
  }
}

async function listAllStaff(service) {
  const all = [];
  let cursor = null;
  do {
    const page = await service.list(cursor ? { limit: 500, cursor } : { limit: 500 });
    all.push(...(page?.items || []));
    cursor = page?.has_more ? page.next_cursor : null;
  } while (cursor);
  return all;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const expected = sharedKey();
    const provided = String(body?.secret || '').trim();
    let authorized = Boolean(expected) && safeEqual(provided, expected);
    if (!authorized) {
      const user = await base44.auth.me().catch(() => null);
      authorized = user?.role === 'admin';
    }
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) {
      return Response.json({ success: true, received: 0, created: 0, updated: 0, skipped: 0 });
    }

    const service = base44.asServiceRole.entities.Staff;
    const existing = await listAllStaff(service);

    const byEmail = new Map();
    const byName = new Map();
    for (const member of existing) {
      const email = String(member.email || '').trim().toLowerCase();
      const name = String(member.name || '').trim().toLowerCase();
      if (email) byEmail.set(email, member);
      if (name) byName.set(name, member);
    }

    const creates = [];
    const updates = [];
    const seen = new Set();
    let skipped = 0;

    for (const raw of items) {
      const email = String(raw?.email || '').trim().toLowerCase();
      const name = String(raw?.full_name || raw?.name || '').trim();
      if (!email && !name) {
        skipped += 1;
        continue;
      }
      const key = email || name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const patch = {};
      if (name) patch.name = name;
      if (email) patch.email = email;
      if (typeof raw?.is_active === 'boolean') patch.is_active = raw.is_active;
      const role = String(raw?.role || '').trim();
      if (ROLES.includes(role)) patch.role = role;
      const shift = String(raw?.shift || '').trim();
      if (shift) patch.shift = shift;
      const hourlyRate = Number(raw?.hourly_rate);
      if (Number.isFinite(hourlyRate) && hourlyRate >= 0) patch.hourly_rate = hourlyRate;
      const hireDate = String(raw?.hire_date || '').trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(hireDate)) patch.hire_date = hireDate;

      const match = (email && byEmail.get(email)) || (name && byName.get(name.toLowerCase())) || null;
      if (match) {
        updates.push({ id: match.id, ...patch });
      } else {
        creates.push({ ...patch, name: patch.name || email });
      }
    }

    const created = creates.length ? await service.bulkCreate(creates) : [];
    const updated = updates.length ? await service.bulkUpdate(updates) : [];

    return Response.json({
      success: true,
      received: items.length,
      created: Array.isArray(created) ? created.length : creates.length,
      updated: Array.isArray(updated) ? updated.length : updates.length,
      skipped,
    });
  } catch (error) {
    console.error('staffRosterWebhook failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}