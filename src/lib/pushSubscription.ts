import { supabase } from './supabase';

export async function upsertPushSubscription(
  subscription: PushSubscription
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { subscription: subscription.toJSON() },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Failed to save push subscription:', error.message);
  }
}

export async function deletePushSubscription(): Promise<void> {
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete push subscription:', error.message);
  }
}
