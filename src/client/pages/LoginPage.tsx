import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FormGroup,
  InputGroup,
  Button,
  Intent,
  Callout,
  Card,
  Elevation,
  H2,
  Icon,
} from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  // Toggle password visibility
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Lock button when loading
  const lockButton = (
    <Button
      icon={showPassword ? 'eye-open' : 'eye-off'}
      minimal
      onClick={toggleShowPassword}
    />
  );

  return (
    <div className="login-container">
      <Card elevation={Elevation.TWO} className="login-card">
        <div className="login-header">
          <Icon icon="lock" iconSize={32} intent={Intent.PRIMARY} />
          <H2>Payment Request System</H2>
        </div>

        <div className="login-subtitle">
          <p>Sign in to access your account</p>
        </div>

        {error && (
          <Callout intent={Intent.DANGER} title="Login Failed" className="login-error">
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
              large
              leftIcon="user"
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
              rightElement={lockButton}
              large
              leftIcon="key"
              required
            />
          </FormGroup>

          <Button
            type="submit"
            intent={Intent.PRIMARY}
            text="Sign In"
            loading={isLoading}
            fill
            large
          />
        </form>

        <div className="login-footer">
          <p>
            <a href="#" className="forgot-password">Forgot password?</a>
          </p>
          <p>
            Don't have an account?{' '}
            <Link to="/register">Register</Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
