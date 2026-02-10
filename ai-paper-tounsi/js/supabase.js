import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const supabaseUrl = "https://ilbfvzihnmamxusdqizd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYmZ2emlobm1hbXh1c2RxaXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODgwNzQsImV4cCI6MjA4MTY2NDA3NH0.1sdbzHEzSAqQCixbkAtd18feeZYiMmBHt_lr2skAxZw";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
