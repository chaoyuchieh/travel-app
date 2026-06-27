"use client"
import { useState, useEffect, useRef } from "react"
import { supabase, createItem, getItemsByTrip } from "../lib/supabase"
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent,
  useDroppable
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import WishlistPanel from "./WishlistPanel"
import ShoppingPanel from "./ShoppingPanel"

interface Trip {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  cover_emoji: string
  currency: string
  days_count: number
  items_count: number
}

interface ItineraryItem {
  id: string
  trip_id: string
  date: string
  sort_order: number
  title: string
  location: string
  start_time: string
  end_time: string
  note: string
  category: string
  est_cost: number
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function formatDate(d: string) {
  const date = new Date(d)
  const days = ["日", "一", "二", "三", "四", "五", "六"]
  return `${date.getMonth() + 1}/${date.getDate()}（${days[date.getDay()]}）`
}

function dateDiff(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1
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

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

function DroppableDate({ date, index, isActive, isOver, itemCount, tab }: {
  date: string; index: number; isActive: boolean; isOver: boolean; itemCount: number; tab: string
}) {
  const { setNodeRef } = useDroppable({ id: `date-${date}`, data: { date } })
  const d = new Date(date)

  return (
    <div ref={setNodeRef} onClick={() => {}} style={{
      flexShrink: 0, minWidth: 52, padding: "7px 10px", borderRadius: 10,
      textAlign: "center", cursor: "pointer", transition: "all 0.15s",
      border: isOver ? "2px solid #185FA5" : isActive ? "none" : "1px solid #ddd",
      background: isOver ? "#E6F1FB" : isActive ? "#185FA5" : "white",
      color: isOver ? "#185FA5" : isActive ? "white" : "#888",
    }}>
      <p style={{ margin: 0, fontSize: 9, opacity: 0.8 }}>Day {index + 1}</p>
      <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 500 }}>{d.getMonth()+1}/{d.getDate()}</p>
      <p style={{ margin: "2px 0 0", fontSize: 10, opacity: 0.8 }}>（{WEEKDAYS[d.getDay()]}）</p>
    </div>
  )
}

function SwipeableItem({ item, onEdit, onDelete }: {
  item: ItineraryItem; onEdit: () => void; onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [swipeX, setSwipeX] = useState(0)
  const startX = useRef(0)
  const isDraggingSwipe = useRef(false)
  const cat = CAT_META[item.category] || CAT_META.other
  const ACTION_WIDTH = 120

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: ACTION_WIDTH, display: "flex" }}>
        <button onClick={onEdit} style={{ flex: 1, background: "#378ADD", color: "white", border: "none", cursor: "pointer", fontSize: 20 }}>✏️</button>
        <button onClick={onDelete} style={{ flex: 1, background: "#EF4444", color: "white", border: "none", cursor: "pointer", fontSize: 20 }}>🗑️</button>
      </div>
      <div
        onTouchStart={e => { startX.current = e.touches[0].clientX; isDraggingSwipe.current = false }}
        onTouchMove={e => {
          const dx = e.touches[0].clientX - startX.current
          if (Math.abs(dx) > 5) isDraggingSwipe.current = true
          setSwipeX(Math.max(-ACTION_WIDTH, Math.min(0, dx + swipeX)))
        }}
        onTouchEnd={() => { if (swipeX < -ACTION_WIDTH / 2) setSwipeX(-ACTION_WIDTH); else setSwipeX(0) }}
        style={{ transform: `translateX(${swipeX}px)`, transition: isDraggingSwipe.current ? "none" : "transform 0.2s", background: "white", padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}
      >
        <div {...attributes} {...listeners} style={{ color: "#ccc", fontSize: 18, cursor: "grab", paddingTop: 2, flexShrink: 0, touchAction: "none" }}>⠿</div>
        <div style={{ width: 44, flexShrink: 0, textAlign: "center" }}>
          {item.start_time ? <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: "#888" }}>{item.start_time.slice(0, 5)}</p>: <p style={{ margin: 0, fontSize: 18 }}>{cat.icon}</p>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{item.title}</p>
            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: cat.color + "20", color: cat.color, whiteSpace: "nowrap" }}>{cat.label}</span>
          </div>
          {item.location && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.location)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#185FA5", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              📍 {item.location}<span style={{ fontSize: 10, background: "#E6F1FB", padding: "1px 6px", borderRadius: 99 }}>導航 →</span>
            </a>
          )}
          {item.note && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888", fontStyle: "italic" }}>{item.note}</p>}
        </div>
      </div>
    </div>
  )
}

