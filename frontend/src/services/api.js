import axios from "axios";
import { supabase } from "./supabase";
import { API_URL } from "../utils/config";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

// Request interceptor to add the auth token
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

// Optional: Interceptor to handle errors or headers globally if needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
