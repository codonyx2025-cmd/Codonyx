import { supabase } from "@/integrations/supabase/client";

const roleLabel = (t: string) => {
  if (t === "advisor") return "Advisor";
  if (t === "laboratory") return "Laboratory";
  if (t === "distributor") return "Distribution Partner";
  return "Member";
};

/**
 * Insert an in-app notification for every admin profile letting them know
 * a new user has just registered and is awaiting review.
 * Must be called while the new user is still authenticated (before signOut),
 * because the notifications insert policy requires an authenticated session.
 */
export async function notifyAdminsOfNewRegistration(opts: {
  fullName: string;
  userType: "advisor" | "laboratory" | "distributor" | string;
  newProfileId?: string | null;
}) {
  try {
    const { data: admins, error } = await supabase.rpc("get_admin_profile_ids");
    if (error || !admins || admins.length === 0) return;

    const role = roleLabel(opts.userType);
    const rows = (admins as Array<{ profile_id: string }>).map((a) => ({
      profile_id: a.profile_id,
      type: "new_registration",
      title: `New ${role} registration`,
      message: `${opts.fullName} has registered as a ${role} and is awaiting review.`,
      link: "/admin",
      related_profile_id: opts.newProfileId ?? null,
      is_read: false,
    }));

    await supabase.from("notifications").insert(rows);
  } catch (e) {
    console.error("Failed to notify admins of new registration:", e);
  }
}
