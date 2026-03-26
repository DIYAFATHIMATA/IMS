import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Shield, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authStorage } from '../services/authStorage';
import { usersApi } from '../services/api';
import NotificationAlert from '../components/ui/NotificationAlert';
import { FormField, FormInput } from '../components/ui/FormField';
import { SUPPLIER_ROLE } from '../utils/roles';

export default function Profile() {
    const { user, updateCurrentUser } = useAuth();
    const token = authStorage.getToken();

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [notice, setNotice] = useState(null);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: '',
        createdAt: ''
    });
    const [profileError, setProfileError] = useState('');

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const res = await usersApi.getProfile(token);
                const data = res.data || {};
                setProfile({
                    name: data.name || '',
                    email: data.email || '',
                    role: data.role || '',
                    createdAt: data.createdAt || ''
                });
            } catch (error) {
                setNotice({ type: 'error', message: error.message || 'Failed to load profile' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]);

    if (user?.role === SUPPLIER_ROLE) {
        return <Navigate to="/supplier/profile" replace />;
    }

    const validatePassword = () => {
        const errors = {};
        if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
        if (!passwordForm.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordForm.newPassword.length < 8 || !/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
            errors.newPassword = 'Password must be at least 8 characters and include letters and numbers';
        }
        if (!passwordForm.confirmPassword) {
            errors.confirmPassword = 'Confirm password is required';
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!profile.name.trim()) {
            setProfileError('Full name is required');
            return;
        }

        setProfileError('');
        setSavingProfile(true);
        try {
            const payload = { name: profile.name.trim() };
            const res = await usersApi.updateProfile(payload, token);
            const updated = res.data || payload;
            setProfile((prev) => ({ ...prev, ...updated }));
            updateCurrentUser?.(updated);
            setNotice({ type: 'success', message: 'Profile updated successfully.' });
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
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Profile</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your account settings</p>
            </div>

            <section className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-2xl p-5">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                    <UserCircle className="w-5 h-5 text-airbnb-600" /> Profile Information
                </h2>

                {loading ? (
                    <p className="text-sm text-zinc-500">Loading profile...</p>
                ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Full Name" required error={profileError}>
                                <FormInput
                                    value={profile.name}
                                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                                />
                            </FormField>

                            <FormField label="Email" hint="Email is read-only.">
                                <FormInput value={profile.email} readOnly className="bg-zinc-100 text-zinc-500" />
                            </FormField>

                            <FormField label="Role & Permissions">
                                <div className="air-input bg-zinc-100 text-zinc-600 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <span className="capitalize">{profile.role || '-'}</span>
                                </div>
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
                    <Mail className="w-5 h-5 text-airbnb-600" /> Security Settings
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
