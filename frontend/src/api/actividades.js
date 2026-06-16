import client from './client'

export const listar     = (params)      => client.get('/actividades/', { params })
export const obtener    = (id)          => client.get(`/actividades/${id}`)
export const crear      = (data)        => client.post('/actividades/', data)
export const actualizar = (id, data)    => client.put(`/actividades/${id}`, data)
export const eliminar   = (id)          => client.delete(`/actividades/${id}`)
