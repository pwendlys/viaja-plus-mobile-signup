
import { supabase } from "@/integrations/supabase/client";

// Mapeia os tipos de documentos para seus respectivos buckets
const DOCUMENT_BUCKET_MAP = {
  residence_proof: 'residence-proofs',
  profile_photo: 'profile-photos',
  cnh_front_photo: 'cnh-photos',
  cnh_back_photo: 'cnh-photos',
  vehicle_document: 'vehicle-photos',
  vehicle_photo: 'vehicle-photos',
  selfie_with_document: 'documents',
  sus_card: 'documents'
} as const;

/**
 * Converte um path de documento armazenado no banco para uma URL pública do Supabase Storage
 */
export const getDocumentPublicUrl = (documentType: string, path: string | null): string | null => {
  if (!path) return null;
  
  const bucket = DOCUMENT_BUCKET_MAP[documentType as keyof typeof DOCUMENT_BUCKET_MAP];
  if (!bucket) {
    console.warn(`Bucket não encontrado para o tipo de documento: ${documentType}`);
    return null;
  }

  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error(`Erro ao gerar URL pública para ${documentType}:`, error);
    return null;
  }
};

/**
 * Verifica se uma URL é um path relativo (precisa ser convertido) ou já é uma URL completa
 */
export const isRelativePath = (url: string | null): boolean => {
  if (!url) return false;
  // Se não começar com http ou https, é um path relativo
  return !url.startsWith('http://') && !url.startsWith('https://');
};
