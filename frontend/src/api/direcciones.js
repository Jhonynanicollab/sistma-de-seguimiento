import client from './client'

export const listar   = ()        => client.get('/direcciones/')
export const obtener  = (id)      => client.get(`/direcciones/${id}`)
export const crear    = (data)    => client.post('/direcciones/', data)
export const actualizar = (id, data) => client.put(`/direcciones/${id}`, data)
export const eliminar = (id)      => client.delete(`/direcciones/${id}`)
