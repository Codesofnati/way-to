import { pgTable, text, timestamp, uuid, boolean, numeric, integer } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').default('User').notNull(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  walletBalance: numeric('wallet_balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  role: text('role').default('user').notNull(), // 'user', 'admin', 'super_admin'
  invitedBy: uuid('invited_by'),
  isLocked: boolean('is_locked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: text('payment_method').notNull(),
  ftNumber: text('ft_number').notNull().unique(),
  screenshotUrl: text('screenshot_url'),
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected'
  approvals_count: integer('approvals_count').default(0).notNull(),
  approvedBy_admins: text('approvedBy_admins').default('[]').notNull(), // JSON array of admin IDs
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NEW: Admin Reports to Super Admin
export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').notNull(),
  targetUserId: uuid('target_user_id').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'resolved'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// NEW: Withdrawal Requests
export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});