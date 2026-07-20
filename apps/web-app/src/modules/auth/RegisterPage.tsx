"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  Hash,
  Building2,
  GraduationCap,
  Calendar,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

import {
  type RegisterValidationInput,
  validateRegisterForm,
} from "@/modules/auth/validators";
import {
  getDepartmentsBySchoolId,
  sendRegisterOtp,
  type DepartmentOption,
} from "@/services/auth/auth.service";
import { setRegisterOtpState } from "@/services/auth/otp-flow-store";

import {
  AuthCard,
  AuthFieldError,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "./components";

type RegisterFormState = RegisterValidationInput;
type ExtraFieldKey = "code" | "departmentId";

const DEFAULT_SCHOOL_ID = 1;

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

const INITIAL_FORM: RegisterFormState = {
  email: "",
  fullName: "",
  password: "",
  confirmPassword: "",
  birthday: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM);
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departmentId, setDepartmentId] = useState("");

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [metaLoadError, setMetaLoadError] = useState<string | null>(null);

  const [touched, setTouched] = useState<Record<keyof RegisterFormState | "terms" | ExtraFieldKey, boolean>>({
    email: false,
    fullName: false,
    password: false,
    confirmPassword: false,
    birthday: false,
    terms: false,
    code: false,
    departmentId: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const errors = useMemo(() => validateRegisterForm(form, acceptedTerms), [acceptedTerms, form]);
  const extraErrors = useMemo<Partial<Record<ExtraFieldKey, string>>>(() => {
    const nextErrors: Partial<Record<ExtraFieldKey, string>> = {};

    if (!code.trim()) {
      nextErrors.code = "Vui lòng nhập mã sinh viên.";
    }

    if (!departmentId) {
      nextErrors.departmentId = "Vui lòng chọn khoa/phòng ban.";
    } else {
      const isValidDepartment = departments.some((department) => String(department.id) === departmentId);
      if (!isValidDepartment) {
        nextErrors.departmentId = "Khoa/phòng ban đã chọn không có trong danh sách.";
      }
    }

    return nextErrors;
  }, [code, departmentId, departments]);

  const isFormValid =
    Object.values(errors).every((value) => !value) &&
    Object.values(extraErrors).every((value) => !value);
  const maxBirthDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    let mounted = true;

    async function loadDepartments() {
      try {
        setIsDepartmentsLoading(true);
        setMetaLoadError(null);
        const data = await getDepartmentsBySchoolId(DEFAULT_SCHOOL_ID);

        if (!mounted) {
          return;
        }

        setDepartments(data);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setMetaLoadError(error instanceof Error ? error.message : "Không tải được danh sách khoa/phòng ban.");
      } finally {
        if (mounted) {
          setIsDepartmentsLoading(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange =
    (field: keyof RegisterFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      setSubmitError(null);
      setSubmitSuccess(null);
    };

  const handleBlur = (field: keyof RegisterFormState | "terms" | ExtraFieldKey) => () => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      email: true,
      fullName: true,
      password: true,
      confirmPassword: true,
      birthday: true,
      terms: true,
      code: true,
      departmentId: true,
    });

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!isFormValid) {
      return;
    }

    try {
      setIsSubmitting(true);

      const challenge = await sendRegisterOtp({ email: form.email.trim() });

      setRegisterOtpState(
        challenge.challengeId,
        challenge.maskedEmail,
        form.email.trim(),
        form,
        code,
        departmentId
      );

      router.push("/register/verify");
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Không thể gửi mã xác nhận lúc này, vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageContainer>
      <AuthCard>
        <AuthHeader
          title="Đăng ký tài khoản"
          description="Tạo tài khoản mới để bắt đầu học tập trên hệ thống."
        />

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-5">
            {/* Full Name Input */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Họ và tên
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder="VD: Nguyễn Văn A"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  onBlur={handleBlur("fullName")}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
              </div>
              <AuthFieldError message={touched.fullName ? errors.fullName : undefined} />
            </div>

            {/* Email Input */}
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
                  value={form.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
              </div>
              <AuthFieldError message={touched.email ? errors.email : undefined} />
            </div>

            {/* Student Code Input */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Mã sinh viên
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Hash className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  name="code"
                  placeholder="VD: 20000001"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                  }}
                  onBlur={handleBlur("code")}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
              </div>
              <AuthFieldError message={touched.code ? extraErrors.code : undefined} />
            </div>

            {/* School Input (Fixed/Readonly) */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Trường học
              </span>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <Building2 className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value="Đại học Công nghiệp TP.HCM"
                  readOnly
                  disabled
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 pl-12 pr-4 text-sm text-slate-600 shadow-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Department Select Input */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Khoa / Phòng ban
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <select
                  value={departmentId}
                  onChange={(event) => {
                    setDepartmentId(event.target.value);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                  }}
                  onBlur={handleBlur("departmentId")}
                  disabled={isDepartmentsLoading || isSubmitting || Boolean(metaLoadError)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-8 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-100 disabled:opacity-60 transition-all duration-200"
                >
                  <option value="">
                    {isDepartmentsLoading ? "Đang tải danh sách khoa..." : "Chọn khoa / phòng ban"}
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={String(department.id)}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <AuthFieldError message={touched.departmentId ? extraErrors.departmentId : undefined} />
            </div>

            {/* Birthday Input */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Ngày sinh
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Calendar className="w-5 h-5" />
                </span>
                <input
                  type="date"
                  name="birthday"
                  max={maxBirthDate}
                  value={form.birthday}
                  onChange={handleChange("birthday")}
                  onBlur={handleBlur("birthday")}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
              </div>
              <AuthFieldError message={touched.birthday ? errors.birthday : undefined} />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Mật khẩu
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <LockKeyhole className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <AuthFieldError message={touched.password ? errors.password : undefined} />

              {form.password ? (
                <div className="pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Độ mạnh mật khẩu</span>
                    <span className={`text-xs font-semibold ${
                      getPasswordStrength(form.password).label === "Mạnh" ? "text-emerald-600" :
                      getPasswordStrength(form.password).label === "Trung bình" ? "text-amber-600" :
                      "text-red-600"
                    }`}>
                      {getPasswordStrength(form.password).label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-300 ${getPasswordStrength(form.password).color}`}
                      style={{ width: `${getPasswordStrength(form.password).strength}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${
                      form.password.length >= 8 && /[0-9]/.test(form.password) && /[^a-zA-Z0-9]/.test(form.password)
                        ? "text-emerald-500"
                        : "text-slate-300"
                    }`} />
                    <p className="text-xs text-slate-500">
                      Tối thiểu 8 ký tự, bao gồm chữ số và ký tự đặc biệt.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                Xác nhận mật khẩu
              </span>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <LockKeyhole className="w-5 h-5" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
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
              <AuthFieldError message={touched.confirmPassword ? errors.confirmPassword : undefined} />
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => {
                    setAcceptedTerms(event.target.checked);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                  }}
                  onBlur={handleBlur("terms")}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 transition focus:ring-2 focus:ring-indigo-500"
                />
                <span className="leading-snug">
                  Tôi đồng ý với{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    điều khoản sử dụng
                  </Link>{" "}
                  và chính sách bảo mật của OTT Edu.
                </span>
              </label>
              <AuthFieldError message={touched.terms ? errors.terms : undefined} />
            </div>
          </div>

          <AuthStatusAlert type="error" message={metaLoadError} />
          <AuthStatusAlert type="error" message={submitError} />
          <AuthStatusAlert type="success" message={submitSuccess} />

          <AuthSubmitButton isSubmitting={isSubmitting} disabled={!isFormValid} submitLabel="Tạo tài khoản" />
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </AuthCard>
    </AuthPageContainer>
  );
}
