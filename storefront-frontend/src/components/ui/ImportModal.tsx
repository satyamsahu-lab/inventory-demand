import React, { useState } from "react";
import { Upload, Download, FileText, AlertCircle, X, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onImport: (file: File) => Promise<void>;
  sampleHeaders: string[];
  sampleRows: string[][];
  sampleFileName: string;
}

export function ImportModal({
  open,
  onClose,
  title,
  onImport,
  sampleHeaders,
  sampleRows,
  sampleFileName,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setUploading(false);
    }
  }, [open]);

  const handleDownloadSample = () => {
    const headerRow = sampleHeaders.join(",");
    const dataRows = sampleRows.map(row => row.join(",")).join("\n");
    const csvContent = headerRow + "\n" + dataRows + (dataRows ? "\n" : "");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sampleFileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Sample template downloaded");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "xlsx") {
        toast.error("Please select a .csv or .xlsx file");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    try {
      await onImport(file);
      setFile(null);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.settings?.message || "Import failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!file || uploading}
            className="px-8 shadow-brand-200"
          >
            {uploading ? "Processing..." : "Start Import"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Upload Area */}
        <div 
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-10 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer",
            file 
              ? "border-emerald-200 bg-emerald-50/30" 
              : "border-surface-200 hover:border-brand-300 hover:bg-brand-50/20"
          )}
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
          />
          
          <div className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center transition-all shadow-sm",
            file ? "bg-emerald-100 text-emerald-600" : "bg-surface-100 text-surface-400 group-hover:bg-brand-100 group-hover:text-brand-500"
          )}>
            {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
          </div>

          <div className="text-center">
            <p className="text-sm font-black text-surface-900 tracking-tight">
              {file ? file.name : "Click to select a file"}
            </p>
            <p className="text-[11px] font-bold text-surface-400 uppercase tracking-widest mt-1">
              Supports CSV or Excel files
            </p>
          </div>

          {file && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white border border-surface-200 flex items-center justify-center text-surface-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Instructions & Sample */}
        <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle size={12} />
            </div>
            <div>
              <p className="text-[11px] font-black text-surface-900 uppercase tracking-widest">Requirements</p>
              <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                Your file must include the following columns: <br/>
                <code className="bg-white border border-surface-200 px-1.5 py-0.5 rounded text-brand-600 font-mono text-[10px] font-bold mt-1 inline-block">
                  {sampleHeaders.join(", ")}
                </code>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-surface-400 italic">Need a template?</p>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-black text-[11px] uppercase tracking-widest transition-colors"
            >
              <Download size={14} />
              Download Sample
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
