"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

interface ShoppingItem {
  id: string
  trip_id: string
  name: string
  store: string
  budget: number
  purchased: boolean
  note: string
}

export default function ShoppingPanel({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", store: "", budget: "", note: "" })

  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await supabase.from('shopping_items').select('*').eq('trip_id', tripId).order('created_at')
        setItems(data || [])
      } catch (error) {
        console.error('Failed to fetch items:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [tripId])

  async function addItem() {
    if (!form.name.trim()) return
    const { data, error } = await supabase.from('shopping_items').insert({
      trip_id: tripId,
      name: form.name,
      store: form.store,
      budget: form.budget ? parseFloat(form.budget) : null,
      note: form.note,
    }).select().single()
    if (error) { alert('新增失敗'); return }
    setItems(prev => [...prev, data])
    setForm({ name: "", store: "", budget: "", note: "" })
    setShowAdd(false)
  }

  async function togglePurchased(item: ShoppingItem) {
    const { data } = await supabase.from('shopping_items').update({ purchased: !item.purchased }).eq('id', item.id).select().single()
    if (data) setItems(prev => prev.map(i => i.id === data.id ? data : i))
  }

  async function deleteItem(id: string) {
    if (!confirm('確定刪除？')) return
    await supabase.from('shopping_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const pending = items.filter(i => !i.purchased)
  const bought = items.filter(i => i.purchased)
  const totalBudget = pending.reduce((sum, i) => sum + (i.budget || 0), 0)

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>🛍️ 購物清單</p>
        <button onClick={() => setShowAdd(true)} style={{ background: "#185FA5", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>+ 新增</button>
      </div>

      {/* 預算總計 */}
      {totalBudget > 0 && (
        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#185FA5" }}>預計花費</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#185FA5" }}>{totalBudget.toLocaleString()}</p>
        </div>
      )}

      {showAdd && (
        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input style={inp} placeholder="商品名稱*" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input style={inp} placeholder="購買地點／店家（選填）" value={form.store} onChange={e => setForm(p => ({ ...p, store: e.target.value }))} />
            <input style={inp} type="number" placeholder="預算（選填）" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
            <input style={inp} placeholder="備註（選填）" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 8, fontSize: 13, cursor: "pointer", background: "white", border: "1px solid #ddd", borderRadius: 8 }}>取消</button>
              <button onClick={addItem} disabled={!form.name.trim()} style={{ flex: 2, padding: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", background: form.name.trim() ? "#185FA5" : "#ddd", color: "white", border: "none", borderRadius: 8 }}>新增</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "#888", fontSize: 13 }}>載入中...</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🛒</p>
          <p style={{ margin: 0, fontSize: 14 }}>還沒有購物清單</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map(item => (
            <div key={item.id} style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <button onClick={() => togglePurchased(item)} style={{ width: 22, height: 22, borderRadius: 50, border: "2px solid #ddd", background: "white", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{item.name}</p>
                  {item.store && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>🏪 {item.store}</p>}
                  {item.budget > 0 && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#185FA5" }}>💰 預算 {item.budget.toLocaleString()}</p>}
                  {item.note && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>{item.note}</p>}
                </div>
                <button onClick={() => deleteItem(item.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
              </div>
            </div>
          ))}

          {bought.length > 0 && (
            <>
              <p style={{ margin: "8px 0 4px", fontSize: 12, color: "#888" }}>✅ 已購買</p>
              {bought.map(item => (
                <div key={item.id} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", opacity: 0.6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => togglePurchased(item)} style={{ width: 22, height: 22, borderRadius: 50, border: "none", background: "#1D9E75", cursor: "pointer", flexShrink: 0, fontSize: 14 }}>✓</button>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, textDecoration: "line-through", color: "#888" }}>{item.name}</p>
                      {item.store && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#bbb" }}>🏪 {item.store}</p>}
                    </div>
                    <button onClick={() => deleteItem(item.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