function EditItemModal({ item, onClose, onUpdated }: { item: ItineraryItem; onClose: () => void; onUpdated: (i: ItineraryItem) => void }) {
  const [form, setForm] = useState({ title: item.title, location: item.location || "", start_time: item.start_time || "", category: item.category, note: item.note || "" })
  const [loading, setLoading] = useState(false)
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }

  async function handleSave() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('itinerary_items').update(form).eq('id', item.id).select().single()
      if (error) throw error
      onUpdated(data)
    } catch (e) { alert('更新失敗') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 440, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>編輯行程</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>行程名稱</label><input style={inp} value={form.title} onChange={e => update("title", e.target.value)} /></div>
          <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>地點</label><input style={inp} placeholder="地點（選填）" value={form.location} onChange={e => update("location", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>時間</label><input type="time" style={inp} value={form.start_time} onChange={e => update("start_time", e.target.value)} /></div>
            <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>類別</label>
              <select style={inp} value={form.category} onChange={e => update("category", e.target.value)}>
                {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>
          <div><label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>備註</label><input style={inp} placeholder="備註（選填）" value={form.note} onChange={e => update("note", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", fontSize: 14, cursor: "pointer", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 10 }}>取消</button>
          <button onClick={handleSave} disabled={!form.title.trim() || loading} style={{ flex: 2, padding: "10px", fontSize: 14, fontWeight: 500, cursor: "pointer", background: form.title.trim() && !loading ? "#185FA5" : "#ddd", color: form.title.trim() && !loading ? "white" : "#999", border: "none", borderRadius: 10 }}>
            {loading ? "儲存中…" : "儲存變更"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TripDetail({ trip, onBack }: { trip: Trip; onBack: () => void }) {
  const [tab, setTab] = useState<'itinerary' | 'wishlist' | 'shopping'>('itinerary')
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [activeDate, setActiveDate] = useState<string>("")
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const [newItem, setNewItem] = useState({ title: "", location: "", start_time: "", category: "attraction", note: "" })
  const [loadingItems, setLoadingItems] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overDateId, setOverDateId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState("")
  const dates = getDatesInRange(trip.start_date, trip.end_date)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  useEffect(() => {
    getItemsByTrip(trip.id).then(data => setItems(data || [])).catch(console.error).finally(() => setLoadingItems(false))
    if (dates.length > 0) setActiveDate(dates[0])
  }, [trip.id])

  const dayItems = items.filter(i => i.date === activeDate).sort((a, b) => a.sort_order - b.sort_order)

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDraggingId(null)
    setOverDateId(null)
    if (!over) return

    const overDate = (over.data.current as any)?.date

    // 拖曳到日期格（從想去清單）
    if (overDate && tab === 'wishlist') {
      const { error } = await supabase.from('itinerary_items').insert({
        trip_id: trip.id,
        date: overDate,
        title: (active.data.current as any)?.place?.name || "",
        location: (active.data.current as any)?.place?.address || "",
        category: 'attraction',
        sort_order: items.filter(i => i.date === overDate).length,
      })
      if (error) { alert('新增失敗'); return }
      const d = new Date(overDate)
      setSuccessMsg(`✅ 已加入 ${d.getMonth()+1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）的行程！`)
      setTimeout(() => setSuccessMsg(""), 3000)
      getItemsByTrip(trip.id).then(data => setItems(data || []))
      setActiveDate(overDate)
      setTab('itinerary')
      return
    }

    // 行程內排序
    if (!overDate && active.id !== over.id) {
      const oldIndex = dayItems.findIndex(i => i.id === active.id)
      const newIndex = dayItems.findIndex(i => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const newOrder = arrayMove(dayItems, oldIndex, newIndex)
      setItems(prev => [...prev.filter(i => i.date !== activeDate), ...newOrder.map((item, idx) => ({ ...item, sort_order: idx }))])
      await Promise.all(newOrder.map((item, idx) => supabase.from('itinerary_items').update({ sort_order: idx }).eq('id', item.id)))
    }
  }

  async function addItem() {
    if (!newItem.title.trim()) return
    try {
      const data = await createItem({ trip_id: trip.id, date: activeDate, sort_order: dayItems.length, ...newItem })
      setItems(prev => [...prev, data])
      setNewItem({ title: "", location: "", start_time: "", category: "attraction", note: "" })
      setShowAddItem(false)
    } catch (e) { alert('新增失敗') }
  }

  async function deleteItem(id: string) {
    if (!confirm('確定要刪除這個行程嗎？')) return
    try {
      const { error } = await supabase.from('itinerary_items').delete().eq('id', id)
      if (error) throw error
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e) { alert('刪除失敗') }
  }

  const inp: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, boxSizing: "border-box" }
  const TABS = [
    { key: 'itinerary', label: '📅 行程' },
    { key: 'wishlist', label: '📍 想去' },
    { key: 'shopping', label: '🛍️ 購物' },
  ]

  return (
    <div>
      {editingItem && (
        <EditItemModal item={editingItem} onClose={() => setEditingItem(null)}
          onUpdated={updated => { setItems(prev => prev.map(i => i.id === updated.id ? updated : i)); setEditingItem(null) }} />
      )}

      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#888", padding: 0, marginBottom: 12 }}>← 返回所有旅行</button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
        <span style={{ fontSize: 32 }}>{trip.cover_emoji}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{trip.title}</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>📍 {trip.destination} · {dateDiff(trip.start_date, trip.end_date)} 天</p>
        </div>
      </div>

      {/* 分頁切換 */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem", background: "#f0f0f0", borderRadius: 12, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            flex: 1, padding: "8px 4px", fontSize: 13, fontWeight: 500,
            border: "none", borderRadius: 10, cursor: "pointer",
            background: tab === t.key ? "white" : "transparent",
            color: tab === t.key ? "#185FA5" : "#888",
            boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setDraggingId(e.active.id as string)}
        onDragOver={e => setOverDateId(e.over?.id as string || null)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => { setDraggingId(null); setOverDateId(null) }}
      >
        {/* 共用日期列 */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: "1rem", scrollbarWidth: "none" }}>
          {dates.map((d, i) => (
            <div key={d} onClick={() => setActiveDate(d)}>
  <DroppableDate
    date={d}
    index={i}
    isActive={d === activeDate}
    isOver={overDateId === `date-${d}`}
    itemCount={items.filter(x => x.date === d).length}
    tab={tab}
  />
</div>
          ))}
        </div>

        {/* 拖曳提示（只在想去分頁顯示） */}
        {tab === 'wishlist' && (
          <p style={{ fontSize: 12, color: draggingId ? "#185FA5" : "#aaa", textAlign: "center", margin: "0 0 12px", transition: "color 0.2s" }}>
            {draggingId ? "放到上方日期格加入行程 ⬆" : "⬆ 拖曳地點到上方日期加入行程"}
          </p>
        )}

        {/* 成功提示 */}
        {successMsg && (
          <div style={{ background: "#E1F5EE", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#085041", textAlign: "center" }}>
            {successMsg}
          </div>
        )}

        {/* 想去清單 */}
        {tab === 'wishlist' && <WishlistPanel tripId={trip.id} trip={trip} />}

        {/* 購物清單 */}
        {tab === 'shopping' && <ShoppingPanel tripId={trip.id} />}

        {/* 行程 */}
        {tab === 'itinerary' && (
          <div style={{ background: "white", border: "1px solid #eee", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{activeDate ? formatDate(activeDate) : ""} 行程</p>
              <button onClick={() => setShowAddItem(true)} style={{ background: "#185FA5", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>+ 新增</button>
            </div>

            {loadingItems ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>載入中...</div>
            ) : dayItems.length === 0 && !showAddItem ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>
                <p style={{ fontSize: 28, margin: "0 0 8px" }}>📅</p>
                <p style={{ margin: 0, fontSize: 14 }}>這天還沒有行程</p>
                <p style={{ margin: "4px 0 0", fontSize: 12 }}>點「+ 新增」或從「想去」拖曳加入</p>
              </div>
            ) : (
              <SortableContext items={dayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {dayItems.map((item, idx) => (
                  <div key={item.id} style={{ borderBottom: idx < dayItems.length - 1 ? "1px solid #eee" : "none" }}>
                    <SwipeableItem item={item} onEdit={() => setEditingItem(item)} onDelete={() => deleteItem(item.id)} />
                  </div>
                ))}
              </SortableContext>
            )}

            {showAddItem && (
              <div style={{ padding: "14px 16px", borderTop: "1px solid #eee", background: "#fafafa" }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 500 }}>新增行程項目</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input style={inp} placeholder="行程名稱*" value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} />
                  <input style={inp} placeholder="地點（選填）" value={newItem.location} onChange={e => setNewItem(p => ({ ...p, location: e.target.value }))} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input type="time" style={inp} value={newItem.start_time} onChange={e => setNewItem(p => ({ ...p, start_time: e.target.value }))} />
                    <select style={inp} value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                      {Object.entries(CAT_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <input style={inp} placeholder="備註（選填）" value={newItem.note} onChange={e => setNewItem(p => ({ ...p, note: e.target.value }))} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowAddItem(false)} style={{ flex: 1, padding: 8, fontSize: 13, cursor: "pointer", background: "white", border: "1px solid #ddd", borderRadius: 8 }}>取消</button>
                    <button onClick={addItem} disabled={!newItem.title.trim()} style={{ flex: 2, padding: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", background: newItem.title.trim() ? "#185FA5" : "#ddd", border: "none", borderRadius: 8, color: newItem.title.trim() ? "white" : "#999" }}>新增</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'itinerary' && <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 12 }}>⠿ 長按拖曳排序　← 左滑顯示編輯刪除</p>}

        <DragOverlay>
          {draggingId && tab === 'wishlist' && (
            <div style={{ background: "white", border: "2px solid #185FA5", borderRadius: 16, padding: "12px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontSize: 14, fontWeight: 500 }}>
              📍 拖曳中...
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
