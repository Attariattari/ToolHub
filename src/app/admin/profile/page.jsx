"use client";
import { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaBuilding,
  FaMapMarkerAlt,
  FaEdit,
  FaTimes,
  FaGoogle,
  FaFacebook,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
} from "react-icons/fa";
import { Check, X, Mail, LinkIcon } from "lucide-react";
import { UserContext } from "@/context/User.context";

// Custom Input Component
const ProfileInput = ({
  icon,
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`pl-10 outline-none w-full py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${disabled ? "bg-gray-50 text-gray-500" : "bg-white"
            }`}
          placeholder={`Enter your ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
};

// Email Update Modal Component
const EmailUpdateModal = ({ isOpen, onClose, currentEmail, onUpdate }) => {
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!newEmail) {
      newErrors.newEmail = "New email is required";
    } else if (!/\S+@\S+\.\S+/.test(newEmail)) {
      newErrors.newEmail = "Please enter a valid email";
    }

    if (!confirmEmail) {
      newErrors.confirmEmail = "Please confirm your email";
    } else if (newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Emails do not match";
    }

    if (newEmail === currentEmail) {
      newErrors.newEmail = "New email must be different from current email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      const result = await onUpdate(newEmail);
      setLoading(false);

      if (result.success) {
        setNewEmail("");
        setConfirmEmail("");
        setErrors({});
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Update Email Address
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Email
            </label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Email Address
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={`w-full py-3 px-4 border rounded-lg bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.newEmail ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Enter new email address"
            />
            {errors.newEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.newEmail}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Email
            </label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className={`w-full py-3 px-4 border rounded-lg bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.confirmEmail ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Re-enter new email address"
            />
            {errors.confirmEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmEmail}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Email"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Password Update Component
const PasswordUpdateBox = () => {
  const { changePassword } = useContext(UserContext);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (validatePassword()) {
      setLoading(true);
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setLoading(false);

      if (result.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setErrors({});
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-100 p-2 rounded-lg">
          <FaLock className="text-red-600" size={20} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Security Settings
        </h2>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handlePasswordSubmit}>
        <h3 className="text-md font-medium text-gray-900 mb-4">
          Change Password
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                className={`w-full py-3 px-4 pr-12 border rounded-lg bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.currentPassword ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <FaEyeSlash size={16} />
                ) : (
                  <FaEye size={16} />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                className={`w-full py-3 px-4 pr-12 border rounded-lg bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.newPassword ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <FaEyeSlash size={16} />
                ) : (
                  <FaEye size={16} />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className={`w-full py-3 px-4 pr-12 border rounded-lg bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <FaEyeSlash size={16} />
                ) : (
                  <FaEye size={16} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default function MyAccountPage() {
  const {
    user,
    updateProfile,
    updateEmail,
    setupTwoFactorAuth,
    loading: userLoading,
  } = useContext(UserContext);

  // All states properly defined in main component
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone: "",
    website: "",
    company: "",
    address: "",
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Update profile state when user data changes
  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        website: user.website || "",
        company: user.company || "",
        address: user.address || "",
      });
      // Check 2FA status from user data
      setTwoFactorEnabled(
        user.securitySettings?.twoFactorAuth?.isEnabled || false
      );
    }
  }, [user]);

  const updateProfileField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmailUpdate = async (newEmail) => {
    const result = await updateEmail(newEmail);
    if (result.success) {
      setProfile((prev) => ({ ...prev, email: newEmail }));
    }
    return result;
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const profileData = {
      username: profile.username,
      phone: profile.phone,
      address: profile.address,
      company: profile.company,
      website: profile.website,
    };

    const result = await updateProfile(profileData);
    setLoading(false);
  };

  const handleTwoFactorToggle = async () => {
    setTwoFactorLoading(true);
    const result = await setupTwoFactorAuth(!twoFactorEnabled);
    setTwoFactorLoading(false);

    if (result.success) {
      setTwoFactorEnabled(!twoFactorEnabled);
    }
  };

  // Show loading state while user data is being fetched
  if (userLoading || !user) {
    return (
      <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-84px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-130px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={16} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
        <div className="flex-1 h-[100%] grid grid-cols-1 lg:grid-cols-7 gap-4">
          {/* Left Container - Main Content */}
          <motion.div
            className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaUser className="text-blue-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <ProfileInput
                icon={<FaUser className="text-gray-400" size={18} />}
                label="Username"
                value={profile.username}
                onChange={(value) => updateProfileField("username", value)}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" size={18} />
                  </div>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="pl-10 pr-20 w-full py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <button
                    onClick={() => setIsEmailModalOpen(true)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    <FaEdit size={14} className="mr-1" />
                    Edit
                  </button>
                </div>
              </div>

              <ProfileInput
                icon={<FaPhone className="text-gray-400" size={18} />}
                label="Phone Number"
                value={profile.phone}
                onChange={(value) => updateProfileField("phone", value)}
              />

              <ProfileInput
                icon={<FaGlobe className="text-gray-400" size={18} />}
                label="Website"
                value={profile.website}
                onChange={(value) => updateProfileField("website", value)}
              />

              <ProfileInput
                icon={<FaBuilding className="text-gray-400" size={18} />}
                label="Company"
                value={profile.company}
                onChange={(value) => updateProfileField("company", value)}
              />

              <ProfileInput
                icon={<FaMapMarkerAlt className="text-gray-400" size={18} />}
                label="Address"
                value={profile.address}
                onChange={(value) => updateProfileField("address", value)}
              />
            </div>

            {/* Two Factor Authentication Section */}
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FaShieldAlt className="text-green-600" size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleTwoFactorToggle}
                    disabled={twoFactorLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${twoFactorEnabled ? "bg-blue-600" : "bg-gray-200"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
              </div>
              {/* <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  {twoFactorEnabled
                    ? "2FA Status: Enabled"
                    : "2FA Status: Disabled"}
                </div>
                <div className="text-xs text-blue-700">
                  {twoFactorEnabled
                    ? "Your account is protected with email-based two-factor authentication."
                    : "Enable two-factor authentication to add an extra layer of security to your account."}
                </div>
              </div> */}
            </div>
          </motion.div>

          {/* Right Container - Password Update */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <PasswordUpdateBox />
          </motion.div>
        </div>
      </motion.div>

      {/* Email Update Modal */}
      <EmailUpdateModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={profile.email}
        onUpdate={handleEmailUpdate}
      />
    </div>
  );
}