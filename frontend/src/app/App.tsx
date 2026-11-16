import "@fontsource/cairo/arabic-400.css";
import "@fontsource/cairo/arabic-500.css";
import "@fontsource/cairo/arabic-600.css";
import "@fontsource/cairo/arabic-700.css";
// layers.css أولاً (يحدد ترتيب الطبقات)، ثم legacy.css (كل الـ CSS القديم داخل طبقة legacy).
import "./styles/layers.css";
import "./styles/legacy.css";

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
