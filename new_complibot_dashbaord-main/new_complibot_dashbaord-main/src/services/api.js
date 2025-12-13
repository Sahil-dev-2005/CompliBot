import { API_BASE_URL } from '../config';

export const sendOTP = async (gstin) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstin })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Network Error:", error);
    throw new Error("Server unreachable. Check if backend is running.");
  }
};

export const verifyOTP = async (gstin, otp) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstin, otp })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Network Error:", error);
    throw new Error("Server unreachable. Check if backend is running.");
  }
};
