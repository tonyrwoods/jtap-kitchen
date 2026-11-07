const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Renders today's opening checklist (checks + signoffs) into a print-only
// document and opens the browser print dialog. Uses a hidden iframe so the
// admin layout isn't affected.
export function printOpeningChecklist({ sections, checked, signoffs, dateLabel }) {
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const completed = sections.reduce(
    (n, s) => n + s.items.filter((i) => checked[`${s.title}::${i}`]).length,
    0
  );

  const sectionsHtml = sections
    .map((section) => {
      const done = section.items.filter((i) => checked[`${section.title}::${i}`]).length;
      const rows = section.items
        .map((item) => {
          const isDone = !!checked[`${section.title}::${item}`];
          return `<li class="${isDone ? "done" : ""}"><span class="box">${isDone ? "&#10003;" : ""}</span><span class="txt">${esc(item)}</span></li>`;
        })
        .join("");
      return `<section><h2>${esc(section.title)}<span class="count">${done}/${section.items.length}</span></h2><ul>${rows}</ul></section>`;
    })
    .join("");

  const signoffRows = [
    ["Manager on Duty", signoffs.manager],
    ["FOH Lead", signoffs.foh_lead],
    ["Kitchen Lead", signoffs.kitchen_lead],
  ]
    .map(
      ([label, value]) =>
        `<tr><td class="label">${esc(label)}</td><td class="line">${esc(value) || "&nbsp;"}</td><td class="sig">&nbsp;</td></tr>`
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Opening Checklist - ${esc(dateLabel)}</title>
<style>
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #111; font-size: 11.5px; margin: 0; }
  header { border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
  h1 { font-size: 20px; margin: 0 0 3px; letter-spacing: 0.02em; }
  .meta { margin: 0; color: #444; font-size: 11px; }
  section { margin-bottom: 13px; break-inside: avoid; page-break-inside: avoid; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 5px;
       border-bottom: 1px solid #999; padding-bottom: 3px; display: flex; justify-content: space-between; }
  h2 .count { font-weight: normal; color: #555; letter-spacing: 0; text-transform: none; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: flex; align-items: flex-start; gap: 7px; padding: 3px 0; break-inside: avoid; }
  .box { width: 12px; height: 12px; border: 1.2px solid #333; display: inline-flex;
         align-items: center; justify-content: center; font-size: 10px; line-height: 1; flex: 0 0 auto; margin-top: 1px; }
  .done .txt { color: #555; text-decoration: line-through; }
  .signoff { margin-top: 18px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; vertical-align: bottom; }
  td.label { width: 32%; font-weight: bold; }
  td.line { border-bottom: 1px solid #333; }
  td.sig { width: 32%; border-bottom: 1px solid #333; padding-left: 14px; }
  footer { margin-top: 16px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 6px; }
</style></head><body>
<header>
  <h1>Opening Checklist</h1>
  <p class="meta">JTAP Kitchen &middot; ${esc(dateLabel)} &middot; ${completed} of ${total} completed</p>
</header>
${sectionsHtml}
<div class="signoff">
  <section><h2>Staff Signoff</h2>
    <table>${signoffRows}</table>
  </section>
</div>
<footer>Please inform your manager of anything incomplete before opening.</footer>
<script>window.onload = function () { window.focus(); window.print(); };<\/script>
</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Opening checklist print view");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  iframe.contentWindow.onafterprint = cleanup;
  setTimeout(cleanup, 120000);
}

export default printOpeningChecklist;