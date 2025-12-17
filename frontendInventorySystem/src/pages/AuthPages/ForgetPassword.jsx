import React, { useState } from 'react';
import { Mail, ArrowLeft, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    workEmail: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call - replace with actual API call later
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
    
    console.log('Forgot password form submitted:', formData);
  };

  const handleBackToLogin = () => {
    // Navigation logic will be added later
    console.log('Back to login clicked');
  };

  const handleResendEmail = () => {
    setIsSubmitted(false);
    setIsLoading(true);
    
    // Simulate resend - replace with actual API call later
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Success Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Reset instructions sent successfully
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Email Sent!</strong> If an account exists with <strong>{formData.workEmail}</strong>, you'll receive a password reset link.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Link expires in 15 minutes</span>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p><strong>Important:</strong></p>
                      <ul className="mt-1 space-y-1">
                        <li>• Check your spam/junk folder</li>
                        <li>• The link can only be used once</li>
                        <li>• Contact support if you don't receive the email</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </button>

              <button
                type="button"
                onClick={handleResendEmail}
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Resend Email
              </button>
            </div>
          </div>

          {/* Support Contact */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help?{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your work email to reset your password
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          
          {/* Information Box */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p><strong>Security Notice:</strong></p>
                <p className="mt-1">For your security, we'll send reset instructions to your registered work email only.</p>
              </div>
            </div>
          </div>

          {/* Work Email */}
          <div>
            <label htmlFor="workEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="workEmail"
                name="workEmail"
                type="email"
                required
                value={formData.workEmail}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                placeholder="Enter your work email"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This should be the same email you use to sign in
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !formData.workEmail.trim()}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending Reset Link...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Reset Link
              </>
            )}
          </button>

          {/* Back to Login */}
          <button
            type="button"
            onClick={handleBackToLogin}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </button>

          {/* Reset Process Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-800 mb-2">What happens next?</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>We'll send a secure reset link to your email</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Click the link to create a new password</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Link expires in 15 minutes for security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Contact{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 underline">
              IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;