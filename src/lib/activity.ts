import { supabase } from "@/integrations/supabase/client";

export async function logActivity(action: string, entity: string, detail = "") {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  await supabase.from("activity_log").insert({
    user_id: user.id,
    actor_email: user.email ?? "",
    action,
    entity,
    detail,
  });
}
