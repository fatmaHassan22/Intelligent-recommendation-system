import {useEffect,useState} from 'react';
import {api,errorMessage} from '../api/client';
import {Button,Notice} from '../components/ui';
interface Status {configured:boolean;public_key:string|null;devices:{id:string;endpoint_hash:string;device_label:string;detailed:boolean|number;enabled:boolean|number}[]}
const base='/students/me/push';
export const supportsPush=()=>window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
function publicBytes(s:string){return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));}
export function PushSettings(){const [status,setStatus]=useState<Status|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[detailed,setDetailed]=useState(false),[deviceLabel,setDeviceLabel]=useState('جهازي');
 const reload=async()=>{try{const r=await api.get<{data:Status}>(base+'/status');setStatus(r.data);}catch(e){setError(errorMessage(e));}};
 useEffect(()=>{void reload();},[]);
 async function subscribe(){setBusy(true);setError('');let subscription:PushSubscription|null=null,created=false;
  try{if(!status?.public_key||!supportsPush())return;
   // Permission is requested directly from the click, never on page load.
   const permission=await Notification.requestPermission();if(permission!=='granted'){setError('لم يُسمح بالإشعارات. يمكنك تعديل الإذن من إعدادات المتصفح.');return;}
   const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});await navigator.serviceWorker.ready;
   subscription=await registration.pushManager.getSubscription();if(!subscription){subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:publicBytes(status.public_key)});created=true;}
   await api.mutate(base+'/subscriptions','POST',{subscription:subscription.toJSON(),device_label:deviceLabel.trim(),detailed});await reload();
  }catch(e){if(created)await subscription?.unsubscribe();setError(errorMessage(e));}finally{setBusy(false);}}
 async function remove(id:string){setBusy(true);try{const device=status?.devices.find(d=>d.id===id);await api.mutate(base+'/subscriptions/'+id,'DELETE');const reg=await navigator.serviceWorker?.getRegistration('/');const sub=await reg?.pushManager.getSubscription();
  // Match the owner's endpoint hash locally; do not disable another device.
  const r=await api.get<{data:Status}>(base+'/status');setStatus(r.data);if(sub&&device){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sub.endpoint))),b=>b.toString(16).padStart(2,'0')).join('');if(hash===device.endpoint_hash)await sub.unsubscribe();}
 }catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 return <section className="surface"><h2>إشعارات الهاتف والمتصفح</h2>{!supportsPush()?<Notice>هذا المتصفح لا يدعم Web Push أو الاتصال غير آمن. على iPhone أضيفي الموقع إلى الشاشة الرئيسية وافتحيه منها، ثم فعّلي الإشعارات. إشعارات التطبيق الداخلية متاحة.</Notice>:!status?.configured?<Notice>الدفع غير مهيأ على الخادم بعد. يلزم HTTPS ومفاتيح VAPID وإعداد تشفير آمن.</Notice>:<><label className="field">اسم الجهاز<input aria-label="اسم الجهاز" maxLength={80} value={deviceLabel} disabled={busy} onChange={e=>setDeviceLabel(e.target.value)}/></label><label className="check-field"><input type="checkbox" checked={detailed} disabled={busy} onChange={e=>setDetailed(e.target.checked)}/>أوافق على إظهار تفاصيل الإشعار على شاشة القفل لهذا الجهاز</label><Button busy={busy} disabled={!deviceLabel.trim()} onClick={()=>void subscribe()}>تفعيل / تحديث إشعارات هذا المتصفح</Button><p>تظهر رسالة عامة افتراضيًا. لا تُرسل رسالة تجريبية أو طلب إذن تلقائي.</p></>}{error&&<p role="alert" className="form-error">{error}</p>}{status?.devices.map(d=><div className="inline-actions" key={d.id}><span>{d.device_label} · {d.enabled?'مفعّل':'انتهى الاشتراك'} · {d.detailed?'تفاصيل مسموحة':'رسالة عامة'}</span><Button variant="secondary" busy={busy} onClick={()=>void remove(d.id)}>إلغاء الاشتراك لهذا الجهاز</Button></div>)}</section>;
}
