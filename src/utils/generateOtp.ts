// src/utils/generateOtp.ts
export function generateOtp(length: number = 6): string {
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }

  return otp;
}