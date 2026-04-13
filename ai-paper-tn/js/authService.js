import { supabase } from "./supabase.js";

let currentUser = null;
let promise = null;

export async function getUser() {
  if (currentUser) return currentUser;

  if (promise) return promise;

  promise = supabase.auth.getUser().then(({ data }) => {
    currentUser = data?.user || null;
    promise = null;
    return currentUser;
  });

  return promise;
}