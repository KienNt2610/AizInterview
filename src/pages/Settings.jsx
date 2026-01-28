import { useState } from "react";
import { userAPI } from "../services/api";
import { useToast } from "../components/ui/Toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { User, Lock, Save, Key } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();

  // ===== PROFILE =====
  const [profile, setProfile] = useState(() => {
    const u = localStorage.getItem("user");
    try {
      return u ? JSON.parse(u) : { fullName: "", email: "" };
    } catch {
      return { fullName: "", email: "" };
    }
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // ===== CHANGE PASSWORD =====
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  const validatePwd = () => {
    const e = {};
    if (!pwd.currentPassword) e.currentPassword = "Current password is required";
    if (!pwd.newPassword) e.newPassword = "New password is required";
    else if (pwd.newPassword.length < 6) e.newPassword = "Min 6 characters";
    if (!pwd.confirmPassword) e.confirmPassword = "Confirm password is required";
    else if (pwd.newPassword !== pwd.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async (ev) => {
    ev.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast("Bạn cần login trước khi đổi mật khẩu.", { type: "warning" });
      return;
    }

    if (!validatePwd()) {
      toast("Vui lòng kiểm tra lại thông tin.", { type: "error" });
      return;
    }

    setPwdLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
        confirmPassword: pwd.confirmPassword,
      });

      toast("Đổi mật khẩu thành công!", { type: "success" });
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwdErrors({});
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Fail to change password";
      toast(msg, { type: "error" });
      console.error("Change password error:", error.response?.data || error);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      // TODO: Call API to update profile
      // await userAPI.updateProfile(profile);
      toast("Profile updated successfully!", { type: "success" });
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(profile));
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Failed to update profile";
      toast(msg, { type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-white/70">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* ===== Profile card ===== */}
        <Card className="bg-[#1F2833]/50 border border-[#66FCF1]/20 backdrop-blur-sm">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#66FCF1]/20 to-[#45A29E]/20 rounded-lg flex items-center justify-center border border-[#66FCF1]/30">
                <User className="w-5 h-5 text-[#66FCF1]" />
              </div>
              <CardTitle className="text-white">Profile Information</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Full Name
                </label>
                <Input
                  placeholder="Your full name"
                  value={profile.fullName || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, fullName: e.target.value })
                  }
                  className="bg-[#0B0C10] border-white/10 text-white placeholder:text-white/40 focus:border-[#66FCF1] focus:ring-[#66FCF1]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={profile.email || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="bg-[#0B0C10] border-white/10 text-white placeholder:text-white/40 focus:border-[#66FCF1] focus:ring-[#66FCF1]/20"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSaveProfile}
                  disabled={profileLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {profileLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== Change Password card ===== */}
        <Card className="bg-[#1F2833]/50 border border-[#66FCF1]/20 backdrop-blur-sm">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#66FCF1]/20 to-[#45A29E]/20 rounded-lg flex items-center justify-center border border-[#66FCF1]/30">
                <Lock className="w-5 h-5 text-[#66FCF1]" />
              </div>
              <CardTitle className="text-white">Change Password</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleChangePassword}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="password"
                      value={pwd.currentPassword}
                      onChange={(e) => {
                        setPwd({ ...pwd, currentPassword: e.target.value });
                        if (pwdErrors.currentPassword) {
                          setPwdErrors({ ...pwdErrors, currentPassword: "" });
                        }
                      }}
                      className={`bg-[#0B0C10] border-white/10 text-white placeholder:text-white/40 focus:border-[#66FCF1] focus:ring-[#66FCF1]/20 pl-10 ${
                        pwdErrors.currentPassword
                          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      placeholder="Enter current password"
                    />
                  </div>
                  {pwdErrors.currentPassword && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                      {pwdErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="password"
                      value={pwd.newPassword}
                      onChange={(e) => {
                        setPwd({ ...pwd, newPassword: e.target.value });
                        if (pwdErrors.newPassword) {
                          setPwdErrors({ ...pwdErrors, newPassword: "" });
                        }
                      }}
                      className={`bg-[#0B0C10] border-white/10 text-white placeholder:text-white/40 focus:border-[#66FCF1] focus:ring-[#66FCF1]/20 pl-10 ${
                        pwdErrors.newPassword
                          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  {pwdErrors.newPassword && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                      {pwdErrors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="password"
                      value={pwd.confirmPassword}
                      onChange={(e) => {
                        setPwd({ ...pwd, confirmPassword: e.target.value });
                        if (pwdErrors.confirmPassword) {
                          setPwdErrors({
                            ...pwdErrors,
                            confirmPassword: "",
                          });
                        }
                      }}
                      className={`bg-[#0B0C10] border-white/10 text-white placeholder:text-white/40 focus:border-[#66FCF1] focus:ring-[#66FCF1]/20 pl-10 ${
                        pwdErrors.confirmPassword
                          ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {pwdErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                      {pwdErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={pwdLoading}
                    className="flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {pwdLoading ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
