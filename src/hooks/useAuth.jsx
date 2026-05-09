import { useState, useEffect, createContext, useContext } from "react";

const AuthContext = createContext(null);

export function AuthProvider({children}) {
    const [user, setUser ] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            credentials: 'include' // tells the browser to send the HttpOnly cookie with the request
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            setUser(data);
            setLoading(false);
        })
        .catch(()=> {
            setUser(null);
            setLoading(false);
        });
    }, []);

    return (
        <AuthContext.Provider value={{user, loading}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext)
}