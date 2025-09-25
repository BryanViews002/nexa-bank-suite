import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Otp = () => {
  const [otp, setOtp] = useState('');
  const [purpose, setPurpose] = useState<'LOGIN' | 'PASSWORD_RESET'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get purpose from localStorage
    const storedPurpose = localStorage.getItem('otpPurpose') as 'LOGIN' | 'PASSWORD_RESET';
    if (storedPurpose) {
      setPurpose(storedPurpose);
    }

    // Fetch OTP in development mode
    fetchDevOtp(storedPurpose || 'LOGIN');
  }, []);

  const fetchDevOtp = async (currentPurpose: string) => {
    try {
      const response = await fetch(`http://localhost:8080/auth/get-otp?purpose=${currentPurpose}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDevOtp(data.otp);
      } else if (response.status === 403) {
        // Production mode - OTP retrieval not available
        setDevOtp(null);
      }
    } catch (error) {
      // Network error or other issues
      setDevOtp(null);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let endpoint: string;
      let body: any;

      if (purpose === 'LOGIN') {
        endpoint = 'http://localhost:8080/auth/verify-otp';
        body = { code: otp, purpose: 'LOGIN' };
      } else {
        // PASSWORD_RESET
        const email = localStorage.getItem('resetEmail');
        const newPassword = localStorage.getItem('newPassword');
        
        endpoint = 'http://localhost:8080/auth/confirm-password-reset';
        body = { email, code: otp, newPassword };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Verification Successful",
          description: data.message,
          variant: "default",
        });

        if (purpose === 'LOGIN') {
          // Clear OTP purpose and redirect to dashboard
          localStorage.removeItem('otpPurpose');
          setCountdown(2);
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/dashboard');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          // PASSWORD_RESET - clear all stored data and redirect to login
          localStorage.removeItem('otpPurpose');
          localStorage.removeItem('resetEmail');
          localStorage.removeItem('newPassword');
          setCountdown(2);
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/login');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        switch (response.status) {
          case 400:
            setError('Invalid OTP. Please try again.');
            break;
          case 401:
            setError('Please log in first.');
            navigate('/login');
            break;
          case 404:
            setError('No valid OTP found. Try generating a new OTP.');
            break;
          default:
            setError(data.message || 'Verification failed. Please try again.');
        }
      }
    } catch (error) {
      setError('Network error. Contact Nexa support.');
    } finally {
      setLoading(false);
    }
  };

  if (countdown > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="nexa-card max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-success mb-4">Verification Complete!</h1>
          <p className="text-muted-foreground mb-4">
            Redirecting in {countdown} seconds...
          </p>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-success h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((2 - countdown) / 2) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="nexa-card max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Verify Nexa OTP
          </h1>
          <p className="text-muted-foreground">
            {purpose === 'LOGIN' 
              ? 'Enter the 6-digit code to access your account'
              : 'Enter the 6-digit code to complete password reset'
            }
          </p>
        </div>

        {devOtp && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">Development Mode - Your OTP:</p>
            <p className="text-2xl font-bold text-success text-center font-mono">{devOtp}</p>
          </div>
        )}

        {!devOtp && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground text-center">
              OTP has been generated by Nexa. Contact support if you don't receive it.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
              6-Digit OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              className="nexa-input text-center text-2xl font-mono tracking-wider"
              placeholder="000000"
              value={otp}
              onChange={handleOtpChange}
            />
          </div>

          {error && (
            <div className="nexa-error bg-error/10 border border-error/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="nexa-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground">
            Need help?{' '}
            <span className="text-primary font-medium">
              Contact Nexa support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Otp;