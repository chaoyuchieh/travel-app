"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

interface WishlistPlace {
  id: string
  trip_id: string
  name: string
  address: string
  url: string
  note: string
  added: boolean
  category: string
}

interface Trip {
  id: string
  start_date: string
  end_date: string
}

const CAT_META: Record<string, { icon: string; color: string; label: string }> = {
  attraction: { icon: "🏛️", color: "#378ADD", label: "景點" },
  food: { icon: "🍜", color: "#1D9E75", label: "餐廳" },
  hotel: { icon: "🏨", color: "#7F77DD", label: "住宿" },
  transport: { icon: "🚆", color: "#BA7517", label: "交通" },
  coffee: { icon: "☕", color: "#A0522D", label: "咖啡" },
  massage: { icon: "💆", color: "#E91E8C", label: "按摩" },
  other: { icon: "📌", color: "#888780", label: "其他" },
}

function EditPlaceModal({ place, onClose, onUpdated }: { place: WishlistPlace; onClose: () => void; onUpdated: (p: WishlistPlace) => void }) {
  const [form, setForm] = useState({ name: place.name, address: place.address || "", url: place.url || "", note: place.note || "", category: place.category || "attraction" })
  const [loading, setLoading] = useState(false)
  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  async function handleSave() {
    setLoading(true)
    const { data, error } = await supabase.from('wishlist_places').update(form).eq('id', place.id).select().single()
    if (error) { alert('更新失敗'); setLoading(false); return }
    onUpdated(data)
    setLoading(false)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 440, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>編輯地點</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>地點名稱</label><input style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>類別</label>
            <select style={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>地址</label><input style={inp} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
          <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>網址</label><input style={inp} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} /></div>
          <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>備註</label><input style={inp} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", fontSize: 14, cursor: "pointer", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 10 }}>取消</button>
          <button onClick={handleSave} disabled={!form.name.trim() || loading} style={{ flex: 2, padding: "10px", fontSize: 14, fontWeight: 500, cursor: "pointer", background: form.name.trim() && !loading ? "#185FA5" : "#ddd", color: form.name.trim() && !loading ? "white" : "#999", border: "none", borderRadius: 10 }}>
            {loading ? "儲存中…" : "儲存變更"}
          </button>
        </div>
      </div>
    </div>
  )
}

function DraggablePlace({ place, onEdit, onDelete }: { place: WishlistPlace; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: place.id, data: { place } })
  const cat = CAT_META[place.category] || CAT_META.other

  return (
    <div ref={setNodeRef}
      style={{
        background: "white", border: "1px solid #eee", borderRadius: 16,
        padding: "14px 16px", opacity: isDragging ? 0.4 : 1,
        transform: CSS.Translate.toString(transform),
        display: "flex", alignItems: "flex-start", gap: 12,
        touchAction: "none"
      }}>
      <div {...attributes} {...listeners} style={{ color: "#ccc", fontSize: 18, cursor: "grab", paddingTop: 2, flexShrink: 0 }}>⠿</div>
      <div style={{ fontSize: 18, flexShrink: 0, paddingTop: 2 }}>{cat.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{place.name}</p>
          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: cat.color + "20", color: cat.color, whiteSpace: "nowrap" }}>{cat.label}</span>
        </div>
        {place.address && (
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: "#185FA5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            📍 {place.address}
            <span style={{ fontSize: 10, background: "#E6F1FB", padding: "1px 6px", borderRadius: 99 }}>導航 →</span>
          </a>
        )}
        {place.url && <a href={place.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: "#185FA5", marginTop: 2 }}>🔗 查看網頁</a>}
        {place.note && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888", fontStyle: "italic" }}>{place.note}</p>}
      </div>
      <div style={{ display: "flex", gap: 6 }} onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
        <button onClick={onEdit} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>✏️</button>
        <button onClick={onDelete} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
      </div>
    </div>
  )
}

export default function WishlistPanel({ tripId, trip }: { tripId: string; trip: Trip }) {
  const [places, setPlaces] = useState<WishlistPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingPlace, setEditingPlace] = useState<WishlistPlace | null>(null)
  const [form, setForm] = useState({ name: "", address: "", url: "", note: "", category: "attraction" })

  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  useEffect(() => {
    supabase.from('wishlist_places').select('*').eq('trip_id', tripId).order('created_at')
      .then(({ data }) => setPlaces(data || []))
      .finally(() => setLoading(false))
  }, [tripId])

  async function addPlace() {
    if (!form.name.trim()) return
    const { data, error } = await supabase.from('wishlist_places').insert({ trip_id: tripId, ...form }).select().single()
    if (error) { alert('新增失敗'); return }
    setPlaces(prev => [...prev, data])
    setForm({ name: "", address: "", url: "", note: "", category: "attraction" })
    setShowAdd(false)
  }

  async function deletePlace(id: string) {
    if (!confirm('確定刪除？')) return
    await supabase.from('wishlist_places').delete().eq('id', id)
    setPlaces(prev => prev.filter(p => p.id !== id))
  }

  const pendingPlaces = places.filter(p => !p.added)
  const donePlaces = places.filter(p => p.added)

  return (
    <div>
      {editingPlace && (
        <EditPlaceModal
          place={editingPlace}
          onClose={() => setEditingPlace(null)}
          onUpdated={updated => {
            setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditingPlace(null)
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>📍 想去清單</p>
        <button onClick={() => setShowAdd(true)} style={{ background: "#185FA5", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>+ 新增</button>
      </div>

      {showAdd && (
        <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: "14px", marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input style={inp} placeholder="地點名稱*" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <select style={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input style={inp} placeholder="地址（填入後可導航）" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            <input style={inp} placeholder="網址（選填）" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
            <input style={inp} placeholder="備註（選填）" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 8, fontSize: 14, cursor: "pointer", background: "white", border: "1px solid #ddd", borderRadius: 8 }}>取消</button>
              <button onClick={addPlace} disabled={!form.name.trim()} style={{ flex: 2, padding: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", background: form.name.trim() ? "#185FA5" : "#ddd", border: "none", borderRadius: 8, color: form.name.trim() ? "white" : "#999" }}>加入清單</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "#888", fontSize: 14 }}>載入中...</p>
      ) : places.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>🗺️</p>
          <p style={{ margin: 0, fontSize: 14 }}>還沒有想去的地方</p>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>新增後可拖曳到上方日期加入行程</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pendingPlaces.map(place => (
            <DraggablePlace key={place.id} place={place} onEdit={() => setEditingPlace(place)} onDelete={() => deletePlace(place.id)} />
          ))}
          {donePlaces.length > 0 && (
            <>
              <p style={{ margin: "8px 0 4px", fontSize: 12, color: "#888" }}>✅ 已加入行程</p>
              {donePlaces.map(place => {
                const cat = CAT_META[place.category] || CAT_META.other
                return (
                  <div key={place.id} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 16, padding: "12px 14px", opacity: 0.6, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <p style={{ margin: 0, fontSize: 14, flex: 1, textDecoration: "line-through", color: "#888" }}>{place.name}</p>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: cat.color + "20", color: cat.color }}>{cat.label}</span>
                    <button onClick={() => deletePlace(place.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}