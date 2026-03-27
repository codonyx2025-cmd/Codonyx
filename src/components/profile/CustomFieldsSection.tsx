import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  placeholder: string | null;
  display_order: number;
}

interface CustomFieldsProps {
  profileId: string;
  userType: string;
  onValuesChange: (values: Record<string, string>) => void;
}

export function CustomFieldsSection({ profileId, userType, onValuesChange }: CustomFieldsProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFieldsAndValues = async () => {
      // Fetch custom fields for this user type
      const { data: fieldsData } = await supabase
        .from("custom_profile_fields")
        .select("*")
        .eq("applies_to", userType as any)
        .order("display_order");

      const customFields = (fieldsData as CustomField[]) || [];
      setFields(customFields);

      if (customFields.length > 0 && profileId) {
        // Fetch existing values
        const { data: valuesData } = await supabase
          .from("custom_profile_values")
          .select("field_id, value")
          .eq("profile_id", profileId);

        const valueMap: Record<string, string> = {};
        (valuesData || []).forEach((v: any) => {
          valueMap[v.field_id] = v.value || "";
        });
        setValues(valueMap);
        onValuesChange(valueMap);
      }
      setLoading(false);
    };

    loadFieldsAndValues();
  }, [profileId, userType]);

  const handleValueChange = (fieldId: string, value: string) => {
    const updated = { ...values, [fieldId]: value };
    setValues(updated);
    onValuesChange(updated);
  };

  if (loading || fields.length === 0) return null;

  return (
    <>
      <div className="pt-4 border-t border-divider">
        <h3 className="font-heading font-semibold text-foreground mb-4">Additional Details</h3>
      </div>

      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`custom-${field.id}`}>
            {field.field_label}{field.is_required ? " *" : ""}
          </Label>

          {field.field_type === "textarea" ? (
            <Textarea
              id={`custom-${field.id}`}
              value={values[field.id] || ""}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              rows={3}
            />
          ) : field.field_type === "tags" ? (
            <TagInput
              id={`custom-${field.id}`}
              value={values[field.id] || ""}
              onChange={(val) => handleValueChange(field.id, val)}
              placeholder={field.placeholder || "Add items"}
              suggestionField={field.field_name}
            />
          ) : field.field_type === "number" ? (
            <Input
              id={`custom-${field.id}`}
              type="number"
              value={values[field.id] || ""}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
            />
          ) : (
            <Input
              id={`custom-${field.id}`}
              type={field.field_type === "url" ? "url" : "text"}
              value={values[field.id] || ""}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
            />
          )}
        </div>
      ))}
    </>
  );
}
