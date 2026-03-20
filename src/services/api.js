const API = import.meta.env.VITE_API_URL;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
  };
};

export const api = {
  get: async (url) => {
    const res = await fetch(`${API}${url}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("GET request failed");
    return res.json();
  },

  post: async (url, data) => {
    const res = await fetch(`${API}${url}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "POST request failed");
    }
    return res.json();
  },

  patch: async (url, data) => {
    const res = await fetch(`${API}${url}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "PATCH request failed");
    }
    return res.json();
  }
};