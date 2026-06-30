"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"

interface ShoppingItem {
  id: string
  trip_id: string
  name: string
  store: string
  budget: number
  purchased: boolean
  note: string
  image_url: string
}

export default function ShoppingPanel({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", store: "", budget: "", note: "" })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  useEffect(() => {
    supabase.from('shopping_items').select('*').eq('trip_id', tripId).order('created_at')
      .then(({ data }) => {
        setItems(data || [])
        setLoading(false)
      })
  }, [tripId])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function addItem() {
    if (!form.name.trim()) return
    setUploading(true)
    try {
      let image_url = ""
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${tripId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('shopping-images')
          .upload(path, imageFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage
          .from('shopping-images')
          .getPublicUrl(path)
        image_url = urlData.publicUrl
      }

      const { data, error } = await supabase.from('shopping_items').insert({
        trip_id: tripId,
        name: form.name,
        store: form.store,
        budget: form.budget ? parseFloat(form.budget) : null,
        note: form.note,
        image_url,
      }).select().single()

      if (error) throw error
      setItems(prev => [...prev, data])
      setForm({ name: "", store: "", budget: "", note: "" })
      setImageFile(null)
      setImagePreview(null)
      setShowAdd(false)
    } catch (e) {
      alert('新增失敗')
    } finally {
      setUploading(false)
    }
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

      {totalBudget > 0 && (
        <div style={{ background: "#E6F1FB", borderRadius: 10, padding: "8px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#185FA5" }}>預計花費</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#185FA5" }}>{totalBudget.toLocaleString()}</p>
        </div>
      )}

      {showAdd && (
        <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: "14px", marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input style={inp} placeholder="商品名稱*" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input style={inp} placeholder="購買地點／店家（選填）" value={form.store} onChange={e => setForm(p => ({ ...p, store: e.target.value }))} />
            <input style={inp} type="number" placeholder="預算（選填）" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
            <input style={inp} placeholder="備註（選填）" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />

            {/* 照片上傳 */}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} style={{ display: "none" }} />
              <button onClick={() => fileInputRef.current?.click()} style={{
                width: "100%", padding: "10px", fontSize: 13, cursor: "pointer",
                background: "white", border: "1px dashed #ddd", borderRadius: 8,
                color: "#888", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
                📷 {imagePreview ? "重新選擇照片" : "新增商品照片（選填）"}
              </button>
              {imagePreview && (
                <div style={{ marginTop: 8, position: "relative" }}>
                  <img src={imagePreview} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} />
                  <button onClick={() => { setImageFile(null); setImagePreview(null) }} style={{
                    position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.5)",
                    color: "white", border: "none", borderRadius: 99, width: 24, height: 24, cursor: "pointer", fontSize: 12
                  }}>✕</button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowAdd(false); setImageFile(null); setImagePreview(null) }} style={{ flex: 1, padding: 8, fontSize: 14, cursor: "pointer", background: "white", border: "1px solid #ddd", borderRadius: 8 }}>取消</button>
              <button onClick={addItem} disabled={!form.name.trim() || uploading} style={{ flex: 2, padding: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", background: form.name.trim() && !uploading ? "#185FA5" : "#ddd", border: "none", borderRadius: 8, color: form.name.trim() && !uploading ? "white" : "#999" }}>
                {uploading ? "上傳中…" : "加入清單"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "#888", fontSize: 14 }}>載入中...</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🛒</p>
          <p style={{ margin: 0, fontSize: 14 }}>還沒有購物清單</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pending.map(item => (
            <div key={item.id} style={{ background: "white", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
              {item.image_url && (
                <img src={item.image_url} style={{ width: "100%", height: 160, objectFit: "cover" }} />
              )}
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
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
                    <button onClick={() => togglePurchased(item)} style={{ width: 22, height: 22, borderRadius: 50, border: "none", background: "#1D9E75", cursor: "pointer", flexShrink: 0, fontSize: 12, color: "white" }}>✓</button>
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