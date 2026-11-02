import { useEffect, useState, type FormEvent } from 'react';
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
function AuthFrame({ title, subtitle, children }:
    {
        title: string;
        subtitle: string;
        children: React.ReactNode
    }) {
    return <div className="auth-page">
        <aside className="auth-aside">
            <Logo light />
            <div>
                <span className="eyebrow">رحلتك الأكاديمية، بوضوح</span>
                <h2>كل خطوة صغيرة<br />تصنع فرقًا.</h2>
                <p>ابدئي بخطتك الحالية، احتفظي بإنجازك، وتابعي تقدمك بثقة ووعي بالبيانات المتاحة.</p>
                <div className="auth-emblem">
                    <Compass size={85} />
                </div>
            </div>
            <small>مسار · Intelligent Academic Support System</small>
        </aside>

        <main className="auth-main">
            <Link to="/" className="back-link">
                <ArrowRight size={17} /> العودة للرئيسية
            </Link>
            <div className="auth-form">
                <h1>{title}</h1>
                <p className="subheading">{subtitle}</p>
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

            <p className="auth-switch">ليس لديكِ حساب؟
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
        if (!data.full_name.trim()) return 'أدخلي اسمك الكامل.';
        if (!/^[\x21-\x7e]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'أدخلي بريدًا إلكترونيًا صالحًا.';
        if (data.password.length < 12 || new TextEncoder().encode(data.password).length > 72) return 'كلمة المرور يجب أن تكون 12 حرفًا على الأقل وألا تتجاوز 72 بايت.';
    }
    if (step === 1 &&
        (!data.major_id || !data.curriculum_plan_id))
        return 'اختاري تخصصًا وخطة من القائمة.';

    if (step === 2 &&
        (!Number.isInteger(data.max_semester_credit_hours) ||
            data.max_semester_credit_hours <= 0 ||
            data.max_semester_credit_hours > 65535))
        return 'أدخلي عدد ساعات صحيحًا موجبًا.';
    return null;
}



export function Register() {
    const auth = useAuth(),
        navigate = useNavigate(),
        majors = useMajors();

    const [step, setStep] = useState(0),
        [data, setData] = useState<Registration>(initial),
        [error, setError] = useState<string | null>(null);

    const plans = usePlans(data.major_id);

    useEffect(() => {
        document.querySelector<HTMLElement>('.step-title')?.focus();
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
            setStep(step + 1); setError(null);
        } else register.mutate();
    };


    return <AuthFrame title="ابدأ مسارك"
        subtitle="أربع خطوات قصيرة، وحساب يتبع خطتك أنت .">
        <div className="steps" aria-label="خطوات إنشاء الحساب">
            {titles.map((title, i) =>
                <div key={title} className={i <= step ? 'step active' : 'step'}
                    aria-current={i === step ? 'step' : undefined}>
                    <span>{i < step ?
                        <Check size={16} /> : i + 1}
                    </span>
                    <small>{title}</small>
                </div>
            )
            }
        </div>

        <form onSubmit={submit}>
            <h2 className="step-title" tabIndex={-1}>{titles[step]}</h2>


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
            </>
            }

            {step === 1 && <>
                {majors.error ? <ErrorState error={majors.error} retry={
                    () => void majors.refetch()}
                /> :
                    <Select label="التخصص"
                        required
                        value={data.major_id}
                        disabled={majors.isPending}
                        onChange={e => setData(d => ({ ...d, major_id: e.target.value, curriculum_plan_id: '' }))}>

                        <option value="">
                            {majors.isPending ? 'جارٍ تحميل التخصصات…' : 'اختاري تخصصك'}
                        </option>

                        {majors.data?.map(m => <option key={m.id}
                            value={String(m.id)}>
                            {m.name_ar}</option>)}
                    </Select>
                }

                <Select label="الخطة الدراسية"
                    required disabled={!data.major_id || plans.isPending}
                    value={data.curriculum_plan_id}
                    onChange={e => set('curriculum_plan_id', e.target.value)}>
                    <option value="">اختاري الخطة</option>
                    {plans.data?.map(p => <option key={p.id}
                        value={String(p.id)}>الخطة {p.plan_number}
                    </option>)}
                </Select>{plans.error && <ErrorState error={plans.error} retry={() => void plans.refetch()} />}
                <Input label="الرقم الجامعي (اختياري)" maxLength={64} value={data.university_student_number ?? ''}
                    onChange={e => set('university_student_number', e.target.value.trim() || null)}
                /></>}


            {step === 2 && <><Input label="الحد الأقصى المفضل لساعات الفصل" type="number" min={1} max={65535}
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
                <p className="helper">نحتفظ بهذه التفضيلات. تُستخدم لتوصيات قائمة على قواعد واضحة، وليست قواعد تسجيل جامعية.</p>
            </>}

            {step === 3 && <><dl className="review">
                <div>
                    <dt>الاسم</dt>
                    <dd>{data.full_name}</dd>
                </div>
                <div>
                    <dt>البريد</dt>
                    <dd dir="ltr">{data.email}</dd>
                </div>
                <div>
                    <dt>التخصص</dt>
                    <dd>{majors.data?.find(m => String(m.id) === data.major_id)?.name_ar}</dd>
                </div>
                <div>
                    <dt>الخطة</dt>
                    <dd>{plans.data?.find(p => String(p.id) === data.curriculum_plan_id)?.plan_number}</dd>
                </div>
                <div>
                    <dt>الرقم الجامعي</dt>
                    <dd>{data.university_student_number ?? 'غير مدخل'}</dd>
                </div>
                <div>
                    <dt>الساعات المفضلة</dt>
                    <dd>{data.max_semester_credit_hours}</dd>
                </div>
                <div>
                    <dt>نمط الدراسة</dt>
                    <dd>{modeLabel(data.preferred_study_mode)}</dd>
                </div>
                <div>
                    <dt>الاهتمام المهني</dt>
                    <dd>{data.career_interest ?? 'غير محدد'}</dd>
                </div>
            </dl>
                <p className="helper">راجعي بياناتك. يمكنك تعديل ملفك لاحقًا، مع تأكيد عند تغيير الخطة.</p>
            </>}{(error || register.error) &&
                <p className="form-error" role="alert">{error ?? errorMessage(register.error)}</p>
            }
            <div className="form-actions">{step > 0 &&
                <Button
                    variant="secondary"
                    type="button"
                    disabled={register.isPending}
                    onClick={() => {
                        setStep(step - 1);
                        setError(null);
                    }}
                >السابق
                </Button>
            }

                <Button
                    type="submit"
                    busy={register.isPending}>
                    {step === 3 ? 'إنشاء حساب' : 'التالي'}<ArrowLeft size={17} />
                </Button>
                
            </div>
        </form>
        <p className="auth-switch">لديكِ حساب؟
            <Link to="/login">تسجيل الدخول</Link>
        </p>
    </AuthFrame>;
}


