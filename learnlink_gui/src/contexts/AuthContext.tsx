import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  user_id?: string; // Optional yap
  id?: string | number; // id ekle
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  // Local storage'dan user bilgisini al
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // user_id ve id alanlarını normalize et
      const normalizedUser = {
        ...parsedUser,
        user_id: parsedUser.user_id || parsedUser.id, // id'yi user_id olarak da kullan
      };
      setUser(normalizedUser);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
