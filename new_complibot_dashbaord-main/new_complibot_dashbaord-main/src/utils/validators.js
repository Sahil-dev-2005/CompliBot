export const validateGSTIN = (gstin) => {
  if (!gstin || gstin.length !== 15) {
    return { valid: false, message: "GSTIN must be exactly 15 characters" };
  }

  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinPattern.test(gstin)) {
    return { valid: false, message: "Invalid GSTIN format" };
  }

  return { valid: true, message: "" };
};

export const validateOTP = (otp) => {
  if (!otp || otp.length !== 6) {
    return false;
  }
  return /^[0-9]{6}$/.test(otp);
};
