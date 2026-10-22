import { eq, inArray, and, gte, lte, sql, desc } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { profiles, notifications, payments, reports, withdrawals } from './db/schema';

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
  const db = drizzle(postgres(c.env.DATABASE_URL));
  const hashedPassword = await hashPassword(password);

  try {
    const newProfile = await db.insert(profiles).values({
      phone, passwordHash: hashedPassword, role: 'user', invitedBy: invitedBy || null,
    }).returning();

    if (invitedBy) {
      await db.insert(notifications).values({
        userId: invitedBy,
        message: `Your invitee brought in a new member with phone: ${phone}`,
      });
    }
    return c.json({ success: true, user: newProfile[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/auth/login', async (c) => {
  const { phone, password } = await c.req.json();
  const db = drizzle(postgres(c.env.DATABASE_URL));
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

// --- REFERRAL & DASHBOARD MODULE (Strict 2-Level Chain) ---
app.get('/api/user/:id/dashboard', async (c) => {
  const userId = c.req.param('id');
  const db = drizzle(postgres(c.env.DATABASE_URL));

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

    return c.json({
      success: true,
      user: userProfile[0],
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
  const { amount, paymentMethod, ftNumber, screenshotUrl } = await c.req.json();
  const db = drizzle(postgres(c.env.DATABASE_URL));

  try {
    const newPayment = await db.insert(payments).values({
      userId, amount, payment_method: paymentMethod, ftNumber, screenshotUrl: screenshotUrl || null, status: 'pending',
    }).returning();
    return c.json({ success: true, payment: newPayment[0] }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/user/:id/withdraw', async (c) => {
  const userId = c.req.param('id');
  const { amount } = await c.req.json();
  const db = drizzle(postgres(c.env.DATABASE_URL));
  
  const user = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (parseFloat(user[0].walletBalance) < parseFloat(amount)) {
    return c.json({ success: false, error: 'Insufficient balance' }, 400);
  }

  await db.update(profiles).set({ walletBalance: (parseFloat(user[0].walletBalance) - parseFloat(amount)).toFixed(2) }).where(eq(profiles.id, userId));
  await db.insert(withdrawals).values({ userId, amount });
  
  return c.json({ success: true, message: 'Withdrawal requested. Pending admin approval.' });
});

// --- ADMIN MODULE ---
app.get('/api/admin/payments', async (c) => {
  try {
    const db = drizzle(postgres(c.env.DATABASE_URL));
    
    // ✅ Join payments with profiles to get the user's phone number
    const allPayments = await db.select({
      id: payments.id,
      amount: payments.amount,
      payment_method: payments.payment_method,
      ftNumber: payments.ftNumber,
      screenshotUrl: payments.screenshotUrl,
      status: payments.status,
      approvals_count: payments.approvals_count,
      approvedBy_admins: payments.approvedBy_admins,
      createdAt: payments.createdAt,
      userId: {
        id: profiles.id,
        name: profiles.name,
        phone: profiles.phone,
      }
    })
    .from(payments)
    .leftJoin(profiles, eq(payments.userId, profiles.id))
    .orderBy(desc(payments.createdAt));

    return c.json({ success: true, payments: allPayments }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/admin/payments/:id/approve', async (c) => {
  const paymentId = c.req.param('id');
  const { adminId } = await c.req.json();
  const db = drizzle(postgres(c.env.DATABASE_URL));

  try {
    const payment = (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
    if (payment.status === 'approved') return c.json({ success: false, error: 'Already approved' }, 400);

    let approvedBy = JSON.parse(payment.approvedBy_admins || '[]');
    if (approvedBy.includes(adminId)) return c.json({ success: false, error: 'You already approved this' }, 400);

    approvedBy.push(adminId);
    const isCompleted = approvedBy.length >= 10; // 10 Admin Rule

    await db.update(payments).set({
      approvals_count: approvedBy.length,
      approvedBy_admins: JSON.stringify(approvedBy),
      status: isCompleted ? 'approved' : 'pending'
    }).where(eq(payments.id, paymentId));

    if (isCompleted) {
      const user = (await db.select().from(profiles).where(eq(profiles.id, payment.userId)).limit(1))[0];
      await db.update(profiles).set({ walletBalance: (parseFloat(user.walletBalance) + parseFloat(payment.amount)).toFixed(2) }).where(eq(profiles.id, payment.userId));
      await db.insert(notifications).values({ userId: payment.userId, message: `Payment of ETB ${payment.amount} approved and added to wallet.` });
    }
    return c.json({ success: true, message: `Approved (${approvedBy.length}/10)` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

app.post('/api/admin/report', async (c) => {
  const { adminId, targetUserId, reason } = await c.req.json();
  const db = drizzle(postgres(c.env.DATABASE_URL));
  await db.insert(reports).values({ adminId, targetUserId, reason });
  return c.json({ success: true, message: 'Report sent to Super Admin' });
});

app.get('/api/admin/performance/:adminId', async (c) => {
  const adminId = c.req.param('adminId');
  const db = drizzle(postgres(c.env.DATABASE_URL));
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
  const db = drizzle(postgres(c.env.DATABASE_URL));
  
  // 1. Get date filters from the frontend URL query
  const startDateQuery = c.req.query('startDate');
  const endDateQuery = c.req.query('endDate');

  const allUsers = await db.select().from(profiles);
  const allPayments = await db.select().from(payments).where(eq(payments.status, 'approved'));
  const pendingReports = await db.select().from(reports).where(eq(reports.status, 'pending'));

  // 2. Apply Custom Date Filter (if provided)
  let filteredUsers = allUsers;
  let filteredPayments = allPayments;

  if (startDateQuery) {
    const start = new Date(startDateQuery);
    filteredUsers = filteredUsers.filter(u => new Date(u.createdAt) >= start);
    filteredPayments = filteredPayments.filter(p => new Date(p.createdAt) >= start);
  }
  if (endDateQuery) {
    const end = new Date(endDateQuery);
    end.setHours(23, 59, 59, 999); // Include the whole end day
    filteredUsers = filteredUsers.filter(u => new Date(u.createdAt) <= end);
    filteredPayments = filteredPayments.filter(p => new Date(p.createdAt) <= end);
  }

  // Calculate filtered totals for the date picker range
  const customFilteredUsersTotal = filteredUsers.length;
  const customFilteredVolumeTotal = filteredPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0);

  // 3. Standard Date Filters (Daily, Weekly, Monthly)
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Analytics calculations
  const dailyUsers = allUsers.filter(u => new Date(u.createdAt) >= dayAgo).length;
  const weeklyUsers = allUsers.filter(u => new Date(u.createdAt) >= weekAgo).length;
  const monthlyUsers = allUsers.filter(u => new Date(u.createdAt) >= monthAgo).length;

  const dailyBirr = allPayments.filter(p => new Date(p.createdAt) >= dayAgo).reduce((acc, p) => acc + parseFloat(p.amount), 0);
  const weeklyBirr = allPayments.filter(p => new Date(p.createdAt) >= weekAgo).reduce((acc, p) => acc + parseFloat(p.amount), 0);
  const monthlyBirr = allPayments.filter(p => new Date(p.createdAt) >= monthAgo).reduce((acc, p) => acc + parseFloat(p.amount), 0);

  // 4. Admin Performance Breakdown
  const adminStats: Record<string, { count: number, volume: number }> = {};
  allPayments.forEach(p => {
    const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
    approvedBy.forEach((adminId: string) => {
      if (!adminStats[adminId]) adminStats[adminId] = { count: 0, volume: 0 };
      adminStats[adminId].count++;
      adminStats[adminId].volume += parseFloat(p.amount) / approvedBy.length; // Pro-rata share
    });
  });

  const adminPerformance = Object.keys(adminStats).map(id => {
    const admin = allUsers.find(u => u.id === id);
    return { id, name: admin?.name, phone: admin?.phone, approvals: adminStats[id].count, volume: adminStats[id].volume.toFixed(2) };
  });

  // 5. Return everything to the frontend
  return c.json({
    success: true,
    analytics: {
      // These are the new custom date filtered totals
      dateFiltered: { 
        users: customFilteredUsersTotal, 
        volume: customFilteredVolumeTotal.toFixed(2) 
      },
      // Standard rolling totals
      users: { daily: dailyUsers, weekly: weeklyUsers, monthly: monthlyUsers, total: allUsers.length },
      birr: { daily: dailyBirr.toFixed(2), weekly: weeklyBirr.toFixed(2), monthly: monthlyBirr.toFixed(2) },
      adminPerformance,
      reports: pendingReports
    },
    admins: allUsers.filter(u => u.role === 'admin'),
    users: allUsers.filter(u => u.role === 'user')
  });
});

// Admin Management Routes for Super Admin
app.post('/api/super-admin/create-admin', async (c) => {
  const { phone, password, name } = await c.req.json();
  const db = drizzle(postgres(c.env.DATABASE_URL));
  const hashedPassword = await hashPassword(password);
  await db.insert(profiles).values({ name, phone, passwordHash: hashedPassword, role: 'admin' });
  return c.json({ success: true, message: 'Admin created' });
});

app.post('/api/super-admin/admins/:id/toggle-lock', async (c) => {
  const id = c.req.param('id');
  const db = drizzle(postgres(c.env.DATABASE_URL));
  const admin = (await db.select().from(profiles).where(eq(profiles.id, id)).limit(1))[0];
  await db.update(profiles).set({ isLocked: !admin.isLocked }).where(eq(profiles.id, id));
  return c.json({ success: true, isLocked: !admin.isLocked });
});

app.delete('/api/super-admin/users/:id', async (c) => {
  const id = c.req.param('id');
  const db = drizzle(postgres(c.env.DATABASE_URL));
  await db.delete(profiles).where(eq(profiles.id, id));
  return c.json({ success: true, message: 'Deleted' });
});

// Get Global Referral Analytics (for Super Admin)
app.get('/api/super-admin/referrals', async (c) => {
  try {
    const db = drizzle(postgres(c.env.DATABASE_URL));
    
    // Fetch all users who have invited someone
    const allUsers = await db.select().from(profiles).where(sql`${profiles.invitedBy} IS NOT NULL`);
    
    // Count how many people each user invited
    const inviteCounts: Record<string, number> = {};
    allUsers.forEach(u => {
      if (u.invitedBy) {
        inviteCounts[u.invitedBy] = (inviteCounts[u.invitedBy] || 0) + 1;
      }
    });

    // Get profiles of the inviters
    const inviterIds = Object.keys(inviteCounts);
    
    // ✅ FIX: Explicitly type the array as any[]
    let inviters: any[] = [];
    
    if (inviterIds.length > 0) {
      const profilesData = await db.select().from(profiles).where(inArray(profiles.id, inviterIds));
      
      inviters = profilesData.map(p => ({
        id: p.id,
        name: p.name || 'User',
        phone: p.phone,
        invitedCount: inviteCounts[p.id]
      })).sort((a, b) => b.invitedCount - a.invitedCount); // Sort highest first
    }

    return c.json({ success: true, referrals: inviters }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// --- SUPER ADMIN PROFILE MODULE ---

// Update Name and Phone
app.put('/api/super-admin/profile/:id/update', async (c) => {
  try {
    const userId = c.req.param('id');
    const { name, phone } = await c.req.json();
    const db = drizzle(postgres(c.env.DATABASE_URL));

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

// Update Password
app.put('/api/super-admin/profile/:id/password', async (c) => {
  try {
    const userId = c.req.param('id');
    const { currentPassword, newPassword } = await c.req.json();
    const db = drizzle(postgres(c.env.DATABASE_URL));

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

// --- ADMIN MODULE ---

// Get Admin Personal Performance & Profile
app.get('/api/admin/profile/:id', async (c) => {
  try {
    const adminId = c.req.param('id');
    const db = drizzle(postgres(c.env.DATABASE_URL));

    const admin = await db.select().from(profiles).where(eq(profiles.id, adminId)).limit(1);
    if (admin.length === 0) return c.json({ success: false, error: 'Admin not found' }, 404);

    const allApprovedPayments = await db.select().from(payments).where(eq(payments.status, 'approved'));

    // Filter payments approved by this specific admin
    const myApprovedPayments = allApprovedPayments.filter(p => {
      const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
      return approvedBy.includes(adminId);
    });

    // Calculate performance
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let dailyCount = 0, weeklyCount = 0, monthlyCount = 0, totalVolume = 0;

    myApprovedPayments.forEach(p => {
      const pDate = new Date(p.createdAt);
      if (pDate >= dayAgo) dailyCount++;
      if (pDate >= weekAgo) weeklyCount++;
      if (pDate >= monthAgo) monthlyCount++;
      
      // Pro-rata volume (amount divided by number of admins who approved)
      const approvedBy = JSON.parse(p.approvedBy_admins || '[]');
      totalVolume += parseFloat(p.amount) / approvedBy.length;
    });

    return c.json({
      success: true,
      profile: admin[0],
      performance: {
        daily: dailyCount,
        weekly: weeklyCount,
        monthly: monthlyCount,
        totalApproved: myApprovedPayments.length,
        totalVolume: totalVolume.toFixed(2)
      }
    }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// Admin Update User Name
app.put('/api/admin/users/:id/name', async (c) => {
  try {
    const userId = c.req.param('id');
    const { name } = await c.req.json();
    const db = drizzle(postgres(c.env.DATABASE_URL));

    await db.update(profiles).set({ name }).where(eq(profiles.id, userId));
    return c.json({ success: true, message: 'User name updated' }, 200);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});
export default app;