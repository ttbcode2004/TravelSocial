// AuthLayout.tsx
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold">
            Travel<span className="text-primary">Social</span>
          </h1>
          <p className="text-fg-muted mt-1 text-sm">Khám phá, chia sẻ, kết nối</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}