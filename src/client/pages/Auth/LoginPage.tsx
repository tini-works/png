import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FormGroup,
  InputGroup,
  Button,
  Intent,
  Callout,
} from '@blueprintjs/core';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Redirect is handled by the AuthContext
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <h2>Login to Your Account</h2>
      
      {error && (
        <Callout intent={Intent.DANGER} title="Login Failed">
          {error}
        </Callout>
      )}
      
      <form onSubmit={handleSubmit}>
        <FormGroup label="Email" labelFor="email">
          <InputGroup
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormGroup>
        
        <FormGroup label="Password" labelFor="password">
          <InputGroup
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightElement={
              <Button
                icon={showPassword ? 'eye-open' : 'eye-off'}
                minimal
                onClick={toggleShowPassword}
              />
            }
            required
          />
        </FormGroup>
        
        <Button
          type="submit"
          intent={Intent.PRIMARY}
          text="Login"
          loading={loading}
          fill
        />
      </form>
      
      <div className="auth-links">
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

