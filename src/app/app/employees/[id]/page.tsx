'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/components/AppShell';
import { ArrowLeft, Save, Check } from 'lucide-react';

const TABS = [
  'Employee Details',
  'Personal Information',
  'Locations',
  'Roles',
  'Wage & Salary',
  'Work Schedule',
  'Documents PRO',
  'Logbook PRO',
] as const;

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export default function EmployeeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { locations, roles } = useAppContext();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(
    'Employee Details'
  );
  const [emp, setEmp] = useState<any>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [middleNames, setMiddleNames] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [employmentType, setEmploymentType] = useState('Full Time');
  const [wtdOptOut, setWtdOptOut] = useState(false);
  const [rightToWorkConfirmed, setRightToWorkConfirmed] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [finalWorkingDate, setFinalWorkingDate] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [niNumber, setNiNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [payrollId, setPayrollId] = useState('');
  const [salaryType, setSalaryType] = useState('HOURLY');
  const [hourlyRate, setHourlyRate] = useState(12.5);
  const [annualSalary, setAnnualSalary] = useState(0);
  const [weeklyStandardHours, setWeeklyStandardHours] = useState(40);
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState(48);
  const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState(28);
  const [pinCode, setPinCode] = useState('');
  const [selectedLocIds, setSelectedLocIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [workSchedule, setWorkSchedule] = useState<
    Record<string, 'Working' | 'Day Off'>
  >({
    Monday: 'Working',
    Tuesday: 'Working',
    Wednesday: 'Working',
    Thursday: 'Working',
    Friday: 'Working',
    Saturday: 'Day Off',
    Sunday: 'Day Off',
  });
  const [logbookEntries, setLogbookEntries] = useState<
    Array<{ date: string; category: string; summary: string }>
  >([]);
  const [newLogCategory, setNewLogCategory] = useState('Performance Review');
  const [newLogSummary, setNewLogSummary] = useState('');

  const loadEmployee = useCallback(async () => {
    const res = await fetch('/api/v1/employees?includePast=true');
    if (res.ok) {
      const data = await res.json();
      const found = (data.employees || []).find((e: any) => e.id === id);
      if (found) {
        setEmp(found);
        setFirstName(found.firstName || '');
        setLastName(found.lastName || '');
        setEmail(found.email || '');
        setRole(found.role || 'EMPLOYEE');
        setPhone(found.phone || '');
        setNotes(found.notes || '');
        setPayrollId(found.payrollId || '');
        setSalaryType(found.salaryType || 'HOURLY');
        setHourlyRate(found.hourlyRate ?? 12.5);
        setAnnualSalary(found.annualSalary ?? 0);
        setWeeklyStandardHours(found.weeklyStandardHours ?? 40);
        setMaxHoursPerWeek(found.maxHoursPerWeek ?? 48);
        setAnnualLeaveAllowance(found.annualLeaveAllowance ?? 28);
        setPinCode(found.pinCode || '');
        setSelectedLocIds(
          (found.userLocations || []).map((ul: any) => ul.locationId)
        );
        setSelectedRoleIds((found.userRoles || []).map((ur: any) => ur.roleId));
      }
    }
  }, [id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/v1/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        role,
        phone,
        notes,
        payrollId,
        salaryType,
        hourlyRate: Number(hourlyRate),
        annualSalary: Number(annualSalary),
        weeklyStandardHours: Number(weeklyStandardHours),
        maxHoursPerWeek: Number(maxHoursPerWeek),
        annualLeaveAllowance: Number(annualLeaveAllowance),
        pinCode,
        locationIds: selectedLocIds,
        roleIds: selectedRoleIds,
      }),
    });
    if (res.ok) {
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
      await loadEmployee();
    }
  }

  if (!emp) {
    return (
      <div className="p-8 text-center text-sm text-[#555459]">
        Loading employee profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/employees"
            className="p-2 rounded-lg border border-[#e2e5ec] bg-white hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {emp.name} — Employee Profile
            </h1>
            <p className="text-xs text-[#555459]">{emp.email}</p>
          </div>
        </div>
        {savedBanner && (
          <span className="px-3.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Profile Saved
          </span>
        )}
      </div>

      {/* 6 Profile Tabs matching app.rotacloud.com */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <div className="border-b border-[#e2e5ec] px-6 flex flex-wrap gap-6 bg-[#f5f6f8]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`py-3.5 text-xs font-bold border-b-2 transition-colors ${
                activeTab === t
                  ? 'border-[#0a65fc] text-[#0a65fc]'
                  : 'border-transparent text-[#555459] hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {activeTab === 'Employee Details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Account Type
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                >
                  {[
                    'Full Time',
                    'Part Time',
                    'Fixed Term',
                    'Casual',
                    'Apprentice/Trainee',
                    'Agency',
                    'Contractor/Freelancer',
                    'Temporary',
                  ].map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Weekly Contracted Hours
                </label>
                <input
                  type="number"
                  value={weeklyStandardHours}
                  onChange={(e) =>
                    setWeeklyStandardHours(Number(e.target.value))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Maximum Weekly Hours
                </label>
                <input
                  type="number"
                  value={maxHoursPerWeek}
                  onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Holiday Allocation (Days)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={annualLeaveAllowance}
                  onChange={(e) =>
                    setAnnualLeaveAllowance(Number(e.target.value))
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Final Working Date
                </label>
                <input
                  type="date"
                  value={finalWorkingDate}
                  onChange={(e) => setFinalWorkingDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div className="md:col-span-3 flex flex-wrap gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wtdOptOut}
                    onChange={(e) => setWtdOptOut(e.target.checked)}
                    className="accent-[#0a65fc]"
                  />
                  Opted out of Working Time Directive (48h/week cap)
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rightToWorkConfirmed}
                    onChange={(e) => setRightToWorkConfirmed(e.target.checked)}
                    className="accent-[#0a65fc]"
                  />
                  &apos;Right to work&apos; status confirmed
                </label>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter a note..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'Personal Information' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Title
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  >
                    {['Mr', 'Miss', 'Ms', 'Mrs', 'Mx', 'Dr'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Middle Name(s)
                  </label>
                  <input
                    type="text"
                    value={middleNames}
                    onChange={(e) => setMiddleNames(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#e2e5ec]">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-[#e2e5ec]">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+44 7700 900000"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Locations' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-[#555459]">
                  Assigned Work Locations
                </div>
                <div className="text-xs font-bold space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedLocIds(locations.map((l) => l.id))
                    }
                    className="text-[#0a65fc] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLocIds([])}
                    className="text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              {locations.map((loc) => (
                <label
                  key={loc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e5ec] cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedLocIds.includes(loc.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLocIds([...selectedLocIds, loc.id]);
                      } else {
                        setSelectedLocIds(
                          selectedLocIds.filter((id) => id !== loc.id)
                        );
                      }
                    }}
                    className="accent-[#0a65fc]"
                  />
                  <span className="text-sm font-bold text-slate-900">
                    {loc.name}
                  </span>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'Roles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-[#555459]">
                  Qualified Job Roles
                </div>
                <div className="text-xs font-bold space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleIds(roles.map((r) => r.id))}
                    className="text-[#0a65fc] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleIds([])}
                    className="text-slate-500 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              {roles.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e5ec] cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoleIds([...selectedRoleIds, r.id]);
                      } else {
                        setSelectedRoleIds(
                          selectedRoleIds.filter((id) => id !== r.id)
                        );
                      }
                    }}
                    className="accent-[#0a65fc]"
                  />
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: r.colour }}
                  />
                  <span className="text-sm font-bold text-slate-900">
                    {r.name}
                  </span>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'Wage & Salary' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  NI Number
                </label>
                <input
                  type="text"
                  value={niNumber}
                  onChange={(e) => setNiNumber(e.target.value)}
                  placeholder="QQ 12 34 56 C"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Pay Structure
                </label>
                <select
                  value={salaryType}
                  onChange={(e) => setSalaryType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                >
                  <option value="HOURLY">per hour (Hourly Wage)</option>
                  <option value="ANNUAL_SALARY">per annum (Salary)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Default Wage (£ / hr)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Annual Salary (£)
                </label>
                <input
                  type="number"
                  step="100"
                  value={annualSalary}
                  onChange={(e) => setAnnualSalary(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Payroll ID
                </label>
                <input
                  type="text"
                  value={payrollId}
                  onChange={(e) => setPayrollId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  4-Digit Terminal PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] font-mono text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'Work Schedule' && (
            <div className="space-y-4">
              <p className="text-xs text-[#555459]">
                Standard working pattern used to calculate holiday deductions
                when booking leave across Monday–Sunday.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                {DAYS_OF_WEEK.map((dayName) => (
                  <div
                    key={dayName}
                    className="p-3 rounded-lg border border-[#e2e5ec] bg-[#f5f6f8] space-y-1.5"
                  >
                    <label className="block text-xs font-bold text-slate-800">
                      {dayName}
                    </label>
                    <select
                      value={workSchedule[dayName]}
                      onChange={(e) =>
                        setWorkSchedule((prev) => ({
                          ...prev,
                          [dayName]: e.target.value as 'Working' | 'Day Off',
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-md border border-[#e2e5ec] bg-white text-xs font-semibold"
                    >
                      <option value="Working">Working</option>
                      <option value="Day Off">Day Off</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Documents PRO' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Employee HR Documents
                  </h3>
                  <p className="text-xs text-[#555459]">
                    Contracts, Right-to-Work checks, and signed policies shared
                    with {emp.name}.
                  </p>
                </div>
                <Link
                  href="/app/documents"
                  className="px-3.5 py-2 rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
                >
                  Open Document Vault
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'Logbook PRO' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Confidential Manager Logbook
                </h3>
                <p className="text-xs text-[#555459]">
                  Record 1-to-1 notes, disciplinary records, or certifications
                  for {emp.name}.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Category
                  </label>
                  <select
                    value={newLogCategory}
                    onChange={(e) => setNewLogCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-xs"
                  >
                    <option value="Performance Review">
                      Performance Review
                    </option>
                    <option value="Return to Work Interview">
                      Return to Work Interview
                    </option>
                    <option value="Certification">Certification</option>
                    <option value="Disciplinary Note">Disciplinary Note</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Entry Summary
                  </label>
                  <input
                    type="text"
                    value={newLogSummary}
                    onChange={(e) => setNewLogSummary(e.target.value)}
                    placeholder="Enter confidential HR logbook note..."
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newLogSummary.trim()) return;
                    setLogbookEntries((prev) => [
                      {
                        date: new Date().toISOString().slice(0, 10),
                        category: newLogCategory,
                        summary: newLogSummary.trim(),
                      },
                      ...prev,
                    ]);
                    setNewLogSummary('');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
                >
                  + Add Logbook Entry
                </button>
              </div>
              {logbookEntries.length > 0 && (
                <div className="divide-y divide-[#e2e5ec] border border-[#e2e5ec] rounded-lg">
                  {logbookEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#0a65fc] mr-2">
                          [{entry.category}]
                        </span>
                        <span className="text-slate-800 font-semibold">
                          {entry.summary}
                        </span>
                      </div>
                      <span className="text-slate-400">{entry.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-[#e2e5ec] flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Employee Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
