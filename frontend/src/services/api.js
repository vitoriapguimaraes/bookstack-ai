import axios from 'axios'

export const api = axios.create({
    baseURL: 'http://localhost:8000', // Adjust if your backend runs on a different port
})

// Optional: Interceptor to handle errors or headers globally if needed
api.interceptors.response.use(
    response => response,
    error => {
        return Promise.reject(error)
    }
)
