import { Component, type ReactNode } from "react";
import { buttonClass } from "../shared/ui";

interface State {
  failed: boolean;
}

/** يلتقط أي خطأ غير متوقع أثناء الرسم ويعرض شاشة بديلة بدل صفحة بيضاء. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="full-state" role="alert">
        <h1>تعذر عرض الصفحة</h1>
        <p>أعد تحميل التطبيق. بياناتك محفوظة في الخادم.</p>
        <button className={buttonClass("primary")} onClick={() => location.reload()}>
          إعادة التحميل
        </button>
      </div>
    );
  }
}
