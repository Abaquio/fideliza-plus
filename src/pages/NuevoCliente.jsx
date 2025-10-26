// src/pages/NuevoCliente.jsx
export default function NuevoCliente() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Nuevo cliente</h2>
          <p className="text-sm text-gray-500">
            Registra un cliente usando su RUT como identificador único.
          </p>
        </div>
        <a
          href="/"
          className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
        >
          Volver
        </a>
      </div>

      <form
        className="max-w-2xl mx-auto bg-white border rounded-xl p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          // Aquí luego conectamos con Supabase
          window.history.back()
        }}
      >
        <h1 className="text-2xl font-semibold">Agregar nuevo cliente</h1>
        <p className="text-sm text-gray-500">
          El RUT es el identificador único. Completa al menos RUT y Nombre.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">RUT *</label>
            <input type="text" className="w-full rounded-lg border px-3 py-2" placeholder="12.345.678-9" required />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Nombre completo *</label>
            <input type="text" className="w-full rounded-lg border px-3 py-2" placeholder="Nombre y apellido" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input type="tel" className="w-full rounded-lg border px-3 py-2" placeholder="+56 9 1234 5678" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full rounded-lg border px-3 py-2" placeholder="correo@ejemplo.com" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea className="w-full rounded-lg border px-3 py-2" rows="3" placeholder="Observaciones" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => window.history.back()} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: "linear-gradient(135deg,#480048,#F07241)" }}
          >
            Guardar cliente
          </button>
        </div>
      </form>
    </section>
  )
}