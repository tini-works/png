import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FormGroup,
  InputGroup,
  Button,
  Intent,
  Callout,
  HTMLSelect,
} from '@blueprintjs/core';
import { useAuth } from '../context/AuthContext';

interface Company {
  _id: string;
  name: string;
}

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fetchingCompanies, setFetchingCompanies] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const { register, isLoading, error } = useAuth();

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setFetchingCompanies(true);
        setCompanyError(null);

        const response = await fetch('/api/companies');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to fetch companies');
        }

        setCompanies(data.data.companies);
      } catch (error: any) {
        setCompanyError(error.message);
      } finally {
        setFetchingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordError(null);

    // Register user
    await register({
      firstName,
      lastName,
      email,
      password,
      companyId,
    });
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
    <div className="register-page">
      <h2>Register</h2>

      {error && (
        <Callout intent={Intent.DANGER} title="Registration Failed">
          {error}
        </Callout>
      )}

      <form onSubmit={handleSubmit}>
        <h3>Personal Information</h3>
        <div className="form-row">
          <FormGroup label="First Name" labelFor="firstName">
            <InputGroup
              id="firstName"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup label="Last Name" labelFor="lastName">
            <InputGroup
              id="lastName"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </FormGroup>
        </div>

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

        <h3>Company Information</h3>
        <FormGroup
          label="Company"
          labelFor="company"
          helperText={companyError}
          intent={companyError ? Intent.DANGER : Intent.NONE}
        >
          <HTMLSelect
            id="company"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            options={[
              { label: 'Select a company', value: '' },
              ...companies.map((company) => ({
                label: company.name,
                value: company._id,
              })),
            ]}
            disabled={fetchingCompanies}
            fill
            required
          />
        </FormGroup>

        <h3>Security</h3>
        <FormGroup
          label="Password"
          labelFor="password"
          helperText="Password must be at least 8 characters long"
        >
          <InputGroup
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightElement={lockButton}
            required
            minLength={8}
          />
        </FormGroup>

        <FormGroup
          label="Confirm Password"
          labelFor="confirmPassword"
          helperText={passwordError}
          intent={passwordError ? Intent.DANGER : Intent.NONE}
        >
          <InputGroup
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            rightElement={lockButton}
            required
            minLength={8}
          />
        </FormGroup>

        <Button
          type="submit"
          intent={Intent.PRIMARY}
          text="Register"
          loading={isLoading}
          fill
        />
      </form>

      <div className="auth-links">
        <p>
          Already have an account?{' '}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

