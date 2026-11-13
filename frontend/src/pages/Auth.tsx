import { CSSProperties, ReactNode, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, GraduationCap, ShieldCheck, Compass, Users, Heading } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api, errorMessage } from '../api/client';
import type { Registration, StudyMode, User } from '../api/types';
import { useAuth } from '../state';
import { useMajors, usePlans } from '../hooks';
import { Button, Input, Select, Badge, ErrorState, modeLabel } from '../components/ui';



import Header from "./sections/Header";
import Hero from "./sections/Hero";
import ProblemSolution from "./sections/ProblemSolution";
import HowItWorks from "./sections/HowItWorks";
import AIRecommendation from "./sections/AIRecommendation";
import Features from "./sections/Features";
import TryIt from "./sections/TryIt";
import Assistant from "./sections/Assistant";
import Tour from "./sections/Tour";
import Stories from "./sections/Stories";
import Faq from "./sections/Faq";
import CTA from "./sections/CTA";
import Footer from "./sections/Footer";

export function Logo(
    { light = false }: { light?: boolean }
) {
    return <Link className={`logo ${light ? 'logo-light' : ''}`} to="/">
        <span className="logo-mark">
            <GraduationCap size={25} />
        </span>
        <span>
            <strong>مسار</strong>
            <small>الدعم الأكاديمي الذكي</small>
        </span>
    </Link>
        ;
}
export function Welcome() {
    return (
        <>
            <Header />
            <main>
                <Hero />
                <ProblemSolution />
                <HowItWorks />
                <AIRecommendation />
                <Features />
                <TryIt />
                <Assistant />
                <Tour />
                <Stories />
                <Faq />
                <CTA />
            </main>
            <Footer />
        </>

    );




}


// function AuthFrame({ title, subtitle, children }:
//     {
//         title: string;
//         subtitle: string;
//         children: React.ReactNode
//     }) {
//     return <div className="auth-page">
//         <aside className="auth-aside">
//             <Logo light />
//             <div>
//                 <span className="eyebrow">رحلتك الأكاديمية، بوضوح</span>
//                 <h2>كل خطوة صغيرة<br />تصنع فرقًا.</h2>
//                 <p>ابدأ بخطتك الحالية، احتفظ بإنجازك، وتابع تقدمك بثقة ووعي بالبيانات المتاحة.</p>
//                 <div className="auth-emblem">
//                     <Compass size={85} />
//                 </div>
//             </div>
//             <small>مسار · Intelligent Academic Support System</small>
//         </aside>

//         <main className="auth-main">
//             <Link to="/" className="back-link">
//                 <ArrowRight size={17} /> العودة للرئيسية
//             </Link>
//             <div className="auth-form">
//                 <h1>{title}</h1>
//                 <p className="subheading">{subtitle}</p>
//                 {children}
//             </div>
//         </main>
//     </div>;
// }

