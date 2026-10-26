const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const login = async (username, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error en el login');
        }

        // Guardar token y usuario en localStorage
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); // { username, rol }
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error en el registro');
        }

        // Auto-login success
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    } catch (error) {
        throw error;
    }
};


export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const getUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error("Error parsing user from localStorage", e);
        localStorage.removeItem('user'); // Clean up bad data
        return null;
    }
};

// Helper para hacer fetch con el token automáticamente
export const fetchWithAuth = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    // Si envíamos JSON y noFormData, agregar Content-Type (si no es FormData)
    if (!(options.body instanceof FormData)) {
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    } else {
        // Si es FormData, NO poner Content-Type manualmente, el navegador lo pone con el boundary
        delete headers['Content-Type'];
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    // Si el token expiró (401), cerrar sesión
    if (res.status === 401) {
        // Disparamos un evento para que App.jsx maneje el logout suavemente
        logout();
        window.dispatchEvent(new Event('auth:unauthorized'));
        throw new Error('Sesión expirada');
    }

    return res;
};
