import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { QueryClient, MutationCache, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, resetCsrf, setUnauthorizedHandler } from './api/client';
import type { Result, User } from './api/types';


export const queryClient = new QueryClient({ mutationCache: new MutationCache({ onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['student', 'engagement'] }); } }), defaultOptions: { queries: { staleTime: 30000, retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1, refetchOnWindowFocus: false }, mutations: { retry: false } } });
interface Auth { user: User | null | undefined; loading: boolean; error: unknown; refetch: () => void; accept: (user: User) => void; logout: () => Promise<void> }
const Context = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const client = useQueryClient(); const session = useQuery({ queryKey: ['auth'], queryFn: async () => { try { return (await api.get<Result<User>>('/auth/me')).data; } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; } }, retry: false });
    useEffect(() => { setUnauthorizedHandler(() => { resetCsrf(); client.removeQueries({ predicate: q => q.queryKey[0] !== 'auth' && q.queryKey[0] !== 'majors' && q.queryKey[0] !== 'plans' }); client.setQueryData(['auth'], null); }); return () => setUnauthorizedHandler(() => { }); }, [client]);
    const accept = (user: User) => { void client.cancelQueries(); client.removeQueries({ predicate: q => q.queryKey[0] !== 'auth' }); client.setQueryData(['auth'], user); };
    const logout = async () => { await api.mutate('/auth/logout', 'POST'); resetCsrf(); void client.cancelQueries(); client.removeQueries({ predicate: q => q.queryKey[0] !== 'auth' }); client.setQueryData(['auth'], null); };
    return <Context.Provider value={{ user: session.data, loading: session.isPending, error: session.error, refetch: () => void session.refetch(), accept, logout }}>{children}</Context.Provider>;
}
export function useAuth() {
    const auth = useContext(Context);
    if (!auth) throw new Error('AuthProvider missing');
    return auth;
}

