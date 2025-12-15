import supabase from "../db.js";

/*
  Middleware to protect admin-only routes
  - Uses Supabase Auth token
  - Verifies user
  - Verifies role === "admin"
*/
export default async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate Supabase user from token
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Check admin role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ error: "Failed to verify admin role" });
    }

    if (profile.role !== "admin") {
      return res.status(403).json({ error: "Admin access only" });
    }

    // Attach admin user to request
    req.admin = userData.user;

    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    res.status(500).json({ error: "Admin auth middleware failed" });
  }
}
