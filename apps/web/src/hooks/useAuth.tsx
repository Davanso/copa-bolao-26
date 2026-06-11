import { createContext, useContext, useMemo, useState } from "react";
import type { User } from "../services/types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem("bolao.token"));
  const [user, setUser] = useState<User | null>(() =>
    JSON.parse(localStorage.getItem("bolao.user") ?? "null"),
  );
  const value = useMemo(
    () => ({
      user,
      token,
      login: (nextToken: string, nextUser: User) => {
        localStorage.setItem("bolao.token", nextToken);
        localStorage.setItem("bolao.user", JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
      },
      updateUser: (nextUser: User) => {
        localStorage.setItem("bolao.user", JSON.stringify(nextUser));
        setUser(nextUser);
      },
      logout: () => {
        localStorage.removeItem("bolao.token");
        localStorage.removeItem("bolao.user");
        setToken(null);
        setUser(null);
      },
    }),
    [user, token],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa de AuthProvider");
  return context;
};
