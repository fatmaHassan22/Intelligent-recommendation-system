import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {PushSettings} from '../integrations/PushSettings';
import {api} from '../api/client';
const permission=vi.fn(),subscribe=vi.fn(),unsubscribe=vi.fn();
beforeEach(()=>{
 vi.spyOn(api,'get').mockResolvedValue({data:{configured:true,public_key:'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',devices:[]}});
 vi.spyOn(api,'mutate').mockResolvedValue({});
 vi.stubGlobal('isSecureContext',true);vi.stubGlobal('PushManager',class{});vi.stubGlobal('Notification',{requestPermission:permission});permission.mockResolvedValue('granted');
 const subscription={toJSON:()=>({endpoint:'https://fcm.googleapis.com/fixture',keys:{p256dh:'fixture-public',auth:'fixture-auth'}}),unsubscribe};unsubscribe.mockResolvedValue(true);subscribe.mockResolvedValue(subscription);
 const registration={pushManager:{getSubscription:vi.fn().mockResolvedValue(null),subscribe}};
 Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{register:vi.fn().mockResolvedValue(registration),ready:Promise.resolve(registration)}});
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();permission.mockReset();subscribe.mockReset();delete (navigator as unknown as Record<string,unknown>).serviceWorker;});
it('requests no permission or subscription until an explicit click, defaults to private payloads',async()=>{
 render(<PushSettings/>);const button=await screen.findByRole('button',{name:'تفعيل / تحديث إشعارات هذا المتصفح'});expect(permission).not.toHaveBeenCalled();expect(subscribe).not.toHaveBeenCalled();fireEvent.click(button);
 await waitFor(()=>expect(api.mutate).toHaveBeenCalledWith('/students/me/push/subscriptions','POST',expect.objectContaining({detailed:false})));expect(permission).toHaveBeenCalledOnce();
});
it('only sends detailed consent when explicitly selected for this device',async()=>{
 render(<PushSettings/>);fireEvent.click(await screen.findByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'تفعيل / تحديث إشعارات هذا المتصفح'}));await waitFor(()=>expect(api.mutate).toHaveBeenCalledWith('/students/me/push/subscriptions','POST',expect.objectContaining({detailed:true})));
});
it('permission denial creates no device and explains how to recover',async()=>{
 permission.mockResolvedValue('denied');render(<PushSettings/>);fireEvent.click(await screen.findByRole('button',{name:'تفعيل / تحديث إشعارات هذا المتصفح'}));await screen.findByRole('alert');expect(subscribe).not.toHaveBeenCalled();expect(api.mutate).not.toHaveBeenCalled();
});
it('unsupported or insecure devices preserve in-app notifications and explain iPhone installation',async()=>{
 vi.stubGlobal('isSecureContext',false);render(<PushSettings/>);await screen.findByText(/هذا المتصفح لا يدعم Web Push/);expect(permission).not.toHaveBeenCalled();expect(screen.queryByRole('button',{name:'تفعيل / تحديث إشعارات هذا المتصفح'})).toBeNull();
});
