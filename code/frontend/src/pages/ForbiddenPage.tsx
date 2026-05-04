import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h1 className="mb-4 text-[15px] font-bold text-text-primary">403 — Access Denied</h1>
      <p className="mb-4 text-[13px] text-text-secondary">You do not have permission to access this page.</p>
      <Link to="/" className="text-xs text-hive-yellow underline">Return to Home</Link>
    </div>
  );
}
