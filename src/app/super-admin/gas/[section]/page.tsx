import { redirect } from "next/navigation";
import { buildSuperAdminHref, isSuperAdminTab } from "@/lib/superAdminNavigation";

type SuperAdminRoutePageProps = {
  params: Promise<{
    section: string;
  }>;
};

export default async function SuperAdminRoutePage({ params }: SuperAdminRoutePageProps) {
  const { section } = await params;

  if (isSuperAdminTab(section) && section !== "overview") {
    redirect(buildSuperAdminHref(section));
  }

  redirect("/super-admin/dashboard");
}
