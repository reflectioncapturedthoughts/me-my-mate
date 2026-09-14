import { useApp } from "../context/AppContext";

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>{t.text}</div>
      ))}
    </div>
  );
}
