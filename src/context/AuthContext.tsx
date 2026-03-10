import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../lib/services/auth.service';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  orgId: string;
  orgName: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = authService.getUser();
        if (storedUser && authService.isAuthenticated()) {
          setUser(storedUser);
        } else if (import.meta.env.DEV) {
          // Auto-login for local development with REAL database IDs
          const mockUser = {
            id: '47a09593-6f23-497e-8138-e1e708c3ae3d',
            email: 'admin@innovation-institute.edu',
            name: 'Admin Principal',
            phone: '+51 987 654 321',
            role: 'admin',
            orgId: 'a6b7b632-237c-42d0-88b1-94a97f175ede',
            orgName: 'Innovation Institute'
          };

          // Mimic login state
          localStorage.setItem('lia_auth_token', 'dev-mock-token');
          localStorage.setItem('lia_user', JSON.stringify(mockUser));
          setUser(mockUser);
        }
      } catch (e) {
        console.error("Failed to initialize auth", e);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: any) => {
    const data = await authService.login(credentials);
    setUser(data.user);
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
