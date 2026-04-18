import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BannerImage {
  id: string;
  image_url: string;
  alt_text: string | null;
}

const BANNER_CACHE_KEY = "codonyx-home-banner-cache-v1";
const AUTH_EVENTS_TO_REFRESH = new Set(["INITIAL_SESSION", "SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED"]);

function readCachedBanners(): BannerImage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BANNER_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (banner): banner is BannerImage =>
        typeof banner?.id === "string" &&
        typeof banner?.image_url === "string" &&
        (typeof banner?.alt_text === "string" || banner?.alt_text === null)
    );
  } catch {
    return [];
  }
}

function cacheBanners(banners: BannerImage[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BANNER_CACHE_KEY, JSON.stringify(banners));
  } catch {
    // Ignore storage failures and keep runtime state only.
  }
}

export function useBannerImages() {
  const [banners, setBanners] = useState<BannerImage[]>(() => readCachedBanners());
  const [loading, setLoading] = useState(() => readCachedBanners().length === 0);

  const fetchBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("banner_images")
        .select("id, image_url, alt_text")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      const nextBanners = (data || []).filter((banner) => banner.image_url?.trim());
      setBanners(nextBanners);
      cacheBanners(nextBanners);
    } catch {
      setBanners((current) => (current.length > 0 ? current : readCachedBanners()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBanners();

    const channel = supabase
      .channel("banner_images_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banner_images" },
        () => void fetchBanners()
      )
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (AUTH_EVENTS_TO_REFRESH.has(event)) {
        void fetchBanners();
      }
    });

    const onFocus = () => void fetchBanners();
    const onStorage = (event: StorageEvent) => {
      if (event.key === BANNER_CACHE_KEY) {
        setBanners(readCachedBanners());
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchBanners();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchBanners]);

  return { banners, loading, refetch: fetchBanners };
}
