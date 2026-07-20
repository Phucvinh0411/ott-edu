"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, LogIn } from "lucide-react";

import {
  AuthCard,
  AuthHeader,
  AuthPageContainer,
} from "./components";

export default function PasswordUpdatedPage() {
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <AuthPageContainer>
      <AuthCard>
        <AuthHeader
          title="Đổi mật khẩu thành công!"
          description="Mật khẩu tài khoản của bạn đã được cập nhật an toàn. Bạn có thể đăng nhập ngay bây giờ."
        />

        <div className="my-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-100 shadow-inner">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-50"
        >
          <LogIn className="w-5 h-5" />
          Đăng nhập ngay
        </button>
      </AuthCard>
    </AuthPageContainer>
  );
}
