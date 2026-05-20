export async function withSerializableRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let attempt = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error: unknown) {
      attempt++;
      
      // PostgreSQL serialization_failure code is '40001'
      // Supabase/PostgREST usually surfaces this in error.code
      const err = error as { code?: string; message?: string };
      const isSerializationFailure = 
        err?.code === '40001' || 
        err?.message?.includes('serialization failure') ||
        err?.message?.includes('could not serialize access');
        
      if (!isSerializationFailure || attempt > maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms...
      const backoffMs = Math.pow(2, attempt - 1) * 100;
      
      // Add jitter to prevent thundering herd
      const jitterMs = Math.random() * 50;
      
      console.warn(`[SerializableRetry] Transaction failed. Retrying in ${backoffMs}ms (Attempt ${attempt}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, backoffMs + jitterMs));
    }
  }
}
