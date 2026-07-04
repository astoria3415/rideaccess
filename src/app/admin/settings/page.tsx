import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-slate-500">
        Manage your admin account security.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Change Password</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Choose a strong password of at least 8 characters. You stay signed
        in after changing it.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
