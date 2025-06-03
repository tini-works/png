import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FormGroup,
  InputGroup,
  Button,
  Intent,
  Callout,
} from '@blueprintjs/core';
import { api } from '../../utils/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    taxId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // First create company
      const companyResponse = await api.companies.create({
        name: formData.companyName,
        taxId: formData.taxId,
        address: {
          street: '',
          city: '',
          province: '',
          country: 'Vietnam',
        },
        contactEmail: formData.email,
        contactPhone: '',
        bankAccounts: [],
      });

      // Then register user with company ID
      await api.auth.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        companyId: companyResponse.data._id,
        role: 'admin', // First user is admin
      });

      // Redirect to login
      navigate('/login', { state: { registered: true } });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="register-page">
      <h2>Create an Account</h2>
      
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
              name="firstName"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup label="Last Name" labelFor="lastName">
            <InputGroup
              id="lastName"
              name="lastName"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </div>
        
        <FormGroup label="Email" labelFor="email">
          <InputGroup
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <div className="form-row">
          <FormGroup label="Password" labelFor="password">
            <InputGroup
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
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
          
          <FormGroup label="Confirm Password" labelFor="confirmPassword">
            <InputGroup
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </FormGroup>
        </div>
        
        <h3>Company Information</h3>
        
        <FormGroup label="Company Name" labelFor="companyName">
          <InputGroup
            id="companyName"
            name="companyName"
            placeholder="Enter your company name"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup label="Tax ID" labelFor="taxId">
          <InputGroup
            id="taxId"
            name="taxId"
            placeholder="Enter your company tax ID"
            value={formData.taxId}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <Button
          type="submit"
          intent={Intent.PRIMARY}
          text="Register"
          loading={loading}
          fill
        />
      </form>
      
      <div className="auth-links">
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

