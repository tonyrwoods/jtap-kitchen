import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, X } from "lucide-react";

const SECTIONS = ["Main Dining", "Bar", "Patio", "Private Room", "Chef's Table"];
const SHAPES = ["round", "square", "rectangle"];
const STATUSES = ["Available", "Reserved", "Occupied", "Unavailable"];

const STATUS_STYLES = {
  Available: "bg-green-100 border-green-400 text-green-800",
  Reserved: "bg-blue-100 border-blue-400 text-blue-800",
  Occupied: "bg-orange-100 border-orange-400 text-orange-800",
  Unavailable: "bg-gray-200 border-gray-400 text-gray-600",
};

function TableCard({ table, onStatusChange, onEdit, onDelete }) {
  const shapeClass = table.shape === "round" ? "rounded-full" : table.shape === "rectangle" ? "rounded-xl" : "rounded-lg";
  return (
    <div className={`relative border-2 ${shapeClass} ${STATUS_STYLES[table.status] || STATUS_STYLES.Available} p-3 flex flex-col items-center justify-center min-h-[100px] cursor-pointer transition-all hover:shadow-md`}>
      <p className="font-heading text-lg font-bold">{table.table_number}</p>
      <div className="flex items-center gap-1 text-xs">
        <Users className="w-3 h-3" />
        <span>{table.capacity}</span>
      </div>
      <p className="text-[10px] font-medium mt-0.5">{table.status}</p>
      {/* Quick status change */}
      <select
        value={table.status}
        onChange={(e) => onStatusChange(table.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={`Change status for table ${table.table_number}`}
      />
      {/* Edit/Delete buttons */}
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit(table); }} className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:text-primary">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(table.id); }} className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:text-destructive">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function TableForm({ table, onSave, onCancel }) {
  const [form, setForm] = useState(table || {
    table_number: "",
    capacity: 4,
    section: "Main Dining",
    shape: "square",
    status: "Available",
    floor_plan_x: 0,
    floor_plan_y: 0,
    is_active: true,
    notes: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, table_number: Number(form.table_number), capacity: Number(form.capacity) };
    if (table?.id) {
      await base44.entities.Table.update(table.id, data);
    } else {
      await base44.entities.Table.create(data);
    }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <h3 className="font-heading text-lg font-semibold">{table?.id ? "Edit" : "Add"} Table</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Table # *</label>
          <input type="number" required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.table_number} onChange={e => setForm({ ...form, table_number: e.target.value })} />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Capacity *</label>
          <input type="number" required className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Section</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Shape</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.shape} onChange={e => setForm({ ...form, shape: e.target.value })}>
            {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Status</label>
          <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="font-body text-xs text-muted-foreground mb-1 block">Active</label>
          <label className="flex items-center h-[38px] gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
            <span className="font-body text-sm">Available for seating</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-border rounded-full font-body text-sm">Cancel</button>
      </div>
    </form>
  );
}

export default function TableManagementTab() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const page = await base44.entities.Table.filter(
        { is_active: { $ne: false } },
        { sort: "table_number", limit: 200 }
      );
      setTables(page.items || []);
    } catch {
      toast.error("Could not load tables");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Real-time updates
    const unsub = base44.entities.Table.subscribe(() => load());
    return unsub;
  }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await base44.entities.Table.update(id, { status });
      setTables(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch {
      toast.error("Could not update table status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this table?")) return;
    try {
      await base44.entities.Table.delete(id);
      setTables(prev => prev.filter(t => t.id !== id));
      toast.success("Table deleted");
    } catch {
      toast.error("Could not delete table");
    }
  };

  const handleSave = () => {
    load();
    setShowForm(false);
    setEditing(null);
  };

  // Group by section
  const bySection = SECTIONS.map(section => ({
    section,
    tables: tables.filter(t => t.section === section),
  }));

  // Status summary
  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = tables.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map(s => (
          <div key={s} className={`border-2 rounded-xl p-3 ${STATUS_STYLES[s]}`}>
            <p className="text-2xl font-heading font-bold">{statusCounts[s] || 0}</p>
            <p className="text-xs font-medium">{s}</p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Floor Plan</h3>
        {!showForm && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Table
          </button>
        )}
      </div>

      {showForm && (
        <TableForm table={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tables yet. Click "Add Table" to create your floor plan.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bySection.map(({ section, sectionTables }) => sectionTables.length > 0 && (
            <div key={section}>
              <h4 className="font-body text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">{section}</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 group">
                {sectionTables.map(table => (
                  <div key={table.id} className="group relative">
                    <TableCard
                      table={table}
                      onStatusChange={handleStatusChange}
                      onEdit={(t) => { setEditing(t); setShowForm(true); }}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="font-body text-xs text-muted-foreground text-center">
        Click a table and use the dropdown to change its status. Changes update in real time for all staff.
      </p>
    </div>
  );
}