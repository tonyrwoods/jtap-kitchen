// Admin-only: generates signed pay-at-table tokens for a list of table
// numbers, used by the printable plaque page to embed per-table tokens in
// the QR codes. The tokens are verified by getTableBill before returning
// any bill data, so a table number alone is not enough to read a bill.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { generateTableBillToken } from '../../shared/tableBillToken.js';

export default async function(req: Request) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { table_numbers } = await req.json().catch(() => ({}));
    if (!Array.isArray(table_numbers)) {
      return Response.json({ error: 'table_numbers array required' }, { status: 400 });
    }
    const tokens: Record<string, string> = {};
    for (const n of table_numbers) {
      const num = Number(n);
      if (Number.isFinite(num) && num >= 1 && num <= 999) {
        tokens[String(num)] = await generateTableBillToken(num);
      }
    }
    return Response.json({ tokens });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}