import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EXPENSE_CATEGORIES = [
  "Food & Beverage",
  "Software Subscriptions",
  "Office Supplies",
  "Utilities",
  "Equipment & Maintenance",
  "Marketing & Advertising",
  "Professional Services",
  "Staffing & Labor",
  "Rent & Facilities",
  "Insurance",
  "Logistics & Shipping",
  "Other"
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { file_url } = await req.json();
  if (!file_url) {
    return Response.json({ error: 'file_url is required' }, { status: 400 });
  }

  const extracted = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a data extraction assistant for a restaurant business. Analyze this vendor invoice PDF and extract all key financial and payment information.

Extract the following fields if present:
- vendor_name: The vendor/supplier company name
- invoice_number: Invoice or receipt number/identifier
- invoice_date: Date of invoice (YYYY-MM-DD format)
- due_date: Overall payment due date (YYYY-MM-DD format), if present
- subtotal: Pre-tax subtotal amount (number only, no currency symbols)
- tax_rate: Tax rate as a percentage number (e.g., 9.25 for 9.25%)
- tax_amount: Tax amount (number only)
- total: Total invoice amount including tax (number only)
- notes: Any special payment terms, conditions, or notes
- line_items: Array of line items, each with: name (string), quantity (number), unit_price (number), line_total (number)
- payment_terms: Payment terms if mentioned (e.g., "Net 30", "Due on receipt", "3 installments")
- installment_plan: If the invoice mentions installments or split payments, one of: "None", "Specific Dates", "30 Days Apart"
- first_payment_due: If installment plan detected, the first payment due date (YYYY-MM-DD)
- expense_category: Based on the vendor name, line items, and description, assign the most appropriate expense category. Choose EXACTLY one from this list: ${EXPENSE_CATEGORIES.join(', ')}. Use "Food & Beverage" for produce, meat, seafood, dairy, or any food/drink suppliers. Use "Software Subscriptions" for SaaS, software, digital tools. Use "Utilities" for electricity, gas, water, internet, phone. Use "Equipment & Maintenance" for kitchen equipment, repairs, hardware. Use "Staffing & Labor" for staffing agencies, payroll services. Use "Professional Services" for accounting, legal, consulting. Use "Marketing & Advertising" for ads, design, printing. Use "Rent & Facilities" for rent, lease, cleaning services. Default to "Other" if unclear.
- category_confidence: Your confidence in the category assignment: "high", "medium", or "low"
- category_reasoning: A brief one-sentence explanation of why you chose this category

Return ONLY valid JSON. If a field cannot be determined from the document, set it to null. Do not guess monetary values.`,
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        vendor_name: { type: 'string' },
        invoice_number: { type: 'string' },
        invoice_date: { type: 'string' },
        due_date: { type: 'string' },
        subtotal: { type: 'number' },
        tax_rate: { type: 'number' },
        tax_amount: { type: 'number' },
        total: { type: 'number' },
        notes: { type: 'string' },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' },
              line_total: { type: 'number' },
            },
          },
        },
        payment_terms: { type: 'string' },
        installment_plan: { type: 'string' },
        first_payment_due: { type: 'string' },
        expense_category: { type: 'string' },
        category_confidence: { type: 'string' },
        category_reasoning: { type: 'string' },
      },
    },
  });

  return Response.json({ extracted });
});