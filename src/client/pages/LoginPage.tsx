import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FormGroup,
  InputGroup,
  Button,
  Intent,
  Callout,
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
    <div className="login-page">
      <h2>Login</h2>

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
            rightElement={lockButton}
            required
          />
        </FormGroup>

        <Button
          type="submit"
          intent={Intent.PRIMARY}
          text="Login"
          loading={isLoading}
          fill
        />
      </form>

      <div className="auth-links">
        <p>
          Don't have an account?{' '}
          <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

