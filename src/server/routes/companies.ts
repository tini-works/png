import { Elysia, t } from 'elysia';
import { Company } from '../models';
import { isAuthenticated, hasRole } from '../middleware/auth';
import { UserRole } from '../models/user';
import { AppError } from '../middleware/errorHandler';

// Create company routes
export const companyRoutes = new Elysia({ prefix: '/companies' })
  // Get all companies (admin only)
  .use(isAuthenticated)
  .get(
    '/',
    async ({ user }) => {
      // Only admin can see all companies
      if (user.role !== UserRole.ADMIN) {
        throw new AppError('Forbidden: Admin access required', 403);
      }

      const companies = await Company.find();
      return {
        success: true,
        data: companies,
      };
    }
  )
  // Get company by ID
  .get(
    '/:id',
    async ({ params, user }) => {
      const { id } = params;

      // Admin can access any company, others only their own
      if (user.role !== UserRole.ADMIN && user.companyId.toString() !== id) {
        throw new AppError('Forbidden: You do not have access to this company', 403);
      }

      const company = await Company.findById(id);
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      return {
        success: true,
        data: company,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Create a new company (admin only)
  .post(
    '/',
    async ({ body, user, set }) => {
      // Only admin can create companies
      if (user.role !== UserRole.ADMIN) {
        throw new AppError('Forbidden: Admin access required', 403);
      }

      // Check if company with same tax ID already exists
      const existingCompany = await Company.findOne({ taxId: body.taxId });
      if (existingCompany) {
        throw new AppError('Company with this tax ID already exists', 400);
      }

      // Create new company
      const company = new Company(body);
      await company.save();

      set.status = 201;
      return {
        success: true,
        message: 'Company created successfully',
        data: company,
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
        bankAccounts: t.Array(
          t.Object({
            bankName: t.String(),
            accountNumber: t.String(),
            accountHolder: t.String(),
            branch: t.Optional(t.String()),
            isDefault: t.Boolean(),
          })
        ),
      }),
    }
  )
  // Update company
  .put(
    '/:id',
    async ({ params, body, user }) => {
      const { id } = params;

      // Admin can update any company, others only their own
      if (user.role !== UserRole.ADMIN && user.companyId.toString() !== id) {
        throw new AppError('Forbidden: You do not have access to this company', 403);
      }

      // Find company
      const company = await Company.findById(id);
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      // If tax ID is being changed, check if it's unique
      if (body.taxId && body.taxId !== company.taxId) {
        const existingCompany = await Company.findOne({ taxId: body.taxId });
        if (existingCompany) {
          throw new AppError('Company with this tax ID already exists', 400);
        }
      }

      // Update company
      Object.assign(company, body);
      await company.save();

      return {
        success: true,
        message: 'Company updated successfully',
        data: company,
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
              isDefault: t.Boolean(),
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
  // Delete company (admin only)
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      const { id } = params;

      // Only admin can delete companies
      if (user.role !== UserRole.ADMIN) {
        throw new AppError('Forbidden: Admin access required', 403);
      }

      // Find and delete company
      const company = await Company.findByIdAndDelete(id);
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      set.status = 204;
      return {
        success: true,
        message: 'Company deleted successfully',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );

