import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL")!;

webpush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const messages: Record<string, { title: string; body: string }> = {
  morning: { title: "Fitness RPG", body: "Time to log your sleep" },
  evening: { title: "Fitness RPG", body: "Don't forget to log your meals" },
};

Deno.serve(async (req) => {
  const { type } = await req.json();

  const message = messages[type];
  if (!message) {
    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, subscription");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  const expiredIds: string[] = [];
  let sent = 0;

  await Promise.allSettled(
    (subscriptions ?? []).map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(message));
        sent++;
      } catch (err: unknown) {
        const pushErr = err as { statusCode?: number };
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          expiredIds.push(row.id);
        } else {
          console.error("Push failed for", row.id, err);
        }
      }
    })
  );

  if (expiredIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);
  }

  return new Response(
    JSON.stringify({ sent, cleaned: expiredIds.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
