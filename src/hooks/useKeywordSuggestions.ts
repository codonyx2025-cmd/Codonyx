import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useKeywordSuggestions(fieldName: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fieldName) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("keyword_suggestions")
        .select("keyword")
        .eq("field_name", fieldName)
        .order("keyword");

      if (!error && data) {
        setSuggestions(data.map((d) => d.keyword));
      }
      setLoading(false);
    };

    fetchSuggestions();
  }, [fieldName]);

  return { suggestions, loading };
}
