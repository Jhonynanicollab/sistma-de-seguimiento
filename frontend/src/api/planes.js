import client from './client'

export const listar     = (params)      => client.get('/planes/', { params })
export const obtener    = (id)          => client.get(`/planes/${id}`)
export const crear      = (data)        => client.post('/planes/', data)
export const actualizar = (id, data)    => client.put(`/planes/${id}`, data)
export const eliminar   = (id)          => client.delete(`/planes/${id}`)
export const actividades = (id)         => client.get(`/planes/${id}/actividades`)

export const subirPdf = (id, file, extraer = true) => {
  const form = new FormData()
  form.append('archivo', file)
  return client.post(`/planes/${id}/upload-pdf?extraer=${extraer}`, form)
}
