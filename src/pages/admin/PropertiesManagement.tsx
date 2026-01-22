import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, Ban, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { PropertyEditDialog } from "@/components/admin/PropertyEditDialog";

interface Property {
  id: string;
  title: string;
  listing_type: string;
  property_type: string;
  price: number;
  location: string;
  status: string;
  created_at: string;
  owner_id: string;
  lease_duration_months?: number[];
  profiles?: {
    full_name: string;
  };
}

const formatLeaseDuration = (months: number[] | undefined | null): string => {
  if (!months || months.length === 0) return "-";
  const duration = months[0];
  if (duration === 6) return "6 Months";
  if (duration === 12) return "1 Year";
  if (duration === 24) return "2 Years";
  return `${duration} Months`;
};

export default function PropertiesManagement() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const { toast } = useToast();

  const fetchProperties = async () => {
    try {
      const { data: propertiesData, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch owner profiles
      const enrichedProperties = await Promise.all(
        (propertiesData || []).map(async (property) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", property.owner_id)
            .maybeSingle();

          return {
            ...property,
            profiles: profileData || undefined,
          };
        })
      );

      setProperties(enrichedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const updatePropertyStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Property ${status}`,
      });

      fetchProperties();
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === properties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(properties.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    
    setBulkUpdating(true);
    try {
      const { error } = await supabase
        .from("properties")
        .update({ status })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedIds.size} properties updated to ${status}`,
      });

      setSelectedIds(new Set());
      fetchProperties();
    } catch (error) {
      console.error("Error bulk updating properties:", error);
      toast({
        title: "Error",
        description: "Failed to update properties",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} properties? This cannot be undone.`)) {
      return;
    }

    setBulkUpdating(true);
    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedIds.size} properties deleted`,
      });

      setSelectedIds(new Set());
      fetchProperties();
    } catch (error) {
      console.error("Error deleting properties:", error);
      toast({
        title: "Error",
        description: "Failed to delete properties",
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const isAllSelected = properties.length > 0 && selectedIds.size === properties.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < properties.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Properties Management</h2>
        <p className="text-muted-foreground mt-2">Manage all property listings</p>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-sm font-medium">
                {selectedIds.size} {selectedIds.size === 1 ? "property" : "properties"} selected
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus("available")}
                  disabled={bulkUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus("pending")}
                  disabled={bulkUpdating}
                >
                  Set Pending
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUpdateStatus("unavailable")}
                  disabled={bulkUpdating}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Mark Unavailable
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={bulkDelete}
                  disabled={bulkUpdating}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkUpdating}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Properties ({properties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(ref) => {
                        if (ref) {
                          (ref as unknown as HTMLInputElement).indeterminate = isSomeSelected;
                        }
                      }}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Listed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow 
                    key={property.id}
                    className={selectedIds.has(property.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(property.id)}
                        onCheckedChange={() => toggleSelect(property.id)}
                        aria-label={`Select ${property.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.title}</div>
                        <div className="text-sm text-muted-foreground">{property.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {property.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{property.listing_type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {property.listing_type === "rent" 
                        ? formatLeaseDuration(property.lease_duration_months)
                        : "-"}
                    </TableCell>
                    <TableCell className="font-medium">${property.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          property.status === "available" ? "default" :
                          property.status === "pending" ? "secondary" : "destructive"
                        }
                      >
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(property.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/property/${property.id}`, "_blank")}
                          title="View Property"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPropertyId(property.id);
                            setEditDialogOpen(true);
                          }}
                          title="Edit Property"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {property.status !== "available" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updatePropertyStatus(property.id, "available")}
                            title="Approve Property"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {property.status === "available" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updatePropertyStatus(property.id, property.listing_type === "rent" ? "rented" : "sold")}
                            title="Mark Unavailable"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PropertyEditDialog
        propertyId={editingPropertyId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchProperties}
      />
    </div>
  );
}
