import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAuth } from "./AuthProvider";
import { Button, Input } from "../../shared/ui";
import { AuthFrame } from "./AuthFrame";

export function Login() {
  const auth = useAuth(),
    navigate = useNavigate();

  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () =>
      api.mutate<{
        user: User;
        csrf_token: string;
      }>("/auth/login", "POST", { email: email.trim(), password }),
    onSuccess: (r) => {
      setPassword("");
      auth.accept(r.user);
      navigate("/app", { replace: true });
    },
  });

  if (auth.user) return <Navigate to="/app" replace />;

  return (
    <AuthFrame title="أهلًا بعودتك" subtitle="سجّل الدخول لتكمل من حيث توقفت .">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
      >
        <Input
          label="البريد الإلكتروني"
          type="email"
          autoComplete="email"
          dir="ltr"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="كلمة المرور"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {login.error && (
          <p className="form-error" role="alert">
            {errorMessage(login.error)}
          </p>
        )}

        <Button busy={login.isPending} className="w-full" type="submit">
          تسجيل الدخول
          <ArrowLeft size={17} />
        </Button>
      </form>

      <p className="auth-switch">
        ليس لديك حساب؟
        <Link to="/register">إنشاء حساب جديد</Link>
      </p>
    </AuthFrame>
  );
}