const points = ['توصيات مساقات مشروحة', 'تقويم ومهام في مكان واحد', 'مساعد ذكي يرافقك'];

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
    return <div className="grid min-h-screen grid-cols-1 bg-white text-ink lg:grid-cols-[minmax(380px,42%)_1fr]">
        <aside className="relative flex flex-col justify-between gap-3 overflow-hidden bg-ink p-6 text-white lg:gap-8 lg:p-12">
            {/* خلفية متحركة */}
            <span aria-hidden="true" className="pointer-events-none absolute -end-16 -top-24 size-[340px] animate-drift rounded-full bg-accent opacity-40 blur-[70px]" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -start-20 size-[300px] animate-drift-rev rounded-full bg-[#2f6fa8] opacity-40 blur-[70px]" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(circle_at_50%_45%,#000,transparent_75%)]" />

            <div className="relative z-10"><Logo light /></div>

            <div className="relative z-10">
                <span className="inline-flex animate-rise items-center gap-2.5 text-sm font-semibold text-accent-mint">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-mint opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-accent-mint" />
                    </span>
                    رحلتك الأكاديمية، بوضوح
                </span>

                <h2 className="mb-4 mt-4 text-[clamp(24px,3.4vw,46px)] font-bold leading-[1.35]">
                    <span className="block animate-rise [animation-delay:.2s]">كل خطوة صغيرة</span>
                    <span className="block animate-rise text-accent-mint [animation-delay:.35s]">تصنع فرقًا.</span>
                </h2>

                <p className="mb-5 max-w-[420px] animate-rise leading-loose text-white/75 [animation-delay:.5s] max-lg:hidden">
                    ابدأ بخطتك الحالية، احتفظ بإنجازك، وتابع تقدمك بثقة ووعي بالبيانات المتاحة.
                </p>

                <ul className="mb-7 grid gap-3 max-lg:hidden">
                    {points.map((p, i) => (
                        <li key={p} style={{ animationDelay: `${0.7 + i * 0.12}s` }}
                            className="flex animate-rise items-center gap-2.5 text-[15px] text-white/90">
                            <Check size={24} className="flex-none rounded-full bg-accent-mint/15 p-1.5 text-accent-mint" />
                            {p}
                        </li>
                    ))}
                </ul>

                <div aria-hidden="true"
                    className="relative grid size-[150px] animate-[rise_.9s_ease-out_1s_both,float_6s_ease-in-out_1.9s_infinite] place-items-center rounded-[36px] border border-white/15 bg-white/5 text-accent-mint backdrop-blur-sm max-lg:hidden">
                    <span className="absolute inset-0 animate-ripple rounded-[36px] border border-accent-mint opacity-0" />
                    <span className="absolute inset-0 animate-ripple rounded-[36px] border border-accent-mint opacity-0 [animation-delay:1.8s]" />
                    <Compass size={85} className="animate-sway" />
                </div>
            </div>

            <small className="relative z-10 text-xs text-white/50 max-lg:hidden">مسار · Intelligent Academic Support System</small>
        </aside>

        <main className="relative flex flex-col bg-white px-6 py-8 lg:px-[clamp(24px,6vw,96px)]">
            <Link to="/" className="group inline-flex w-fit animate-rise items-center gap-2 text-sm text-muted transition-colors hover:text-accent">
                <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" /> العودة للرئيسية
            </Link>

            {/* auth-fields: يربط تنسيق الحقول والأزرار الموجود في index.css */}
            <div className="auth-fields mx-auto my-auto w-full max-w-[460px] py-6">
                <h1 className="mb-1.5 animate-rise text-[34px] font-bold [animation-delay:.1s]">{title}</h1>
                <p className="mb-6 animate-rise text-sm text-muted [animation-delay:.18s]">{subtitle}</p>
                {children}
            </div>
        </main>
    </div>;
}



export function Login() {
    const auth = useAuth(), navigate = useNavigate();

    const [email, setEmail] = useState(''),
        [password, setPassword] = useState('');

    const login = useMutation({
        mutationFn: () => api.mutate<{
            user: User; csrf_token: string
        }>('/auth/login', 'POST', { email: email.trim(), password }),
        onSuccess: r => {
            setPassword('');
            auth.accept(r.user); navigate('/app', { replace: true });
        }
    });


    if (auth.user) return <Navigate to="/app" replace />;


    return (
        <AuthFrame title="أهلًا بعودتك" subtitle="سجّل الدخول لتكمل من حيث توقفت .">
            <form onSubmit={e => {
                e.preventDefault();
                login.mutate();
            }}>
                <Input label="البريد الإلكتروني"
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    required maxLength={254}
                    value={email}
                    onChange={e => setEmail(e.target.value)} />

                <Input label="كلمة المرور"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)} />

                {login.error && <p className="form-error" role="alert">{errorMessage(login.error)}</p>}

                <Button busy={login.isPending} className="w-full" type="submit">تسجيل الدخول
                    <ArrowLeft size={17} />
                </Button>

            </form>

            <p className="auth-switch">ليس لديك حساب؟
                <Link to="/register">إنشاء حساب جديد</Link>
            </p>
        </AuthFrame>
    );
}


