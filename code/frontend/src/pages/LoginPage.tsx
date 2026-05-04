import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { login } from "@/services/authApi";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const storeLogin = useAuthStore((s) => s.login);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await login(data.email, data.password);
      storeLogin(res.accessToken, res.user, res.user.org_id);
      navigate("/admin/driver-checkin");
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) setError("Too many attempts. Please try again later.");
      else setError("Invalid email or password.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-[3px] bg-bg-surface p-8"
      >
        <div className="mb-6 flex items-center justify-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z" fill="#F5C518" opacity="0.18"/>
            <path d="M16 3L29 10.5V21.5L16 29L3 21.5V10.5L16 3Z" stroke="#F5C518" strokeWidth="1.5"/>
            <path d="M16 8.5L23 12.75V21.25L16 25.5L9 21.25V12.75L16 8.5Z" fill="#F5C518" opacity="0.45"/>
            <path d="M16 13L19.5 15V19L16 21L12.5 19V15L16 13Z" fill="#F5C518"/>
          </svg>
          <span className="text-lg font-extrabold tracking-wide"><span className="text-white">THE</span><span className="text-hive-yellow">HIVE</span></span>
        </div>

        {error && (
          <p role="alert" aria-live="assertive" className="mb-4 text-[11px] text-status-error">{error}</p>
        )}
        {!error && <p aria-live="assertive" className="mb-4 text-[11px] text-status-error" />}

        <label className="mb-1 block text-xs text-text-primary" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="mb-1 w-full h-[30px] rounded-[3px] border border-border-input px-2 text-xs"
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mb-3 text-xs text-status-error">{errors.email.message}</p>
        )}

        <label className="mb-1 block text-xs text-text-primary" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          className="mb-1 w-full h-[30px] rounded-[3px] border border-border-input px-2 text-xs"
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="mb-3 text-xs text-status-error">{errors.password.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full h-8 rounded-[3px] bg-hive-yellow text-xs font-semibold text-text-primary"
        >
          Log In
        </button>
      </form>
    </div>
  );
}
