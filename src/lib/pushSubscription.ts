import { supabase } from './supabase';

export async function upsertPushSubscription(
  subscription: PushSubscription
): Promise<void> {
  if (!supabase) return;

  const json = subscription.toJSON();
  const endpoint = json.endpoint;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { endpoint, subscription: json },
      { onConflict: 'user_id,endpoint' }
    );

  if (error) {
    console.error('Failed to save push subscription:', error.message);
  }
}

export async function deletePushSubscription(): Promise<void> {
  if (!supabase) return;

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', sub.endpoint);

  if (error) {
    console.error('Failed to delete push subscription:', error.message);
  }
}
