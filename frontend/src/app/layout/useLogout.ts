import { useState } from "react";
import { errorMessage } from "../../shared/api/client";
import { useAuth } from "../../features/auth/AuthProvider";
import { layoutText } from "../../config/strings.ar";
import { useToast } from "../../shared/ui";

/** تسجيل الخروج مع حالة التحميل ورسائل النجاح/الفشل. */
export function useLogout() {
  const { logout: signOut } = useAuth();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast(layoutText.loggedOut);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setLoggingOut(false);
    }
  };

  return { logout, loggingOut };
}
