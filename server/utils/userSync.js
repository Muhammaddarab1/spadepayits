/**
 * User Synchronization Service
 * Syncs users from Microsoft 365 to the local database
 * Creates or updates user records based on Microsoft tenant
 */
import User from '../models/User.js';
import Role from '../models/Role.js';
import { getMicrosoftUsers } from './microsoftGraph.js';

/**
 * Sync all users from Microsoft 365 to database
 * Returns sync summary with created, updated, and error counts
 */
export const syncUsersFromMicrosoft = async () => {
  const summary = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Fetch all users from Microsoft
    const microsoftUsers = await getMicrosoftUsers();
    summary.total = microsoftUsers.length;

    // Get default role for new users
    const defaultRole = await Role.findOne({ name: 'User' });
    if (!defaultRole) {
      throw new Error('Default "User" role not found in database');
    }

    for (const msUser of microsoftUsers) {
      try {
        // Skip users without email
        if (!msUser.email) {
          summary.skipped++;
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [{ email: msUser.email }, { microsoftId: msUser.microsoftId }],
        });

        if (existingUser) {
          // Update existing user with Microsoft data
          existingUser.name = msUser.name;
          existingUser.microsoftId = msUser.microsoftId;
          existingUser.department = msUser.department;
          existingUser.jobTitle = msUser.jobTitle;
          // Don't override password or role, just update profile data
          await existingUser.save();
          summary.updated++;
        } else {
          // Create new user
          const newUser = new User({
            name: msUser.name,
            email: msUser.email,
            microsoftId: msUser.microsoftId,
            department: msUser.department,
            jobTitle: msUser.jobTitle,
            role: defaultRole._id,
            permissions: {},
            password: generateRandomPassword(), // Random password, user can reset
          });
          await newUser.save();
          summary.created++;
        }
      } catch (error) {
        console.error(`Failed to sync user ${msUser.email}:`, error.message);
        summary.errors.push({
          email: msUser.email,
          error: error.message,
        });
      }
    }

    console.log('User sync completed:', summary);
    return summary;
  } catch (error) {
    console.error('User sync failed:', error.message);
    throw error;
  }
};

/**
 * Generate random password for new users
 * Users will reset on first login
 */
const generateRandomPassword = () => {
  const length = 16;
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

/**
 * Manually sync a specific user by email
 * Called when new user is registered/invited
 */
export const syncUserByEmail = async (email) => {
  try {
    // Search for user in Microsoft
    const { searchMicrosoftUserByEmail } = await import('./microsoftGraph.js');
    const msUser = await searchMicrosoftUserByEmail(email);

    if (!msUser) {
      return { success: false, message: 'User not found in Microsoft 365 tenant' };
    }

    // Get or create user in local database
    let user = await User.findOne({ email });

    if (!user) {
      const defaultRole = await Role.findOne({ name: 'User' });
      user = new User({
        name: msUser.name,
        email: msUser.email,
        microsoftId: msUser.microsoftId,
        department: msUser.department,
        jobTitle: msUser.jobTitle,
        role: defaultRole._id,
        permissions: {},
        password: generateRandomPassword(),
      });
      await user.save();
      return { success: true, message: 'User created from Microsoft 365 data', created: true };
    } else {
      // Update existing user
      user.name = msUser.name;
      user.microsoftId = msUser.microsoftId;
      user.department = msUser.department;
      user.jobTitle = msUser.jobTitle;
      await user.save();
      return { success: true, message: 'User updated with Microsoft 365 data', created: false };
    }
  } catch (error) {
    console.error(`Failed to sync user ${email}:`, error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Get sync statistics
 */
export const getSyncStats = async () => {
  try {
    const usersWithMicrosoftId = await User.countDocuments({ microsoftId: { $exists: true, $ne: null } });
    const totalUsers = await User.countDocuments();

    return {
      totalUsers,
      syncedUsers: usersWithMicrosoftId,
      unsyncedUsers: totalUsers - usersWithMicrosoftId,
      syncPercentage: totalUsers > 0 ? Math.round((usersWithMicrosoftId / totalUsers) * 100) : 0,
    };
  } catch (error) {
    console.error('Failed to get sync stats:', error.message);
    throw error;
  }
};
