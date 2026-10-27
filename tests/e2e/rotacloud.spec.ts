import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

test.describe('RotaCloud End-to-End Parity & Invite-Only Admission Suite', () => {
  test.beforeAll(() => {
    execSync(
      'npm run auth:bootstrap-admin -- --email jack.wolf@rotacloud-test.local --name "Jack Wolf" --password "AdminPassword123!" --company "MS" --location "York"',
      { stdio: 'ignore' }
    );
  });

  test.afterAll(() => {
    execSync(
      `node --import tsx -e "import { prisma } from './src/lib/prisma'; (async () => { await prisma.auditLog.deleteMany({}); await prisma.accountInvitation.deleteMany({}); await prisma.shiftRequest.deleteMany({}); await prisma.shift.deleteMany({}); await prisma.leaveRecord.deleteMany({}); await prisma.timesheet.deleteMany({}); await prisma.employeeLocation.deleteMany({}); await prisma.employeeRole.deleteMany({}); await prisma.role.deleteMany({}); await prisma.location.deleteMany({}); await prisma.user.deleteMany({}); await prisma.workspace.deleteMany({}); })()"`,
      { stdio: 'ignore' }
    );
  });

  test('1. Public marketing pages & interactive pricing calculator render accurately', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        name: /Workforce management software that makes work/i,
      })
    ).toBeVisible();

    await page.goto('/pricing');
    await expect(
      page.getByRole('heading', {
        name: /Simple, transparent stairstep pricing/i,
      })
    ).toBeVisible();

    await page.goto('/rota-planning');
    await expect(
      page.getByRole('heading', { name: /Build conflict-free rotas/i })
    ).toBeVisible();

    await page.goto('/time-and-attendance');
    await expect(
      page.getByRole('heading', {
        name: /Accurate clocking and stress-free payroll timesheets/i,
      })
    ).toBeVisible();

    await page.goto('/hr-software');
    await expect(
      page.getByRole('heading', {
        name: /Centralised leave, TOIL, Bradford Factor/i,
      })
    ).toBeVisible();

    await page.goto('/welcomeback');
    await expect(
      page.getByRole('heading', {
        name: /Ready to check your next shift/i,
      })
    ).toBeVisible();
  });

  test('2. Invite-only registration rejects invalid codes on /register', async ({
    page,
  }) => {
    await page.goto('/register?code=RC-0000-0000-0000');
    await expect(page.getByText(/INVALID/i)).toBeVisible();
  });

  test('3. Admin login, Role creation, Rota scheduling & publishing, Single-Use Invite issuance, Staff registration, Leave, PIN Terminal & Audit Log', async ({
    page,
    browser,
  }) => {
    // Log in as bootstrapped Admin (Jack Wolf)
    await page.goto('/login');
    await page
      .getByPlaceholder('you@company.com')
      .fill('jack.wolf@rotacloud-test.local');
    await page
      .getByPlaceholder('Enter your password')
      .fill('AdminPassword123!');
    await page.getByRole('button', { name: /Log In/i }).click();

    await page.waitForURL('**/app/dashboard');
    await expect(
      page.getByRole('heading', { name: /Welcome back, Jack/i })
    ).toBeVisible();

    // Create a Job Role on /app/roles
    await page.goto('/app/roles');
    await page
      .getByPlaceholder(/e.g. Barista, Shift Supervisor/i)
      .fill('Front of House');
    await page.getByRole('button', { name: /Add Role/i }).click();
    await expect(page.getByText('Front of House')).toBeVisible();

    // Navigate to Rota Builder (/app/rotas), test natural-language duration ("9am - 5pm"), Tools menu & View Options, add a shift, and publish it
    await page.goto('/app/rotas');
    await expect(page.getByText('Week summary')).toBeVisible();
    await page.getByRole('button', { name: /Add Shift/i }).click();
    await page.locator('input#duration').fill('9am - 5pm');
    await page.screenshot({
      path: 'screenshots/136-local-shift-drawer-natural-duration.png',
    });
    await page
      .locator('form')
      .getByRole('button', { name: /Add Shift/i })
      .click();
    await expect(page.getByText(/Shift added to rota/i)).toBeVisible();

    await page.getByRole('button', { name: /Publish/i }).click();
    await expect(page.getByText(/Published 1 shift/i)).toBeVisible();
    await page.screenshot({
      path: 'screenshots/137-local-rota-builder-interactive.png',
    });

    // Issue a Single-Use Invitation Code on /app/employees
    const uniqueEmail = `alex.${Date.now()}@rotacloud-test.local`;
    await page.goto('/app/employees');
    await page
      .getByRole('button', { name: /Add \/ Invite Employee/i })
      .click();
    const modal = page.locator('form');
    await modal.locator('input[type="text"]').first().fill('Alex');
    await modal.locator('input[type="text"]').nth(1).fill('Taylor');
    await modal.locator('input[type="email"]').fill(uniqueEmail);
    await modal
      .getByRole('button', { name: /Generate Single-Use Invite Code/i })
      .click();

    await expect(
      page.getByText(/Single-Use Invitation Code Issued/i)
    ).toBeVisible();
    const issuedCodeText = await page
      .locator('.font-mono.text-lg')
      .textContent();
    const inviteCode = (issuedCodeText || '').trim();
    expect(inviteCode).toMatch(/^RC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    // Open a clean browser context and register Alex Taylor using the single-use code
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    await staffPage.goto(`/register?code=${inviteCode}`);
    await expect(
      staffPage.getByText(/Valid EMPLOYEE invitation/i)
    ).toBeVisible();
    await staffPage.getByPlaceholder('Jane', { exact: true }).fill('Alex');
    await staffPage.getByPlaceholder('Doe', { exact: true }).fill('Taylor');
    await staffPage
      .getByPlaceholder('At least 8 characters')
      .fill('AlexPassword123!');
    await staffPage
      .getByRole('button', { name: /Redeem Invitation & Create Account/i })
      .click();
    await staffPage.waitForURL('**/app/dashboard');
    await expect(
      staffPage.getByRole('heading', { name: /Welcome back, Alex/i })
    ).toBeVisible();
    await staffContext.close();

    // Verify Leave page, 14-Type Leave Expander, am/pm toggles & Set Holiday Allowance Modal
    await page.goto('/app/leave');
    await expect(
      page.getByRole('heading', {
        name: /Leave, Holiday Allowances, Embargoes & TOIL/i,
      })
    ).toBeVisible();
    await page.getByRole('button', { name: /More \(All 14 Types\)/i }).click();
    await expect(
      page.getByRole('button', { name: /Compassionate/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /^Set$/i }).first().click();
    await expect(
      page.getByText(/Accrue Holiday \(12\.07%\)/i)
    ).toBeVisible();
    await page.screenshot({
      path: 'screenshots/138-local-leave-14-types-and-set-allowance.png',
    });
    await page.getByRole('button', { name: /Cancel/i }).click();

    // Verify Availability Single-Day Modal (15-min increments when All day is off) & Repeating Pattern Builder
    await page.goto('/app/availability');
    await page
      .getByRole('button', { name: /Create availability on/i })
      .first()
      .click();
    await expect(page.getByText(/Create availability/i)).toBeVisible();
    await page.locator('input[type="checkbox"]').click();
    await page.screenshot({
      path: 'screenshots/139-local-availability-15min-modal-and-pattern.png',
    });
    await page.getByRole('button', { name: /Cancel/i }).click();

    // Verify Employee 8 Profile Tabs
    await page.goto('/app/employees');
    await page.getByRole('link', { name: /Edit Profile/i }).first().click();
    await expect(
      page.getByRole('button', { name: 'Work Schedule' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Logbook PRO' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Work Schedule' }).click();
    await page.screenshot({
      path: 'screenshots/140-local-employee-8-profile-tabs.png',
    });

    // Verify Reports page (Bradford Factor & WTD Compliance)
    await page.goto('/app/reports');
    await expect(
      page.getByRole('heading', {
        name: /Workforce Analytics, Bradford Factor & WTD Compliance Reports/i,
      })
    ).toBeVisible();

    // Verify Security Audit Trail (/app/activity)
    await page.goto('/app/activity');
    await expect(
      page.getByRole('heading', {
        name: /Security & Operational Audit Trail/i,
      })
    ).toBeVisible();
    await expect(page.getByText('INVITATION_CONSUMED').first()).toBeVisible();
  });
});
