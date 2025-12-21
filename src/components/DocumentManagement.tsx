import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, Trash2, Download, Eye, Loader2, File, FileImage, FileArchive } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  owner_id: string;
  property_id: string | null;
  lease_id: string | null;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_TYPES = [
  { value: "lease_agreement", label: "Lease Agreement" },
  { value: "contract", label: "Contract" },
  { value: "tenant_id", label: "Tenant ID" },
  { value: "proof_of_income", label: "Proof of Income" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "insurance", label: "Insurance Document" },
  { value: "other", label: "Other" },
];

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return FileImage;
  if (["zip", "rar", "7z"].includes(ext || "")) return FileArchive;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType, description }: { file: File; documentType: string; description: string }) => {
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from("documents").insert({
        owner_id: user.id,
        uploaded_by: user.id,
        document_type: documentType,
        file_name: file.name,
        file_url: fileName,
        file_size: file.size,
        description: description || null,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully");
      setIsUploadOpen(false);
      setSelectedFile(null);
      setDocumentType("");
      setDescription("");
    },
    onError: (error) => {
      toast.error("Failed to upload document: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (document: Document) => {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([document.file_url]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error("Please select a file and document type");
      return;
    }
    setUploading(true);
    await uploadMutation.mutateAsync({ file: selectedFile, documentType, description });
    setUploading(false);
  };

  const handleDownload = async (document: Document) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(document.file_url);

    if (error) {
      toast.error("Failed to download document");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = async (document: Document) => {
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(document.file_url);
    
    // For private buckets, we need to create a signed URL
    const { data: signedData, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_url, 3600);

    if (error) {
      toast.error("Failed to preview document");
      return;
    }

    window.open(signedData.signedUrl, "_blank");
  };

  const filteredDocuments = documents?.filter(doc => 
    filterType === "all" || doc.document_type === filterType
  );

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Please sign in to manage your documents.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-muted-foreground">
            Securely store and manage your lease agreements, contracts, and important documents.
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this document..."
                />
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={uploading || !selectedFile || !documentType}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Label>Filter by type:</Label>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocuments?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground">
              Upload your first document using the button above to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments?.map((doc) => {
            const FileIcon = getFileIcon(doc.file_name);
            return (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <FileIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{doc.file_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          {getDocumentTypeLabel(doc.document_type)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(doc)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{doc.file_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(doc)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
