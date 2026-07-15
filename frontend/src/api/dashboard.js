import client from './client'

export const getGlobal      = (params)  => client.get('/dashboard/', { params })
export const getPorDireccion = (params)  => client.get('/dashboard/por-direccion', { params })
export const getPorPlan     = (planId)  => client.get(`/dashboard/plan/${planId}`)
