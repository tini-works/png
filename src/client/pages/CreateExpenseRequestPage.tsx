import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  FormGroup,
  InputGroup,
  TextArea,
  Button,
  HTMLSelect,
  Intent,
  Callout,
  NumericInput,
  FileInput,
  Tag,
  Icon,
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import { useAuth } from '../context/AuthContext';
import { ExpenseCategory } from '../../shared/types';

const CreateExpenseRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [currencies, setCurrencies] = useState<string[]>(['VND', 'USD', 'EUR', 'JPY', 'KRW', 'CNY']);
  
  // Form state
  const [title, setTitle] = useState('');
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('VND');
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(undefined);
  const [amountInVND, setAmountInVND] = useState<number>(0);
  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [notes, setNotes] = useState('');

  // Validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/expense-requests/categories', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data.data.categories);
        
        // Set default category if available
        if (data.data.categories.length > 0) {
          setCategory(data.data.categories[0]);
        }
      } catch (error: any) {
        setError(error.message);
      }
    };

    fetchCategories();
  }, [token]);

  // Update amount in VND when amount, currency, or exchange rate changes
  useEffect(() => {
    if (currency === 'VND') {
      setAmountInVND(amount);
      setExchangeRate(undefined);
    } else if (exchangeRate) {
      setAmountInVND(amount * exchangeRate);
    }
  }, [amount, currency, exchangeRate]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!expenseDate) {
      errors.expenseDate = 'Expense date is required';
    }
    
    if (amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!currency) {
      errors.currency = 'Currency is required';
    }
    
    if (currency !== 'VND' && (!exchangeRate || exchangeRate <= 0)) {
      errors.exchangeRate = 'Exchange rate is required and must be greater than 0';
    }
    
    if (!category) {
      errors.category = 'Category is required';
    }
    
    setFormErrors(errors);
    
    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    // Submit form
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/expense-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          expenseDate: expenseDate.toISOString(),
          amount,
          currency,
          exchangeRate: currency !== 'VND' ? exchangeRate : undefined,
          vendorName: vendorName || undefined,
          category,
          description: description || undefined,
          notes: notes || undefined,
          // Attachments would be handled separately with file uploads
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create expense request');
      }
      
      // Navigate to expense requests list
      navigate('/expense-requests');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setAttachments([...attachments, ...fileList]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Format currency
  const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  };

  return (
    <div className="create-expense-page">
      <div className="page-header">
        <h1>Create Expense Request</h1>
        <Button
          icon="arrow-left"
          text="Back to Expenses"
          minimal
          onClick={() => navigate('/expense-requests')}
        />
      </div>

      {error && (
        <Callout intent={Intent.DANGER} title="Error" className="form-error">
          {error}
        </Callout>
      )}

      <Card className="expense-form-card">
        <form onSubmit={handleSubmit}>
          <FormGroup
            label="Title/Purpose"
            labelFor="title"
            intent={formErrors.title ? Intent.DANGER : Intent.NONE}
            helperText={formErrors.title}
            required
          >
            <InputGroup
              id="title"
              placeholder="Enter the purpose of this expense"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              intent={formErrors.title ? Intent.DANGER : Intent.NONE}
            />
          </FormGroup>

          <div className="form-row">
            <FormGroup
              label="Expense Date"
              labelFor="expenseDate"
              intent={formErrors.expenseDate ? Intent.DANGER : Intent.NONE}
              helperText={formErrors.expenseDate}
              required
            >
              <DateInput
                formatDate={(date) => date.toLocaleDateString()}
                parseDate={(str) => new Date(str)}
                placeholder="MM/DD/YYYY"
                value={expenseDate}
                onChange={(date) => setExpenseDate(date as Date)}
                maxDate={new Date()}
                intent={formErrors.expenseDate ? Intent.DANGER : Intent.NONE}
              />
            </FormGroup>

            <FormGroup
              label="Category"
              labelFor="category"
              intent={formErrors.category ? Intent.DANGER : Intent.NONE}
              helperText={formErrors.category}
              required
            >
              <HTMLSelect
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categories.map((cat) => ({
                  label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '),
                  value: cat,
                }))}
                fill
                intent={formErrors.category ? Intent.DANGER : Intent.NONE}
              />
            </FormGroup>
          </div>

          <div className="form-row">
            <FormGroup
              label="Amount"
              labelFor="amount"
              intent={formErrors.amount ? Intent.DANGER : Intent.NONE}
              helperText={formErrors.amount}
              required
            >
              <NumericInput
                id="amount"
                value={amount}
                onValueChange={(valueAsNumber) => setAmount(valueAsNumber)}
                min={0}
                fill
                intent={formErrors.amount ? Intent.DANGER : Intent.NONE}
              />
            </FormGroup>

            <FormGroup
              label="Currency"
              labelFor="currency"
              intent={formErrors.currency ? Intent.DANGER : Intent.NONE}
              helperText={formErrors.currency}
              required
            >
              <HTMLSelect
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={currencies.map((curr) => ({
                  label: curr,
                  value: curr,
                }))}
                fill
                intent={formErrors.currency ? Intent.DANGER : Intent.NONE}
              />
            </FormGroup>
          </div>

          {currency !== 'VND' && (
            <div className="form-row">
              <FormGroup
                label="Exchange Rate"
                labelFor="exchangeRate"
                intent={formErrors.exchangeRate ? Intent.DANGER : Intent.NONE}
                helperText={formErrors.exchangeRate}
                required
              >
                <NumericInput
                  id="exchangeRate"
                  value={exchangeRate}
                  onValueChange={(valueAsNumber) => setExchangeRate(valueAsNumber)}
                  min={0}
                  fill
                  intent={formErrors.exchangeRate ? Intent.DANGER : Intent.NONE}
                />
              </FormGroup>

              <FormGroup
                label="Amount in VND"
                labelFor="amountInVND"
              >
                <InputGroup
                  id="amountInVND"
                  value={formatCurrency(amountInVND, 'VND')}
                  disabled
                />
              </FormGroup>
            </div>
          )}

          <FormGroup
            label="Vendor Name"
            labelFor="vendorName"
          >
            <InputGroup
              id="vendorName"
              placeholder="Enter vendor name (optional)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </FormGroup>

          <FormGroup
            label="Description"
            labelFor="description"
          >
            <TextArea
              id="description"
              placeholder="Enter a detailed description of the expense (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fill
              growVertically
              rows={3}
            />
          </FormGroup>

          <FormGroup
            label="Attachments"
            labelFor="attachments"
          >
            <FileInput
              id="attachments"
              text="Choose files..."
              onInputChange={handleFileChange}
              inputProps={{ multiple: true }}
            />
            {attachments.length > 0 && (
              <div className="attachments-list">
                {attachments.map((file, index) => (
                  <Tag
                    key={index}
                    onRemove={() => removeAttachment(index)}
                    className="attachment-tag"
                  >
                    <Icon icon="paperclip" />
                    {file.name}
                  </Tag>
                ))}
              </div>
            )}
          </FormGroup>

          <FormGroup
            label="Notes"
            labelFor="notes"
          >
            <TextArea
              id="notes"
              placeholder="Enter any additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fill
              growVertically
              rows={2}
            />
          </FormGroup>

          <div className="form-actions">
            <Button
              type="button"
              text="Cancel"
              onClick={() => navigate('/expense-requests')}
              className="cancel-button"
            />
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              text="Save as Draft"
              loading={isLoading}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateExpenseRequestPage;

