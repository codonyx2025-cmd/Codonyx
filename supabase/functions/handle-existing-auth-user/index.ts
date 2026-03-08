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
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists in auth (paginate to avoid missing users beyond first page)
    const normalizedEmail = email.toLowerCase();
    let existingUser: { id: string; email?: string } | undefined;
    let page = 1;
    const perPage = 200;

    while (!existingUser) {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        return new Response(
          JSON.stringify({ error: "Failed to check existing users." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      existingUser = usersData.users.find(
        (u) => u.email?.toLowerCase() === normalizedEmail
      );

      if (existingUser || usersData.users.length < perPage) break;
      page += 1;
    }

    if (!existingUser) {
      return new Response(
        JSON.stringify({ error: "No existing account found with this email." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a profile
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", existingUser.id)
      .maybeSingle();

    if (profileData) {
      return new Response(
        JSON.stringify({ error: "An account with this email is already fully registered." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User exists in auth but has no profile - update their password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      { password }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update account credentials." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ user_id: existingUser.id, message: "Account updated successfully." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
