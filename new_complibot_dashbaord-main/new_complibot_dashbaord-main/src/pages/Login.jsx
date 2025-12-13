import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateGSTIN, validateOTP } from '../utils/validators';
import { sendOTP, verifyOTP } from '../services/api';
import styles from './Login.module.css';

const Login = () => {
  const navigate = useNavigate();
  const [gstin, setGstin] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gstinError, setGstinError] = useState('');

  const handleGstinChange = (e) => {
    const value = e.target.value.toUpperCase();
    setGstin(value);
    setError('');
    
    if (value.length > 0) {
      const validation = validateGSTIN(value);
      setGstinError(validation.valid ? '' : validation.message);
    } else {
      setGstinError('');
    }
  };

  const handleSendOtp = async () => {
    const validation = validateGSTIN(gstin);
    if (!validation.valid) {
      setGstinError(validation.message);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await sendOTP(gstin);
      
      if (result.success) {
        setShowOtpInput(true);
        setError('');
      } else {
        setError(result.message || 'Failed to send OTP');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOTP(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyOTP(gstin, otp);
      
      if (result.success) {
        localStorage.setItem('complibot_user', JSON.stringify(result.user));
        navigate('/dashboard');
      } else {
        setError(result.message || 'Invalid OTP');
        setOtp('');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setError('');
    setLoading(true);
    
    try {
      const result = await sendOTP(gstin);
      
      if (result.success) {
        setError('');
        alert('OTP resent successfully');
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isGstinValid = validateGSTIN(gstin).valid;
  const isOtpValid = validateOTP(otp);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Complibot Dashboard</h1>
      </header>
      
      <div className={styles.loginCard}>
        <h2 className={styles.title}>Login</h2>
        
        <div className={styles.formGroup}>
          <label htmlFor="gstin" className={styles.label}>
            Enter GSTIN Number
          </label>
          <input
            id="gstin"
            type="text"
            value={gstin}
            onChange={handleGstinChange}
            placeholder="e.g., 07ABCDE1234F1Z5"
            maxLength={15}
            disabled={showOtpInput}
            className={`${styles.input} ${gstinError ? styles.inputError : ''}`}
          />
          <div className={styles.inputFooter}>
            <span className={styles.charCount}>{gstin.length}/15 characters</span>
            {gstinError && <span className={styles.errorText}>{gstinError}</span>}
          </div>
        </div>

        {!showOtpInput && (
          <button
            onClick={handleSendOtp}
            disabled={!isGstinValid || loading}
            className={styles.button}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        )}

        {showOtpInput && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="otp" className={styles.label}>
                Enter 6-digit OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setOtp(value);
                  setError('');
                }}
                placeholder="123456"
                maxLength={6}
                autoFocus
                className={styles.input}
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={!isOtpValid || loading}
              className={styles.button}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              onClick={handleResendOtp}
              disabled={loading}
              className={styles.linkButton}
            >
              Didn't receive OTP? Resend
            </button>
          </>
        )}

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
