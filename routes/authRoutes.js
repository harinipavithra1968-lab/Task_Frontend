import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const save = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (identifier, password) => {
    const data = await api("/auth/login", {
      method: "POST",
      body: {
        identifier,
        password,
      },
    });

    save(data);
  };

  const register = async (form) => {
    const data = await api("/auth/register", {
      method: "POST",
      body: form,
    });

    save(data);
  };

  // ==========================================
  // GOOGLE LOGIN
  // ==========================================

  useEffect(() => {
    const handleGoogleLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        return;
      }

      try {
        console.log("Google token received");

        // Save Google JWT
        localStorage.setItem("token", token);

        // Get user from YOUR actual backend
        const response = await fetch(
          "https://task-frontend-gyqw.onrender.com/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to get Google user information");
        }

        const data = await response.json();

        console.log("Google user received:", data);

        // Handle either { user: {...} } or direct user object
        const googleUser = data.user || data;

        localStorage.setItem(
          "user",
          JSON.stringify(googleUser)
        );

        setUser(googleUser);

        // Remove ?token= from browser URL
        window.history.replaceState(
          {},
          document.title,
          "/"
        );

        // Go to Task Management page
        window.location.href = "/";
      } catch (error) {
        console.error("Google login error:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Send user back to login
        window.location.href = "/login";
      }
    };

    handleGoogleLogin();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}