import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthProvider";
import { ThemeProvider } from "../features/theme/theme";
import { queryClient } from "../shared/api/queryClient";
import { ToastProvider } from "../shared/ui";

/** ترتيب المزودات مهم: الراوتر خارج الثيم لأن الثيم يقرأ المسار الحالي. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ThemeProvider>{children}</ThemeProvider>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
