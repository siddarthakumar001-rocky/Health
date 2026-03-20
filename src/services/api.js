const API = import.meta.env.VITE_API_URL;

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
    };
};

const request = async (method, url, data) => {
    const headers = getHeaders();
    try {
        console.log(`[API Request] ${method} ${url}`, data || "");
        
        const res = await fetch(`${API}${url}`, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });

        const result = await res.json().catch(() => ({}));
        console.log(`[API Response] ${method} ${url} Status: ${res.status}`, result);

        if (!res.ok) {
            throw new Error(result.error || result.message || `${method} request failed with status ${res.status}`);
        }
        return result;
    } catch (err) {
        console.error(`[API Error] ${method} ${url}:`, err.message);
        throw err;
    }
};

export const api = {
    get: (url) => request("GET", url),
    post: (url, data) => request("POST", url, data),
    patch: (url, data) => request("PATCH", url, data),
    put: (url, data) => request("PUT", url, data),
    delete: (url) => request("DELETE", url),
};