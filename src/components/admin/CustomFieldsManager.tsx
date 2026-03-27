import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Pencil, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  applies_to: string;
  is_required: boolean;
  display_order: number;
  placeholder: string | null;
}

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "tags", label: "Tags (comma-separated)" },
  { value: "number", label: "Number" },
  { value: "url", label: "URL" },
];

const USER_TYPES = [
  { value: "advisor", label: "Advisor" },
  { value: "laboratory", label: "Laboratory" },
  { value: "distributor", label: "Distributor" },
];

export function CustomFieldsManager() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [appliesTo, setAppliesTo] = useState("advisor");
  const [isRequired, setIsRequired] = useState(false);
  const [placeholder, setPlaceholder] = useState("");

  // Tag suggestions state
  const [tagSuggestions, setTagSuggestions] = useState<{ id: string; keyword: string }[]>([]);
  const [newSuggestion, setNewSuggestion] = useState("");

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from("custom_profile_fields")
      .select("*")
      .order("applies_to")
      .order("display_order");

    if (error) {
      toast({ title: "Error", description: "Failed to load custom fields.", variant: "destructive" });
    } else {
      setFields((data as CustomField[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFieldLabel("");
    setFieldName("");
    setFieldType("text");
    setAppliesTo("advisor");
    setIsRequired(false);
    setPlaceholder("");
    setEditingField(null);
    setTagSuggestions([]);
    setNewSuggestion("");
  };

  const fetchTagSuggestions = async (name: string) => {
    if (!name) { setTagSuggestions([]); return; }
    const { data } = await supabase
      .from("keyword_suggestions" as any)
      .select("id, keyword")
      .eq("field_name", name)
      .order("keyword");
    setTagSuggestions((data as any[]) || []);
  };

  const addTagSuggestion = async () => {
    const kw = newSuggestion.trim();
    if (!kw || !fieldName.trim()) return;
    if (tagSuggestions.some(s => s.keyword.toLowerCase() === kw.toLowerCase())) {
      toast({ title: "Duplicate", description: "This suggestion already exists.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("keyword_suggestions" as any)
      .insert({ field_name: fieldName.trim(), keyword: kw });
    if (error) {
      toast({ title: "Error", description: "Failed to add suggestion.", variant: "destructive" });
    } else {
      setNewSuggestion("");
      fetchTagSuggestions(fieldName.trim());
    }
  };

  const removeTagSuggestion = async (id: string) => {
    await supabase.from("keyword_suggestions" as any).delete().eq("id", id);
    fetchTagSuggestions(fieldName.trim());
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (field: CustomField) => {
    setEditingField(field);
    setFieldLabel(field.field_label);
    setFieldName(field.field_name);
    setFieldType(field.field_type);
    setAppliesTo(field.applies_to);
    setIsRequired(field.is_required);
    setPlaceholder(field.placeholder || "");
    if (field.field_type === "tags") {
      fetchTagSuggestions(field.field_name);
    } else {
      setTagSuggestions([]);
    }
    setDialogOpen(true);
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  const handleLabelChange = (value: string) => {
    setFieldLabel(value);
    if (!editingField) {
      setFieldName(generateFieldName(value));
    }
  };

  const handleSave = async () => {
    if (!fieldLabel.trim() || !fieldName.trim()) {
      toast({ title: "Validation Error", description: "Label and name are required.", variant: "destructive" });
      return;
    }

    setSaving(true);

    const fieldData = {
      field_label: fieldLabel.trim(),
      field_name: fieldName.trim(),
      field_type: fieldType,
      applies_to: appliesTo as any,
      is_required: isRequired,
      placeholder: placeholder.trim() || null,
    };

    if (editingField) {
      const { error } = await supabase
        .from("custom_profile_fields")
        .update(fieldData)
        .eq("id", editingField.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update field.", variant: "destructive" });
      } else {
        toast({ title: "Field updated successfully" });
      }
    } else {
      const maxOrder = fields.filter(f => f.applies_to === appliesTo).length;
      const { error } = await supabase
        .from("custom_profile_fields")
        .insert({ ...fieldData, display_order: maxOrder });

      if (error) {
        toast({ title: "Error", description: "Failed to create field.", variant: "destructive" });
      } else {
        toast({ title: "Field created successfully" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchFields();
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm("Delete this custom field? All saved values for this field will also be deleted.")) return;

    const { error } = await supabase
      .from("custom_profile_fields")
      .delete()
      .eq("id", fieldId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete field.", variant: "destructive" });
    } else {
      toast({ title: "Field deleted" });
      fetchFields();
    }
  };

  const filteredFields = filterType === "all" ? fields : fields.filter(f => f.applies_to === filterType);

  const typeColorMap: Record<string, string> = {
    advisor: "bg-primary/10 text-primary",
    laboratory: "bg-accent/80 text-accent-foreground",
    distributor: "bg-secondary text-secondary-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Custom Profile Fields</h2>
          <p className="text-sm text-muted-foreground">
            Define additional fields that appear on user edit profile pages
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Field
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Label className="text-sm">Filter by type:</Label>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {USER_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading fields...</p>
      ) : filteredFields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No custom fields created yet. Click "Add Field" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Input Type</TableHead>
                  <TableHead className="hidden md:table-cell">Required</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.field_label}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={typeColorMap[field.applies_to] || ""}>
                        {field.applies_to}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{field.field_type}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {field.is_required ? <Badge variant="default">Yes</Badge> : <span className="text-muted-foreground">No</span>}
                    </TableCell>
                    <TableCell className="sm:hidden">
                      <Badge variant="outline" className={typeColorMap[field.applies_to] || ""}>
                        {field.applies_to}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(field)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(field.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { resetForm(); } setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Custom Field" : "Add Custom Field"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Field Label *</Label>
              <Input
                value={fieldLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., Certifications"
              />
            </div>

            <div className="space-y-2">
              <Label>Field Name (internal) *</Label>
              <Input
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g., certifications"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Auto-generated from label. Used internally.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input Type</Label>
                <Select value={fieldType} onValueChange={(v) => { setFieldType(v); if (v === "tags" && fieldName.trim()) fetchTagSuggestions(fieldName.trim()); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Applies To</Label>
                <Select value={appliesTo} onValueChange={setAppliesTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Placeholder Text</Label>
              <Input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="e.g., Enter your certifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Required Field</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>

            {/* Tag Suggestions Section - only for tags type */}
            {fieldType === "tags" && fieldName.trim() && (
              <div className="space-y-3 border-t border-border pt-4">
                <Label className="text-sm font-semibold">Dropdown Suggestions</Label>
                <p className="text-xs text-muted-foreground">
                  Add predefined options users can choose from. They can also type custom values via "Other".
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newSuggestion}
                    onChange={(e) => setNewSuggestion(e.target.value)}
                    placeholder="Add a suggestion..."
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTagSuggestion(); } }}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={addTagSuggestion} disabled={!newSuggestion.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tagSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {tagSuggestions.map((s) => (
                      <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                        {s.keyword}
                        <button type="button" onClick={() => removeTagSuggestion(s.id)} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {tagSuggestions.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No suggestions yet. Users will only see a free-text input.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !fieldLabel.trim() || !fieldName.trim()}>
              {saving ? "Saving..." : editingField ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
