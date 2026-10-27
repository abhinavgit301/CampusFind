import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Report } from '../models/Report.js';
import { Claim } from '../models/Claim.js';
import { Match } from '../models/Match.js';
import { Notification } from '../models/Notification.js';
import { RecoveryRecord } from '../models/RecoveryRecord.js';
import { AuditLog } from '../models/AuditLog.js';
import { ENV } from '../config/env.js';
import { findAndStoreMatchesForReport } from '../services/matchService.js';

export async function seedDatabase() {
  if (ENV.NODE_ENV === 'production') {
    throw new Error('[Security Exception] Database seeding is strictly forbidden in production mode.');
  }

  console.log('[Seed] Starting database seeding...');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Report.deleteMany({}),
    Claim.deleteMany({}),
    Match.deleteMany({}),
    Notification.deleteMany({}),
    RecoveryRecord.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('[Seed] Cleared existing collections.');

  // Create Users
  const studentSalt = await bcrypt.genSalt(10);
  const studentHash = await bcrypt.hash('Password123!', studentSalt);
  const modHash = await bcrypt.hash('AdminSecret123!', studentSalt);

  const student1 = await User.create({
    email: 'student@campus.edu',
    passwordHash: studentHash,
    displayName: 'Alex Sharma',
    hostel: 'UNIWORLD_1',
    roomNumber: '304',
    phoneNumber: '+91 98765 43210',
    role: 'STUDENT',
    status: 'ACTIVE',
  });

  const student2 = await User.create({
    email: 'finder@campus.edu',
    passwordHash: studentHash,
    displayName: 'Priya Patel',
    hostel: 'UNIWORLD_2',
    roomNumber: '112',
    phoneNumber: '+91 91234 56789',
    role: 'STUDENT',
    status: 'ACTIVE',
  });

  const moderator = await User.create({
    email: 'moderator@campus.edu',
    passwordHash: modHash,
    displayName: 'Chief Proctor Office',
    hostel: 'NONE',
    roomNumber: 'Admin-201',
    phoneNumber: '+91 90000 00000',
    role: 'MODERATOR',
    status: 'ACTIVE',
  });

  console.log('[Seed] Created default users:');
  console.log(' - student@campus.edu (Password123!)');
  console.log(' - finder@campus.edu (Password123!)');
  console.log(' - moderator@campus.edu (AdminSecret123!)');

  // Create Reports
  const report1 = await Report.create({
    publicId: 'CF-2026-1001',
    reportType: 'FOUND',
    reporterId: student2._id,
    categoryId: 'Electronics',
    title: 'Sony WH-1000XM4 Noise-Cancelling Headphones',
    description: 'Found black Sony over-ear headphones on a desk on the 2nd floor of Macro Campus central library. In clean black carry case with aux cable.',
    attributes: {
      color: 'Black',
      brand: 'Sony',
      model: 'WH-1000XM4',
    },
    photoKeys: [],
    eventAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    foundLocation: 'Macro Campus',
    holdingLocation: 'MACRO_RECEPTION',
    contactDetails: null, // Strictly null for Macro Campus reception
    status: 'ACTIVE',
  });

  const report2 = await Report.create({
    publicId: 'CF-2026-1002',
    reportType: 'LOST',
    reporterId: student1._id,
    categoryId: 'Electronics',
    title: 'Sony Wireless Headphones (Black WH-1000XM4)',
    description: 'Lost my black Sony noise cancelling headphones in the main campus library study area near reading room B.',
    attributes: {
      color: 'Black',
      brand: 'Sony',
      model: 'WH-1000XM4',
    },
    photoKeys: [],
    eventAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    lastSeenLocation: 'Macro Campus',
    contactDetails: null,
    status: 'ACTIVE',
  });

  const report3 = await Report.create({
    publicId: 'CF-2026-1003',
    reportType: 'FOUND',
    reporterId: student2._id,
    categoryId: 'Electronics',
    title: 'Dell 65W USB-C Laptop Charger',
    description: 'Found black Dell power brick in Uniworld 1 common lounge on the sofa. Keeping it safe with me.',
    attributes: {
      brand: 'Dell',
      wattage: '65W',
      color: 'Black',
    },
    photoKeys: [],
    eventAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    foundLocation: 'Uniworld 1',
    holdingLocation: 'WITH_FINDER',
    contactDetails: {
      displayName: 'Priya Patel',
      phoneNumber: '+91 91234 56789',
      hostel: 'Uniworld 2',
      roomNumber: '112',
    },
    status: 'ACTIVE',
  });

  const report4 = await Report.create({
    publicId: 'CF-2026-1004',
    reportType: 'LOST',
    reporterId: student1._id,
    categoryId: 'Bags and Wallets',
    title: 'Brown Fossil Leather Bifold Wallet',
    description: 'Contains college identity card, metro card, and driver license. Misplaced near Uniworld 2 cafeteria benches.',
    attributes: {
      brand: 'Fossil',
      color: 'Brown',
    },
    photoKeys: [],
    eventAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    lastSeenLocation: 'Uniworld 2',
    contactDetails: null,
    status: 'ACTIVE',
  });

  const report5 = await Report.create({
    publicId: 'CF-2026-1005',
    reportType: 'FOUND',
    reporterId: student1._id,
    categoryId: 'ID Cards and Documents',
    title: 'Student Identity Card — CS Branch 3rd Year',
    description: 'Found near Macro Campus sports ground gate. Deposited at Macro Campus security reception counter.',
    attributes: {
      type: 'College ID',
    },
    photoKeys: [],
    eventAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    foundLocation: 'Macro Campus',
    holdingLocation: 'MACRO_RECEPTION',
    contactDetails: null,
    status: 'ACTIVE',
  });

  const report7 = await Report.create({
    publicId: 'CF-2026-1007',
    reportType: 'FOUND',
    reporterId: student2._id,
    categoryId: 'Electronics',
    title: 'Apple iPad Air (Space Gray) with Apple Pencil',
    description: 'Found high-value iPad left on the study table in Uniworld 1 2nd floor lounge. Safely handed over to Uniworld 1 ground floor reception warden desk.',
    attributes: {
      brand: 'Apple',
      color: 'Space Gray',
      accessory: 'Pencil Attached',
    },
    photoKeys: [],
    eventAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    foundLocation: 'Uniworld 1',
    holdingLocation: 'UNIWORLD_1_RECEPTION',
    contactDetails: null,
    status: 'ACTIVE',
  });

  const report8 = await Report.create({
    publicId: 'CF-2026-1008',
    reportType: 'FOUND',
    reporterId: student1._id,
    categoryId: 'Accessories',
    title: 'Titan Automatic Skeleton Mechanical Wristwatch',
    description: 'Found premium steel wristwatch near Uniworld 2 gym entrance benches. Deposited with Uniworld 2 hostel reception security desk.',
    attributes: {
      brand: 'Titan',
      material: 'Stainless Steel',
      dialColor: 'Blue / Silver',
    },
    photoKeys: [],
    eventAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    foundLocation: 'Uniworld 2',
    holdingLocation: 'UNIWORLD_2_RECEPTION',
    contactDetails: null,
    status: 'ACTIVE',
  });

  const report6 = await Report.create({
    publicId: 'CF-2026-1006',
    reportType: 'FOUND',
    reporterId: student2._id,
    categoryId: 'Bottles and Containers',
    title: 'Blue Hydro Flask Water Bottle (32oz)',
    description: 'Stainless steel insulated bottle recovered and returned to original owner.',
    attributes: {
      brand: 'Hydro Flask',
      color: 'Blue',
      size: '32oz',
    },
    photoKeys: [],
    eventAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    foundLocation: 'Uniworld 1',
    holdingLocation: 'WITH_FINDER',
    contactDetails: {
      displayName: 'Priya Patel',
      phoneNumber: '+91 91234 56789',
    },
    status: 'RESOLVED',
    resolvedAt: new Date(),
  });

  await RecoveryRecord.create({
    reportId: report6._id,
    foundByUserId: student2._id,
    claimantId: student1._id,
    completedAt: new Date(),
    confirmedBy: student2._id,
    notes: 'Handed over in Uniworld 1 lobby after serial confirmation.',
  });

  console.log('[Seed] Created sample listings.');

  // Run match algorithm for report1 and report2
  await findAndStoreMatchesForReport(report1);
  await findAndStoreMatchesForReport(report2);

  // Add initial notifications
  await Notification.create({
    recipientId: student1._id,
    type: 'MATCH_SUGGESTED',
    title: 'High Confidence Match Suggested',
    message: 'We found a 95% match for your lost Sony WH-1000XM4 Headphones! Check your activity matches.',
    relatedReportId: report1._id,
  });

  await Notification.create({
    recipientId: student2._id,
    type: 'GENERAL',
    title: 'Welcome to CampusFind',
    message: 'Thank you for helping keep our campus safe and connected. Browse listings anytime.',
  });

  console.log('[Seed] Seed completed successfully!');
}

if (process.argv[1]?.endsWith('seedData.ts')) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase();
      await disconnectDatabase();
      process.exit(0);
    } catch (e) {
      console.error('[Seed] Failed:', e);
      process.exit(1);
    }
  })();
}
