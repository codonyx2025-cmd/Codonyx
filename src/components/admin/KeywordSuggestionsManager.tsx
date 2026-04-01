import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Search } from "lucide-react";

interface KeywordSuggestion {
  id: string;
  field_name: string;
  keyword: string;
  created_at: string;
}

const FIELD_OPTIONS = [
  { value: "expertise", label: "Areas of Expertise", role: "Advisor" },
  { value: "experience", label: "Experience / Background", role: "Advisor" },
  { value: "mentoring_areas", label: "Functional Areas for Mentoring", role: "Advisor" },
  { value: "languages", label: "Languages", role: "Advisor" },
  { value: "industry_expertise", label: "Industry Expertise", role: "Advisor" },
  { value: "education", label: "Education Institute", role: "Advisor" },
  { value: "research_areas", label: "Research Areas", role: "Laboratory" },
  { value: "services", label: "Services Offered", role: "Laboratory" },
  { value: "distribution_capacity", label: "Distribution Capacity", role: "Distributor" },
  { value: "bio_distributor", label: "About Your Business", role: "Distributor" },
];

export function KeywordSuggestionsManager() {
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>("expertise");
  const [newKeyword, setNewKeyword] = useState("");
  const [bulkKeywords, setBulkKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    fetchSuggestions();
  }, [selectedField]);

  const fetchSuggestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("keyword_suggestions")
      .select("*")
      .eq("field_name", selectedField)
      .order("keyword");

    if (!error && data) {
      setSuggestions(data);
    }
    setLoading(false);
  };

  const addKeyword = async () => {
    // Split by comma or pipe to support multiple keywords at once
    const keywords = newKeyword.split(/[,|]/).map(k => k.trim()).filter(Boolean);
    if (keywords.length === 0) return;

    setSaving(true);

    if (keywords.length === 1) {
      const { error } = await supabase
        .from("keyword_suggestions" as any)
        .insert({ field_name: selectedField, keyword: keywords[0] } as any);

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Duplicate", description: "This keyword already exists for this field.", variant: "destructive" });
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
      } else {
        setNewKeyword("");
        fetchSuggestions();
        toast({ title: "Added", description: `"${keywords[0]}" added successfully.` });
      }
    } else {
      const inserts = keywords.map(keyword => ({ field_name: selectedField, keyword }));
      const { error } = await supabase
        .from("keyword_suggestions" as any)
        .insert(inserts as any);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setNewKeyword("");
        fetchSuggestions();
        toast({ title: "Added", description: `${keywords.length} keywords added successfully.` });
      }
    }
    setSaving(false);
  };

  const addBulkKeywords = async () => {
    const keywords = bulkKeywords.split("\n").map(k => k.trim()).filter(Boolean);
    if (keywords.length === 0) return;

    setSaving(true);
    const inserts = keywords.map(keyword => ({ field_name: selectedField, keyword }));

    const { error } = await supabase
      .from("keyword_suggestions" as any)
      .insert(inserts as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setBulkKeywords("");
      fetchSuggestions();
      toast({ title: "Added", description: `${keywords.length} keywords added.` });
    }
    setSaving(false);
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase
      .from("keyword_suggestions" as any)
      .delete()
      .eq("id", id);

    if (!error) {
      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast({ title: "Deleted", description: "Keyword removed." });
    }
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.keyword.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const currentFieldLabel = FIELD_OPTIONS.find(f => f.value === selectedField)?.label || selectedField;
  const currentFieldRole = FIELD_OPTIONS.find(f => f.value === selectedField)?.role || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Keyword Suggestions Manager</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage predefined keyword options that appear in registration form dropdowns. Users can also type custom values using the "Other" option.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Field selector */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider font-medium">Select Field</Label>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    {option.label}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {option.role}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add single keyword */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider font-medium">Add Keyword</Label>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder={`Add keywords (use , or | to separate multiple)`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button onClick={addKeyword} disabled={saving || !newKeyword.trim()} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        {/* Bulk add */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider font-medium">Bulk Add (one per line)</Label>
          <textarea
            value={bulkKeywords}
            onChange={(e) => setBulkKeywords(e.target.value)}
            placeholder={`Paste multiple keywords, one per line...`}
            className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={addBulkKeywords} disabled={saving || !bulkKeywords.trim()} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" /> Add All
          </Button>
        </div>

        {/* Existing keywords */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider font-medium">
              Keywords for "{currentFieldLabel}" <Badge variant="outline" className="ml-1 text-[10px]">{currentFieldRole}</Badge>
            </Label>
            <span className="text-xs text-muted-foreground">{suggestions.length} total</span>
          </div>

          {suggestions.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter keywords..."
                className="pl-9 h-9"
              />
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : filteredSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {suggestions.length === 0 ? "No keywords added yet." : "No matching keywords."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-border rounded-md">
              {filteredSuggestions.map(suggestion => (
                <Badge
                  key={suggestion.id}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm gap-1.5 group"
                >
                  {suggestion.keyword}
                  <button
                    type="button"
                    onClick={() => deleteKeyword(suggestion.id)}
                    className="ml-1 opacity-50 group-hover:opacity-100 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
