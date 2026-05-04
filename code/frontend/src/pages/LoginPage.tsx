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
        className="w-full max-w-sm rounded-lg bg-bg-surface p-8"
      >
        <h1 className="mb-6 text-center text-2xl font-bold text-hive-yellow">The Hive</h1>

        {error && (
          <p role="alert" aria-live="assertive" className="mb-4 text-sm text-status-error">{error}</p>
        )}
        {!error && <p aria-live="assertive" className="mb-4 text-sm text-status-error" />}

        <label className="mb-1 block text-sm text-text-primary" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="mb-1 w-full rounded border border-border-input px-3 py-2 text-sm"
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mb-3 text-xs text-status-error">{errors.email.message}</p>
        )}

        <label className="mb-1 block text-sm text-text-primary" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          className="mb-1 w-full rounded border border-border-input px-3 py-2 text-sm"
          {...register("password")}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="mb-3 text-xs text-status-error">{errors.password.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full rounded bg-hive-yellow py-2 font-semibold text-text-primary"
        >
          Log In
        </button>
      </form>
    </div>
  );
}
