
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Check } from "lucide-react";

interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  onFileChange: (files: File[]) => void;
}

const FileUpload = ({ 
  label, 
  accept = "image/*", 
  multiple = false, 
  required = false, 
  onFileChange 
}: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
    onFileChange(selectedFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileChange(newFiles);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        required={required}
      />

      <div 
        onClick={triggerFileSelect}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
      >
        {files.length === 0 ? (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-600">
              Clique para selecionar {multiple ? "arquivos" : "arquivo"}
            </p>
            <p className="text-sm text-gray-400">
              {accept.includes("image") ? "Imagens aceitas: JPG, PNG, PDF" : "Documentos aceitos"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Check className="w-8 h-8 text-green-500 mx-auto" />
            <p className="text-green-600 font-medium">
              {files.length} arquivo{files.length > 1 ? "s" : ""} selecionado{files.length > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
