import client from './client'

export const listar     = (params)      => client.get('/evidencias/', { params })
export const obtener    = (id)          => client.get(`/evidencias/${id}`)
export const crear      = (data)        => client.post('/evidencias/', data)
export const actualizar = (id, data)    => client.put(`/evidencias/${id}`, data)
export const eliminar   = (id)          => client.delete(`/evidencias/${id}`)

export const subirArchivo = (id, file) => {
  const form = new FormData()
  form.append('archivo', file)
  return client.post(`/evidencias/${id}/upload`, form)
}
