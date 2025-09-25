import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.needMfa) {
          toast({
            title: "OTP Required",
            description: data.message,
            variant: "default",
          });
          // Store login context for OTP verification
          localStorage.setItem('otpPurpose', 'LOGIN');
          navigate('/otp');
        } else {
          // Direct login success (shouldn't happen with current backend)
          navigate('/dashboard');
        }
      } else {
        switch (response.status) {
          case 401:
            setError('Invalid credentials. Please check your username and password.');
            break;
          case 423:
            setError('Account locked. Please contact Nexa support.');
            break;
          default:
            setError(data.message || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      setError('Network error. Contact Nexa support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="nexa-card max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Sign in to Nexa</h1>
          <p className="text-muted-foreground">Access your secure banking dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="nexa-input"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="nexa-input"
              placeholder="Enter your password"
              value={formData.password}
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <Link
            to="/reset-password"
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            Forgot your password?
          </Link>
          
          <div className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Register with Nexa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;