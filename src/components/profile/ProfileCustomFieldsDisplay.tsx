import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface ProfileCustomFieldsDisplayProps {
  profileId: string;
  userType: "advisor" | "laboratory" | "distributor";
}

interface CustomFieldValue {
  id: string;
  fieldLabel: string;
  fieldType: string;
  displayOrder: number;
  value: string;
}

interface CustomFieldRelation {
  id: string;
  field_label: string;
  field_type: string;
  display_order: number;
  applies_to: "advisor" | "laboratory" | "distributor";
}

interface CustomValueRow {
  value: string | null;
  custom_profile_fields: CustomFieldRelation | CustomFieldRelation[] | null;
}

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export function ProfileCustomFieldsDisplay({ profileId, userType }: ProfileCustomFieldsDisplayProps) {
  const [fields, setFields] = useState<CustomFieldValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCustomFields = async () => {
      const { data, error } = await supabase
        .from("custom_profile_values")
        .select(
          `
            value,
            custom_profile_fields:field_id (
              id,
              field_label,
              field_type,
              display_order,
              applies_to
            )
          `
        )
        .eq("profile_id", profileId);

      if (error || !isMounted) {
        setIsLoading(false);
        return;
      }

      const normalized = ((data as CustomValueRow[]) || [])
        .map((row) => {
          const relation = Array.isArray(row.custom_profile_fields)
            ? row.custom_profile_fields[0]
            : row.custom_profile_fields;

          if (!relation || !row.value?.trim() || relation.applies_to !== userType) {
            return null;
          }

          return {
            id: relation.id,
            fieldLabel: relation.field_label,
            fieldType: relation.field_type,
            displayOrder: relation.display_order,
            value: row.value,
          };
        })
        .filter((field): field is CustomFieldValue => Boolean(field))
        .sort((a, b) => a.displayOrder - b.displayOrder || a.fieldLabel.localeCompare(b.fieldLabel));

      setFields(normalized);
      setIsLoading(false);
    };

    loadCustomFields();

    return () => {
      isMounted = false;
    };
  }, [profileId, userType]);

  if (isLoading || fields.length === 0) return null;

  return (
    <section className="bg-background rounded-2xl border border-divider p-8 mt-6">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Additional Details</h2>

      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <p className="text-sm text-muted-foreground">{field.fieldLabel}</p>

            {field.fieldType === "tags" ? (
              <div className="flex flex-wrap gap-2">
                {parseTags(field.value).map((tag) => (
                  <Badge key={`${field.id}-${tag}`} variant="secondary" className="font-medium">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : field.fieldType === "url" ? (
              <a
                href={field.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {field.value}
              </a>
            ) : (
              <p className="text-foreground whitespace-pre-wrap">{field.value}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
