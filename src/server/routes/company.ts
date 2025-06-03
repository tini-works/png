import { Elysia, t } from 'elysia';
import { Company } from '../models';
import { isAuthenticated, hasRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

// Company routes
export const companyRoutes = new Elysia().group('/api/companies', (app) =>
  app
    // Get all companies
    .get(
      '/',
      async ({ query }) => {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const companies = await Company.find()
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 });

        const total = await Company.countDocuments();

        return {
          success: true,
          data: {
            companies,
            pagination: {
              total,
              page,
              limit,
              pages: Math.ceil(total / limit),
            },
          },
        };
      },
      {
        query: t.Object({
          page: t.Optional(t.Numeric()),
          limit: t.Optional(t.Numeric()),
        }),
      }
    )
    // Get company by ID
    .get(
      '/:id',
      async ({ params, set }) => {
        const company = await Company.findById(params.id);
        if (!company) {
          set.status = 404;
          throw new AppError('Company not found', 404);
        }

        return {
          success: true,
          data: { company },
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    )
    // Create company
    .post(
      '/',
      async ({ body, set }) => {
        // Check if company with same tax ID already exists
        const existingCompany = await Company.findOne({ taxId: body.taxId });
        if (existingCompany) {
          set.status = 400;
          throw new AppError('Company with this tax ID already exists', 400);
        }

        // Create company
        const company = await Company.create(body);

        return {
          success: true,
          data: { company },
        };
      },
      {
        body: t.Object({
          name: t.String(),
          taxId: t.String(),
          address: t.Object({
            street: t.String(),
            city: t.String(),
            province: t.String(),
            postalCode: t.Optional(t.String()),
            country: t.String(),
          }),
          contactEmail: t.String({ format: 'email' }),
          contactPhone: t.String(),
          logo: t.Optional(t.String()),
          website: t.Optional(t.String()),
          industry: t.Optional(t.String()),
          size: t.Optional(t.String()),
          bankAccounts: t.Optional(
            t.Array(
              t.Object({
                bankName: t.String(),
                accountNumber: t.String(),
                accountHolder: t.String(),
                branch: t.Optional(t.String()),
                isDefault: t.Optional(t.Boolean()),
              })
            )
          ),
          settings: t.Optional(
            t.Object({
              defaultCurrency: t.Optional(t.String()),
              paymentTerms: t.Optional(t.Number()),
              notificationPreferences: t.Optional(
                t.Object({
                  email: t.Optional(t.Boolean()),
                  inApp: t.Optional(t.Boolean()),
                })
              ),
              paymentMethods: t.Optional(
                t.Object({
                  bankTransfer: t.Optional(t.Boolean()),
                  vnpay: t.Optional(t.Boolean()),
                  momo: t.Optional(t.Boolean()),
                  zalopay: t.Optional(t.Boolean()),
                  cash: t.Optional(t.Boolean()),
                })
              ),
            })
          ),
        }),
      }
    )
    // Update company
    .put(
      '/:id',
      async ({ params, body, set }) => {
        // Check if company exists
        const company = await Company.findById(params.id);
        if (!company) {
          set.status = 404;
          throw new AppError('Company not found', 404);
        }

        // Check if tax ID is being changed and if it's already in use
        if (body.taxId && body.taxId !== company.taxId) {
          const existingCompany = await Company.findOne({ taxId: body.taxId });
          if (existingCompany && !existingCompany._id.equals(company._id)) {
            set.status = 400;
            throw new AppError('Company with this tax ID already exists', 400);
          }
        }

        // Update company
        const updatedCompany = await Company.findByIdAndUpdate(
          params.id,
          body,
          { new: true }
        );

        return {
          success: true,
          data: { company: updatedCompany },
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String()),
          taxId: t.Optional(t.String()),
          address: t.Optional(
            t.Object({
              street: t.Optional(t.String()),
              city: t.Optional(t.String()),
              province: t.Optional(t.String()),
              postalCode: t.Optional(t.String()),
              country: t.Optional(t.String()),
            })
          ),
          contactEmail: t.Optional(t.String({ format: 'email' })),
          contactPhone: t.Optional(t.String()),
          logo: t.Optional(t.String()),
          website: t.Optional(t.String()),
          industry: t.Optional(t.String()),
          size: t.Optional(t.String()),
          bankAccounts: t.Optional(
            t.Array(
              t.Object({
                bankName: t.String(),
                accountNumber: t.String(),
                accountHolder: t.String(),
                branch: t.Optional(t.String()),
                isDefault: t.Optional(t.Boolean()),
              })
            )
          ),
          settings: t.Optional(
            t.Object({
              defaultCurrency: t.Optional(t.String()),
              paymentTerms: t.Optional(t.Number()),
              notificationPreferences: t.Optional(
                t.Object({
                  email: t.Optional(t.Boolean()),
                  inApp: t.Optional(t.Boolean()),
                })
              ),
              paymentMethods: t.Optional(
                t.Object({
                  bankTransfer: t.Optional(t.Boolean()),
                  vnpay: t.Optional(t.Boolean()),
                  momo: t.Optional(t.Boolean()),
                  zalopay: t.Optional(t.Boolean()),
                  cash: t.Optional(t.Boolean()),
                })
              ),
            })
          ),
        }),
      }
    )
    // Delete company
    .delete(
      '/:id',
      async ({ params, set }) => {
        // Check if company exists
        const company = await Company.findById(params.id);
        if (!company) {
          set.status = 404;
          throw new AppError('Company not found', 404);
        }

        // Delete company
        await Company.findByIdAndDelete(params.id);

        return {
          success: true,
          data: null,
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
      }
    )
    // Add bank account
    .post(
      '/:id/bank-accounts',
      async ({ params, body, set }) => {
        // Check if company exists
        const company = await Company.findById(params.id);
        if (!company) {
          set.status = 404;
          throw new AppError('Company not found', 404);
        }

        // If this is the default account, set other accounts to non-default
        if (body.isDefault) {
          company.bankAccounts.forEach((account) => {
            account.isDefault = false;
          });
        }

        // Add bank account
        company.bankAccounts.push(body);
        await company.save();

        return {
          success: true,
          data: { company },
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          bankName: t.String(),
          accountNumber: t.String(),
          accountHolder: t.String(),
          branch: t.Optional(t.String()),
          isDefault: t.Optional(t.Boolean()),
        }),
      }
    )
    // Update bank account
    .put(
      '/:id/bank-accounts/:accountId',
      async ({ params, body, set }) => {
        // Check if company exists
        const company = await Company.findById(params.id);
        if (!company) {
          set.status = 404;
          throw new AppError('Company not found', 404);
        }

        // Find bank account
        const accountIndex = company.bankAccounts.findIndex(
          (account) => account._id.toString() === params.accountId
        );
        if (accountIndex === -1) {
          set.status = 404;
          throw new AppError('Bank account not found', 404);
        }

        // If this is the default account, set other accounts to non-default
        if (body.isDefault) {
          company.bankAccounts.forEach((account, index) => {
            if (index !== accountIndex) {
              account.isDefault = false;
            }
          });
        }

        // Update bank account
        company.bankAccounts[accountIndex] = {
          ...company.bankAccounts[accountIndex].toObject(),
          ...body,
        };
        await company.save();

        return {
          success: true,
          data: { company },
        };
      },
      {
        params: t.Object({
          id: t.String(),
          accountId: t.String(),
        }),
        body: t.Object({
          bankName: t.Optional(t.String()),
          accountNumber: t.Optional(t.String()),
          accountHolder: t.Optional(t.String()),
          branch: t.Optional(t.String()),
          isDefault: t.Optional(t.Boolean()),
        }),
      }
    )
    // Delete bank account
    .delete(
      '/:id/bank-accounts/:accountId',
      async ({ params, set }) => {
        // Check if company exists
        const company = await Company.findById(params.id);
        if (!company) {
          set.status = 404;
          throw new AppError('Company not found', 404);
        }

        // Find bank account
        const accountIndex = company.bankAccounts.findIndex(
          (account) => account._id.toString() === params.accountId
        );
        if (accountIndex === -1) {
          set.status = 404;
          throw new AppError('Bank account not found', 404);
        }

        // Remove bank account
        company.bankAccounts.splice(accountIndex, 1);
        await company.save();

        return {
          success: true,
          data: { company },
        };
      },
      {
        params: t.Object({
          id: t.String(),
          accountId: t.String(),
        }),
      }
    )
    // Update company settings
    .put(
      '/:id/settings',
      async ({ params, body, set }) => {
        // Check if company exists
        const company = await Company.findById(params.id);
        if (!company) {
          set.status = 404;
          throw new AppError('Company not found', 404);
        }

        // Update settings
        company.settings = {
          ...company.settings,
          ...body,
        };
        await company.save();

        return {
          success: true,
          data: { company },
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          defaultCurrency: t.Optional(t.String()),
          paymentTerms: t.Optional(t.Number()),
          notificationPreferences: t.Optional(
            t.Object({
              email: t.Optional(t.Boolean()),
              inApp: t.Optional(t.Boolean()),
            })
          ),
          paymentMethods: t.Optional(
            t.Object({
              bankTransfer: t.Optional(t.Boolean()),
              vnpay: t.Optional(t.Boolean()),
              momo: t.Optional(t.Boolean()),
              zalopay: t.Optional(t.Boolean()),
              cash: t.Optional(t.Boolean()),
            })
          ),
        }),
      }
    )
);

