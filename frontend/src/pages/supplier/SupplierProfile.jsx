import { useEffect, useState } from 'react';
import { Building2, ShieldCheck, UserCircle } from 'lucide-react';
import { authStorage } from '../../services/authStorage';
import { usersApi } from '../../services/api';
import NotificationAlert from '../../components/ui/NotificationAlert';
import { FormField, FormInput, FormTextarea } from '../../components/ui/FormField';

const PHONE_REGEX = /^[0-9+()\-\s]{7,15}$/;

const initialProfile = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  businessAddress: '',
  supplierCategory: 'General Goods',
  gstNumber: '',
  createdAt: ''
};

const SUPPLIER_CATEGORIES = ['Electronics', 'Office Supplies', 'Furniture', 'Stationery', 'General Goods'];

export default function SupplierProfile() {
  const token = authStorage.getToken();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notice, setNotice] = useState(null);

  const [profile, setProfile] = useState(initialProfile);
  const [profileErrors, setProfileErrors] = useState({});

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await usersApi.getProfile(token);
      const data = res.data || {};
      setProfile({
        name: data.name || '',
        companyName: data.companyName || '',
        email: data.email || '',
        phone: data.phone || '',
        businessAddress: data.businessAddress || '',
        supplierCategory: data.supplierCategory || 'General Goods',
        gstNumber: data.gstNumber || '',
        createdAt: data.createdAt || ''
      });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateProfile = () => {
    const errors = {};
    if (!profile.name.trim()) errors.name = 'Supplier name is required';
    if (!profile.companyName.trim()) errors.companyName = 'Company name is required';
    if (!profile.businessAddress.trim()) errors.businessAddress = 'Business address is required';
    if (!profile.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!PHONE_REGEX.test(profile.phone.trim())) {
      errors.phone = 'Invalid phone number format';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      if (passwordForm.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      } else if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
        errors.newPassword = 'Password must include letters and numbers';
      }
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setSavingProfile(true);
    try {
      const payload = {
        name: profile.name.trim(),
        companyName: profile.companyName.trim(),
        phone: profile.phone.trim(),
        businessAddress: profile.businessAddress.trim(),
        supplierCategory: profile.supplierCategory,
        gstNumber: profile.gstNumber.trim()
      };
      const res = await usersApi.updateProfile(payload, token);
      const data = res.data || payload;
      setProfile((prev) => ({ ...prev, ...data }));
      setNotice({ type: 'success', message: 'Profile information updated successfully.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setSavingPassword(true);
    try {
      await usersApi.changePassword(passwordForm, token);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setNotice({ type: 'success', message: 'Password changed successfully.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Failed to change password' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {notice ? (
        <NotificationAlert
          type={notice.type}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Supplier Profile Management</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage personal, company, and security details.</p>
      </div>

      <section className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
          <UserCircle className="w-5 h-5 text-airbnb-600" /> Profile Information
        </h2>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading profile...</p>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Supplier Name" required error={profileErrors.name}>
                <FormInput
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                />
              </FormField>

              <FormField label="Email" hint="Email is read-only.">
                <FormInput value={profile.email} readOnly className="bg-zinc-100 text-zinc-500" />
              </FormField>

              <FormField label="Phone Number" required error={profileErrors.phone}>
                <FormInput
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 9876543210"
                />
              </FormField>

              <FormField label="Registration Date">
                <FormInput
                  value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  }) : '-'}
                  readOnly
                  className="bg-zinc-100 text-zinc-500"
                />
              </FormField>
            </div>

            <button type="submit" disabled={savingProfile} className="air-btn-primary">
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
      </section>

      <section className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-airbnb-600" /> Company Details
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <FormField label="Company Name" required error={profileErrors.companyName}>
            <FormInput
              value={profile.companyName}
              onChange={(e) => setProfile((prev) => ({ ...prev, companyName: e.target.value }))}
            />
          </FormField>

          <FormField label="Business Address" required error={profileErrors.businessAddress}>
            <FormTextarea
              rows={3}
              value={profile.businessAddress}
              onChange={(e) => setProfile((prev) => ({ ...prev, businessAddress: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Supplier Category">
              <select
                className="air-input"
                value={profile.supplierCategory}
                onChange={(e) => setProfile((prev) => ({ ...prev, supplierCategory: e.target.value }))}
              >
                {SUPPLIER_CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </FormField>

            <FormField label="GST Number (Optional)">
              <FormInput
                value={profile.gstNumber}
                onChange={(e) => setProfile((prev) => ({ ...prev, gstNumber: e.target.value }))}
              />
            </FormField>
          </div>

          <button type="submit" disabled={savingProfile} className="air-btn-primary">
            {savingProfile ? 'Saving...' : 'Save Company Details'}
          </button>
        </form>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-airbnb-600" /> Security Settings
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <FormField label="Current Password" required error={passwordErrors.currentPassword}>
            <FormInput
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
          </FormField>

          <FormField
            label="New Password"
            required
            error={passwordErrors.newPassword}
            hint="Minimum 8 characters with letters and numbers"
          >
            <FormInput
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
          </FormField>

          <FormField label="Confirm Password" required error={passwordErrors.confirmPassword}>
            <FormInput
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </FormField>

          <button type="submit" disabled={savingPassword} className="air-btn-primary">
            {savingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
