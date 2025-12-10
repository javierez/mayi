import { AccountAdminBreadcrumb } from "~/components/admin/account/breadcrumb";
import { MailConfiguration } from "~/components/admin/account/mail-configuration";

export default function AccountAdminCorreoPage() {
  return (
    <div className="space-y-6">
      <AccountAdminBreadcrumb />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Sistema de notificaciones
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura el servicio de correo electrónico y las notificaciones
          automáticas
        </p>
      </div>

      <MailConfiguration />
    </div>
  );
}
