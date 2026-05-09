const bcrypt = require('bcryptjs');
const { sequelize, Role, User, AttendanceRecord, CorrectionRequest, AttendanceRule, AuditLog } = require('../models');

// ─── Seed Script ──────────────────────────────────────────
// Populates the database with sample data for all 3 roles
// Run: npm run seed

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync tables (force: true drops and recreates)
    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated');

    // ── 1. Roles ────────────────────────────────────────────
    const [adminRole, hrRole, empRole] = await Role.bulkCreate([
      { name: 'admin', description: 'System administrator with full access to all modules' },
      { name: 'hr', description: 'HR personnel who reviews correction requests and views attendance' },
      { name: 'employee', description: 'Regular employee who marks attendance and raises corrections' },
    ]);
    console.log('✅ Roles seeded');

    // ── 2. Users ────────────────────────────────────────────
    const hash = (pw) => bcrypt.hashSync(pw, 12);

    const [admin, hr, emp1, emp2, emp3] = await User.bulkCreate([
      { employee_id: 'ADM-001', name: 'Rajesh Kumar', email: 'admin@optronix.com', password_hash: hash('Admin@123'), role_id: adminRole.id, department: 'Management' },
      { employee_id: 'HR-001', name: 'Priya Sharma', email: 'hr@optronix.com', password_hash: hash('Hr@123'), role_id: hrRole.id, department: 'Human Resources' },
      { employee_id: 'EMP-001', name: 'Amit Patel', email: 'emp1@optronix.com', password_hash: hash('Emp@123'), role_id: empRole.id, department: 'Engineering' },
      { employee_id: 'EMP-002', name: 'Sneha Reddy', email: 'emp2@optronix.com', password_hash: hash('Emp@123'), role_id: empRole.id, department: 'Engineering' },
      { employee_id: 'EMP-003', name: 'Karan Singh', email: 'emp3@optronix.com', password_hash: hash('Emp@123'), role_id: empRole.id, department: 'Design' },
    ]);
    console.log('✅ Users seeded');

    // ── 3. Attendance Rules ─────────────────────────────────
    await AttendanceRule.create({
      default_shift_start: '09:00:00',
      default_shift_end: '18:00:00',
      grace_period_minutes: 15,
      min_hours_full_day: 8,
      min_hours_half_day: 4,
      auto_absent_enabled: false,
      auto_absent_cutoff: '12:00:00',
    });
    console.log('✅ Attendance rules seeded');

    // ── 4. Attendance Records (last 15 days) ────────────────
    const employees = [emp1, emp2, emp3];
    const attendanceRecords = [];

    for (let i = 14; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      for (const emp of employees) {
        // Skip weekends
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Randomize clock-in between 8:45 and 9:30
        const clockIn = new Date(date);
        clockIn.setHours(8 + Math.floor(Math.random() * 1), 45 + Math.floor(Math.random() * 45), 0);

        // Randomize clock-out between 17:30 and 18:30
        const clockOut = new Date(date);
        clockOut.setHours(17 + Math.floor(Math.random() * 1), 30 + Math.floor(Math.random() * 60), 0);

        const diffMs = clockOut - clockIn;
        const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        const status = totalHours >= 8 ? 'present' : totalHours >= 4 ? 'half-day' : 'absent';

        attendanceRecords.push({
          user_id: emp.id,
          date: dateStr,
          clock_in: clockIn,
          clock_out: clockOut,
          total_hours: totalHours,
          status,
          source: 'self',
        });
      }
    }

    const createdRecords = await AttendanceRecord.bulkCreate(attendanceRecords);
    console.log(`✅ ${createdRecords.length} attendance records seeded`);

    // ── 5. Correction Requests ──────────────────────────────
    const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fiveDaysAgo = new Date(); fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const tenDaysAgo = new Date(); tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    await CorrectionRequest.bulkCreate([
      {
        user_id: emp1.id, attendance_id: createdRecords[0]?.id || null,
        date: fiveDaysAgo.toISOString().split('T')[0], type: 'wrong_in',
        corrected_time: '09:00:00', reason: 'System recorded wrong clock-in time. I was at my desk by 9 AM.',
        status: 'approved', reviewed_by: hr.id, remarks: 'Verified with CCTV logs.',
        reviewed_at: threeDaysAgo,
      },
      {
        user_id: emp1.id, attendance_id: null,
        date: twoDaysAgo.toISOString().split('T')[0], type: 'missed_in',
        corrected_time: '09:15:00', reason: 'Forgot to mark attendance but was present in office.',
        status: 'pending', reviewed_by: null, remarks: null, reviewed_at: null,
      },
      {
        user_id: emp2.id, attendance_id: createdRecords[3]?.id || null,
        date: sevenDaysAgo.toISOString().split('T')[0], type: 'missed_out',
        corrected_time: '18:00:00', reason: 'Left office at 6 PM but forgot to clock out.',
        status: 'approved', reviewed_by: hr.id, remarks: 'Approved based on team lead confirmation.',
        reviewed_at: fiveDaysAgo,
      },
      {
        user_id: emp3.id, attendance_id: createdRecords[5]?.id || null,
        date: tenDaysAgo.toISOString().split('T')[0], type: 'wrong_out',
        corrected_time: '18:30:00', reason: 'Clock-out was registered early due to network issue.',
        status: 'rejected', reviewed_by: hr.id, remarks: 'No supporting evidence found. CCTV shows exit at recorded time.',
        reviewed_at: sevenDaysAgo,
      },
      {
        user_id: emp2.id, attendance_id: null,
        date: threeDaysAgo.toISOString().split('T')[0], type: 'missed_in',
        corrected_time: '09:05:00', reason: 'Was in a client meeting and forgot to mark attendance.',
        status: 'pending', reviewed_by: null, remarks: null, reviewed_at: null,
      },
    ]);
    console.log('✅ Correction requests seeded');

    // ── 6. Audit Logs ───────────────────────────────────────
    await AuditLog.bulkCreate([
      { user_id: admin.id, action: 'user_create', entity_type: 'user', entity_id: emp1.id, new_values: { name: 'Amit Patel' }, ip_address: '127.0.0.1' },
      { user_id: admin.id, action: 'user_create', entity_type: 'user', entity_id: emp2.id, new_values: { name: 'Sneha Reddy' }, ip_address: '127.0.0.1' },
      { user_id: admin.id, action: 'rule_update', entity_type: 'rule', entity_id: 1, old_values: { grace_period_minutes: 10 }, new_values: { grace_period_minutes: 15 }, ip_address: '127.0.0.1' },
      { user_id: hr.id, action: 'approve', entity_type: 'correction', entity_id: 1, old_values: { status: 'pending' }, new_values: { status: 'approved' }, ip_address: '127.0.0.1' },
      { user_id: hr.id, action: 'reject', entity_type: 'correction', entity_id: 4, old_values: { status: 'pending' }, new_values: { status: 'rejected' }, ip_address: '127.0.0.1' },
    ]);
    console.log('✅ Audit logs seeded');

    console.log('\n🎉 All seed data created successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('┌──────────┬─────────────────────┬──────────────┐');
    console.log('│ Role     │ Email               │ Password     │');
    console.log('├──────────┼─────────────────────┼──────────────┤');
    console.log('│ Admin    │ admin@optronix.com  │ Admin@123    │');
    console.log('│ HR       │ hr@optronix.com     │ Hr@123       │');
    console.log('│ Employee │ emp1@optronix.com   │ Emp@123      │');
    console.log('│ Employee │ emp2@optronix.com   │ Emp@123      │');
    console.log('│ Employee │ emp3@optronix.com   │ Emp@123      │');
    console.log('└──────────┴─────────────────────┴──────────────┘');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
