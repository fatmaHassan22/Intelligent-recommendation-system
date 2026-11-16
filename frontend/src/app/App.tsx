import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
// ترتيب الـ CSS مهم (الأحدث يطغى على الأقدم عند تساوي الخصوصية).
import "./styles/global.css";
import "../features/productivity/styles.css";
import "../features/engagement/styles.css";
import "../features/integrations/styles.css";
import "../features/theme/theme.css";
import "../features/academic/dashboard.css";

import { ErrorBoundary } from "./ErrorBoundary";
import { Providers } from "./Providers";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRoutes />
      </Providers>
    </ErrorBoundary>
  );
}
