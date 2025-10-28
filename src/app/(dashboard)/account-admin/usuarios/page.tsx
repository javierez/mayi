import { getUsersForRoleManagement } from "~/server/queries/users";
import UsuariosClient from "./usuarios-client";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const users = await getUsersForRoleManagement();

  return <UsuariosClient initialUsers={users} />;
}