const titles = ['معلوماتك الشخصية', 'بياناتك الأكاديمية', 'تفضيلات الدراسة', 'مراجعة بياناتك'];

const initial: Registration =
{
    full_name: '',
    email: '',
    password: '',
    major_id: '',
    curriculum_plan_id: '',
    university_student_number: null,
    max_semester_credit_hours: 18,
    preferred_study_mode: 'BALANCED',
    career_interest: null
};



export function validateStep(step: number, data: Registration): string | null {
    if (step === 0) {
        if (!data.full_name.trim()) return 'أدخل اسمك الكامل.';
        if (!/^[\x21-\x7e]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'أدخل بريدًا إلكترونيًا صالحًا.';
        if (data.password.length < 12 || new TextEncoder().encode(data.password).length > 72) return 'كلمة المرور يجب أن تكون 12 حرفًا على الأقل وألا تتجاوز 72 بايت.';
    }
    if (step === 1 &&
        (!data.major_id || !data.curriculum_plan_id))
        return 'اختر تخصصًا وخطة من القائمة.';

    if (step === 2 &&
        (!Number.isInteger(data.max_semester_credit_hours) ||
            data.max_semester_credit_hours <= 0 ||
            data.max_semester_credit_hours > 65535))
        return 'أدخل عدد ساعات صحيحًا موجبًا.';
    return null;
}



// export function Register() {
//     const auth = useAuth(),
//         navigate = useNavigate(),
//         majors = useMajors();

//     const [step, setStep] = useState(0),
//         [data, setData] = useState<Registration>(initial),
//         [error, setError] = useState<string | null>(null);

//     const plans = usePlans(data.major_id);

//     useEffect(() => {
//         document.querySelector<HTMLElement>('.step-title')?.focus();
//     }, [step]);

//     const set = <K extends keyof Registration>(key: K, value: Registration[K]) => {
//         setData(d => ({ ...d, [key]: value })); setError(null);
//     };


//     const register = useMutation({
//         mutationFn: () => api.mutate<{
//             user: User; csrf_token: string
//         }>
//             ('/auth/register', 'POST', { ...data, full_name: data.full_name.trim(), email: data.email.trim() }),
//         onSuccess: r => {
//             setData(initial);
//             auth.accept(r.user);
//             navigate('/app', { replace: true });
//         }
//     });

//     if (auth.user) return <Navigate to="/app" replace />;
//     const submit = (e: FormEvent) => {
//         e.preventDefault();
//         const invalid = validateStep(step, data);
//         if (invalid) {
//             setError(invalid); return;
//         }
//         if (step < 3) {
//             setStep(step + 1); setError(null);
//         } else register.mutate();
//     };


//     return <AuthFrame title="ابدأ مسارك"
//         subtitle="أربع خطوات قصيرة، وحساب يتبع خطتك أنت .">
//         <div className="steps" aria-label="خطوات إنشاء الحساب">
//             {titles.map((title, i) =>
//                 <div key={title} className={i <= step ? 'step active' : 'step'}
//                     aria-current={i === step ? 'step' : undefined}>
//                     <span>{i < step ?
//                         <Check size={16} /> : i + 1}
//                     </span>
//                     <small>{title}</small>
//                 </div>
//             )
//             }
//         </div>

//         <form onSubmit={submit}>
//             <h2 className="step-title" tabIndex={-1}>{titles[step]}</h2>


//             {step === 0 && <>
//                 <Input label="الاسم الكامل"
//                     autoComplete="name" required maxLength={255}
//                     value={data.full_name}
//                     onChange={e => set('full_name', e.target.value)} />
//                 <Input label="البريد الإلكتروني"
//                     type="email"
//                     dir="ltr"
//                     autoComplete="email"
//                     required maxLength={254}
//                     value={data.email}
//                     onChange={e => set('email', e.target.value)} />
//                 <Input label="كلمة المرور"
//                     type="password"
//                     autoComplete="new-password"
//                     required minLength={12}
//                     value={data.password}
//                     onChange={e => set('password', e.target.value)}
//                     hint="12 حرفًا على الأقل. لا تحفظ المنصة كلمة المرور بصيغتها الأصلية." />
//             </>
//             }

//             {step === 1 && <>
//                 {majors.error ? <ErrorState error={majors.error} retry={
//                     () => void majors.refetch()}
//                 /> :
//                     <Select label="التخصص"
//                         required
//                         value={data.major_id}
//                         disabled={majors.isPending}
//                         onChange={e => setData(d => ({ ...d, major_id: e.target.value, curriculum_plan_id: '' }))}>

//                         <option value="">
//                             {majors.isPending ? 'جارٍ تحميل التخصصات…' : 'اختر تخصصك'}
//                         </option>

//                         {majors.data?.map(m => <option key={m.id}
//                             value={String(m.id)}>
//                             {m.name_ar}</option>)}
//                     </Select>
//                 }

//                 <Select label="الخطة الدراسية"
//                     required disabled={!data.major_id || plans.isPending}
//                     value={data.curriculum_plan_id}
//                     onChange={e => set('curriculum_plan_id', e.target.value)}>
//                     <option value="">اختر الخطة</option>
//                     {plans.data?.map(p => <option key={p.id}
//                         value={String(p.id)}>الخطة {p.plan_number}
//                     </option>)}
//                 </Select>{plans.error && <ErrorState error={plans.error} retry={() => void plans.refetch()} />}
//                 <Input label="الرقم الجامعي (اختياري)" maxLength={64} value={data.university_student_number ?? ''}
//                     onChange={e => set('university_student_number', e.target.value.trim() || null)}
//                 /></>}


//             {step === 2 && <><Input label="الحد الأقصى المفضل لساعات الفصل" type="number" min={1} max={65535}
//                 required value={data.max_semester_credit_hours || ''}
//                 onChange={e => set('max_semester_credit_hours', Number(e.target.value))}
//                 hint="تفضيل شخصي، وليس اعتمادًا للحد الأكاديمي المسموح." />
//                 <Select label="نمط الدراسة" value={data.preferred_study_mode}
//                     onChange={e => set('preferred_study_mode', e.target.value as StudyMode)}>
//                     <option value="LIGHT">خفيف</option>
//                     <option value="BALANCED">متوازن</option>
//                     <option value="FAST_GRADUATION">تخرج أسرع</option>
//                 </Select>
//                 <Input label="الاهتمام المهني (اختياري)"
//                     maxLength={255} value={data.career_interest ?? ''}
//                     onChange={e => set('career_interest', e.target.value.trim() || null)} />
//                 <p className="helper">نحتفظ بهذه التفضيلات. تُستخدم لتوصيات قائمة على قواعد واضحة، وليست قواعد تسجيل جامعية.</p>
//             </>}

//             {step === 3 && <><dl className="review">
//                 <div>
//                     <dt>الاسم</dt>
//                     <dd>{data.full_name}</dd>
//                 </div>
//                 <div>
//                     <dt>البريد</dt>
//                     <dd dir="ltr">{data.email}</dd>
//                 </div>
//                 <div>
//                     <dt>التخصص</dt>
//                     <dd>{majors.data?.find(m => String(m.id) === data.major_id)?.name_ar}</dd>
//                 </div>
//                 <div>
//                     <dt>الخطة</dt>
//                     <dd>{plans.data?.find(p => String(p.id) === data.curriculum_plan_id)?.plan_number}</dd>
//                 </div>
//                 <div>
//                     <dt>الرقم الجامعي</dt>
//                     <dd>{data.university_student_number ?? 'غير مدخل'}</dd>
//                 </div>
//                 <div>
//                     <dt>الساعات المفضلة</dt>
//                     <dd>{data.max_semester_credit_hours}</dd>
//                 </div>
//                 <div>
//                     <dt>نمط الدراسة</dt>
//                     <dd>{modeLabel(data.preferred_study_mode)}</dd>
//                 </div>
//                 <div>
//                     <dt>الاهتمام المهني</dt>
//                     <dd>{data.career_interest ?? 'غير محدد'}</dd>
//                 </div>
//             </dl>
//                 <p className="helper">راجع بياناتك. يمكنك تعديل ملفك لاحقًا، مع تأكيد عند تغيير الخطة.</p>
//             </>}{(error || register.error) &&
//                 <p className="form-error" role="alert">{error ?? errorMessage(register.error)}</p>
//             }
//             <div className="form-actions">{step > 0 &&
//                 <Button
//                     variant="secondary"
//                     type="button"
//                     disabled={register.isPending}
//                     onClick={() => {
//                         setStep(step - 1);
//                         setError(null);
//                     }}
//                 >السابق
//                 </Button>
//             }

//                 <Button
//                     type="submit"
//                     busy={register.isPending}>
//                     {step === 3 ? 'إنشاء حساب' : 'التالي'}<ArrowLeft size={17} />
//                 </Button>
                
//             </div>
//         </form>
//         <p className="auth-switch">لديك حساب؟
//             <Link to="/login">تسجيل الدخول</Link>
//         </p>
//     </AuthFrame>;
// }
function SwitchLink({ text, to, label }: { text: string; to: string; label: string }) {
    return <p className="mt-7 animate-rise text-sm text-muted [animation-delay:.7s]">{text}
        <Link to={to} className="ms-1.5 font-bold text-accent underline-offset-4 hover:underline">{label}</Link>
    </p>;
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
    const n = steps.length, p = n > 1 ? current / (n - 1) : 0;
    return (
        <ol aria-label="خطوات إنشاء الحساب" style={{ '--n': n, '--p': p } as CSSProperties}
            className="relative mb-8 grid animate-rise auto-cols-fr grid-flow-col [animation-delay:.2s]">
            <span aria-hidden="true" className="absolute top-[15px] h-[3px] rounded bg-[#e8eef4] [inset-inline-start:calc(100%/var(--n)/2)] [width:calc(100%_-_100%/var(--n))]" />
            <span aria-hidden="true" className="absolute top-[15px] h-[3px] rounded bg-accent transition-[width] duration-700 ease-out [inset-inline-start:calc(100%/var(--n)/2)] [width:calc((100%_-_100%/var(--n))*var(--p))]" />
            {steps.map((label, i) => {
                const state = i < current ? 'done' : i === current ? 'active' : 'todo';
                return (
                    <li key={label} aria-current={i === current ? 'step' : undefined}
                        className="relative z-10 flex flex-col items-center gap-2 text-center">
                        <span className={`grid size-8 place-items-center rounded-full text-[13px] font-bold shadow-[0_0_0_4px_#fff] transition-all duration-500 ${state === 'todo' ? 'bg-[#eef3f7] text-[#8a99ab]' : 'bg-accent text-white'
                            } ${state === 'active' ? 'scale-110 animate-ring-pulse' : ''}`}>
                            {state === 'done' ? <Check size={16} className="animate-pop" /> : i + 1}
                        </span>
                        <small className={`hidden max-w-[90px] text-xs transition-colors sm:block ${state === 'active' ? 'font-semibold text-ink' : state === 'done' ? 'text-accent' : 'text-[#8a99ab]'
                            }`}>{label}</small>
                    </li>
                );
            })}
        </ol>
    );
}



function PasswordStrength({ value }: { value: string }) {
    const score = [
        value.length >= 12,
        /[a-z]/.test(value) && /[A-Z]/.test(value),
        /\d/.test(value),
        /[^A-Za-z0-9]/.test(value),
    ].filter(Boolean).length;
    const labels = ['ضعيفة', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'];
    const colors = ['', 'bg-[#e5534b]', 'bg-[#e6a23c]', 'bg-[#7bc67e]', 'bg-accent'];
    return (
        <div className="mt-2.5 flex min-h-[18px] items-center gap-3" aria-live="polite">
            <div className="grid flex-1 grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map(i => (
                    <span key={i} className={`h-[5px] rounded-full transition-all duration-500 ${i <= score ? `${colors[score]} scale-y-[1.3]` : 'bg-[#e8eef4]'}`} />
                ))}
            </div>
            <span className="min-w-12 text-xs font-semibold text-muted">{value ? labels[score] : ''}</span>
        </div>
    );
}


