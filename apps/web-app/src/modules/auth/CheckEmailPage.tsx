"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { forgotPassword } from "@/services/auth/auth.service";
import { getForgotOtpState, setForgotOtpState } from "@/services/auth/otp-flow-store";

import {
  AuthCard,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "./components";

export default function CheckEmailPage() {
  const router = useRouter();
  const [maskedEmail, setMaskedEmail] = useState(getForgotOtpState()?.maskedEmail ?? "m***@example.com");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const otpState = getForgotOtpState();

  useEffect(() => {
    if (!otpState) {
      router.replace("/forgot-password");
    }
  }, [otpState, router]);

  const handleOpenEmail = () => {
    window.open("mailto:", "_blank");
  };

  const handleResendLink = async () => {
    const state = getForgotOtpState();
    if (!state) {
      router.replace("/forgot-password");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsResending(true);
    try {
      if (!state.email) {
        throw new Error("Không tìm thấy email để gửi lại mã OTP.");
      }

      const response = await forgotPassword({ email: state.email });
      setForgotOtpState(response.challengeId, response.maskedEmail, state.email);
      setMaskedEmail(response.maskedEmail);
      setSuccess("Mã xác minh mới đã được gửi thành công!");
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : "Không thể gửi lại mã OTP.";
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleGoToVerify = () => {
    router.push("/forgot-password/verify");
  };

  return (
    <AuthPageContainer>
      <AuthCard>
        <AuthHeader
          title="Kiểm tra email"
          description={`Mã xác minh 6 số đã được gửi đến địa chỉ ${maskedEmail}`}
        />

        <AuthStatusAlert type="error" message={error} />
        <AuthStatusAlert type="success" message={success} />

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleOpenEmail}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-50"
          >
            <Mail className="w-5 h-5" />
            Mở ứng dụng Email
          </button>

          <button
            type="button"
            onClick={handleGoToVerify}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-indigo-600 bg-white px-4 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-50"
          >
            <KeyRound className="w-5 h-5" />
            Nhập mã OTP xác minh
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Chưa nhận được email?{" "}
          <button
            type="button"
            onClick={handleResendLink}
            disabled={isResending}
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline disabled:opacity-50"
          >
            {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
          </button>
        </div>

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
