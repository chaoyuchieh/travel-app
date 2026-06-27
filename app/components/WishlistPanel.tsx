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
}

interface Trip {
  id: string
  start_date: string
  end_date: string
}

function EditPlaceModal({ place, onClose, onUpdated }: { place: WishlistPlace; onClose: () => void; onUpdated: (p: WishlistPlace) => void }) {
  const [form, setForm] = useState({ name: place.name, address: place.address || "", url: place.url || "", note: place.note || "" })
  const [loading, setLoading] = useState(false)
  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  async function handleSave() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('wishlist_places').update(form).eq('id', place.id).select().single()
      if (error) throw error
      onUpdated(data)
    } catch (e) {
      alert('更新失敗')
    } finally {
      setLoading(false)
    }
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: place.id,
    data: { place }
  })

  return (
    <div ref={setNodeRef}
      style={{
        background: "white", border: "1px solid #eee", borderRadius: 16,
        padding: "12px 14px", opacity: isDragging ? 0.4 : 1,
        transform: CSS.Translate.toString(transform),
        display: "flex", alignItems: "flex-start", gap: 10,
        touchAction: "none"
      }}>
      <div {...attributes} {...listeners} style={{ color: "#ccc", fontSize: 18, cursor: "grab", paddingTop: 2, flexShrink: 0 }}>⠿</div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>📍 {place.name}</p>
        {place.address && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{place.address}</p>}
        {place.url && <a href={place.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: "#185FA5", marginTop: 2 }}>🔗 查看網頁</a>}
        {place.note && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{place.note}</p>}
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
  const [form, setForm] = useState({ name: "", address: "", url: "", note: "" })
  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 14, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const { data } = await supabase.from('wishlist_places').select('*').eq('trip_id', tripId).order('created_at')
        setPlaces(data || [])
      } catch (error) {
        console.error('Failed to fetch places:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlaces()
  }, [tripId])

  async function addPlace() {
    if (!form.name.trim()) return
    try {
      const { data, error } = await supabase.from('wishlist_places').insert({ trip_id: tripId, ...form }).select().single()
      if (error) throw error
      setPlaces(prev => [...prev, data])
      setForm({ name: "", address: "", url: "", note: "" })
      setShowAdd(false)
    } catch (e) {
      alert('新增失敗')
    }
  }

  async function deletePlace(id: string) {
    if (!confirm('確定刪除？')) return
    try {
      await supabase.from('wishlist_places').delete().eq('id', id)
      setPlaces(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      alert('刪除失敗')
    }
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
              {donePlaces.map(place => (
                <div key={place.id} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 16, padding: "12px 14px", opacity: 0.6, display: "flex", alignItems: "center", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 14, flex: 1, textDecoration: "line-through", color: "#888" }}>📍 {place.name}</p>
                  <button onClick={() => deletePlace(place.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