export function Register() {
    const auth = useAuth(),
        navigate = useNavigate(),
        majors = useMajors();

    const [step, setStep] = useState(0),
        [dir, setDir] = useState<'fwd' | 'back'>('fwd'),
        [data, setData] = useState<Registration>(initial),
        [error, setError] = useState<string | null>(null);

    const plans = usePlans(data.major_id);

    // نقل التركيز لعنوان الخطوة عند الانتقال فقط (وليس عند أول فتح للصفحة)
    const prevStep = useRef(step);
    useEffect(() => {
        if (prevStep.current !== step) {
            prevStep.current = step;
            document.querySelector<HTMLElement>('[data-step-title]')?.focus();
        }
    }, [step]);

    const set = <K extends keyof Registration>(key: K, value: Registration[K]) => {
        setData(d => ({ ...d, [key]: value })); setError(null);
    };

    const register = useMutation({
        mutationFn: () => api.mutate<{
            user: User; csrf_token: string
        }>
            ('/auth/register', 'POST', { ...data, full_name: data.full_name.trim(), email: data.email.trim() }),
        onSuccess: r => {
            setData(initial);
            auth.accept(r.user);
            navigate('/app', { replace: true });
        }
    });

    if (auth.user) return <Navigate to="/app" replace />;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const invalid = validateStep(step, data);
        if (invalid) {
            setError(invalid); return;
        }
        if (step < 3) {
            setDir('fwd'); setStep(step + 1); setError(null);
        } else register.mutate();
    };

    const message = error ?? (register.error ? errorMessage(register.error) : null);

    return <AuthFrame title="ابدأ مسارك"
        subtitle="أربع خطوات قصيرة، وحساب يتبع خطتك أنت.">
        <Stepper steps={titles} current={step} />

        <form onSubmit={submit}>
            {/* key={step} يعيد تشغيل حركة الدخول عند كل خطوة */}
            <div key={step} className={`auth-stagger ${dir === 'back' ? 'animate-step-back' : 'animate-step-in'}`}>
                <h2 data-step-title tabIndex={-1} className="text-[19px] font-semibold outline-none">{titles[step]}</h2>

                {step === 0 && <>
                    <Input label="الاسم الكامل"
                        autoComplete="name" required maxLength={255}
                        value={data.full_name}
                        onChange={e => set('full_name', e.target.value)} />
                    <Input label="البريد الإلكتروني"
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        required maxLength={254}
                        value={data.email}
                        onChange={e => set('email', e.target.value)} />
                    <Input label="كلمة المرور"
                        type="password"
                        autoComplete="new-password"
                        required minLength={12}
                        value={data.password}
                        onChange={e => set('password', e.target.value)}
                        hint="12 حرفًا على الأقل. لا تحفظ المنصة كلمة المرور بصيغتها الأصلية." />
                    <PasswordStrength value={data.password} />
                </>}

                {step === 1 && <>
                    {majors.error ? <ErrorState error={majors.error} retry={() => void majors.refetch()} /> :
                        <Select label="التخصص"
                            required
                            value={data.major_id}
                            disabled={majors.isPending}
                            onChange={e => setData(d => ({ ...d, major_id: e.target.value, curriculum_plan_id: '' }))}>
                            <option value="">
                                {majors.isPending ? 'جارٍ تحميل التخصصات…' : 'اختر تخصصك'}
                            </option>
                            {majors.data?.map(m => <option key={m.id} value={String(m.id)}>{m.name_ar}</option>)}
                        </Select>}
                    <Select label="الخطة الدراسية"
                        required disabled={!data.major_id || plans.isPending}
                        value={data.curriculum_plan_id}
                        onChange={e => set('curriculum_plan_id', e.target.value)}>
                        <option value="">اختر الخطة</option>
                        {plans.data?.map(p => <option key={p.id} value={String(p.id)}>الخطة {p.plan_number}</option>)}
                    </Select>
                    {plans.error && <ErrorState error={plans.error} retry={() => void plans.refetch()} />}
                    <Input label="الرقم الجامعي (اختياري)" maxLength={64} value={data.university_student_number ?? ''}
                        onChange={e => set('university_student_number', e.target.value.trim() || null)} />
                </>}

                {step === 2 && <>
                    <Input label="الحد الأقصى المفضل لساعات الفصل" type="number" min={1} max={65535}
                        required value={data.max_semester_credit_hours || ''}
                        onChange={e => set('max_semester_credit_hours', Number(e.target.value))}
                        hint="تفضيل شخصي، وليس اعتمادًا للحد الأكاديمي المسموح." />
                    <Select label="نمط الدراسة" value={data.preferred_study_mode}
                        onChange={e => set('preferred_study_mode', e.target.value as StudyMode)}>
                        <option value="LIGHT">خفيف</option>
                        <option value="BALANCED">متوازن</option>
                        <option value="FAST_GRADUATION">تخرج أسرع</option>
                    </Select>
                    <Input label="الاهتمام المهني (اختياري)"
                        maxLength={255} value={data.career_interest ?? ''}
                        onChange={e => set('career_interest', e.target.value.trim() || null)} />
                    <p className="mt-3 text-xs leading-relaxed text-muted">نحتفظ بهذه التفضيلات. تُستخدم لتوصيات قائمة على قواعد واضحة، وليست قواعد تسجيل جامعية.</p>
                </>}

                {step === 3 && <>
                    <dl className="mt-4 grid gap-2.5">
                        {([
                            ['الاسم', data.full_name],
                            ['البريد', <span dir="ltr">{data.email}</span>],
                            ['التخصص', majors.data?.find(m => String(m.id) === data.major_id)?.name_ar],
                            ['الخطة', plans.data?.find(p => String(p.id) === data.curriculum_plan_id)?.plan_number],
                            ['الرقم الجامعي', data.university_student_number ?? 'غير مدخل'],
                            ['الساعات المفضلة', data.max_semester_credit_hours],
                            ['نمط الدراسة', modeLabel(data.preferred_study_mode)],
                            ['الاهتمام المهني', data.career_interest ?? 'غير محدد'],
                        ] as [string, ReactNode][]).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-4 rounded-[14px] border border-line bg-[#f9fbfd] px-4 py-3.5 text-sm">
                                <dt className="text-muted">{k}</dt>
                                <dd className="font-semibold">{v}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-3 text-xs leading-relaxed text-muted">راجع بياناتك. يمكنك تعديل ملفك لاحقًا، مع تأكيد عند تغيير الخطة.</p>
                </>}
            </div>

            {message && <p key={message} role="alert"
                className="mt-4 animate-shake rounded-xl bg-[#fdecea] px-3.5 py-3 text-sm text-[#9a3412]">{message}</p>}

            <div className="flex flex-wrap gap-3">
                <Button type="submit" busy={register.isPending}>
                    {step === 3 ? 'إنشاء حسابي' : 'التالي'}<ArrowLeft size={17} />
                </Button>
                {step > 0 &&
                    <Button variant="secondary"
                        type="button"
                        disabled={register.isPending}
                        onClick={() => { setDir('back'); setStep(step - 1); setError(null); }}
                    >السابق
                    </Button>}
            </div>
        </form>

        <SwitchLink text="لديك حساب؟" to="/login" label="تسجيل الدخول" />
    </AuthFrame>;
}
