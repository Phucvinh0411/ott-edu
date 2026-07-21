"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { registerAccount, sendRegisterOtp, verifyOtp } from "@/services/auth/auth.service";
import { getRegisterOtpState, setRegisterOtpState, clearRegisterOtpState } from "@/services/auth/otp-flow-store";
import { registerSession, setActiveSessionClassId } from "@/services/api/token-store";

import {
  AuthCard,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "./components";

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? "",
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export default function VerifyRegisterPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(48);
  const [maskedEmail, setMaskedEmail] = useState("m***@example.com");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const otpState = getRegisterOtpState();
    if (!otpState) {
      router.replace("/register");
      return;
    }
    setMaskedEmail(otpState.maskedEmail);
  }, [router]);

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

    const state = getRegisterOtpState();
    if (!state) {
      router.replace("/register");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // 1. Verify OTP first to get the verified token
      const response = await verifyOtp({
        challengeId: state.challengeId,
        otpCode: otp.join(""),
        purpose: "REGISTER",
      });

      // 2. Register account immediately using saved form data + verifiedToken
      const normalizedName = splitFullName(state.form.fullName);
      const loginResponse = await registerAccount({
        email: state.email,
        password: state.form.password,
        firstName: normalizedName.firstName,
        lastName: normalizedName.lastName,
        roleName: "ROLE_STUDENT",
        code: state.code.trim(),
        schoolId: 1, // DEFAULT_SCHOOL_ID
        departmentId: Number(state.departmentId),
        verifiedToken: response.verifiedToken,
      });

      setSuccess("Xác thực và đăng ký thành công! Đang tự động đăng nhập...");
      clearRegisterOtpState();
      
      if (loginResponse && loginResponse.accessToken && loginResponse.user) {
        registerSession(loginResponse.accessToken, loginResponse.refreshToken || "", loginResponse.user);

        const userTeams = loginResponse.user?.teams || [];
        const userClassId = userTeams.length > 0 ? userTeams[0].id.toString() : "60d5ecb8b3112a445c742301";
        const userEmail = loginResponse.user?.email || state.email;

        sessionStorage.setItem("userEmail", userEmail);
        if (userClassId) {
          setActiveSessionClassId(userClassId);
        }

        const isAdmin = loginResponse.user?.roles?.some(
          (role: string) => role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN" || role.includes("ADMIN")
        );

        setTimeout(() => {
          if (isAdmin) {
            router.replace("/admin");
          } else {
            router.replace("/calendar");
          }
        }, 1200);
      } else {
        setTimeout(() => {
          router.replace("/login");
        }, 1500);
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Xác thực mã OTP thất bại.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    const state = getRegisterOtpState();
    if (!state || !state.email) {
      router.replace("/register");
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      const response = await sendRegisterOtp({ email: state.email });
      setRegisterOtpState(response.challengeId, response.maskedEmail, state.email, state.form, state.code, state.departmentId);
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
          title="Xác thực tài khoản"
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
            submitLabel="Xác thực và hoàn tất"
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
            href="/register"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Nhập lại thông tin đăng ký
          </Link>
        </div>
      </AuthCard>
    </AuthPageContainer>
  );
}
