import Axios, { AxiosRequestConfig, AxiosError } from 'axios'

type RequestData = Record<string, unknown> | null | unknown // unkknow is used to allow any type of data, including primitives like string or number

const BASE_URL = import.meta.env.PROD
    ? '/api/'
    : '//localhost:3030/api/'

const axios = Axios.create({ withCredentials: true })

export const httpService = {
    get<R>(endpoint: string, data?: RequestData): Promise<R> {
        return ajax<R>(endpoint, 'GET', data)
    },
    post<R, T = RequestData>(endpoint: string, data?: T): Promise<R> {
        return ajax<R>(endpoint, 'POST', data)
    },
    put<R, T = RequestData>(endpoint: string, data?: T): Promise<R> {
        return ajax<R>(endpoint, 'PUT', data)
    },
    delete<R>(endpoint: string, data?: RequestData): Promise<R> {
        return ajax<R>(endpoint, 'DELETE', data)
    }
}

async function ajax<R>(
    endpoint: string,
    method: string = 'GET',
    data: RequestData = null
): Promise<R> {
    const url = `${BASE_URL}${endpoint}`

    const options: AxiosRequestConfig = {
        url,
        method,
        data: (method !== 'GET') ? data : null,
        params: (method === 'GET') ? data : null
    }

    try {
        const res = await axios(options)
        return res.data as R
    } catch (err) {
        if (Axios.isAxiosError(err)) {
            const axiosError = err as AxiosError
            if (axiosError.response?.status === 401) {
                sessionStorage.clear()
                window.location.assign('/')
            }
        }
        throw err
    }
}