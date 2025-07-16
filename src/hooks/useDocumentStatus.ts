
import { useState, useCallback } from 'react';

export interface DocumentStatus {
  [documentKey: string]: 'approved' | 'rejected' | 'pending';
}

export const useDocumentStatus = (initialDocuments: any[], rejectedDocuments: string[] = []) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  
  // Calcula o status baseado nos documentos rejeitados
  const getDocumentStatus = useCallback((documentKey: string): 'approved' | 'rejected' | 'pending' => {
    if (rejectedDocuments.includes(documentKey)) {
      return 'rejected';
    }
    // Se o perfil está aprovado e o doc não está rejeitado, então está aprovado
    return 'pending'; // Será determinado pelo componente pai baseado no status geral
  }, [rejectedDocuments]);

  const toggleDocumentSelection = useCallback((documentKey: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentKey) 
        ? prev.filter(key => key !== documentKey)
        : [...prev, documentKey]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDocuments([]);
  }, []);

  const selectAll = useCallback(() => {
    const allKeys = initialDocuments.map(doc => doc.key);
    setSelectedDocuments(allKeys);
  }, [initialDocuments]);

  return {
    selectedDocuments,
    getDocumentStatus,
    toggleDocumentSelection,
    clearSelection,
    selectAll
  };
};
