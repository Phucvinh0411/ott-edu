"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { forgotPassword } from "@/services/auth/auth.service";
import { clearForgotOtpState, setForgotOtpState } from "@/services/auth/otp-flow-store";

import {
  AuthCard,
  AuthFieldError,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "./components";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = !email.trim()
    ? "Vui lòng nhập địa chỉ email."
    : !/\S+@\S+\.\S+/.test(email.trim())
    ? "Email không hợp lệ."
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emailError) return;

    setError(null);
    setIsLoading(true);

    try {
      const normalizedEmail = email.trim();
      clearForgotOtpState();
      const response = await forgotPassword({ email: normalizedEmail });
      setForgotOtpState(response.challengeId, response.maskedEmail, normalizedEmail);
      router.push("/forgot-password/check-email");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không thể gửi mã OTP lúc này.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageContainer>
      <AuthCard>
        <AuthHeader
          title="Quên mật khẩu?"
          description="Nhập địa chỉ email tài khoản của bạn để nhận mã xác minh khôi phục."
        />

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Địa chỉ Email
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="student@iuh.edu.vn"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  onBlur={() => setTouched(true)}
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
              </div>
              <AuthFieldError message={touched ? emailError : undefined} />
            </div>
          </div>

          <AuthStatusAlert type="error" message={error} />

          <AuthSubmitButton
            isSubmitting={isLoading}
            disabled={!email.trim() || Boolean(emailError)}
            submitLabel="Gửi mã xác minh"
            loadingLabel="Đang gửi..."
          />
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Nhớ mật khẩu?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang đăng nhập
          </Link>
        </div>
      </AuthCard>
    </AuthPageContainer>
  );
}
