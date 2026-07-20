export type LoginValidationInput = {
  email: string;
  password: string;
};

export type LoginValidationErrors = Partial<Record<keyof LoginValidationInput, string>>;

export type RegisterValidationInput = {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  birthday: string;
};

export type RegisterValidationErrors = Partial<Record<keyof RegisterValidationInput | "terms", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateLoginForm(input: LoginValidationInput): LoginValidationErrors {
  const errors: LoginValidationErrors = {};

  if (!input.email.trim()) {
    errors.email = "Vui lòng nhập email.";
  } else if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Email chưa đúng định dạng.";
  }

  if (!input.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }

  return errors;
}

function getAgeFromBirthday(value: string): number {
  const birthDate = new Date(value);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export function validateRegisterForm(
  input: RegisterValidationInput,
  acceptedTerms: boolean,
): RegisterValidationErrors {
  const errors: RegisterValidationErrors = {};

  if (!input.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ và tên.";
  } else if (input.fullName.trim().length < 2) {
    errors.fullName = "Họ và tên cần ít nhất 2 ký tự.";
  }

  if (!input.email.trim()) {
    errors.email = "Vui lòng nhập email.";
  } else if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Email chưa đúng định dạng.";
  }

  if (!input.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (
    input.password.length < MIN_PASSWORD_LENGTH ||
    !/[0-9]/.test(input.password) ||
    !/[^a-zA-Z0-9]/.test(input.password)
  ) {
    errors.password = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ số và ký tự đặc biệt.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  } else if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  if (!input.birthday) {
    errors.birthday = "Vui lòng chọn ngày sinh.";
  } else if (getAgeFromBirthday(input.birthday) < 13) {
    errors.birthday = "Bạn cần đủ 13 tuổi để đăng ký.";
  }

  if (!acceptedTerms) {
    errors.terms = "Bạn cần đồng ý điều khoản để tiếp tục.";
  }

  return errors;
}