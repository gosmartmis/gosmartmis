import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SCHOOL_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const DEMO_PASSWORD = "Demo@GoSmart2024";

const TEST_USERS = [
  {
    email: "superadmin@gosmartmis.rw",
    password: "Admin@1234",
    full_name: "Super Admin",
    role: "super-admin",
    school_id: null,
    phone: "+250788000001",
  },
  // Demo portal accounts — must match demo/page.tsx credentials exactly
  {
    email: "demo.director@gosmartmis.rw",
    password: DEMO_PASSWORD,
    full_name: "Dr. Marie Uwimana",
    role: "director",
    school_id: SCHOOL_ID,
    phone: "+250788000002",
  },
  {
    email: "demo.manager@gosmartmis.rw",
    password: DEMO_PASSWORD,
    full_name: "Mr. Eric Nkurunziza",
    role: "school_manager",
    school_id: SCHOOL_ID,
    phone: "+250788000008",
  },
  {
    email: "demo.dean@gosmartmis.rw",
    password: DEMO_PASSWORD,
    full_name: "Mr. Jean Habimana",
    role: "dean",
    school_id: SCHOOL_ID,
    phone: "+250788000003",
  },
  {
    email: "demo.registrar@gosmartmis.rw",
    password: DEMO_PASSWORD,
    full_name: "Ms. Alice Mukamana",
    role: "registrar",
    school_id: SCHOOL_ID,
    phone: "+250788000004",
  },
  {
    email: "demo.accountant@gosmartmis.rw",
    password: DEMO_PASSWORD,
    full_name: "Mr. Patrick Nzeyimana",
    role: "accountant",
    school_id: SCHOOL_ID,
    phone: "+250788000005",
  },
  {
    email: "demo.teacher@gosmartmis.rw",
    password: DEMO_PASSWORD,
    full_name: "Mrs. Grace Ingabire",
    role: "teacher",
    school_id: SCHOOL_ID,
    phone: "+250788000006",
  },
  {
    email: "demo.student@gosmartmis.rw",
    password: DEMO_PASSWORD,
    full_name: "Kevin Mugisha",
    role: "student",
    school_id: SCHOOL_ID,
    phone: "+250788000007",
  },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Ensure the demo school exists
  const { error: schoolError } = await adminClient.from("schools").upsert(
    {
      id: SCHOOL_ID,
      name: "Go Smart Demo Academy",
      slug: "demo",
      email: "demo@gosmartmis.rw",
      phone: "+250788000000",
      address: "Kigali, Rwanda",
      subscription_plan: "premium",
      subscription_status: "active",
      max_students: 2000,
      max_teachers: 100,
      is_active: true,
    },
    { onConflict: "id" }
  );

  if (schoolError) {
    console.error("School upsert error:", schoolError.message);
  }

  const results: { email: string; status: string; error?: string }[] = [];

  for (const user of TEST_USERS) {
    try {
      let userId: string;
      let isExisting = false;

      // Check if user already exists in auth
      const { data: listData } = await adminClient.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === user.email);

      if (existing) {
        userId = existing.id;
        isExisting = true;
        // Always refresh password so credentials stay correct
        await adminClient.auth.admin.updateUserById(userId, {
          password: user.password,
          email_confirm: true,
        });
      } else {
        const { data: authData, error: authError } =
          await adminClient.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: { full_name: user.full_name },
          });

        if (authError) throw new Error(authError.message);
        userId = authData.user.id;
      }

      // Upsert profile
      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            school_id: user.school_id,
            phone: user.phone,
            is_active: true,
          },
          { onConflict: "id" }
        );

      if (profileError) throw new Error(profileError.message);

      results.push({ email: user.email, status: isExisting ? "updated" : "created" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ email: user.email, status: "error", error: message });
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: "Seed complete", results }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
