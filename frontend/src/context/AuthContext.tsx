"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Define molde do usuário
interface User {
  nome: string;
  email: string;
  cargo: "GERENTE" | "PADEIRO";
}

// Define o contexto do login
interface AuthContextType {
  user: User | null;
  login: (token: string, usuario: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isGerente: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Já entra sem precisar fazer login caso já tivesse logado
  useEffect(() => {
    const storedUser = localStorage.getItem("royal_user");
    const storedToken = localStorage.getItem("royal_token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    } else if (pathname !== "/login") {
      router.push("/login");
    }
  }, [pathname, router]);

  // Realiza o login
  const login = (token: string, usuario: User) => {
    localStorage.setItem("royal_token", token);
    localStorage.setItem("royal_user", JSON.stringify(usuario));
    setUser(usuario);
    router.push("/");
  };

  // Sai da conta
  const logout = () => {
    localStorage.removeItem("royal_token");
    localStorage.removeItem("royal_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isGerente: user?.cargo === "GERENTE",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
