import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider,useAuth} from '../state';
import {api} from '../api/client';
function SessionProbe(){const auth=useAuth();return <><span>{auth.user?.full_name??'signed out'}</span><button onClick={()=>auth.accept({id:'test',full_name:'QA Student',email:'qa@example.test',role:'STUDENT',created_at:''})}>accept</button><button onClick={()=>void auth.logout()}>logout</button></>;}
it('updates active auth observers immediately after login and logout',async()=>{
 const get=vi.spyOn(api,'get').mockResolvedValue({data:null});const mutate=vi.spyOn(api,'mutate').mockResolvedValue(undefined);
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 try{render(<QueryClientProvider client={client}><AuthProvider><SessionProbe/></AuthProvider></QueryClientProvider>);await waitFor(()=>expect(get).toHaveBeenCalled());fireEvent.click(screen.getByText('accept'));await waitFor(()=>expect(screen.getByText('QA Student')).toBeTruthy());fireEvent.click(screen.getByText('logout'));await waitFor(()=>expect(screen.getByText('signed out')).toBeTruthy());expect(mutate).toHaveBeenCalledWith('/auth/logout','POST');}finally{get.mockRestore();mutate.mockRestore();client.clear();}
});
