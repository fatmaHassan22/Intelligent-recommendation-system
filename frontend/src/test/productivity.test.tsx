import {beforeEach,afterEach,it,expect,vi,type MockInstance} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {api} from '../api/client';
import {ToastProvider} from '../components/ui';
import {TaskEditor,TasksPage,ProductivityDashboard} from '../productivity/Tasks';
import {CalendarPage} from '../productivity/Calendar';
import {PomodoroPage,ProductivityHeader} from '../productivity/Pomodoro';
import {NotificationsPage} from '../productivity/Notifications';
import {timerRemaining,timerLabel,localToIso,localDayStart} from '../productivity/time';
import type {ActiveResponse,Task,Notification} from '../api/productivity';

// Fixtures exist only in tests. Production pages call authenticated backend APIs.
const task:Task={id:'42',title:'تحضير مراجعة',description:'وصف',priority:'HIGH',status:'TODO',due_date:'2026-10-11',due_time:'10:00',due_at:'2026-10-11T10:00:00.000Z',timezone:'UTC',completed_at:null,course_code:null,course_name:null,revision:3,created_at:'2026-10-11T08:00:00.000Z',updated_at:'2026-10-11T08:00:00.000Z',is_overdue:false};
let tasks:Task[],active:ActiveResponse,notifications:Notification[];
let get:MockInstance<typeof api.get>,mutate:MockInstance<typeof api.mutate>;
beforeEach(()=>{
 tasks=[{...task}];active={data:null,server_now:new Date().toISOString(),suggested_break_mode:'SHORT_BREAK'};notifications=[{id:'7',type:'TASK_UPCOMING',title:'اقترب الموعد',message:'راجعي المهمة.',read_at:null,created_at:'2026-10-11T08:00:00.000Z',href:'/app/tasks/42',task_id:'42',event_id:null,session_id:null}];
 get=vi.spyOn(api,'get').mockImplementation(async(path:string)=>{
  if(path.endsWith('/notifications/preferences'))return {data:{timezone:'UTC',configured:true,task_upcoming:true,task_overdue:true,event_reminders:true,pomodoro_completion:true,general_reminders:true,task_reminder_minutes:60,event_reminder_minutes:30}} as any;
  if(path.endsWith('/productivity/courses'))return {data:[]} as any;
  if(path.endsWith('/pomodoro/active'))return active as any;
  if(path.endsWith('/pomodoro/settings'))return {data:{focus_minutes:1,short_break_minutes:1,long_break_minutes:2,long_break_after:4}} as any;
  if(path.includes('/pomodoro/statistics'))return {data:focus} as any;
  if(path.includes('/productivity/summary'))return {data:{today_tasks:[],upcoming_tasks:[],overdue_count:2,completed_today:1,focus,timezone:'UTC'}} as any;
  if(path.endsWith('/notifications/count'))return {data:{unread_count:notifications.filter(n=>!n.read_at).length}} as any;
  if(path.includes('/notifications?'))return {data:notifications,unread_count:notifications.filter(n=>!n.read_at).length,pagination:{page:1,limit:15,total:notifications.length}} as any;
  if(path.includes('/calendar?'))return {data:{tasks,events:[],from:'2026-10-01T00:00Z',to:'2026-11-01T00:00Z'}} as any;
  if(path.endsWith('/tasks/42'))return {data:tasks[0]} as any;
  if(path.includes('/tasks?'))return {data:tasks,pagination:{page:1,limit:12,total:tasks.length},server_now:new Date().toISOString()} as any;
  throw new Error('Unexpected test route '+path);
 });
 mutate=vi.spyOn(api,'mutate').mockImplementation(async(path:string,method:string,body:any)=>{
  if(path.endsWith('/tasks')&&method==='POST'){tasks=[{...task,...body}];return {data:tasks[0]} as any;}
  if(path.endsWith('/notifications/7')){notifications=method==='DELETE'?[]:notifications.map(n=>({...n,read_at:body.read?'2026-10-11T09:00:00Z':null}));return undefined as any;}
  if(path.includes('/pomodoro/sessions/9/actions')){active={data:{...active.data!,state:body.action==='RESUME'?'RUNNING':'PAUSED',revision:4,ends_at:body.action==='RESUME'?new Date(Date.now()+49000).toISOString():null,remaining_ms:49000},server_now:new Date().toISOString()};return active as any;}
  return {data:{}} as any;
 });
});
afterEach(()=>vi.restoreAllMocks());
const focus={timezone:'UTC',today_focus_minutes:2,weekly_focus_minutes:2,today_completed_sessions:2,weekly_completed_sessions:2,total_completed_focus_sessions:2,total_focus_minutes:2,daily:Array.from({length:7},(_,i)=>({date:`2026-10-${String(5+i).padStart(2,'0')}`,completed_sessions:i===6?2:0,focus_minutes:i===6?2:0}))};
function show(element:React.ReactNode,path='/app/tasks'){const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0},mutations:{retry:false}}});return render(<QueryClientProvider client={client}><ToastProvider><MemoryRouter initialEntries={[path]}>{element}</MemoryRouter></ToastProvider></QueryClientProvider>);}
it('submits a real task mutation including optional date/time and leaves persistence to backend',async()=>{show(<TaskEditor onClose={()=>{}}/>);fireEvent.change(screen.getByLabelText('عنوان المهمة'),{target:{value:'مهمة من النموذج'}});fireEvent.change(screen.getByLabelText('تاريخ الاستحقاق (اختياري)'),{target:{value:'2026-10-11'}});fireEvent.change(screen.getByLabelText('وقت الاستحقاق (اختياري)'),{target:{value:'10:30'}});fireEvent.click(screen.getByRole('button',{name:'حفظ المهمة'}));await waitFor(()=>expect(mutate).toHaveBeenCalledWith('/students/me/tasks','POST',expect.objectContaining({title:'مهمة من النموذج',due_date:'2026-10-11',due_time:'10:30',priority:'MEDIUM',status:'TODO'})));});
it('task filters send the selected view to the API',async()=>{show(<TasksPage/>);await screen.findByText(task.title);fireEvent.click(screen.getByRole('button',{name:'المتأخرة'}));await waitFor(()=>expect(get).toHaveBeenCalledWith(expect.stringContaining('view=OVERDUE')));fireEvent.change(screen.getByLabelText('تصفية الأولوية'),{target:{value:'HIGH'}});await waitFor(()=>expect(get).toHaveBeenCalledWith(expect.stringContaining('priority=HIGH')));});
it('calendar displays task source records and switches month/week/day without copying tasks',async()=>{const {container}=show(<CalendarPage/>,'/app/calendar?date=2026-10-11');await screen.findByText('أجندة اليوم المختار');expect(container.querySelectorAll('.calendar-day').length).toBe(42);expect(screen.getAllByText(task.title).length).toBeGreaterThan(0);fireEvent.click(screen.getByRole('button',{name:'أسبوع'}));await waitFor(()=>expect(container.querySelectorAll('.calendar-day').length).toBe(7));fireEvent.click(screen.getByRole('button',{name:'يوم'}));await waitFor(()=>expect(container.querySelector('.calendar-grid')).toBeNull());expect((await screen.findByRole('link',{name:new RegExp(task.title)})).getAttribute('href')).toBe('/app/tasks/42');});
it('creating a task from the calendar uses task API and refreshes calendar records',async()=>{tasks=[];show(<CalendarPage/>,'/app/calendar?date=2026-10-11');await screen.findByText('لا مواعيد في هذا اليوم');fireEvent.click(screen.getByRole('button',{name:'مهمة في هذا اليوم'}));expect((screen.getByLabelText('تاريخ الاستحقاق (اختياري)') as HTMLInputElement).value).toBe('2026-10-11');fireEvent.change(screen.getByLabelText('عنوان المهمة'),{target:{value:'مهمة التقويم'}});fireEvent.click(screen.getByRole('button',{name:'حفظ المهمة'}));await waitFor(()=>expect(screen.getAllByText('مهمة التقويم').length).toBeGreaterThan(0));expect(mutate).toHaveBeenCalledWith('/students/me/tasks','POST',expect.objectContaining({due_date:'2026-10-11'}));});
it('restores paused Pomodoro and resumes saved revision instead of creating another session',async()=>{active={data:{id:'9',mode:'FOCUS',state:'PAUSED',duration_ms:60000,remaining_ms:49000,started_at:new Date().toISOString(),ends_at:null,completed_at:null,task_id:null,course_id:null,revision:3},server_now:new Date().toISOString()};show(<PomodoroPage/>);await screen.findByRole('button',{name:'استئناف'});expect(screen.getByLabelText('الوقت المتبقي').textContent).toBe('00:49');fireEvent.click(screen.getByRole('button',{name:'استئناف'}));await waitFor(()=>expect(mutate).toHaveBeenCalledWith('/students/me/pomodoro/sessions/9/actions','POST',{action:'RESUME',expected_revision:3}));await screen.findByRole('button',{name:'إيقاف مؤقت'});});
it('notifications mark read and update global unread badge, with link to source task',async()=>{show(<><ProductivityHeader/><NotificationsPage/></>);await screen.findByText('اقترب الموعد');expect(screen.getByRole('link',{name:'عرض العنصر المرتبط'}).getAttribute('href')).toBe('/app/tasks/42');fireEvent.click(screen.getByRole('button',{name:'قراءة الإشعار'}));await waitFor(()=>expect(screen.getByRole('link',{name:'الإشعارات، 0 غير مقروءة'})).toBeTruthy());expect(mutate).toHaveBeenCalledWith('/students/me/notifications/7','PATCH',{read:true});});
it('dashboard shows API-backed counts and empty states without synthetic tasks',async()=>{show(<ProductivityDashboard/>);await screen.findByText('يوم بلا مواعيد مهام');expect(screen.getByText('لا مواعيد قادمة')).toBeTruthy();expect(screen.getByText('مهام متأخرة').parentElement?.textContent).toContain(new Intl.NumberFormat('ar').format(2));expect(screen.getByText('دقائق التركيز اليوم').parentElement?.textContent).toContain(new Intl.NumberFormat('ar').format(2));});
it('timestamp timer reconciles long background gaps and server offset without interval counters',()=>{const running={state:'RUNNING',ends_at:'2026-10-11T08:01:00.000Z',remaining_ms:60000};expect(timerRemaining(running,3000,Date.parse('2026-10-11T08:00:10Z'))).toBe(47000);expect(timerRemaining(running,0,Date.parse('2026-10-11T09:00:00Z'))).toBe(0);expect(timerRemaining({...running,state:'PAUSED',ends_at:null,remaining_ms:49750},0,Date.now())).toBe(49750);expect(timerLabel(49750)).toBe('00:50');});
it('calendar event time conversion preserves timezone and DST dates',()=>{expect(localToIso('2026-10-11T10:00','UTC')).toBe('2026-10-11T10:00:00.000Z');expect(()=>localToIso('2026-03-29T02:30','Europe/Berlin')).toThrow();const from=Date.parse(localDayStart('2026-03-29','Europe/Berlin')),to=Date.parse(localDayStart('2026-03-30','Europe/Berlin'));expect(to-from).toBe(23*3600000);});
