"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { forgotPassword, verifyOtp } from "@/services/auth/auth.service";
import { getForgotOtpState, setForgotOtpState, setForgotVerifiedToken } from "@/services/auth/otp-flow-store";

import {
  AuthCard,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "./components";

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(48);
  const [maskedEmail, setMaskedEmail] = useState(getForgotOtpState()?.maskedEmail ?? "m***@example.com");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpState = getForgotOtpState();

  useEffect(() => {
    if (!otpState) {
      router.replace("/forgot-password");
    }
  }, [otpState, router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.every((digit) => digit !== "")) {
      return;
    }

    const state = getForgotOtpState();
    if (!state) {
      router.replace("/forgot-password");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await verifyOtp({
        challengeId: state.challengeId,
        otpCode: otp.join(""),
        purpose: "FORGOT_PASSWORD",
      });

      setForgotVerifiedToken(response.verifiedToken);
      setSuccess("Xác thực OTP thành công!");
      setTimeout(() => {
        router.push("/forgot-password/reset");
      }, 800);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Không thể xác thực mã OTP.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    const state = getForgotOtpState();
    if (!state || !state.email) {
      router.replace("/forgot-password");
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const response = await forgotPassword({ email: state.email });
      setForgotOtpState(response.challengeId, response.maskedEmail, state.email);
      setMaskedEmail(response.maskedEmail);
      setTimeLeft(48);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setSuccess("Mã OTP mới đã được gửi thành công!");
    } catch (resendError) {
      const message = resendError instanceof Error ? resendError.message : "Không thể gửi lại mã OTP.";
      setError(message);
    }
  };

  return (
    <AuthPageContainer>
      <AuthCard>
        <AuthHeader
          title="Xác thực OTP khôi phục"
          description={`Mã xác thực 6 số đã được gửi đến ${maskedEmail}`}
        />

        <AuthStatusAlert type="error" message={error} />
        <AuthStatusAlert type="success" message={success} />

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="h-12 w-12 rounded-2xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50"
              />
            ))}
          </div>

          <AuthSubmitButton
            isSubmitting={isLoading}
            disabled={!otp.every((digit) => digit !== "")}
            submitLabel="Xác nhận mã OTP"
            loadingLabel="Đang xử lý..."
          />
        </form>

        <div className="mt-6 text-center">
          <p className="mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Thời gian hiệu lực</p>
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-indigo-600">
                {Math.floor(timeLeft / 60).toString().padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold text-slate-400">PHÚT</span>
            </div>
            <span className="text-xl font-bold text-slate-300">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-indigo-600">
                {(timeLeft % 60).toString().padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold text-slate-400">GIÂY</span>
            </div>
          </div>
          
          {timeLeft === 0 && (
            <button
              onClick={handleResendCode}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Gửi lại mã OTP mới
            </button>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <Link
            href="/forgot-password"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Nhập lại email khác
          </Link>
        </div>
      </AuthCard>
    </AuthPageContainer>
  );
}
