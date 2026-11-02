import {useQuery,useQueryClient} from '@tanstack/react-query';
import {api} from '../api/client';
export const integrationPrefix='/students/me';
export function useIntegration<T>(path:string,enabled=true){return useQuery({queryKey:['student','integrations',path],queryFn:({signal})=>api.get<{data:T}>(integrationPrefix+path,signal).then(r=>r.data),enabled,refetchOnWindowFocus:true,refetchInterval:path.includes('/conversations/')?10000:60000});}
export function useIntegrationRefresh(){const client=useQueryClient();return ()=>Promise.all([client.invalidateQueries({queryKey:['student','integrations']}),client.invalidateQueries({queryKey:['student','productivity']})]);}
