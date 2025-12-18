"use client"

import React from "react"

export default function ValidadoCard({
  open,
  title = "Acción realizada",
  message = "La operación se completó correctamente.",
  onClose,
}) {
  if (!open) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative max-w-sm rounded-xl bg-card border border-border shadow-xl overflow-hidden">
        {/* botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
        >
          ×
        </button>

        {/* cabecera verde */}
        <div className="bg-emerald-600/90 px-4 py-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 7L9.00004 18L3.99994 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-emerald-50">{title}</h3>
        </div>

        {/* contenido */}
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}
