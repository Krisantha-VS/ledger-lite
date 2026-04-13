"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Lock, Check, X, Tag } from "lucide-react";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { Category, CategoryType } from "@/shared/types";

const PRESET_COLOURS = ["#94a3b8", "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

// ── New category form state ─────────────────────────────

interface NewForm {
  name: string;
  icon: string;
  colour: string;
  type: CategoryType;
}

const DEFAULT_NEW: NewForm = { name: "", icon: "📦", colour: "#6366f1", type: "expense" };

// ── Edit state ──────────────────────────────────────────

interface EditState {
  id: number;
  name: string;
  icon: string;
  colour: string;
}

// ── Section component ───────────────────────────────────

function ColourPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {PRESET_COLOURS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-5 w-5 cursor-pointer rounded-full border-2 transition-transform hover:scale-110"
          style={{
            background: c,
            borderColor: value === c ? "hsl(var(--ll-text-primary))" : "transparent",
          }}
          aria-label={`Colour ${c}`}
        />
      ))}
    </div>
  );
}

function CategoryRow({
  cat,
  onEdit,
  onDelete,
  editState,
  onEditChange,
  onEditSave,
  onEditCancel,
  saving,
}: {
  cat: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
  editState: EditState | null;
  onEditChange: (patch: Partial<EditState>) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  saving: boolean;
}) {
  const isEditing = editState?.id === cat.id;

  if (isEditing && editState) {
    return (
      <div className="ll-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
            style={{ background: editState.colour + "33", color: editState.colour }}
          >
            <CategoryIcon icon={editState.icon} size={15} />
          </div>
          <input
            className="ll-input flex-1 text-sm"
            value={editState.name}
            onChange={e => onEditChange({ name: e.target.value })}
            placeholder="Category name"
            autoFocus
          />
          <input
            className="ll-input w-16 text-center text-sm"
            value={editState.icon}
            onChange={e => onEditChange({ icon: e.target.value })}
            placeholder="Icon"
            maxLength={4}
          />
        </div>
        <div className="flex items-center justify-between">
          <ColourPicker value={editState.colour} onChange={colour => onEditChange({ colour })} />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onEditCancel}
              className="rounded-lg p-1.5 transition-colors hover:bg-rose-500/10"
              style={{ color: "hsl(var(--ll-text-muted))" }}
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onEditSave}
              disabled={saving || !editState.name.trim()}
              className="rounded-lg p-1.5 transition-colors disabled:opacity-50"
              style={{
                background: "hsl(var(--ll-accent) / 0.15)",
                color: "hsl(var(--ll-accent))",
              }}
              aria-label="Save edit"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ll-card flex items-center gap-3 p-3">
      {/* Colour icon circle */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ background: cat.colour + "33", color: cat.colour }}
      >
        <CategoryIcon icon={cat.icon} size={15} />
      </div>

      {/* Name + badges */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span
          className="truncate text-sm font-medium"
          style={{ color: "hsl(var(--ll-text-primary))" }}
        >
          {cat.name}
        </span>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            background: cat.type === "income"
              ? "hsl(var(--ll-income) / 0.12)"
              : cat.type === "expense"
              ? "hsl(var(--ll-expense) / 0.12)"
              : "hsl(var(--ll-accent) / 0.12)",
            color: cat.type === "income"
              ? "hsl(var(--ll-income))"
              : cat.type === "expense"
              ? "hsl(var(--ll-expense))"
              : "hsl(var(--ll-accent))",
          }}
        >
          {cat.type}
        </span>
        {cat.isSystem && (
          <span
            className="flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: "hsl(var(--ll-text-muted) / 0.1)",
              color: "hsl(var(--ll-text-muted))",
            }}
          >
            <Lock className="h-2.5 w-2.5" />
            system
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {!cat.isSystem && (
          <button
            type="button"
            onClick={() => onEdit(cat)}
            className="rounded p-1.5 transition-colors hover:bg-[hsl(var(--ll-accent)/0.1)]"
            style={{ color: "hsl(var(--ll-text-muted))" }}
            aria-label={`Edit ${cat.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(cat.id)}
          disabled={cat.isSystem}
          className="rounded p-1.5 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-30"
          style={{ color: "hsl(var(--ll-text-muted))" }}
          aria-label={cat.isSystem ? "System category cannot be deleted" : `Delete ${cat.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main view ───────────────────────────────────────────

export function CategoriesView() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();

  const [showNew, setShowNew]         = useState(false);
  const [newForm, setNewForm]         = useState<NewForm>(DEFAULT_NEW);
  const [creating, setCreating]       = useState(false);
  const [editState, setEditState]     = useState<EditState | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleteId, setDeleteId]       = useState<number | null>(null);

  const income  = categories.filter(c => c.type === "income");
  const expense = categories.filter(c => c.type === "expense");
  const both    = categories.filter(c => c.type === "both");

  const handleCreate = async () => {
    if (!newForm.name.trim()) return;
    setCreating(true);
    try {
      await createCategory(newForm);
      setNewForm(DEFAULT_NEW);
      setShowNew(false);
    } finally {
      setCreating(false);
    }
  };

  const handleEditStart = (cat: Category) => {
    setEditState({ id: cat.id, name: cat.name, icon: cat.icon, colour: cat.colour });
  };

  const handleEditSave = async () => {
    if (!editState || !editState.name.trim()) return;
    setSaving(true);
    try {
      await updateCategory({
        id: editState.id,
        name: editState.name,
        icon: editState.icon,
        colour: editState.colour,
      });
      setEditState(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    try {
      await deleteCategory(deleteId);
    } finally {
      setDeleteId(null);
    }
  };

  const renderSection = (title: string, items: Category[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "hsl(var(--ll-text-muted))" }}
        >
          {title}
        </h2>
        <div className="space-y-1.5">
          {items.map(cat => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              onEdit={handleEditStart}
              onDelete={setDeleteId}
              editState={editState}
              onEditChange={patch => setEditState(prev => prev ? { ...prev, ...patch } : prev)}
              onEditSave={handleEditSave}
              onEditCancel={() => setEditState(null)}
              saving={saving}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
            Categories
          </h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            Organise your transactions
          </p>
        </div>
        <button
          onClick={() => { setShowNew(v => !v); setNewForm(DEFAULT_NEW); }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white"
          style={{ background: "hsl(var(--ll-accent))" }}
          aria-label="New category"
        >
          <Plus className="h-3.5 w-3.5" />
          New Category
        </button>
      </div>

      {/* Inline new form */}
      {showNew && (
        <div className="ll-card space-y-3 p-4">
          <p className="text-xs font-semibold" style={{ color: "hsl(var(--ll-text-secondary))" }}>
            New Category
          </p>
          {/* Row 1: icon preview + name */}
          <div className="flex items-center gap-2">
            <div
              className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-base"
              style={{ background: newForm.colour + "33", color: newForm.colour }}
            >
              <CategoryIcon icon={newForm.icon} size={18} />
            </div>
            <input
              className="ll-input flex-1 text-sm"
              placeholder="Name"
              value={newForm.name}
              onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>
          {/* Row 2: quick emoji picker */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {["📦", "🛒", "🏠", "💊", "🚗", "⚡", "💰", "🎮", "🍔", "✈️"].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewForm(f => ({ ...f, icon: emoji }))}
                  className="rounded-md px-1.5 py-1 text-base transition-colors hover:bg-white/10"
                  style={{
                    background: newForm.icon === emoji ? newForm.colour + "33" : "transparent",
                    outline: newForm.icon === emoji ? `1.5px solid ${newForm.colour}` : "none",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              className="ll-input w-36 text-sm"
              placeholder="or type emoji…"
              value={newForm.icon}
              onChange={e => setNewForm(f => ({ ...f, icon: e.target.value }))}
              maxLength={4}
            />
          </div>
          {/* Row 3: colour + type */}
          <div className="flex items-center gap-3">
            <ColourPicker
              value={newForm.colour}
              onChange={colour => setNewForm(f => ({ ...f, colour }))}
            />
            <select
              className="ll-input ml-auto w-32 text-sm"
              value={newForm.type}
              onChange={e => setNewForm(f => ({ ...f, type: e.target.value as CategoryType }))}
              aria-label="Category type"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="both">Both</option>
            </select>
          </div>
          {/* Row 4: actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
              style={{
                background: "var(--ll-bg-elevated)",
                color: "hsl(var(--ll-text-secondary))",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newForm.name.trim()}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "hsl(var(--ll-accent))" }}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create categories to organise your transactions"
          action={
            <button
              onClick={() => setShowNew(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "hsl(var(--ll-accent))" }}
            >
              Add Category
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {renderSection("Income", income)}
          {renderSection("Expense", expense)}
          {renderSection("Both", both)}
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete category?"
        description="This category will be permanently removed. It cannot be deleted if it has transactions or budgets."
      />
    </div>
  );
}
