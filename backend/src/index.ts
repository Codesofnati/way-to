import { eq, inArray, and, gte, lte, sql, desc,  ne} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core'; // ✅ Import alias from pg-core

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { profiles, notifications, payments, reports, withdrawals,
   paymentMethods, paymentAccounts, fundPlans, userFunds, transactions, 
   jobs, jobTasks, userJobs, taskSubmissions, contactMethods, banks, 
   userBankDetails,  withdrawSettings, withdrawalRequests, referralSettings, 
   platforms,
   systemSettings,
   dailyVideos,
   globalNotifications,
   stories,
   appSettings} from './db/schema';

   // ✅ ADD THIS NEW HELPER FUNCTION HERE
function getDb(databaseUrl: string) {
  const client = postgres(databaseUrl, { prepare: false });
  return drizzle(client);
}


type Bindings = { DATABASE_URL: string; };
const app = new Hono<{ Bindings: Bindings }>();
app.use('/*', cors());

// --- UTILS ---
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- AUTH MODULE ---
app.post('/api/auth/register', async (c) => {
  const { phone, password, invitedBy } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);
  
  try {
    // ✅ 1. CHECK IF INVITER HAS BOUGHT A JOB
    if (invitedBy) {
      const inviterJob = await db
        .select()
        .from(userJobs)
        .where(eq(userJobs.userId, invitedBy))
        .limit(1);

      if (inviterJob.length === 0) {
        return c.json({ 
          success: false, 
          error: 'The person who invited you has not registered for a job yet. They must buy a job to invite new members.' 
        }, 403);
      }
    }

    const hashedPassword = await hashPassword(password);

    // ✅ 2. CREATE THE NEW USER (No money given yet)
    const newProfile = await db.insert(profiles).values({
      phone, 
      passwordHash: hashedPassword, 
      role: 'user', 
      invitedBy: invitedBy || null,
    }).returning();

    // ✅ 3. NOTIFY INVITER ONLY (No Payout yet)
    if (invitedBy) {
      await db.insert(notifications).values({
        userId: invitedBy,
        message: `Your invitee brought in a new member with phone: ${phone}. They must buy a job for you to earn a bonus.`,
      });
    }
    
    return c.json({ success: true, user: newProfile[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/auth/login', async (c) => {
  const { phone, password } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);
  const hashedPassword = await hashPassword(password);
  
  const user = await db.select().from(profiles).where(eq(profiles.phone, phone)).limit(1);
  if (user.length === 0 || user[0].passwordHash !== hashedPassword) {
    return c.json({ success: false, error: 'Invalid credentials' }, 401);
  }
  if (user[0].isLocked) {
    return c.json({ success: false, error: 'Account is locked. Contact Super Admin.' }, 403);
  }
  return c.json({ success: true, user: user[0] }, 200);
});

// Update User Profile Info (Name, Username, Email)
app.put('/api/user/:id/profile', async (c) => {
  try {
    const userId = c.req.param('id');
    const { name, username, email } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db.update(profiles)
      .set({ name, username, email })
      .where(eq(profiles.id, userId))
      .returning();

    if (updated.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, user: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Update User Password
app.put('/api/user/:id/password', async (c) => {
  try {
    const userId = c.req.param('id');
    const { currentPassword, newPassword } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    // 1. Verify Current Password
    const user = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (user.length === 0) return c.json({ success: false, error: 'User not found' }, 404);

    const currentHashed = await hashPassword(currentPassword);
    if (user[0].passwordHash !== currentHashed) {
      return c.json({ success: false, error: 'Incorrect current password' }, 401);
    }

    // 2. Hash and Save New Password
    const newHashed = await hashPassword(newPassword);
    await db.update(profiles).set({ passwordHash: newHashed }).where(eq(profiles.id, userId));

    return c.json({ success: true, message: 'Password updated successfully' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// --- REFERRAL & DASHBOARD MODULE (Strict 2-Level Chain) ---
// --- REFERRAL & DASHBOARD MODULE (Strict 2-Level Chain) ---
app.get('/api/user/:id/dashboard', async (c) => {
  const userId = c.req.param('id');
  const db = getDb(c.env.DATABASE_URL);

  try {
    const userProfile = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (userProfile.length === 0) return c.json({ success: false, error: 'User not found' }, 404);

    const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));

    // Level 1 (Direct Invites)
    const level1 = await db.select().from(profiles).where(eq(profiles.invitedBy, userId));
    const level1Ids = level1.map(u => u.id);

    // Level 2 (Grandchildren only, no deeper)
    let level2: any[] = [];
    if (level1Ids.length > 0) {
      level2 = await db.select().from(profiles).where(inArray(profiles.invitedBy, level1Ids));
    }

    const formatReferral = (u: any) => ({
      id: u.id, name: u.name, phone: u.phone, createdAt: u.createdAt,
    });

    // ✅ Fetch Active Job Level AND Price
    const userJobData = await db.select({ 
      jobName: jobs.name,
      jobPrice: jobs.price
    })
      .from(userJobs)
      .leftJoin(jobs, eq(userJobs.jobId, jobs.id))
      .where(eq(userJobs.userId, userId))
      .limit(1);

    const jobLevel = userJobData.length > 0 ? userJobData[0].jobName : 'No Job';
    const jobPrice = userJobData.length > 0 ? userJobData[0].jobPrice : '0';

    // ✅ NEW: Calculate Job Profits
    const submissions = await db.select({
      jobId: taskSubmissions.jobId,
      createdAt: taskSubmissions.createdAt,
    })
    .from(taskSubmissions)
    .where(and(eq(taskSubmissions.userId, userId), eq(taskSubmissions.status, 'paid')));

    let totalJobProfit = 0;
    let dailyJobProfit = 0;
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const sub of submissions) {
      // Get the reward amount for this specific job
      const jobInfo = (await db.select().from(jobs).where(eq(jobs.id, sub.jobId)).limit(1))[0];
      if (jobInfo) {
        const reward = parseFloat(jobInfo.rewardPerTask);
        totalJobProfit += reward;
        if (new Date(sub.createdAt) >= dayAgo) {
          dailyJobProfit += reward;
        }
      }
    }

    return c.json({
      success: true,
      user: {
        ...userProfile[0],
        jobLevel: jobLevel,
        jobPrice: jobPrice,
        totalJobProfit: totalJobProfit.toFixed(2),   // ✅ Add total job profit
        dailyJobProfit: dailyJobProfit.toFixed(2),   // ✅ Add daily job profit
      },
      notifications: userNotifications,
      referrals: { level1: level1.map(formatReferral), level2: level2.map(formatReferral) },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// --- PAYMENTS & WITHDRAWALS ---
app.post('/api/user/:id/payment', async (c) => {
  const userId = c.req.param('id');
  // ✅ Add assignedTo here
  const { amount, paymentMethod, ftNumber, screenshotUrl, assignedTo } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);

  try {
    const newPayment = await db.insert(payments).values({
      userId, amount, payment_method: paymentMethod, ftNumber, screenshotUrl: screenshotUrl || null, status: 'pending',
      assignedTo: assignedTo || null // ✅ Save the name
    }).returning();
    return c.json({ success: true, payment: newPayment[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// --- ADMIN MODULE ---
app.get('/api/admin/payments', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const adminId = c.req.query('adminId');
    
    let adminName = '';
    let userRole = 'admin';

    if (adminId) {
      const admin = (await db.select().from(profiles).where(eq(profiles.id, adminId)).limit(1))[0];
      if (admin) {
        adminName = admin.name;
        userRole = admin.role;
      }
    }

    const allPayments = await db.select({
      id: payments.id,
      amount: payments.amount,
      payment_method: payments.payment_method,
      ftNumber: payments.ftNumber,
      screenshotUrl: payments.screenshotUrl,
      status: payments.status,
      assignedTo: payments.assignedTo,
      rejectionReason: payments.rejectionReason,
      approvals_count: payments.approvals_count,
      approvedBy_admins: payments.approvedBy_admins,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      userId: { id: profiles.id, name: profiles.name, phone: profiles.phone }
    })
    .from(payments)
    .leftJoin(profiles, eq(payments.userId, profiles.id))
    .orderBy(desc(payments.createdAt));

    // ✅ We return ALL payments. The frontend handles the filtering logic.
    return c.json({ 
      success: true, 
      payments: allPayments,
      userRole,    // Send role so frontend knows
      adminName    // Send name so frontend knows who "Me" is
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/admin/payments/:id/approve', async (c) => {
  const paymentId = c.req.param('id');
  const { adminId } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);

  try {
    const payment = (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
    if (payment.status === 'approved') return c.json({ success: false, error: 'Already approved' }, 400);

    let approvedBy = JSON.parse(payment.approvedBy_admins || '[]');
    if (approvedBy.includes(adminId)) return c.json({ success: false, error: 'You already approved this' }, 400);

    approvedBy.push(adminId);
    
    // ✅ CHANGED: Only 1 admin is needed to close the ticket
    const isCompleted = approvedBy.length >= 1; 

       await db.update(payments).set({
      approvals_count: approvedBy.length,
      approvedBy_admins: JSON.stringify(approvedBy),
      status: isCompleted ? 'approved' : 'pending',
      updatedAt: new Date() // ✅ Set closed time
    }).where(eq(payments.id, paymentId));
    if (isCompleted) {
      const user = (await db.select().from(profiles).where(eq(profiles.id, payment.userId)).limit(1))[0];
      await db.update(profiles).set({ walletBalance: (parseFloat(user.walletBalance) + parseFloat(payment.amount)).toFixed(2) }).where(eq(profiles.id, payment.userId));
      await db.insert(notifications).values({ userId: payment.userId, message: `Payment of ETB ${payment.amount} approved and added to wallet.` });
    }
    return c.json({ success: true, message: `Approved successfully!` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/admin/payments/:id/reject', async (c) => {
  try {
    const paymentId = c.req.param('id');
    const { reason } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const payment = (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
    if (!payment) return c.json({ success: false, error: 'Payment not found' }, 404);
    if (payment.status !== 'pending') return c.json({ success: false, error: 'Payment already processed' }, 400);

    // ✅ Update status to rejected
        await db.update(payments).set({ 
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date() // ✅ Set closed time
    }).where(eq(payments.id, paymentId));
    // ✅ Notify the user
    await db.insert(notifications).values({
      userId: payment.userId,
      message: `Your deposit of ETB ${payment.amount} was rejected. Reason: ${reason}`
    });

    return c.json({ success: true, message: 'Payment rejected' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/admin/report', async (c) => {
  try {
    const { adminId, targetUserId, reason } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    let finalUserId = targetUserId;

    // ✅ Check if the input looks like a phone number (doesn't contain hyphens)
    if (!targetUserId.includes('-')) {
      // Look up the user by phone number
      const targetUser = await db.select().from(profiles).where(eq(profiles.phone, targetUserId)).limit(1);
      
      if (targetUser.length === 0) {
        return c.json({ success: false, error: 'User with this phone number not found.' }, 404);
      }
      finalUserId = targetUser[0].id; // Swap the phone number for the real UUID
    }

    await db.insert(reports).values({ adminId, targetUserId: finalUserId, reason });
    return c.json({ success: true, message: 'Report sent to Super Admin' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/admin/performance/:adminId', async (c) => {
  const adminId = c.req.param('adminId');
  const db = getDb(c.env.DATABASE_URL);
  const allPayments = await db.select().from(payments).where(eq(payments.status, 'approved'));
  
  let totalApproved = 0;
  let totalVolume = 0;

  allPayments.forEach(p => {
    const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
    if (approvedBy.includes(adminId)) {
      totalApproved++;
      totalVolume += parseFloat(p.amount);
    }
  });

  return c.json({ success: true, performance: { totalApproved, totalVolume: totalVolume.toFixed(2) } });
});

// --- SUPER ADMIN MODULE ---
app.get('/api/super-admin/analytics', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  
  const startDateQuery = c.req.query('startDate');
  const endDateQuery = c.req.query('endDate');

  const allUsers = await db.select().from(profiles);
  const allDeposits = await db.select().from(payments).where(eq(payments.status, 'approved'));
  const allWithdrawals = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.status, 'approved'));
  
  // ✅ 1. Fetch reports with user details (Name, Phone, Balance)
  const pendingReports = await db.select({
    id: reports.id,
    reason: reports.reason,
    createdAt: reports.createdAt,
    targetUserId: reports.targetUserId,
    targetName: profiles.name,
    targetPhone: profiles.phone,
    targetBalance: profiles.walletBalance,
  })
  .from(reports)
  .leftJoin(profiles, eq(reports.targetUserId, profiles.id))
  .where(eq(reports.status, 'pending'));

  // Date Filters
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Helper function for calculating sums
  const calculateSum = (arr: any[], start: Date, end: Date, amountKey: string) => {
    return arr.filter(item => {
      const d = new Date(item.createdAt);
      return d >= start && d <= end;
    }).reduce((sum, item) => sum + parseFloat(item[amountKey]), 0);
  };

  // --- 1. Users Growth ---
  const dailyUsers = allUsers.filter(u => new Date(u.createdAt) >= dayAgo).length;
  const weeklyUsers = allUsers.filter(u => new Date(u.createdAt) >= weekAgo).length;
  const monthlyUsers = allUsers.filter(u => new Date(u.createdAt) >= monthAgo).length;
  
  const invitedUsers = allUsers.filter(u => u.invitedBy !== null).length;
  const webUsers = allUsers.filter(u => u.invitedBy === null).length;

  // --- 2. Financials (Standard) ---
  const dailyDeposits = calculateSum(allDeposits, dayAgo, now, 'amount');
  const weeklyDeposits = calculateSum(allDeposits, weekAgo, now, 'amount');
  const monthlyDeposits = calculateSum(allDeposits, monthAgo, now, 'amount');

  const dailyWithdrawals = calculateSum(allWithdrawals, dayAgo, now, 'amountRequested');
  const weeklyWithdrawals = calculateSum(allWithdrawals, weekAgo, now, 'amountRequested');
  const monthlyWithdrawals = calculateSum(allWithdrawals, monthAgo, now, 'amountRequested');

  const netDaily = dailyDeposits - dailyWithdrawals;
  const netWeekly = weeklyDeposits - weeklyWithdrawals;
  const netMonthly = monthlyDeposits - monthlyWithdrawals;

  // --- 3. Custom Date Filtering ---
  let customUsers = 0;
  let customDeposits = 0;
  let customWithdrawals = 0;
  
  if (startDateQuery && endDateQuery) {
    const start = new Date(startDateQuery);
    const end = new Date(endDateQuery);
    end.setHours(23, 59, 59, 999);

    customUsers = allUsers.filter(u => {
      const d = new Date(u.createdAt);
      return d >= start && d <= end;
    }).length;

    customDeposits = calculateSum(allDeposits, start, end, 'amount');
    customWithdrawals = calculateSum(allWithdrawals, start, end, 'amountRequested');
  }

  // --- 4. Admin Performance Breakdown ---
  const adminStats: Record<string, { depositsCount: number, depositsVolume: number, withdrawalsCount: number, withdrawalsVolume: number }> = {};
  
  // Process Deposits
  allDeposits.forEach(p => {
    const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
    approvedBy.forEach((adminId: string) => {
      if (!adminStats[adminId]) adminStats[adminId] = { depositsCount: 0, depositsVolume: 0, withdrawalsCount: 0, withdrawalsVolume: 0 };
      adminStats[adminId].depositsCount++;
      adminStats[adminId].depositsVolume += parseFloat(p.amount) / approvedBy.length; // Pro-rata
    });
  });

  // Process Withdrawals
  allWithdrawals.forEach(w => {
    if (w.approvedBy) {
      if (!adminStats[w.approvedBy]) adminStats[w.approvedBy] = { depositsCount: 0, depositsVolume: 0, withdrawalsCount: 0, withdrawalsVolume: 0 };
      adminStats[w.approvedBy].withdrawalsCount++;
      adminStats[w.approvedBy].withdrawalsVolume += parseFloat(w.amountRequested);
    }
  });

  const adminPerformance = Object.keys(adminStats).map(id => {
    const admin = allUsers.find(u => u.id === id);
    const netVolume = adminStats[id].depositsVolume - adminStats[id].withdrawalsVolume;
    
    return { 
      id, 
      name: admin?.name || 'Unknown', 
      phone: admin?.phone || 'N/A', 
      depositsCount: adminStats[id].depositsCount,
      depositsVolume: adminStats[id].depositsVolume,
      withdrawalsCount: adminStats[id].withdrawalsCount,
      withdrawalsVolume: adminStats[id].withdrawalsVolume,
      netVolume: netVolume
    };
  });

  // ✅ 5. Calculate Invite Counts (For Best Inviter)
  const inviteCounts: Record<string, number> = {};
  allUsers.forEach(u => {
    if (u.invitedBy) {
      inviteCounts[u.invitedBy] = (inviteCounts[u.invitedBy] || 0) + 1;
    }
  });

  return c.json({
    success: true,
    analytics: {
      dateFiltered: {
        users: customUsers,
        deposits: customDeposits.toFixed(2),
        withdrawals: customWithdrawals.toFixed(2),
        net: (customDeposits - customWithdrawals).toFixed(2)
      },
      users: { 
        daily: dailyUsers, weekly: weeklyUsers, monthly: monthlyUsers, total: allUsers.length,
        invited: invitedUsers, web: webUsers
      },
      financials: {
        deposits: { daily: dailyDeposits.toFixed(2), weekly: weeklyDeposits.toFixed(2), monthly: monthlyDeposits.toFixed(2) },
        withdrawals: { daily: dailyWithdrawals.toFixed(2), weekly: weeklyWithdrawals.toFixed(2), monthly: monthlyWithdrawals.toFixed(2) },
        net: { daily: netDaily.toFixed(2), weekly: netWeekly.toFixed(2), monthly: netMonthly.toFixed(2) }
      },
      adminPerformance,
      reports: pendingReports
    },
    admins: allUsers.filter(u => u.role === 'admin'),
    // ✅ Add inviteCount to each user object
    users: allUsers.filter(u => u.role === 'user').map(u => ({
      ...u,
      invitedCount: inviteCounts[u.id] || 0
    }))
  });
});

// Admin Management Routes for Super Admin
app.post('/api/super-admin/create-admin', async (c) => {
  const { phone, password, name } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);
  const hashedPassword = await hashPassword(password);
  await db.insert(profiles).values({ name, phone, passwordHash: hashedPassword, role: 'admin' });
  return c.json({ success: true, message: 'Admin created' });
});

app.post('/api/super-admin/admins/:id/toggle-lock', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env.DATABASE_URL);
  const admin = (await db.select().from(profiles).where(eq(profiles.id, id)).limit(1))[0];
  await db.update(profiles).set({ isLocked: !admin.isLocked }).where(eq(profiles.id, id));
  return c.json({ success: true, isLocked: !admin.isLocked });
});

// Super Admin: Delete Admin
app.delete('/api/super-admin/admins/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    
    // Safety check: Don't allow deleting the Super Admin
    const admin = (await db.select().from(profiles).where(eq(profiles.id, id)).limit(1))[0];
    if (admin.role === 'super_admin') {
      return c.json({ success: false, error: 'Cannot delete a Super Admin.' }, 403);
    }

    await db.delete(profiles).where(eq(profiles.id, id));
    return c.json({ success: true, message: 'Admin deleted successfully.' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.delete('/api/super-admin/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);

    // ✅ 1. Mark any pending reports for this user as resolved
    await db.update(reports).set({ status: 'resolved' }).where(eq(reports.targetUserId, id));

    // ✅ 2. Delete their Bank Details (This fixes the "Unknown" issue)
    await db.delete(userBankDetails).where(eq(userBankDetails.userId, id));

    // ✅ 3. Delete their Job Registrations & Tasks
    await db.delete(userJobs).where(eq(userJobs.userId, id));
    await db.delete(taskSubmissions).where(eq(taskSubmissions.userId, id));

    // ✅ 4. Delete their Fund Investments
    await db.delete(userFunds).where(eq(userFunds.userId, id));

    // ✅ 5. Delete their Payments and Withdrawals
    await db.delete(payments).where(eq(payments.userId, id));
    await db.delete(withdrawalRequests).where(eq(withdrawalRequests.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));

    // ✅ 6. Finally, delete the user profile
    await db.delete(profiles).where(eq(profiles.id, id));
    
    return c.json({ success: true, message: 'User and all associated data deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Get Global Referral Analytics (for Super Admin)

// Get Global Referral Analytics (for Super Admin)
// Get Global Referral Analytics (for Super Admin)
app.get('/api/super-admin/referrals', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    
    // 1. Fetch ALL users
    const allUsers = await db.select().from(profiles).where(eq(profiles.role, 'user'));
    
    // 2. Count invites
    const inviteCounts: Record<string, number> = {};
    allUsers.forEach(u => {
      if (u.invitedBy) {
        inviteCounts[u.invitedBy] = (inviteCounts[u.invitedBy] || 0) + 1;
      }
    });

    // 3. Fetch all active user jobs with job names
    const userJobsData = await db.select({
      userId: userJobs.userId,
      jobName: jobs.name
    })
    .from(userJobs)
    .leftJoin(jobs, eq(userJobs.jobId, jobs.id));
    
    const userJobMap: Record<string, string> = {};
    userJobsData.forEach(uj => {
      userJobMap[uj.userId] = uj.jobName || 'Unknown Job';
    });

    // 4. Build the list
    let inviters = allUsers.map(p => ({
      id: p.id,
      name: p.name || 'User',
      phone: p.phone,
      createdAt: p.createdAt,
      invitedCount: inviteCounts[p.id] || 0,
      jobLevel: userJobMap[p.id] || 'No Job'
    }));

    // ✅ REMOVED THE FILTER HERE
    // Now everyone (even 0 invites) will be returned to the frontend

    // 5. Sort by most invites
    inviters.sort((a, b) => b.invitedCount - a.invitedCount);

    return c.json({ success: true, referrals: inviters }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// --- SUPER ADMIN PROFILE MODULE ---
app.put('/api/super-admin/profile/:id/update', async (c) => {
  try {
    const userId = c.req.param('id');
    const { name, phone } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    // Check if the phone number is already taken by someone else
    if (phone) {
      const existing = await db.select().from(profiles).where(eq(profiles.phone, phone)).limit(1);
      if (existing.length > 0 && existing[0].id !== userId) {
        return c.json({ success: false, error: 'Phone number is already in use' }, 400);
      }
    }

    const updated = await db.update(profiles)
      .set({ name, phone })
      .where(eq(profiles.id, userId))
      .returning();

    if (updated.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, user: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/super-admin/profile/:id/password', async (c) => {
  try {
    const userId = c.req.param('id');
    const { currentPassword, newPassword } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    // 1. Verify Current Password
    const user = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (user.length === 0) return c.json({ success: false, error: 'User not found' }, 404);

    const currentHashed = await hashPassword(currentPassword);
    if (user[0].passwordHash !== currentHashed) {
      return c.json({ success: false, error: 'Incorrect current password' }, 401);
    }

    // 2. Hash and Save New Password
    const newHashed = await hashPassword(newPassword);
    await db.update(profiles).set({ passwordHash: newHashed }).where(eq(profiles.id, userId));

    return c.json({ success: true, message: 'Password updated successfully' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// --- ADMIN PROFILE MODULE ---
app.get('/api/admin/profile/:id', async (c) => {
  try {
    const adminId = c.req.param('id');
    const startDateQuery = c.req.query('startDate');
    const endDateQuery = c.req.query('endDate');
    const db = getDb(c.env.DATABASE_URL);

    const admin = await db.select().from(profiles).where(eq(profiles.id, adminId)).limit(1);
    if (admin.length === 0) return c.json({ success: false, error: 'Admin not found' }, 404);

    // Fetch all data
    const allDeposits = await db.select().from(payments).where(eq(payments.status, 'approved'));
    const allWithdrawals = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.status, 'approved'));

    // Date boundaries
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Helper to filter by admin & date
    const getAdminStats = (arr: any[], isDeposit: boolean, start: Date, end: Date) => {
      let count = 0;
      let amount = 0;
      arr.forEach(item => {
        const date = new Date(item.createdAt);
        if (date < start || date > end) return;

        let approvedBy = isDeposit 
          ? JSON.parse(item.approvedBy_admins || '[]') 
          : [item.approvedBy];

        if (approvedBy.includes(adminId)) {
          count++;
          const val = parseFloat(isDeposit ? item.amount : item.amountRequested);
          amount += isDeposit ? (val / approvedBy.length) : val;
        }
      });
      return { count, amount };
    };

    // Custom Dates
    let customStart = dayAgo;
    let customEnd = now;
    if (startDateQuery && endDateQuery) {
      customStart = new Date(startDateQuery);
      customEnd = new Date(endDateQuery);
      customEnd.setHours(23, 59, 59, 999);
    }

    // Calculate 4 timeframes
    const calcRange = (start: Date, end: Date) => {
      const dep = getAdminStats(allDeposits, true, start, end);
      const wth = getAdminStats(allWithdrawals, false, start, end);
      return {
        deposits: { count: dep.count, amount: dep.amount.toFixed(2) },
        withdrawals: { count: wth.count, amount: wth.amount.toFixed(2) },
        net: (dep.amount - wth.amount).toFixed(2)
      };
    };

    const today = calcRange(dayAgo, now);
    const weekly = calcRange(weekAgo, now);
    const monthly = calcRange(monthAgo, now);
    const custom = calcRange(customStart, customEnd);

    return c.json({
      success: true,
      profile: admin[0],
      stats: {
        today,
        weekly,
        monthly,
        custom
      }
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/admin/profile/:id/update', async (c) => {
  try {
    const userId = c.req.param('id');
    const { name, username, email } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db.update(profiles)
      .set({ name, username, email })
      .where(eq(profiles.id, userId))
      .returning();

    return c.json({ success: true, user: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/admin/profile/:id/password', async (c) => {
  try {
    const userId = c.req.param('id');
    const { currentPassword, newPassword } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const user = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    if (user.length === 0) return c.json({ success: false, error: 'User not found' }, 404);

    const currentHashed = await hashPassword(currentPassword);
    if (user[0].passwordHash !== currentHashed) {
      return c.json({ success: false, error: 'Incorrect current password' }, 401);
    }

    const newHashed = await hashPassword(newPassword);
    await db.update(profiles).set({ passwordHash: newHashed }).where(eq(profiles.id, userId));

    return c.json({ success: true, message: 'Password updated successfully' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// PAYMENT METHODS MODULE
// ==========================================
app.get('/api/payment-methods', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    
    const methods = await db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true));
    
    const methodsWithRandomAccount = await Promise.all(methods.map(async (method) => {
      const accounts = await db.select().from(paymentAccounts).where(eq(paymentAccounts.methodId, method.id));
      
      let selectedAccount = null;
      if (accounts.length > 0) {
        const randomIndex = Math.floor(Math.random() * accounts.length);
        selectedAccount = accounts[randomIndex];
      }

      return {
        ...method,
        accountName: selectedAccount?.accountName || 'Contact Admin',
        accountNumber: selectedAccount?.accountNumber || 'No accounts available',
      };
    }));

    return c.json({ success: true, methods: methodsWithRandomAccount }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/super-admin/payment-methods', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const methods = await db.select().from(paymentMethods).orderBy(paymentMethods.createdAt);
    
    const methodsWithAccounts = await Promise.all(methods.map(async (method) => {
      const accounts = await db.select().from(paymentAccounts).where(eq(paymentAccounts.methodId, method.id));
      return { ...method, accounts };
    }));

    return c.json({ success: true, methods: methodsWithAccounts }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/super-admin/payment-methods', async (c) => {
  try {
    const { name } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    const newMethod = await db.insert(paymentMethods).values({ name }).returning();
    return c.json({ success: true, method: newMethod[0] }, 201);
  } catch (err: any) {
    if (err.code === '23505') return c.json({ success: false, error: 'Method already exists' }, 400);
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/super-admin/payment-methods/:id/accounts', async (c) => {
  try {
    const methodId = c.req.param('id');
    const { accountName, accountNumber } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const newAccount = await db.insert(paymentAccounts).values({
      methodId, accountName, accountNumber
    }).returning();

    return c.json({ success: true, account: newAccount[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.delete('/api/super-admin/payment-accounts/:accountId', async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const db = getDb(c.env.DATABASE_URL);
    await db.delete(paymentAccounts).where(eq(paymentAccounts.id, accountId));
    return c.json({ success: true, message: 'Account deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/super-admin/payment-methods/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { name } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db
      .update(paymentMethods)
      .set({ name })
      .where(eq(paymentMethods.id, id))
      .returning();

    if (updated.length === 0) {
      return c.json({ success: false, error: 'Method not found' }, 404);
    }
    return c.json({ success: true, method: updated[0] }, 200);
  } catch (err: any) {
    if (err.code === '23505') {
      return c.json({ success: false, error: 'A method with this name already exists.' }, 400);
    }
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/super-admin/payment-accounts/:accountId', async (c) => {
  try {
    const accountId = c.req.param('accountId');
    const { accountName, accountNumber } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db
      .update(paymentAccounts)
      .set({ accountName, accountNumber })
      .where(eq(paymentAccounts.id, accountId))
      .returning();

    if (updated.length === 0) {
      return c.json({ success: false, error: 'Account not found' }, 404);
    }
    return c.json({ success: true, account: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/super-admin/payment-methods/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);

    const method = (
      await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1)
    )[0];

    if (!method) return c.json({ success: false, error: 'Method not found' }, 404);

    await db
      .update(paymentMethods)
      .set({ isActive: !method.isActive })
      .where(eq(paymentMethods.id, id));

    return c.json({ success: true, isActive: !method.isActive }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete Payment Method
app.delete('/api/super-admin/payment-methods/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);

    // ✅ Safety Check: Check if any payment was made using this method
    const inUse = await db.select().from(payments).where(eq(payments.payment_method, id)).limit(1);
    // Note: Since payments store the method NAME (e.g. "CBE"), we check by name if needed. 
    // But to be safe, we just delete the accounts first.
    
    // 1. Delete all linked accounts
    await db.delete(paymentAccounts).where(eq(paymentAccounts.methodId, id));
    
    // 2. Delete the method itself
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));

    return c.json({ success: true, message: 'Method deleted successfully' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// FUND PLANS MODULE
// ==========================================
app.post('/api/super-admin/fund-plans', async (c) => {
  try {
    const { name, description, durationDays, interestRate, minAmount, maxAmount, maxParticipants, startDate, fakeJoinedUsers } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    
    const newPlan = await db.insert(fundPlans).values({
      name, description, durationDays, interestRate, minAmount, maxAmount, 
      maxParticipants: parseInt(maxParticipants) || 100,
      fakeJoinedUsers: parseInt(fakeJoinedUsers) || 0,
      startDate: new Date(startDate)
    }).returning();
    
    return c.json({ success: true, plan: newPlan[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Edit Fund Plan
app.put('/api/super-admin/fund-plans/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { name, description, durationDays, interestRate, minAmount, maxAmount, maxParticipants, startDate, fakeJoinedUsers, isActive } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db.update(fundPlans).set({ 
      name, description, durationDays, interestRate, minAmount, maxAmount, 
      maxParticipants, startDate: new Date(startDate), fakeJoinedUsers, isActive 
    }).where(eq(fundPlans.id, id)).returning();

    return c.json({ success: true, plan: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete Fund Plan
app.delete('/api/super-admin/fund-plans/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);

    // Check if anyone has joined
    const joined = await db.select().from(userFunds).where(eq(userFunds.planId, id)).limit(1);
    if (joined.length > 0) {
      return c.json({ success: false, error: 'Cannot delete. Users have already invested in this fund. Deactivate it instead.' }, 400);
    }

    await db.delete(fundPlans).where(eq(fundPlans.id, id));
    return c.json({ success: true, message: 'Fund deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Fund Analytics
app.get('/api/super-admin/fund-analytics', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);

    // 1. Fetch all plans
    const allPlans = await db.select().from(fundPlans).orderBy(desc(fundPlans.createdAt));
    
    // 2. Fetch all user investments
    const allInvestments = await db.select().from(userFunds);

    // 3. Calculate overall stats
    const totalInvested = allInvestments.reduce((acc, inv) => acc + parseFloat(inv.amountInvested), 0);
    const totalUsersJoined = allInvestments.length;

    // 4. Calculate per-fund breakdown
    const fundStats = allPlans.map(plan => {
      const investmentsForPlan = allInvestments.filter(inv => inv.planId === plan.id);
      
      const totalMoneyInFund = investmentsForPlan.reduce((acc, inv) => acc + parseFloat(inv.amountInvested), 0);
      
      return {
        id: plan.id,
        name: plan.name,
        startDate: plan.startDate,
        durationDays: plan.durationDays,
        interestRate: plan.interestRate,
        maxParticipants: plan.maxParticipants,
        fakeJoinedUsers: plan.fakeJoinedUsers,
        realJoinedUsers: investmentsForPlan.length,
        totalJoinedUI: investmentsForPlan.length + plan.fakeJoinedUsers, // What the user sees
        totalMoneyInFund: totalMoneyInFund.toFixed(2),
        status: new Date() >= new Date(plan.startDate) ? 'Closed/Started' : 'Open',
      };
    });

    return c.json({
      success: true,
      analytics: {
        totalInvested: totalInvested.toFixed(2),
        totalUsersJoined,
        fundStats
      }
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/super-admin/fund-plans', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const plans = await db.select().from(fundPlans).orderBy(desc(fundPlans.createdAt)); 
    return c.json({ success: true, plans }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/fund-plans', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const plans = await db.select().from(fundPlans).where(eq(fundPlans.isActive, true)).orderBy(desc(fundPlans.createdAt)); 
    
    const plansWithCounts = await Promise.all(plans.map(async (plan) => {
      const joined = await db.select().from(userFunds).where(eq(userFunds.planId, plan.id));
      
      const now = new Date();
      const start = new Date(plan.startDate);
      const hasStarted = now >= start; // ✅ Check if fund has locked
      
      return { 
        ...plan, 
        currentParticipants: joined.length,
        isClosed: hasStarted, // Send to frontend to disable button
      };
    }));

    return c.json({ success: true, plans: plansWithCounts }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/user/:id/join-fund', async (c) => {
  const userId = c.req.param('id');
  const { planId, amount } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);

  try {
    const user = (await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1))[0];
    const plan = (await db.select().from(fundPlans).where(eq(fundPlans.id, planId)).limit(1))[0];

    if (!user || !plan) return c.json({ success: false, error: 'User or Plan not found' }, 404);

    // ✅ Check if the fund has started
    if (new Date() >= new Date(plan.startDate)) {
      return c.json({ success: false, error: 'This fund is already locked and closed for new investors.' }, 400);
    }
    
    // Check capacity
    const joined = await db.select().from(userFunds).where(eq(userFunds.planId, planId));
    const totalJoined = joined.length + plan.fakeJoinedUsers; // Include fake users
    if (totalJoined >= plan.maxParticipants) return c.json({ success: false, error: 'This fund is already full.' }, 400);

    if (parseFloat(user.walletBalance) < parseFloat(amount)) return c.json({ success: false, error: 'Insufficient wallet balance' }, 400);
    if (parseFloat(amount) < parseFloat(plan.minAmount)) return c.json({ success: false, error: `Minimum is ETB ${plan.minAmount}` }, 400);
    if (parseFloat(amount) > parseFloat(plan.maxAmount)) return c.json({ success: false, error: `Maximum is ETB ${plan.maxAmount}` }, 400);

    const interest = parseFloat(amount) * (parseFloat(plan.interestRate) / 100) * plan.durationDays;
    const totalReturn = parseFloat(amount) + interest;
    const dailyBirr = parseFloat(amount) * (parseFloat(plan.interestRate) / 100); // ✅ Daily ETB

    const start = new Date(plan.startDate); // Use the plan's start date!
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);

    await db.update(profiles).set({ 
      walletBalance: (parseFloat(user.walletBalance) - parseFloat(amount)).toFixed(2) 
    }).where(eq(profiles.id, userId));

    await db.insert(userFunds).values({
      userId, planId, amountInvested: amount,
      dailyInterestBirr: dailyBirr.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      startDate: start, endDate: end, status: 'active'
    });

     // ✅ NEW: Notify user about Fund Investment
    await db.insert(notifications).values({
      userId,
      message: `You have successfully invested ETB ${amount} into "${plan.name}". Your funds will mature on ${end.toDateString()}.`,
    });

    return c.json({ success: true, message: 'Fund joined successfully!' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// User: Get My Active Funds
app.get('/api/user/:id/my-funds', async (c) => {
  const userId = c.req.param('id');
  const db = getDb(c.env.DATABASE_URL);
  try {
    // ✅ 1. Check for matured funds and notify
    const allFunds = await db.select().from(userFunds).where(eq(userFunds.userId, userId));
    const now = new Date();

    for (const fund of allFunds) {
      if (fund.status === 'active' && new Date(fund.endDate) <= now) {
        // Mark as completed
        await db.update(userFunds).set({ status: 'completed' }).where(eq(userFunds.id, fund.id));
        
        // Get plan name
        const plan = (await db.select().from(fundPlans).where(eq(fundPlans.id, fund.planId)).limit(1))[0];
        
        // Send notification
        await db.insert(notifications).values({
          userId,
          message: `Your investment in "${plan?.name || 'Fund'}" has matured! ETB ${fund.totalReturn} has been added to your wallet.`,
        });

        // Add funds back to wallet
        const user = (await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1))[0];
        await db.update(profiles).set({
          walletBalance: (parseFloat(user.walletBalance) + parseFloat(fund.totalReturn)).toFixed(2)
        }).where(eq(profiles.id, userId));
      }
    }

    // 2. Return the updated list
    const funds = await db.select({
      id: userFunds.id,
      amountInvested: userFunds.amountInvested,
      dailyInterestBirr: userFunds.dailyInterestBirr,
      totalReturn: userFunds.totalReturn,
      startDate: userFunds.startDate,
      endDate: userFunds.endDate,
      status: userFunds.status,
      planName: fundPlans.name,
    })
    .from(userFunds)
    .leftJoin(fundPlans, eq(userFunds.planId, fundPlans.id))
    .where(eq(userFunds.userId, userId));

    return c.json({ success: true, funds }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// JOBS MODULE
// ==========================================
app.post('/api/super-admin/jobs', async (c) => {
  try {
    const { name, description, price, taskCount, rewardPerTask } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    const newJob = await db.insert(jobs).values({ name, description, price, taskCount, rewardPerTask }).returning();
    return c.json({ success: true, job: newJob[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/super-admin/jobs', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const allJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
    
    const jobsWithTasks = await Promise.all(allJobs.map(async (job) => {
      const tasks = await db.select().from(jobTasks).where(eq(jobTasks.jobId, job.id));
      return { ...job, tasks };
    }));
    
    return c.json({ success: true, jobs: jobsWithTasks }, 200);
  } catch (err: any) {
    console.error("Error fetching jobs:", err); // ✅ This will print the real error to your terminal
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/super-admin/jobs/:id/tasks', async (c) => {
  try {
    const jobId = c.req.param('id');
    // ✅ 1. Extract fakeLikes from the request body
    const { title, youtubeUrl, fakeLikes } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    let thumbnailUrl = null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    if (match && match[2].length === 11) {
      thumbnailUrl = `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
    }

    const now = new Date();
    const ethiopianTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const todayStr = ethiopianTime.toISOString().split('T')[0];

    // ✅ 2. Insert fakeLikes into the database
    const newTask = await db.insert(jobTasks).values({ 
      jobId, 
      title, 
      youtubeUrl, 
      thumbnailUrl, 
      scheduledDate: todayStr,
      fakeLikes: parseInt(fakeLikes) || 0 // ✅ Add the column
    }).returning();
    
    return c.json({ success: true, task: newTask[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/jobs', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const allJobs = await db.select().from(jobs).where(eq(jobs.isActive, true)).orderBy(desc(jobs.createdAt));
    return c.json({ success: true, jobs: allJobs }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/user/:id/buy-job', async (c) => {
  const userId = c.req.param('id');
  const { jobId } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);

  try {
    const user = (await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1))[0];
    const job = (await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1))[0];

    if (!user || !job) return c.json({ success: false, error: 'User or Job not found' }, 404);
    if (parseFloat(user.walletBalance) < parseFloat(job.price)) return c.json({ success: false, error: 'Insufficient wallet balance' }, 400);

    // 1. Check if they already have a job
    const existingJob = await db.select().from(userJobs).where(eq(userJobs.userId, userId)).limit(1);
    if (existingJob.length > 0) {
      return c.json({ success: false, error: 'You already have an active job. Please contact support to terminate your current job before buying a new one.' }, 400);
    }

    // 2. Deduct Job Price
    await db.update(profiles).set({ 
      walletBalance: (parseFloat(user.walletBalance) - parseFloat(job.price)).toFixed(2) 
    }).where(eq(profiles.id, userId));

    // 3. Give User the Job
    await db.insert(userJobs).values({ userId, jobId });

     // ✅ NEW: Notify user about Job Purchase
    await db.insert(notifications).values({
      userId,
      message: `You have successfully purchased the "${job.name}" job for ETB ${job.price}. You can now start completing tasks.`,
    });

    // ✅ 4. DISTRIBUTE REFERRAL BONUSES (ONLY IF NOT PAID BEFORE)
    if (user.invitedBy && !user.hasPaidReferral) {
      let settings = (await db.select().from(referralSettings).limit(1))[0];
      if (!settings) settings = (await db.insert(referralSettings).values({}).returning())[0];

      const jobPrice = parseFloat(job.price);
      const level1Bonus = jobPrice * (parseFloat(settings.level1Percent) / 100);
      const inviter = (await db.select().from(profiles).where(eq(profiles.id, user.invitedBy)).limit(1))[0];
      
      if (inviter && level1Bonus > 0) {
        await db.update(profiles).set({ walletBalance: (parseFloat(inviter.walletBalance) + level1Bonus).toFixed(2) }).where(eq(profiles.id, inviter.id));
        await db.insert(notifications).values({ userId: inviter.id, message: `You earned ETB ${level1Bonus.toFixed(2)} because your invitee bought the ${job.name} job!` });

        if (inviter.invitedBy) {
          const level2Bonus = jobPrice * (parseFloat(settings.level2Percent) / 100);
          const grandInviter = (await db.select().from(profiles).where(eq(profiles.id, inviter.invitedBy)).limit(1))[0];
          if (grandInviter && level2Bonus > 0) {
            await db.update(profiles).set({ walletBalance: (parseFloat(grandInviter.walletBalance) + level2Bonus).toFixed(2) }).where(eq(profiles.id, grandInviter.id));
            await db.insert(notifications).values({ userId: grandInviter.id, message: `You earned ETB ${level2Bonus.toFixed(2)} because your indirect invitee bought a job!` });
          }
        }
      }

      // ✅ Mark as paid so they don't get another bonus next time
      await db.update(profiles).set({ hasPaidReferral: true }).where(eq(profiles.id, userId));
    }

    return c.json({ success: true, message: 'Job unlocked successfully!' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Get All Active Jobs Users
app.get('/api/super-admin/active-jobs', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const active = await db.select({
      id: userJobs.id,
      userId: userJobs.userId,
      jobName: jobs.name,
      userName: profiles.name,
      userPhone: profiles.phone,
      startedAt: userJobs.createdAt,
    })
    .from(userJobs)
    .leftJoin(jobs, eq(userJobs.jobId, jobs.id))
    .leftJoin(profiles, eq(userJobs.userId, profiles.id));
    
    return c.json({ success: true, activeJobs: active }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Terminate User Job
app.delete('/api/super-admin/active-jobs/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    
    // ✅ Fetch details for notification
    const activeJob = (await db.select().from(userJobs).where(eq(userJobs.id, id)).limit(1))[0];
    if (activeJob) {
      const jobDetails = (await db.select().from(jobs).where(eq(jobs.id, activeJob.jobId)).limit(1))[0];
      
      await db.insert(notifications).values({
        userId: activeJob.userId,
        message: `Your active job "${jobDetails?.name || 'Job'}" has been terminated by support. You can now purchase a new job.`,
      });
    }

    await db.delete(userJobs).where(eq(userJobs.id, id));
    return c.json({ success: true, message: 'Job terminated successfully' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/user/:id/my-jobs', async (c) => {
  const userId = c.req.param('id');
  const db = getDb(c.env.DATABASE_URL);

  try {
    // 1. Get user's job(s)
    const myJobsData = await db.select({
      id: userJobs.id,
      jobId: userJobs.jobId,
      jobName: jobs.name,
      taskCount: jobs.taskCount,
      rewardPerTask: jobs.rewardPerTask,
    })
    .from(userJobs)
    .leftJoin(jobs, eq(userJobs.jobId, jobs.id))
    .where(eq(userJobs.userId, userId));

    // 2. Get today's global videos (ONE query for ALL jobs)
   // ✅ Ethiopian "today" as YYYY-MM-DD
const now = new Date();
const ethiopianDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
const todayStr = ethiopianDate.toISOString().split('T')[0];
    const todaysVideos = await db.select().from(dailyVideos)
      .where(and(
        eq(dailyVideos.scheduledDate, todayStr),
        eq(dailyVideos.isActive, true)
      ));

    // 3. Get user's submissions (to mark which videos they've done)
    const submissions = await db.select().from(taskSubmissions)
      .where(eq(taskSubmissions.userId, userId));

    // 4. For each job the user holds, attach today's videos
    const jobsWithTasks = myJobsData.map((job) => {
      const tasksWithStatus = todaysVideos.map(video => ({
        id: video.id,
        title: video.title,
        youtubeUrl: video.youtubeUrl,
        thumbnailUrl: video.thumbnailUrl,
        fakeLikes: video.fakeLikes,
        requiresSubscription: video.requiresSubscription, 
        isCompleted: submissions.some(
          sub => sub.taskId === video.id && sub.jobId === job.jobId
        ),
      }));
      return { ...job, tasks: tasksWithStatus };
    });

    return c.json({ success: true, myJobs: jobsWithTasks }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/user/:id/submit-task', async (c) => {
  const userId = c.req.param('id');
  const { taskId, jobId, rating, subscribed, liked } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);

  try {
    const now = new Date();
    
    // Get current hour (using local time or UTC depending on your server)
    const currentHour = now.getHours(); 

    // OPEN: 8:00 AM to 3:59 PM (16 is 4:00 PM)
    if (currentHour < 8 || currentHour >= 16) {
      return c.json({
        success: false,
        error: 'Tasks can only be completed between 8:00 AM and 4:00 PM.'
      }, 403);
    }

    if (rating !== 5) return c.json({ success: false, error: 'You must rate 5 stars.' }, 400);
    if (!subscribed || !liked) return c.json({ success: false, error: 'You must subscribe and like.' }, 400);

    // ✅ Keep your Ethiopian Date generation for the database check
    const ethiopianTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const todayStr = ethiopianTime.toISOString().split('T')[0];

    // Verify the video is today's active video
    const video = (await db.select().from(dailyVideos)
      .where(and(
        eq(dailyVideos.id, taskId),
        eq(dailyVideos.scheduledDate, todayStr),
        eq(dailyVideos.isActive, true)
      )).limit(1))[0];
      
    // ... rest of your code remains exactly the same ...

    if (!video) return c.json({ success: false, error: 'This video is not available today.' }, 404);

    // Prevent duplicate submission for the SAME video AND SAME job
    const existing = await db.select().from(taskSubmissions)
      .where(and(
        eq(taskSubmissions.userId, userId),
        eq(taskSubmissions.taskId, taskId),
        eq(taskSubmissions.jobId, jobId)
      )).limit(1);
    if (existing.length > 0) return c.json({ success: false, error: 'Task already completed' }, 400);

    // Pay out job's reward
    const job = (await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1))[0];
    if (!job) return c.json({ success: false, error: 'Job not found' }, 404);

    const user = (await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1))[0];
    await db.update(profiles).set({
      walletBalance: (parseFloat(user.walletBalance) + parseFloat(job.rewardPerTask)).toFixed(2)
    }).where(eq(profiles.id, userId));

    await db.insert(taskSubmissions).values({
      userId, taskId, jobId, rating, status: 'paid'
    });

    return c.json({ success: true, message: `You earned ETB ${job.rewardPerTask}!` }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/super-admin/jobs/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { name, description, price, taskCount, rewardPerTask, isActive } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db.update(jobs).set({ 
      name, description, price, taskCount, rewardPerTask, isActive 
    }).where(eq(jobs.id, id)).returning();

    return c.json({ success: true, job: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.delete('/api/super-admin/jobs/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);

    const activeUsers = await db.select().from(userJobs).where(eq(userJobs.jobId, id)).limit(1);
    if (activeUsers.length > 0) {
      return c.json({ success: false, error: 'Cannot delete. Users are currently registered for this job. Deactivate it instead.' }, 400);
    }

    await db.delete(jobTasks).where(eq(jobTasks.jobId, id));
    await db.delete(jobs).where(eq(jobs.id, id));
    
    return c.json({ success: true, message: 'Job deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// CONTACT METHODS MODULE
// ==========================================
// Public: Get Active Contact Methods (for Users)
app.get('/api/contact-methods', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const methods = await db.select({
      id: contactMethods.id,
      name: contactMethods.name,
      username: contactMethods.username,
      baseUrl: platforms.baseUrl,
      logoUrl: platforms.logoUrl,
    })
    .from(contactMethods)
    .leftJoin(platforms, eq(contactMethods.platformId, platforms.id))
    .where(eq(contactMethods.isActive, true));

    return c.json({ success: true, methods }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});
// --- PLATFORMS MODULE ---

// Super Admin: Get All Platforms
app.get('/api/super-admin/platforms', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const allPlatforms = await db.select().from(platforms);
    return c.json({ success: true, platforms: allPlatforms }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Create Platform
app.post('/api/super-admin/platforms', async (c) => {
  try {
    const { name, baseUrl, logoUrl } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    const newPlatform = await db.insert(platforms).values({ name, baseUrl, logoUrl }).returning();
    return c.json({ success: true, platform: newPlatform[0] }, 201);
  } catch (err: any) {
    if (err.code === '23505') return c.json({ success: false, error: 'Platform name already exists' }, 400);
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete Platform
app.delete('/api/super-admin/platforms/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    
    // Safety check: Don't delete if it's being used
    const inUse = await db.select().from(contactMethods).where(eq(contactMethods.platformId, id)).limit(1);
    if (inUse.length > 0) return c.json({ success: false, error: 'Cannot delete platform. It is being used by a contact method.' }, 400);

    await db.delete(platforms).where(eq(platforms.id, id));
    return c.json({ success: true, message: 'Platform deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Get All Contact Methods (with platform details)
app.get('/api/super-admin/contact-methods', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const methods = await db.select({
      id: contactMethods.id,
      name: contactMethods.name,
      username: contactMethods.username,
      platformId: contactMethods.platformId,
      platformName: platforms.name,
      baseUrl: platforms.baseUrl,
      logoUrl: platforms.logoUrl,
    })
    .from(contactMethods)
    .leftJoin(platforms, eq(contactMethods.platformId, platforms.id));

    return c.json({ success: true, methods }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Create Contact Method
app.post('/api/super-admin/contact-methods', async (c) => {
  try {
    const { name, username, platformId } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    const newMethod = await db.insert(contactMethods).values({ name, username, platformId }).returning();
    return c.json({ success: true, method: newMethod[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Edit Contact Method
app.put('/api/super-admin/contact-methods/:id', async (c) => {
  try {
    const id = c.req.param('id');
    // ✅ Removed photoUrl, added platformId
    const { name, username, platformId, isActive } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    
    const updated = await db.update(contactMethods)
      .set({ name, username, platformId, isActive })
      .where(eq(contactMethods.id, id))
      .returning();

    if (updated.length === 0) return c.json({ success: false, error: 'Method not found' }, 404);

    return c.json({ success: true, method: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete Contact Method
app.delete('/api/super-admin/contact-methods/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    
    const deleted = await db.delete(contactMethods).where(eq(contactMethods.id, id)).returning();
    
    if (deleted.length === 0) return c.json({ success: false, error: 'Method not found' }, 404);
    
    return c.json({ success: true, message: 'Deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// BANKS MODULE
// ==========================================
app.get('/api/banks', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const allBanks = await db.select().from(banks).where(eq(banks.isActive, true));
    return c.json({ success: true, banks: allBanks }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/super-admin/banks', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const allBanks = await db.select().from(banks).orderBy(banks.createdAt);
    return c.json({ success: true, banks: allBanks }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/super-admin/banks', async (c) => {
  try {
    const { name } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    const newBank = await db.insert(banks).values({ name }).returning();
    return c.json({ success: true, bank: newBank[0] }, 201);
  } catch (err: any) {
    if (err.code === '23505') return c.json({ success: false, error: 'Bank already exists' }, 400);
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/super-admin/banks/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    const bank = (await db.select().from(banks).where(eq(banks.id, id)).limit(1))[0];
    if (!bank) return c.json({ success: false, error: 'Bank not found' }, 404);
    
    await db.update(banks).set({ isActive: !bank.isActive }).where(eq(banks.id, id));
    return c.json({ success: true, isActive: !bank.isActive }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Edit Bank Name
app.put('/api/super-admin/banks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { name } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db
      .update(banks)
      .set({ name })
      .where(eq(banks.id, id))
      .returning();

    if (updated.length === 0) {
      return c.json({ success: false, error: 'Bank not found' }, 404);
    }
    return c.json({ success: true, bank: updated[0] }, 200);
  } catch (err: any) {
    if (err.code === '23505') return c.json({ success: false, error: 'Bank name already exists' }, 400);
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete Bank
app.delete('/api/super-admin/banks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);

    // Optional: Check if any user is using this bank before deleting
    const inUse = await db.select().from(userBankDetails).where(eq(userBankDetails.bankId, id)).limit(1);
    if (inUse.length > 0) {
      return c.json({ success: false, error: 'Cannot delete bank. Users are currently using it for withdrawals. Disable it instead.' }, 400);
    }

    await db.delete(banks).where(eq(banks.id, id));
    return c.json({ success: true, message: 'Bank deleted successfully.' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/user/:id/bank-details', async (c) => {
  try {
    const userId = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    
    const details = await db.select({
      id: userBankDetails.id,
      bankName: banks.name,
      accountHolderName: userBankDetails.accountHolderName,
      accountNumber: userBankDetails.accountNumber,
      createdAt: userBankDetails.createdAt
    })
    .from(userBankDetails)
    .leftJoin(banks, eq(userBankDetails.bankId, banks.id))
    .where(eq(userBankDetails.userId, userId))
    .limit(1);

    return c.json({ success: true, details: details[0] || null }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/user/:id/bank-details', async (c) => {
  try {
    const userId = c.req.param('id');
    const { bankId, accountHolderName, accountNumber } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const existing = await db.select().from(userBankDetails).where(eq(userBankDetails.userId, userId)).limit(1);
    if (existing.length > 0) {
      return c.json({ success: false, error: 'Bank information already exists and cannot be modified.' }, 400);
    }

    const newDetails = await db.insert(userBankDetails).values({
      userId, bankId, accountHolderName, accountNumber
    }).returning();

    return c.json({ success: true, details: newDetails[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// WITHDRAWAL MODULE
// ==========================================
app.get('/api/withdraw-settings', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    let settings = (await db.select().from(withdrawSettings).limit(1))[0];
    if (!settings) {
      settings = (await db.insert(withdrawSettings).values({ 
        taxPercent: '5.00', 
        amounts: '[400, 700, 1000, 1500]' 
      }).returning())[0];
    }
    return c.json({ success: true, settings }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/super-admin/withdraw-settings', async (c) => {
  try {
    const { taxPercent, amounts } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    
    const existing = await db.select().from(withdrawSettings).limit(1);
    let updated;
    
    if (existing.length > 0) {
      updated = await db.update(withdrawSettings)
        .set({ taxPercent, amounts: JSON.stringify(amounts) })
        .where(eq(withdrawSettings.id, existing[0].id))
        .returning();
    } else {
      updated = await db.insert(withdrawSettings)
        .values({ taxPercent, amounts: JSON.stringify(amounts) })
        .returning();
    }
    
    return c.json({ success: true, settings: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/user/:id/withdraw', async (c) => {
  const userId = c.req.param('id');
  const { amount } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);

  try {
    // ✅ 1. TIME RESTRICTION CHECK (8 AM to 4 PM)
   // ✅ NEW (Forces Ethiopian Time UTC+3)
const now = new Date();
const ethiopianHour = (now.getUTCHours() + 3) % 24;

// Allow only between 8:00 AM and 3:59 PM
if (ethiopianHour < 8 || ethiopianHour >= 16) {
  return c.json({ 
    success: false, 
    error: 'Withdrawals are currently closed. Open daily from 8:00 AM to 4:00 PM.' 
  }, 403);
}

    // ... (rest of the code remains exactly the same)

    // ✅ 2. FETCH DATA & VALIDATE
    const user = (await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1))[0];
    const settings = (await db.select().from(withdrawSettings).limit(1))[0];
    const bank = (await db.select().from(userBankDetails).where(eq(userBankDetails.userId, userId)).limit(1))[0];

    if (!user) return c.json({ success: false, error: 'User not found' }, 404);
    if (!bank) return c.json({ success: false, error: 'Please add your bank information first.' }, 400);
    if (parseFloat(user.walletBalance) < parseFloat(amount)) return c.json({ success: false, error: 'Insufficient balance' }, 400);

    // ✅ 3. CALCULATE TAX
    const taxAmount = (parseFloat(amount) * (parseFloat(settings.taxPercent) / 100)).toFixed(2);
    const amountToReceive = (parseFloat(amount) - parseFloat(taxAmount)).toFixed(2);

    const bankSnapshot = JSON.stringify({
      bankName: (await db.select().from(banks).where(eq(banks.id, bank.bankId)).limit(1))[0]?.name,
      accountHolder: bank.accountHolderName,
      accountNumber: bank.accountNumber
    });

    // ✅ 4. DEDUCT WALLET
    await db.update(profiles).set({ 
      walletBalance: (parseFloat(user.walletBalance) - parseFloat(amount)).toFixed(2) 
    }).where(eq(profiles.id, userId));

    // ✅ 5. CREATE REQUEST
    const newRequest = await db.insert(withdrawalRequests).values({
      userId, 
      amountRequested: amount, 
      taxAmount, 
      amountToReceive, 
      bankDetailsSnapshot: bankSnapshot
    }).returning();

    return c.json({ success: true, request: newRequest[0], message: 'Withdrawal request submitted!' }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/user/:id/my-withdrawals', async (c) => {
  const userId = c.req.param('id');
  const db = getDb(c.env.DATABASE_URL);
  try {
    const requests = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
      
    return c.json({ success: true, requests }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/admin/withdrawals', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const lockerProfile = alias(profiles, 'locker');

    const requests = await db
      .select({
        id: withdrawalRequests.id,
        amountRequested: withdrawalRequests.amountRequested,
        amountToReceive: withdrawalRequests.amountToReceive,
        status: withdrawalRequests.status,
        bankDetailsSnapshot: withdrawalRequests.bankDetailsSnapshot,
        rejectionReason: withdrawalRequests.rejectionReason,
        approvedBy: withdrawalRequests.approvedBy,
        lockedBy: withdrawalRequests.lockedBy,
        lockedAt: withdrawalRequests.lockedAt,
        lockedByName: lockerProfile.name,
        createdAt: withdrawalRequests.createdAt,
        updatedAt: withdrawalRequests.updatedAt,
        userId: withdrawalRequests.userId,
        userName: profiles.name,
        userPhone: profiles.phone,
      })
      .from(withdrawalRequests)
      .leftJoin(profiles, eq(withdrawalRequests.userId, profiles.id))
      .leftJoin(lockerProfile, eq(withdrawalRequests.lockedBy, lockerProfile.id))
      .orderBy(desc(withdrawalRequests.createdAt));

    return c.json({ success: true, requests }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/admin/withdrawals/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status, adminId, rejectionReason } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const request = (await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1))[0];
    if (!request) return c.json({ success: false, error: 'Request not found' }, 404);
    if (request.status !== 'pending') return c.json({ success: false, error: 'Request already processed' }, 400);

    // ✅ Save reason + timestamp to DB
    await db.update(withdrawalRequests)
      .set({ 
        status, 
        approvedBy: adminId, 
        rejectionReason: status === 'rejected' ? rejectionReason : null,
        updatedAt: new Date() // ✅ Closed Time
      }) 
      .where(eq(withdrawalRequests.id, id));

       if (status === 'rejected') {
      const user = (await db.select().from(profiles).where(eq(profiles.id, request.userId)).limit(1))[0];
      await db.update(profiles).set({ 
        walletBalance: (parseFloat(user.walletBalance) + parseFloat(request.amountRequested)).toFixed(2) 
      }).where(eq(profiles.id, request.userId));
      
      // ✅ Notify user of rejection
      await db.insert(notifications).values({ 
        userId: request.userId, 
        message: `Your withdrawal request of ETB ${request.amountRequested} was rejected. Reason: ${rejectionReason}. Funds returned to your wallet.` 
      });
    } else {
      // ✅ Notify user of approval
      await db.insert(notifications).values({ 
        userId: request.userId, 
        message: `Your withdrawal request of ETB ${request.amountRequested} has been approved and sent to your bank.` 
      });
    }
    return c.json({ success: true, message: `Request ${status}` }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.get('/api/user/:id/my-payments', async (c) => {
  try {
    const userId = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    
    const myPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));

    return c.json({ success: true, payments: myPayments }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// REFERRAL SETTINGS MODULE
// ==========================================
// Super Admin: Get Referral Settings
app.get('/api/super-admin/referral-settings', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    let settings = (await db.select().from(referralSettings).limit(1))[0];
    if (!settings) {
      settings = (await db.insert(referralSettings).values({}).returning())[0];
    }
    return c.json({ success: true, settings }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Update Referral Settings
app.put('/api/super-admin/referral-settings', async (c) => {
  try {
    const { level1Percent, level2Percent } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    
    const existing = await db.select().from(referralSettings).limit(1);
    let updated;
    
    if (existing.length > 0) {
      updated = await db.update(referralSettings)
        .set({ level1Percent, level2Percent })
        .where(eq(referralSettings.id, existing[0].id))
        .returning();
    } else {
      updated = await db.insert(referralSettings)
        .values({ level1Percent, level2Percent })
        .returning();
    }
    
    return c.json({ success: true, settings: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// NOTIFICATIONS MODULE
// ==========================================
app.get('/api/user/:id/notifications', async (c) => {
  try {
    const userId = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return c.json({ success: true, notifications: userNotifications }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.put('/api/user/:id/notifications/:notifId/read', async (c) => {
  try {
    const notifId = c.req.param('notifId');
    const db = getDb(c.env.DATABASE_URL);
    
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notifId));
    
    return c.json({ success: true, message: 'Marked as read' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Get All User Bank Details
app.get('/api/super-admin/user-banks', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    
    const details = await db.select({
      id: userBankDetails.id,
      userId: userBankDetails.userId,
      userName: profiles.name,
      userPhone: profiles.phone,
      bankId: userBankDetails.bankId,
      bankName: banks.name,
      accountHolderName: userBankDetails.accountHolderName,
      accountNumber: userBankDetails.accountNumber,
      adminEdited: userBankDetails.adminEdited,
      createdAt: userBankDetails.createdAt,
      updatedAt: userBankDetails.updatedAt,
    })
    .from(userBankDetails)
    .leftJoin(profiles, eq(userBankDetails.userId, profiles.id))
    .leftJoin(banks, eq(userBankDetails.bankId, banks.id))
    .orderBy(desc(userBankDetails.updatedAt));

    return c.json({ success: true, details }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Update a User's Bank Details
app.put('/api/super-admin/user-banks/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { bankId, accountHolderName, accountNumber } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db.update(userBankDetails)
      .set({ 
        bankId, 
        accountHolderName, 
        accountNumber,
        adminEdited: true,        // ✅ Mark as edited by admin
        updatedAt: new Date()     // ✅ Update the timestamp
      })
      .where(eq(userBankDetails.id, id))
      .returning();

    if (updated.length === 0) return c.json({ success: false, error: 'Bank details not found' }, 404);
    
    return c.json({ success: true, details: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});
export default app;

// Super Admin: Get Admin Performance (Closed Tickets Stats)
app.get('/api/super-admin/admin-performance', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const startDateQuery = c.req.query('startDate');
    const endDateQuery = c.req.query('endDate');

    // Fetch all closed tickets
    const closedPayments = await db.select().from(payments).where(ne(payments.status, 'pending'));

    // Fetch all admins
    const admins = await db.select().from(profiles).where(eq(profiles.role, 'admin'));

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let customStart = now;
    let customEnd = now;
    if (startDateQuery && endDateQuery) {
      customStart = new Date(startDateQuery);
      customEnd = new Date(endDateQuery);
      customEnd.setHours(23, 59, 59, 999);
    }

    const performance = admins.map(admin => {
      let daily = 0, weekly = 0, monthly = 0, custom = 0;

      closedPayments.forEach(payment => {
        const approvedBy = JSON.parse(payment.approvedBy_admins || '[]');
        if (approvedBy.includes(admin.id)) {
          const closeDate = new Date(payment.updatedAt || payment.createdAt);

          if (closeDate >= dayAgo) daily++;
          if (closeDate >= weekAgo) weekly++;
          if (closeDate >= monthAgo) monthly++;
          if (startDateQuery && endDateQuery && closeDate >= customStart && closeDate <= customEnd) custom++;
        }
      });

      return {
        adminId: admin.id,
        adminName: admin.name || 'Unknown Admin',
        daily,
        weekly,
        monthly,
        custom,
      };
    });

    return c.json({ success: true, performance }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});


// Get System Settings (Public)
app.get('/api/system-settings', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const settings = (await db.select().from(systemSettings).limit(1))[0];
  return c.json({ success: true, settings: settings || { youtubeChannelUrl: '' } });
});

// Super Admin: Update YouTube Channel
// Super Admin: Update/Set YouTube Channel URL
app.put('/api/super-admin/system-settings', async (c) => {
  try {
    const { youtubeChannelUrl } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    
    // ✅ Check if the 'global' row exists
    const existing = await db.select().from(systemSettings).limit(1);

    if (existing.length > 0) {
      // If it exists, update it
      await db.update(systemSettings)
        .set({ youtubeChannelUrl })
        .where(eq(systemSettings.id, 'global'));
    } else {
      // If it's empty, insert the first row
      await db.insert(systemSettings).values({
        id: 'global',
        youtubeChannelUrl,
        maxUsers: 100
      });
    }
      
    return c.json({ success: true, message: 'YouTube link updated!' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete/Remove YouTube Channel URL
app.delete('/api/super-admin/system-settings/youtube', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    
    // Since the row definitely exists after you save the first link, update works fine here
    await db.update(systemSettings)
      .set({ youtubeChannelUrl: '' })
      .where(eq(systemSettings.id, 'global'));
      
    return c.json({ success: true, message: 'YouTube link removed!' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// DAILY VIDEOS MODULE (Global — applies to all jobs)
// ==========================================

// Super Admin: Create a daily video (applies to ALL jobs for that date)
app.post('/api/super-admin/daily-videos', async (c) => {
  try {
    const { title, youtubeUrl, fakeLikes, scheduledDate } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    // Auto-extract YouTube thumbnail
    let thumbnailUrl = null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = youtubeUrl.match(regExp);
    if (match && match[2].length === 11) {
      thumbnailUrl = `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
    }

    // Default to today's Ethiopian date if not provided
    const now = new Date();
    const ethiopianTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const dateStr = scheduledDate || ethiopianTime.toISOString().split('T')[0];

    const newVideo = await db.insert(dailyVideos).values({
      title,
      youtubeUrl,
      thumbnailUrl,
      fakeLikes: parseInt(fakeLikes) || 0,
      scheduledDate: dateStr,
    }).returning();

    return c.json({ success: true, video: newVideo[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Get all daily videos (optionally by date)
app.get('/api/super-admin/daily-videos', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const dateQuery = c.req.query('date');
    
    let videos;
    if (dateQuery) {
      videos = await db.select().from(dailyVideos)
        .where(eq(dailyVideos.scheduledDate, dateQuery))
        .orderBy(desc(dailyVideos.createdAt));
    } else {
      videos = await db.select().from(dailyVideos)
        .orderBy(desc(dailyVideos.createdAt));
    }
    return c.json({ success: true, videos }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete a daily video
app.delete('/api/super-admin/daily-videos/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    await db.delete(dailyVideos).where(eq(dailyVideos.id, id));
    return c.json({ success: true, message: 'Video deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ==========================================
// STORIES & NOTIFICATIONS MODULE
// ==========================================

// Admin: Create Story
app.post('/api/super-admin/stories', async (c) => {
  try {
    const { titleAm, titleEn, contentAm, contentEn, imageUrl } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    const newStory = await db.insert(stories).values({ titleAm, titleEn, contentAm, contentEn, imageUrl }).returning();
    return c.json({ success: true, story: newStory[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Admin: Delete Story
app.delete('/api/super-admin/stories/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    await db.delete(stories).where(eq(stories.id, id));
    return c.json({ success: true, message: 'Story deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Public: Get All Stories
app.get('/api/stories', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const allStories = await db.select().from(stories).orderBy(desc(stories.createdAt));
    return c.json({ success: true, stories: allStories }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Admin: Create Global Notification
app.post('/api/super-admin/notifications', async (c) => {
  try {
    const { titleAm, titleEn, contentAm, contentEn, expiresAt, imageUrl } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    
    const newNotif = await db.insert(globalNotifications).values({ 
      titleAm: titleAm || null,
      titleEn: titleEn || null,
      contentAm: contentAm || null,
      contentEn: contentEn || null,
      expiresAt: new Date(expiresAt),
      imageUrl: imageUrl || null
    }).returning();
    
    return c.json({ success: true, notification: newNotif[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Public: Get Active Notification (If any)

// Public: Get ALL Active Notifications (for carousel)
app.get('/api/active-notification', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const now = new Date();
    
    // Get all notifications that haven't expired yet
    const active = await db.select().from(globalNotifications)
      .where(gte(globalNotifications.expiresAt, now))
      .orderBy(desc(globalNotifications.createdAt));

    return c.json({ success: true, notifications: active }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});


app.post('/api/admin/withdrawals/:id/lock', async (c) => {
  const id = c.req.param('id');
  const { adminId } = await c.req.json();
  const db = getDb(c.env.DATABASE_URL);

  try {
    const request = (await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id)).limit(1))[0];
    if (!request) return c.json({ success: false, error: 'Not found' }, 404);
    if (request.status !== 'pending') return c.json({ success: false, error: 'Request already processed' }, 400);

    // ✅ Changed to 1 minute
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    
    if (request.lockedBy && request.lockedBy !== adminId && request.lockedAt && new Date(request.lockedAt) > oneMinuteAgo) {
      const locker = (await db.select().from(profiles).where(eq(profiles.id, request.lockedBy)).limit(1))[0];
      return c.json({ success: false, error: `Currently being reviewed by ${locker?.name || 'another admin'}` }, 403);
    }

    // Lock it (or overwrite the expired lock)
    await db.update(withdrawalRequests)
      .set({ lockedBy: adminId, lockedAt: new Date() })
      .where(eq(withdrawalRequests.id, id));

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});



// ==========================================
// APP SETTINGS (PROFIT & VIP) MODULE
// ==========================================

// Public: Get Settings

app.get('/api/app-settings', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    let settings = (await db.select().from(appSettings).limit(1))[0];
    
    if (!settings) {
      // Create default if doesn't exist
      settings = (await db.insert(appSettings).values({ id: 'global' }).returning())[0];
    }
    
    return c.json({ 
      success: true, 
      settings: {
        profitImages: JSON.parse(settings.profitImages),
        vipImage: settings.vipImage
      } 
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Update Settings
app.put('/api/super-admin/app-settings', async (c) => {
  try {
    const { profitImages, vipImage } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);
    
    const existing = await db.select().from(appSettings).limit(1);
    
    if (existing.length > 0) {
      await db.update(appSettings)
        .set({ profitImages: JSON.stringify(profitImages), vipImage, updatedAt: new Date() })
        .where(eq(appSettings.id, 'global'));
    } else {
      await db.insert(appSettings).values({ 
        id: 'global', 
        profitImages: JSON.stringify(profitImages), 
        vipImage 
      });
    }
    
    return c.json({ success: true, message: 'Images updated successfully' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Edit a Story
app.put('/api/super-admin/stories/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { titleAm, titleEn, contentAm, contentEn, imageUrl } = await c.req.json();
    const db = getDb(c.env.DATABASE_URL);

    const updated = await db.update(stories)
      .set({ titleAm, titleEn, contentAm, contentEn, imageUrl })
      .where(eq(stories.id, id))
      .returning();

    return c.json({ success: true, story: updated[0] }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete a Story (Ensure this is in your backend)
app.delete('/api/super-admin/stories/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    await db.delete(stories).where(eq(stories.id, id));
    return c.json({ success: true, message: 'Story deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Get All Global Notifications
app.get('/api/super-admin/notifications', async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const notifs = await db.select().from(globalNotifications).orderBy(desc(globalNotifications.createdAt));
    return c.json({ success: true, notifications: notifs }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Super Admin: Delete Global Notification
app.delete('/api/super-admin/notifications/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = getDb(c.env.DATABASE_URL);
    await db.delete(globalNotifications).where(eq(globalNotifications.id, id));
    return c.json({ success: true, message: 'Notification deleted' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});