import { pgTable, text, timestamp, uuid, boolean, numeric, integer } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').default('User').notNull(), // You can use this as "Real Name"
  username: text('username'),                   // ✅ NEW
  email: text('email'),                         // ✅ NEW
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  walletBalance: numeric('wallet_balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  role: text('role').default('user').notNull(),
  invitedBy: uuid('invited_by'),
  isLocked: boolean('is_locked').default(false).notNull(),
  hasPaidReferral: boolean('has_paid_referral').default(false).notNull(), // ✅ NEW
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
  rejectionReason: text('rejection_reason'), // ✅ ADD THIS
  approvedBy_admins: text('approvedBy_admins').default('[]').notNull(), // JSON array of admin IDs
  assignedTo: text('assigned_to'), // ✅ NEW: The name of the account holder (e.g. "Abebe")
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // ✅ NEW: Closed Time

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
// 1. The Method (e.g., Telebirr, CBE)
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. The Accounts (e.g., Telebirr Acc 1, Telebirr Acc 2)
export const paymentAccounts = pgTable('payment_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  methodId: uuid('method_id').notNull(), // Links to paymentMethods
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 1. Fund Plans (Created by Super Admin)
export const fundPlans = pgTable('fund_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  durationDays: integer('duration_days').notNull(),
  interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(), // Daily %
  minAmount: numeric('min_amount', { precision: 10, scale: 2 }).default('500.00').notNull(),
  maxAmount: numeric('max_amount', { precision: 10, scale: 2 }).default('50000.00').notNull(),
  maxParticipants: integer('max_participants').default(100).notNull(),
  fakeJoinedUsers: integer('fake_joined_users').default(0).notNull(), // ✅ NEW: Fake UI count
  startDate: timestamp('start_date').notNull(),                       // ✅ NEW: Fund lock date
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. User Funds (When a user invests)
export const userFunds = pgTable('user_funds', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  planId: uuid('plan_id').notNull(),
  amountInvested: numeric('amount_invested', { precision: 10, scale: 2 }).notNull(),
  dailyInterestBirr: numeric('daily_interest_birr', { precision: 10, scale: 2 }).notNull(), // ✅ NEW: Quick daily calc
  totalReturn: numeric('total_return', { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').default('active').notNull(), // 'active', 'completed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Transactions (For future wallet history tracking)
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  type: text('type').notNull(), // 'deposit', 'withdraw', 'fund_lock', 'fund_return'
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 1. Jobs (The subscription tiers users buy)
export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),                 // e.g. "Starter Job"
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(), // e.g. 2500.00
  taskCount: integer('task_count').notNull(),   // e.g. 2 videos to watch
  rewardPerTask: numeric('reward_per_task', { precision: 10, scale: 2 }).notNull(), // e.g. 50 ETB
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Job Tasks (The actual videos)
export const jobTasks = pgTable('job_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').notNull(),
  title: text('title').notNull(),
  youtubeUrl: text('youtube_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  fakeLikes: integer('fake_likes').default(0).notNull(), // ✅ Make sure this exists
  scheduledDate: text('scheduled_date').notNull(), // ✅ NEW: Store as "YYYY-MM-DD" string
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. User Jobs (Tracks who bought which job)
export const userJobs = pgTable('user_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  jobId: uuid('job_id').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Task Submissions (Tracks completed videos and 5-star ratings)
export const taskSubmissions = pgTable('task_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  taskId: uuid('task_id').notNull(),
  jobId: uuid('job_id').notNull(),
  rating: integer('rating').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'paid'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ✅ NEW: Platforms Table
export const platforms = pgTable('platforms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(), // e.g. "Telegram"
  baseUrl: text('base_url').notNull(),   // e.g. "https://t.me/"
  logoUrl: text('logo_url').notNull(),   // e.g. "https://.../telegram-logo.png"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ✅ UPDATED: Contact Methods Table
export const contactMethods = pgTable('contact_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),          // e.g. "Abebe Support"
  username: text('username').notNull(),  // e.g. "@abebe_support"
  platformId: uuid('platform_id').notNull(), // Links to the platform
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 1. Banks (Managed by Super Admin)
export const banks = pgTable('banks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(), // e.g. "Commercial Bank of Ethiopia"
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. User Bank Details (Locked after saving)
export const userBankDetails = pgTable('user_bank_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(), // One bank account per user
  bankId: uuid('bank_id').notNull(),
  accountHolderName: text('account_holder_name').notNull(),
  accountNumber: text('account_number').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),     // ✅ Track when it was changed
  adminEdited: boolean('admin_edited').default(false).notNull(), // ✅ Track if admin changed it
});

// 1. Withdrawal Settings (Super Admin sets these)
export const withdrawSettings = pgTable('withdraw_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  taxPercent: numeric('tax_percent', { precision: 5, scale: 2 }).notNull(), // e.g. 5.00 for 5%
  amounts: text('amounts').notNull(), // JSON array string e.g. "[400, 700, 1000]"
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Withdrawal Requests (Admin/Super Admin process these)
export const withdrawalRequests = pgTable('withdrawal_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  amountRequested: numeric('amount_requested', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  amountToReceive: numeric('amount_to_receive', { precision: 10, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected'
  bankDetailsSnapshot: text('bank_details_snapshot').notNull(), // Save their bank info at time of request
  approvedBy: uuid('approved_by'), // ✅ NEW: Tracks which admin processed it
  rejectionReason: text('rejection_reason'), // ✅ Added
  lockedBy: uuid('locked_by'),          // ✅ Who opened it
  lockedAt: timestamp('locked_at'),     // ✅ When they opened it
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // ✅ Ensure this exists
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ✅ NEW: Referral Settings (Super Admin sets these)
export const referralSettings = pgTable('referral_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  level1Percent: numeric('level1_percent', { precision: 5, scale: 2 }).default('20.00').notNull(), // ✅ % instead of amount
  level2Percent: numeric('level2_percent', { precision: 5, scale: 2 }).default('5.00').notNull(),  // ✅ % instead of amount
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey().default('global'),
  maxUsers: integer('max_users').default(100).notNull(),
  youtubeChannelUrl: text('youtube_channel_url').default('').notNull(), // ✅ NEW
});

// ✅ NEW: Daily Global Videos (entered once by Super Admin, shown to ALL job holders)
export const dailyVideos = pgTable('daily_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  youtubeUrl: text('youtube_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  fakeLikes: integer('fake_likes').default(0).notNull(),
  scheduledDate: text('scheduled_date').notNull(), // "YYYY-MM-DD"
  isActive: boolean('is_active').default(true).notNull(),
  requiresSubscription: boolean('requires_subscription').default(false).notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ✅ 1. Company Stories (Home Feed)
export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  titleAm: text('title_am').notNull(),
  titleEn: text('title_en').notNull(),
  contentAm: text('content_am').notNull(),
  contentEn: text('content_en').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ✅ 2. Global Popup Notifications
export const globalNotifications = pgTable('global_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  titleAm: text('title_am').notNull(),
  titleEn: text('title_en').notNull(),
  contentAm: text('content_am').notNull(),
  contentEn: text('content_en').notNull(),
  expiresAt: timestamp('expires_at').notNull(), // When it should stop showing
  createdAt: timestamp('created_at').defaultNow().notNull(),
});