export function generateOtp6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}