import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user_id from profile
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id, email, full_name")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete related data first
    await adminClient.from("custom_profile_values").delete().eq("profile_id", profileId);
    await adminClient.from("publications").delete().eq("profile_id", profileId);
    await adminClient.from("connections").delete().or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`);
    await adminClient.from("deal_bids").delete().eq("distributor_profile_id", profileId);
    await adminClient.from("opportunity_submissions").delete().eq("submitted_by", profileId);

    // Delete profile
    await adminClient.from("profiles").delete().eq("id", profileId);

    // Delete user roles
    await adminClient.from("user_roles").delete().eq("user_id", profile.user_id);

    // Delete auth user
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(profile.user_id);
    if (authDeleteError) {
      console.error("Auth delete error:", authDeleteError);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Account ${profile.full_name} permanently deleted` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
