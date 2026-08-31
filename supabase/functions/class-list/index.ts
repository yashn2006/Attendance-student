// supabase/functions/class-list/index.ts
// GET — classes owned by the authenticated teacher, with student counts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const supabaseAdmin = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ status: "error", message: "Missing auth" }, 401);
    }

    const callerClient = createClient(SUPABASE_URL ?? "", ANON_KEY ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !authUser) {
      return jsonResponse({ status: "error", message: "Invalid session" }, 401);
    }

    const { data: teacherRow, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id")
      .eq("supabase_user", authUser.id)
      .single();

    if (teacherError || !teacherRow) {
      return jsonResponse({ status: "error", message: "Not a recognized teacher" }, 403);
    }

    const { data: classes, error: classError } = await supabaseAdmin
      .from("classes")
      .select("id, name")
      .eq("teacher_id", teacherRow.id);

    if (classError) {
      return jsonResponse({ status: "error", message: classError.message }, 500);
    }
    if (!classes || classes.length === 0) {
  return jsonResponse({ status: "ok", teacherId: teacherRow.id, classes: [] }, 200);
}

    const classIds = classes.map((c) => c.id);
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .select("class_id")
      .in("class_id", classIds);

    if (enrollError) {
      return jsonResponse({ status: "error", message: enrollError.message }, 500);
    }

    const countByClass: Record<string, number> = {};
    for (const e of enrollments ?? []) {
      countByClass[e.class_id] = (countByClass[e.class_id] ?? 0) + 1;
    }

    const result = classes.map((c) => ({
      id: c.id,
      name: c.name,
      studentCount: countByClass[c.id] ?? 0,
    }));

    return jsonResponse({ status: "ok", teacherId: teacherRow.id, classes: result }, 200);
  } catch (err) {
    console.error("UNHANDLED ERROR:", err instanceof Error ? err.stack : err);
    return jsonResponse(
      { status: "error", message: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});