
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Download, Check, X, CheckSquare, Square } from "lucide-react";

interface Document {
  key: string;
  label: string;
  url: string | null;
  status?: 'approved' | 'rejected' | 'pending';
}

interface DocumentViewerProps {
  documents: Document[];
  onApproveDocument?: (documentKey: string) => void;
  onRejectDocument?: (documentKey: string) => void;
  onApproveMultiple?: (documentKeys: string[]) => void;
  onRejectMultiple?: (documentKeys: string[]) => void;
  showActions?: boolean;
  allowMultipleSelection?: boolean;
}

const DocumentViewer = ({ 
  documents, 
  onApproveDocument, 
  onRejectDocument,
  onApproveMultiple,
  onRejectMultiple,
  showActions = false,
  allowMultipleSelection = false
}: DocumentViewerProps) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  const openImageInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const downloadDocument = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
    }
  };

  const toggleDocumentSelection = (documentKey: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentKey) 
        ? prev.filter(key => key !== documentKey)
        : [...prev, documentKey]
    );
  };

  const selectAllDocuments = () => {
    const allKeys = documents.filter(doc => doc.url).map(doc => doc.key);
    setSelectedDocuments(allKeys);
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const handleApproveSelected = () => {
    if (onApproveMultiple && selectedDocuments.length > 0) {
      onApproveMultiple(selectedDocuments);
      clearSelection();
    }
  };

  const handleRejectSelected = () => {
    if (onRejectMultiple && selectedDocuments.length > 0) {
      onRejectMultiple(selectedDocuments);
      clearSelection();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documentos Enviados</h3>
        {allowMultipleSelection && showActions && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectedDocuments.length === documents.filter(d => d.url).length ? clearSelection : selectAllDocuments}
            >
              {selectedDocuments.length === documents.filter(d => d.url).length ? (
                <>
                  <Square className="w-4 h-4 mr-1" />
                  Desmarcar Todos
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Selecionar Todos
                </>
              )}
            </Button>
            {selectedDocuments.length > 0 && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApproveSelected}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Aprovar Selecionados ({selectedDocuments.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleRejectSelected}
                >
                  <X className="w-4 h-4 mr-1" />
                  Rejeitar Selecionados ({selectedDocuments.length})
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.key} className={`overflow-hidden ${selectedDocuments.includes(doc.key) ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {allowMultipleSelection && showActions && doc.url && (
                    <Checkbox
                      checked={selectedDocuments.includes(doc.key)}
                      onCheckedChange={() => toggleDocumentSelection(doc.key)}
                    />
                  )}
                  <span>{doc.label}</span>
                </div>
                {getStatusBadge(doc.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {doc.url ? (
                <>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={doc.url} 
                      alt={doc.label}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => openImageInNewTab(doc.url!)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Visualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{doc.label}</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center">
                          <img 
                            src={doc.url} 
                            alt={doc.label}
                            className="max-w-full max-h-[70vh] object-contain"
                          />
                        </div>
                        <div className="flex justify-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            onClick={() => downloadDocument(doc.url!, `${doc.label}.jpg`)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          {showActions && onApproveDocument && doc.status !== 'approved' && (
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => onApproveDocument(doc.key)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Aprovar Este Documento
                            </Button>
                          )}
                          {showActions && onRejectDocument && doc.status !== 'rejected' && (
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => onRejectDocument(doc.key)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Rejeitar Este Documento
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(doc.url!, `${doc.label}.jpg`)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    {showActions && !allowMultipleSelection && (
                      <>
                        {onApproveDocument && doc.status !== 'approved' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onApproveDocument(doc.key)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Aprovar
                          </Button>
                        )}
                        {onRejectDocument && doc.status !== 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => onRejectDocument(doc.key)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Rejeitar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Documento não enviado</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DocumentViewer;
