import client from './client'

export const getGlobal      = ()        => client.get('/dashboard/')
export const getPorDireccion = ()       => client.get('/dashboard/por-direccion')
export const getPorPlan     = (planId)  => client.get(`/dashboard/plan/${planId}`)
