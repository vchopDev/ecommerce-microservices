// Note: localStorage is used for simplicity.
// TODO: In production consider httpOnly cookies for better XSS protection.
function getToken(): string | null {
    return localStorage.getItem('access_token')
}

async function request<T>(
    baseUrl: string,
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()

    const hasBody = options.body !== undefined

    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
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

const USER_API = import.meta.env.VITE_API_URL
const CATALOG_API = import.meta.env.VITE_CATALOG_URL

function createClient(baseUrl: string) {
    return {
        get: <T>(path: string) => request<T>(baseUrl, path),
        post: <T>(path: string, body: unknown) =>
            request<T>(baseUrl, path, { method: 'POST', body: JSON.stringify(body) }),
        patch: <T>(path: string, body: unknown) =>
            request<T>(baseUrl, path, { method: 'PATCH', body: JSON.stringify(body) }),
        delete: <T>(path: string) =>
            request<T>(baseUrl, path, { method: 'DELETE' }),
    }
}

export const userApi = createClient(USER_API)
export const catalogApi = createClient(CATALOG_API)