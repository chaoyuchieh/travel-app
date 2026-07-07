"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

interface Todo {
  id: string
  title: string
  completed: boolean
  created_at: string
}

export default function TodoPanel() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")

  useEffect(() => {
    supabase.from('todos').select('*').order('created_at')
      .then(({ data }) => {
        setTodos(data || [])
        setLoading(false)
      })
  }, [])

  async function addTodo() {
    if (!newTitle.trim()) return
    const { data, error } = await supabase.from('todos').insert({ title: newTitle }).select().single()
    if (error) { alert('新增失敗'); return }
    setTodos(prev => [...prev, data])
    setNewTitle("")
  }

  async function toggleTodo(todo: Todo) {
    const { data } = await supabase.from('todos').update({ completed: !todo.completed }).eq('id', todo.id).select().single()
    if (data) setTodos(prev => prev.map(t => t.id === data.id ? data : t))
  }

  async function deleteTodo(id: string) {
    await supabase.from('todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const pending = todos.filter(t => !t.completed)
  const done = todos.filter(t => t.completed)

  const inp: React.CSSProperties = { flex: 1, padding: "10px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h2 style={{ margin: "0 0 1.25rem", fontSize: 20, fontWeight: 500 }}>📋 代辦事項</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          style={inp}
          placeholder="新增事項..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
        />
        <button
          onClick={addTodo}
          disabled={!newTitle.trim()}
          style={{ background: newTitle.trim() ? "#185FA5" : "#ddd", color: newTitle.trim() ? "white" : "#999", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
        >
          新增
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#888" }}>載入中...</p>
      ) : todos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>✅</p>
          <p style={{ margin: 0, fontSize: 14 }}>還沒有代辦事項</p>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map(todo => (
              <div key={todo.id} style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => toggleTodo(todo)} style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid #ddd", background: "white", cursor: "pointer", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 14, flex: 1 }}>{todo.title}</p>
                <button onClick={() => deleteTodo(todo.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
              </div>
            ))}
          </div>

          {done.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>已完成 {done.length} 項</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {done.map(todo => (
                  <div key={todo.id} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, opacity: 0.6 }}>
                    <button onClick={() => toggleTodo(todo)} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "#1D9E75", cursor: "pointer", flexShrink: 0, color: "white", fontSize: 12 }}>✓</button>
                    <p style={{ margin: 0, fontSize: 14, flex: 1, textDecoration: "line-through", color: "#888" }}>{todo.title}</p>
                    <button onClick={() => deleteTodo(todo.id)} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, padding: "4px 8px", fontSize: 12, cursor: "pointer" }}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}