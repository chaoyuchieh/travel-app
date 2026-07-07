"use client"
import { useState } from "react"
import TravelApp from './components/TravelApp'
import TodoPanel from './components/TodoPanel'

export default function Home() {
  const [page, setPage] = useState<'travel' | 'todo'>('travel')

  return (
    <div>
      {page === 'travel' ? <TravelApp /> : <TodoPanel />}

      {/* 底部導航 */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "white", borderTop: "1px solid #eee",
        display: "flex", zIndex: 99
      }}>
        <button onClick={() => setPage('travel')} style={{
          flex: 1, padding: "12px 8px", border: "none", cursor: "pointer",
          background: "none", fontSize: 22, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 2
        }}>
          <span>✈️</span>
          <span style={{ fontSize: 10, color: page === 'travel' ? "#185FA5" : "#888" }}>旅行</span>
        </button>
        <button onClick={() => setPage('todo')} style={{
          flex: 1, padding: "12px 8px", border: "none", cursor: "pointer",
          background: "none", fontSize: 22, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 2
        }}>
          <span>📋</span>
          <span style={{ fontSize: 10, color: page === 'todo' ? "#185FA5" : "#888" }}>代辦</span>
        </button>
      </div>

      <div style={{ height: 64 }} />
    </div>
  )
}