import client from './client'
import axios from 'axios'

export const login = (email, password) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return client.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}

export const getMe = (token) =>
  axios.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  })
