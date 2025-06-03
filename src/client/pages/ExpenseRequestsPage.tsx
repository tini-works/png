import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  HTMLTable,
  Spinner,
  NonIdealState,
  Intent,
  Tag,
  InputGroup,
  HTMLSelect,
  Callout,
  Tabs,
  Tab,
} from '@blueprintjs/core';
import { DateRangeInput } from '@blueprintjs/datetime';
import { useAuth } from '../context/AuthContext';
import { ExpenseRequest, ExpenseRequestStatus } from '../../shared/types';
import { formatCurrency, formatDate } from '../../shared/utils';

const ExpenseRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch expense requests
  const fetchExpenseRequests = async (page = 1, filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...filters,
      });

      const response = await fetch(`/api/expense-requests?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch expense requests');
      }

      const data = await response.json();
      setExpenseRequests(data.data.expenseRequests);
      setTotalCount(data.data.pagination.total);
      setTotalPages(data.data.pagination.pages);
      setCurrentPage(page);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchExpenseRequests();
  }, [token, pageSize]);

  // Apply filters
  const applyFilters = () => {
    const filters: Record<string, string> = {};

    if (searchQuery) {
      filters.search = searchQuery;
    }

    if (statusFilter) {
      filters.status = statusFilter;
    }

    if (categoryFilter) {
      filters.category = categoryFilter;
    }

    if (dateRange[0] && dateRange[1]) {
      filters.startDate = dateRange[0].toISOString();
      filters.endDate = dateRange[1].toISOString();
    }

    fetchExpenseRequests(1, filters);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCategoryFilter('');
    setDateRange([null, null]);
    fetchExpenseRequests();
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    if (tabId === 'all') {
      setStatusFilter('');
    } else if (tabId === 'draft') {
      setStatusFilter(ExpenseRequestStatus.DRAFT);
    } else if (tabId === 'submitted') {
      setStatusFilter(ExpenseRequestStatus.SUBMITTED);
    } else if (tabId === 'approved') {
      setStatusFilter(ExpenseRequestStatus.APPROVED);
    } else if (tabId === 'rejected') {
      setStatusFilter(ExpenseRequestStatus.REJECTED);
    }

    // Apply the status filter
    const filters: Record<string, string> = {};
    if (tabId !== 'all') {
      filters.status = tabId;
    }
    fetchExpenseRequests(1, filters);
  };

  // Get status tag intent
  const getStatusIntent = (status: string): Intent => {
    switch (status) {
      case ExpenseRequestStatus.DRAFT:
        return Intent.NONE;
      case ExpenseRequestStatus.SUBMITTED:
        return Intent.PRIMARY;
      case ExpenseRequestStatus.APPROVED:
        return Intent.SUCCESS;
      case ExpenseRequestStatus.REJECTED:
        return Intent.DANGER;
      case ExpenseRequestStatus.PAID:
        return Intent.SUCCESS;
      case ExpenseRequestStatus.CANCELLED:
        return Intent.NONE;
      default:
        return Intent.NONE;
    }
  };

  // Format status label
  const formatStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchExpenseRequests(page);
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <Button
          key={i}
          minimal
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="pagination">
        <Button
          icon="chevron-left"
          minimal
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        />
        {pages}
        <Button
          icon="chevron-right"
          minimal
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        />
      </div>
    );
  };

  return (
    <div className="expense-requests-page">
      <div className="page-header">
        <h1>Expense Requests</h1>
        <Button
          intent={Intent.PRIMARY}
          icon="add"
          text="New Expense Request"
          onClick={() => navigate('/expense-requests/create')}
        />
      </div>

      {error && (
        <Callout intent={Intent.DANGER} title="Error" className="error-message">
          {error}
        </Callout>
      )}

      <Card className="filters-card">
        <div className="filters-header">
          <h3>Filters</h3>
          <Button
            minimal
            icon="refresh"
            text="Reset"
            onClick={resetFilters}
          />
        </div>
        <div className="filters-content">
          <div className="filter-row">
            <div className="filter-item">
              <label>Search</label>
              <InputGroup
                placeholder="Search by title, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rightElement={
                  <Button
                    icon="search"
                    minimal
                    onClick={applyFilters}
                  />
                }
              />
            </div>
            <div className="filter-item">
              <label>Category</label>
              <HTMLSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { label: 'All Categories', value: '' },
                  { label: 'Travel', value: 'travel' },
                  { label: 'Meals', value: 'meals' },
                  { label: 'Accommodation', value: 'accommodation' },
                  { label: 'Office Supplies', value: 'office_supplies' },
                  { label: 'Transportation', value: 'transportation' },
                  { label: 'Entertainment', value: 'entertainment' },
                  { label: 'Training', value: 'training' },
                  { label: 'Software', value: 'software' },
                  { label: 'Hardware', value: 'hardware' },
                  { label: 'Marketing', value: 'marketing' },
                  { label: 'Other', value: 'other' },
                ]}
                fill
              />
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-item">
              <label>Date Range</label>
              <DateRangeInput
                value={dateRange}
                onChange={setDateRange}
                formatDate={(date) => date.toLocaleDateString()}
                parseDate={(str) => new Date(str)}
                maxDate={new Date()}
                allowSingleDayRange
              />
            </div>
            <div className="filter-actions">
              <Button
                intent={Intent.PRIMARY}
                text="Apply Filters"
                onClick={applyFilters}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="expense-list-card">
        <Tabs
          id="expense-tabs"
          selectedTabId={activeTab}
          onChange={handleTabChange}
          animate
        >
          <Tab id="all" title="All" />
          <Tab id="draft" title="Draft" />
          <Tab id="submitted" title="Submitted" />
          <Tab id="approved" title="Approved" />
          <Tab id="rejected" title="Rejected" />
        </Tabs>

        {isLoading ? (
          <div className="loading-container">
            <Spinner />
            <p>Loading expense requests...</p>
          </div>
        ) : expenseRequests.length === 0 ? (
          <NonIdealState
            icon="folder-open"
            title="No expense requests found"
            description="Create a new expense request to get started."
            action={
              <Button
                intent={Intent.PRIMARY}
                icon="add"
                text="New Expense Request"
                onClick={() => navigate('/expense-requests/create')}
              />
            }
          />
        ) : (
          <>
            <HTMLTable striped className="expense-table">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenseRequests.map((expense) => (
                  <tr key={expense._id}>
                    <td>{expense.requestNumber}</td>
                    <td>
                      <Link to={`/expense-requests/${expense._id}`}>
                        {expense.title}
                      </Link>
                    </td>
                    <td>{formatDate(expense.expenseDate)}</td>
                    <td>
                      {formatCurrency(expense.amount, expense.currency)}
                      {expense.currency !== 'VND' && (
                        <div className="vnd-amount">
                          {formatCurrency(expense.amountInVND, 'VND')}
                        </div>
                      )}
                    </td>
                    <td>
                      <Tag minimal>
                        {expense.category.charAt(0).toUpperCase() +
                          expense.category.slice(1).replace('_', ' ')}
                      </Tag>
                    </td>
                    <td>
                      <Tag intent={getStatusIntent(expense.status)}>
                        {formatStatusLabel(expense.status)}
                      </Tag>
                    </td>
                    <td>
                      <Button
                        icon="edit"
                        minimal
                        small
                        onClick={() => navigate(`/expense-requests/${expense._id}`)}
                        disabled={
                          ![
                            ExpenseRequestStatus.DRAFT,
                            ExpenseRequestStatus.REJECTED,
                          ].includes(expense.status as ExpenseRequestStatus)
                        }
                      />
                      <Button
                        icon="trash"
                        minimal
                        small
                        intent={Intent.DANGER}
                        disabled={
                          ![
                            ExpenseRequestStatus.DRAFT,
                            ExpenseRequestStatus.REJECTED,
                            ExpenseRequestStatus.CANCELLED,
                          ].includes(expense.status as ExpenseRequestStatus)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>

            <div className="table-footer">
              <div className="pagination-info">
                Showing {expenseRequests.length} of {totalCount} expense requests
              </div>
              {renderPagination()}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ExpenseRequestsPage;

