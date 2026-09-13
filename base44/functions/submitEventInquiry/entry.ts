import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceRateLimit } from '../../shared/rateLimit.js';
import { depositForPackage } from '../../shared/eventDeposit.js';

const escapeHtml = (text) => String(text == null ? '' : text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      contact_name, email, phone, event_type,
      preferred_day, preferred_date, guest_count, package: pkg, package_name,
      event_date, selected_talent_ids, selected_addon_ids, selected_menu_item_ids, estimated_total, message,
    } = body;

    if (!contact_name || !email || !guest_count) {
      return Response.json({ error: 'Name, email, and guest count are required.' }, { status: 400 });
    }

    const limited = await enforceRateLimit(req, base44, 'submitEventInquiry', String(email).toLowerCase(), 3, 3600000);
    if (limited) return limited;

    // Deposit is resolved server-side from the package tier (client never sends a price).
    const depositAmount = depositForPackage(pkg) || 0;

    // Force server-controlled fields — public submitters cannot self-set status.
    const inquiry = await base44.asServiceRole.entities.EventCenterInquiry.create({
      contact_name,
      email,
      phone: phone || null,
      event_type: event_type || null,
      preferred_day: preferred_day || 'Flexible',
      preferred_date: preferred_date || null,
      event_date: event_date || preferred_date || null,
      guest_count: parseInt(guest_count) || 0,
      package: pkg || 'Not Sure',
      package_name: package_name || pkg || null,
      selected_talent_ids: Array.isArray(selected_talent_ids) ? selected_talent_ids : [],
      selected_addon_ids: Array.isArray(selected_addon_ids) ? selected_addon_ids : [],
      selected_menu_item_ids: Array.isArray(selected_menu_item_ids) ? selected_menu_item_ids : [],
      estimated_total: Number(estimated_total) || 0,
      deposit_amount: depositAmount,
      deposit_status: 'Unpaid',
      message: message || null,
      status: 'New',
    });

    // Confirmation is sent by the payments webhook once the deposit is paid.
    return Response.json({ success: true, inquiry });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}