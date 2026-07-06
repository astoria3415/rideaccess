import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { PushSetup } from "@/components/admin/PushSetup";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-slate-500">
        Manage notifications and your admin account security.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Notifications</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Install this dashboard as an app on your phone and get real-time
        alerts. Turn it on for both your and your partner&apos;s phones.
      </p>
      <PushSetup />

      <h2 className="mt-8 text-lg font-semibold">Change Password</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Choose a strong password of at least 8 characters. You stay signed
        in after changing it.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
