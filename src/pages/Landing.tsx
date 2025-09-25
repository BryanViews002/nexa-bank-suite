import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show intro for 2.5 seconds, then fade to main content
    const introTimer = setTimeout(() => {
      setShowIntro(false);
      // Small delay before showing main content for smooth transition
      setTimeout(() => setShowContent(true), 300);
    }, 2500);

    return () => clearTimeout(introTimer);
  }, []);

  // Loading Intro Screen
  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-primary flex items-center justify-center z-50 animate-fade-in">
        <div className="text-center">
          {/* Animated Nexa Logo */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-primary-foreground rounded-full flex items-center justify-center mx-auto animate-bounce-in">
              <span className="text-primary font-bold text-6xl">N</span>
            </div>
            {/* Pulsing rings around logo */}
            <div className="absolute inset-0 w-32 h-32 mx-auto border-4 border-primary-foreground/30 rounded-full animate-ping"></div>
            <div className="absolute inset-2 w-28 h-28 mx-auto border-2 border-primary-foreground/20 rounded-full animate-ping delay-1000"></div>
          </div>
          
          {/* Brand Text */}
          <div className="animate-fade-in delay-500">
            <h1 className="text-4xl font-bold text-primary-foreground mb-4">Nexa Bank</h1>
            <p className="text-xl text-primary-foreground/80">Secure and Simple Banking</p>
          </div>

          {/* Loading Indicator */}
          <div className="mt-12 animate-fade-in delay-1000">
            <div className="w-48 h-1 bg-primary-foreground/20 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary-foreground rounded-full animate-loading-bar"></div>
            </div>
            <p className="text-primary-foreground/60 text-sm mt-4">Initializing secure connection...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main Landing Content (only show after intro)
  if (!showContent) return null;

  return (
    <div className="nexa-hero">
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo Animation */}
        <div className="animate-bounce-in mb-8">
          <div className="w-24 h-24 bg-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <span className="text-primary font-bold text-4xl">N</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="animate-fade-in space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Welcome to <span className="text-primary-foreground/90">Nexa Bank</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/80 max-w-2xl mx-auto">
            Secure and Simple Banking
          </p>
          <p className="text-lg text-primary-foreground/70 max-w-3xl mx-auto">
            Experience the future of banking with Nexa. Manage your accounts, transfer money, 
            and track your transactions with enterprise-grade security and an intuitive interface.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="animate-slide-in-right mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            to="/login"
            className="nexa-btn-primary text-lg px-8 py-4 w-full sm:w-auto text-center inline-block transform hover:scale-105 transition-all"
          >
            Get Started
          </Link>
          <Link
            to="/register"
            className="nexa-btn-secondary text-lg px-8 py-4 w-full sm:w-auto text-center inline-block bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Register Now
          </Link>
        </div>

        {/* Features */}
        <div className="animate-fade-in mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary-foreground mb-2">Secure</h3>
            <p className="text-primary-foreground/70">Bank-grade security with multi-factor authentication</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary-foreground mb-2">Fast</h3>
            <p className="text-primary-foreground/70">Instant transactions and real-time account updates</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary-foreground mb-2">Simple</h3>
            <p className="text-primary-foreground/70">Intuitive interface designed for all users</p>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-primary-foreground/5 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-primary-foreground/5 rounded-full blur-xl animate-pulse delay-1000"></div>
    </div>
  );
};

export default Landing;