import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Reset Code Sent",
          description: data.message,
          variant: "default",
        });
        setStep('password');
      } else {
        setError(data.message || 'Failed to send reset code. Please try again.');
      }
    } catch (error) {
      setError('Network error. Contact Nexa support.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Store data for OTP verification
    localStorage.setItem('resetEmail', formData.email);
    localStorage.setItem('newPassword', formData.newPassword);
    localStorage.setItem('otpPurpose', 'PASSWORD_RESET');

    toast({
      title: "Ready for Verification",
      description: "Please enter the OTP to complete password reset",
      variant: "default",
    });
    
    navigate('/otp');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="nexa-card max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            {step === 'email' ? 'Reset Password' : 'Set New Password'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'email' 
              ? 'Enter your email to receive a reset code from Nexa' 
              : 'Enter your new password for Nexa account'
            }
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="nexa-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            {error && (
              <div className="nexa-error bg-error/10 border border-error/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="nexa-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Reset Code...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
              <p className="nexa-success text-center">
                Reset code sent to {formData.email}
              </p>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="nexa-input"
                placeholder="Enter your new password"
                value={formData.newPassword}
                onChange={handleInputChange}
              />
            </div>

            {error && (
              <div className="nexa-error bg-error/10 border border-error/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="nexa-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Verification
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="nexa-btn-secondary w-full"
            >
              Back to Email
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign in to Nexa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;