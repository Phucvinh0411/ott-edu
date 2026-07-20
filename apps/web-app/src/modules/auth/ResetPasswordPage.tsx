"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/services/auth/auth.service";
import { clearForgotOtpState, getForgotVerifiedToken } from "@/services/auth/otp-flow-store";

import {
  AuthCard,
  AuthFieldError,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "./components";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 8) return { strength: 25, label: "Yếu", color: "bg-red-500" };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    if (strength < 50) return { strength, label: "Yếu", color: "bg-red-500" };
    if (strength < 75) return { strength, label: "Trung bình", color: "bg-amber-500" };
    return { strength: 100, label: "Mạnh", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const isValid = newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[^a-zA-Z0-9]/.test(newPassword);

  const passwordError = !newPassword
    ? "Vui lòng nhập mật khẩu mới."
    : !isValid
    ? "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ số và ký tự đặc biệt."
    : null;

  const confirmError = !confirmPassword
    ? "Vui lòng xác nhận lại mật khẩu."
    : newPassword !== confirmPassword
    ? "Mật khẩu xác nhận không khớp."
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });
    if (newPassword !== confirmPassword || !isValid) {
      return;
    }

    const verifiedToken = getForgotVerifiedToken();
    if (!verifiedToken) {
      router.replace("/forgot-password");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await resetPassword({
        verifiedToken,
        newPassword,
        confirmPassword,
      });

      clearForgotOtpState();
      router.push("/forgot-password/success");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không thể đặt lại mật khẩu.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageContainer>
      <AuthCard>
        <AuthHeader
          title="Đặt lại mật khẩu"
          description="Tạo mật khẩu mới an toàn cho tài khoản của bạn."
        />

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-5">
            {/* New Password */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Mật khẩu mới
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <LockKeyhole className="w-5 h-5" />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <AuthFieldError message={touched.newPassword ? passwordError : undefined} />

              {newPassword ? (
                <div className="pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Độ mạnh mật khẩu</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.label === "Mạnh" ? "text-emerald-600" :
                      passwordStrength.label === "Trung bình" ? "text-amber-600" :
                      "text-red-600"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isValid ? "text-emerald-500" : "text-slate-300"}`} />
                    <p className="text-xs text-slate-500">
                      Tối thiểu 8 ký tự, bao gồm chữ số và ký tự đặc biệt.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Xác nhận mật khẩu mới
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <LockKeyhole className="w-5 h-5" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <AuthFieldError message={touched.confirmPassword ? confirmError : undefined} />
            </div>
          </div>

          <AuthStatusAlert type="error" message={error} />

          <AuthSubmitButton
            isSubmitting={isSubmitting}
            disabled={!isValid || newPassword !== confirmPassword}
            submitLabel="Cập nhật mật khẩu"
            loadingLabel="Đang cập nhật..."
          />
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
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
