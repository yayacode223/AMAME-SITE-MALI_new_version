import axios, { InternalAxiosRequestConfig } from "axios"; 

const url = import.meta.env.VITE_API_BASE_URL;


export const Api = axios.create({
    baseURL: url,
    withCredentials: true,
}); 

Api.interceptors.request.use(
    (config : InternalAxiosRequestConfig) => {
        return config;
    },
    (error) => {
        console.error("Erreur", error); 
        return Promise.reject(error); 
    }
)

Api.interceptors.response.use(
    (response) => {
        return response; 
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            window.location.href = '/login';
            console.error("Non autorisé (401). Redirection potentielle vers la connexion.");
        } 
        return Promise.reject(error); 
    }
)