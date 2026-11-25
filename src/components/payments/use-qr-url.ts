import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Short-lived link to a private eSewa QR picture. */
export function useQrUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["payment-qr", path],
    enabled: !!path,
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("payment-qr").createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
