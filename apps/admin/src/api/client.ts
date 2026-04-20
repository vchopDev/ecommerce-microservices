const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Note: localStorage is used for simplicity.
//TODO: In production consider httpOnly cookies for better XSS protection.
function getToken(): string | null {
    return localStorage.getItem('access_token')
}

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message ?? `Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json()
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(path: string) =>
        request<T>(path, { method: 'DELETE' }),
}