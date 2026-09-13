import React, { useEffect, useState } from 'react';
import { VendorsAPI, VendorPanelAPI } from '../api/client';

export default function Menu({ vendor }) {
  const [catalog, setCatalog] = useState(null);
  const isSupermarket = vendor.type === 'SUPERMARKET';
  const [form, setForm] = useState({ categoryId: '', name: '', price: '', description: '', weightKg: '', brand: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const data = await VendorsAPI.get(vendor.id);
    setCatalog(data);
    setForm((f) => (f.categoryId ? f : { ...f, categoryId: data.categories[0]?.id || '' }));
  }

  useEffect(() => { load(); }, [vendor.id]);

  async function toggleStock(product) {
    await VendorPanelAPI.updateProduct(vendor.id, product.id, { inStock: !product.inStock });
    load();
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    setError('');
    try {
      const category = await VendorPanelAPI.addCategory(vendor.id, newCategoryName.trim());
      setNewCategoryName('');
      await load();
      setForm((f) => ({ ...f, categoryId: category.id }));
    } catch (err) {
      setError(err?.response?.data?.error?.formErrors?.[0] || 'Could not add category.');
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!form.categoryId || !form.name || !form.price) {
      setError('Category, name, and price are required.');
      return;
    }
    setSaving(true);
    try {
      const attributes = isSupermarket
        ? { weightKg: form.weightKg ? Number(form.weightKg) : undefined, brand: form.brand || undefined }
        : undefined;
      await VendorPanelAPI.addProduct(vendor.id, {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        attributes,
      });
      setForm({ ...form, name: '', price: '', description: '', weightKg: '', brand: '' });
      load();
    } catch (err) {
      setError(err?.response?.data?.error?.formErrors?.[0] || 'Could not add item.');
    } finally {
      setSaving(false);
    }
  }

  if (!catalog) return <p style={{ color: 'var(--muted)' }}>Loading menu…</p>;

  return (
    <div>
      <h1>{isSupermarket ? 'Catalog' : 'Menu'} — {vendor.name}</h1>

      <h2>Categories</h2>
      <form className="card" onSubmit={handleAddCategory} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>New category name</label>
          <input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder={isSupermarket ? 'e.g. Frozen Foods' : 'e.g. Desserts'} />
        </div>
        <button className="btn btn-secondary" disabled={addingCategory}>{addingCategory ? 'Adding…' : 'Add category'}</button>
      </form>

      <h2>Add an item</h2>
      <form className="card" onSubmit={handleAdd}>
        {error && <div className="error-text">{error}</div>}
        {catalog.categories.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Add a category above before you can add items.</p>
        ) : (
          <>
            <div className="field">
              <label>Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {catalog.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isSupermarket ? 'e.g. Tomatoes' : 'e.g. Charcoal Kofta Plate'} />
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={isSupermarket ? '' : 'toms, onion, garlic toum, flatbread'} />
            </div>
            <div className="field">
              <label>Price (EGP)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            {isSupermarket && (
              <>
                <div className="field">
                  <label>Weight (kg, optional)</label>
                  <input type="number" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="1" />
                </div>
                <div className="field">
                  <label>Brand (optional)</label>
                  <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Juhayna" />
                </div>
              </>
            )}
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add item'}</button>
          </>
        )}
      </form>

      {catalog.categories.map((cat) => (
        <div key={cat.id}>
          <h2>{cat.name}</h2>
          <div className="card">
            {cat.products.length === 0 && <p style={{ color: 'var(--muted)' }}>No items in this category yet.</p>}
            {cat.products.map((p) => (
              <div className="product-row" key={p.id}>
                <div>
                  <strong>{p.name}</strong>
                  {p.description && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{p.description}</div>}
                  {p.attributes && (p.attributes.brand || p.attributes.weightKg) && (
                    <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                      {[p.attributes.brand, p.attributes.weightKg ? `${p.attributes.weightKg} kg` : null].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 700 }}>EGP {p.price}</div>
                <button className="btn btn-secondary" onClick={() => toggleStock(p)}>
                  {p.inStock ? 'Mark sold out' : 'Mark in stock'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
