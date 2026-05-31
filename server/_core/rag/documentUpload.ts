/**
 * RAG Document Upload - Upload de Documentos
 * 
 * Responsabilidade: Gerenciar upload, parsing e indexação de documentos
 * 
 * Fluxo:
 * 1. Upload do arquivo (PDF, DOCX, TXT)
 * 2. Parsing do conteúdo
 * 3. Chunking em seções
 * 4. Geração de embeddings
 * 5. Indexação em Pinecone
 * 6. Armazenamento de metadata
 */

// Storage será integrado em fase posterior

/**
 * Documento carregado
 */
export interface UploadedDocument {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  storageKey: string;
  content: string;
  chunkCount: number;
  tokenCount: number;
  status: 'uploading' | 'parsing' | 'indexing' | 'completed' | 'failed';
  uploadedAt: Date;
  metadata: Record<string, any>;
}

/**
 * Validar arquivo
 */
function validateFile(file: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}): void {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.mimetype}`);
  }

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`Arquivo muito grande: ${file.size} bytes (máximo: ${maxSize})`);
  }

  if (!file.originalname || file.originalname.length === 0) {
    throw new Error('Nome de arquivo inválido');
  }
}

/**
 * Extrair conteúdo do arquivo
 */
async function extractContent(file: {
  buffer: Buffer;
  mimetype: string;
}): Promise<string> {
  try {
    if (file.mimetype === 'text/plain') {
      return file.buffer.toString('utf-8');
    }

    // Para PDF e DOCX, retornar placeholder por enquanto
    // Em produção, usar pdfparse e mammoth
    return `[Conteúdo de ${file.mimetype}]`;
  } catch (error) {
    console.error('Erro ao extrair conteúdo:', error);
    throw error;
  }
}

/**
 * Contar tokens no texto
 */
function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Fazer upload de um documento
 */
export async function uploadDocument(
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  },
  userId: string,
  organizationId: string
): Promise<UploadedDocument> {
  const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 1. Validar arquivo
    validateFile(file);

    // 2. Fazer upload para S3 (será integrado em fase posterior)
    const key = `documents/${organizationId}/${userId}/${documentId}/${file.originalname}`;
    const url = `/manus-storage/${key}`;

    // 3. Extrair conteúdo
    const content = await extractContent(file);

    // 4. Contar tokens
    const tokenCount = countTokens(content);

    const document: UploadedDocument = {
      id: documentId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageUrl: url,
      storageKey: key,
      content,
      chunkCount: Math.ceil(tokenCount / 500), // Estimativa: 500 tokens por chunk
      tokenCount,
      status: 'completed',
      uploadedAt: new Date(),
      metadata: {
        userId,
        organizationId,
        uploadedAt: new Date().toISOString(),
      },
    };

    return document;
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    throw error;
  }
}

/**
 * Validar documento carregado
 */
export function validateUploadedDocument(doc: UploadedDocument): boolean {
  if (!doc.id || !doc.fileName || !doc.storageUrl || !doc.storageKey) {
    console.error('Documento incompleto');
    return false;
  }

  if (!['uploading', 'parsing', 'indexing', 'completed', 'failed'].includes(doc.status)) {
    console.error(`Status inválido: ${doc.status}`);
    return false;
  }

  if (doc.size <= 0) {
    console.error('Tamanho inválido');
    return false;
  }

  return true;
}

/**
 * Calcular estatísticas de upload
 */
export function getUploadStats(documents: UploadedDocument[]): {
  totalDocuments: number;
  totalSize: number;
  totalChunks: number;
  totalTokens: number;
  avgSize: number;
  avgChunks: number;
} {
  if (documents.length === 0) {
    return {
      totalDocuments: 0,
      totalSize: 0,
      totalChunks: 0,
      totalTokens: 0,
      avgSize: 0,
      avgChunks: 0,
    };
  }

  const totalSize = documents.reduce((sum, d) => sum + d.size, 0);
  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);
  const totalTokens = documents.reduce((sum, d) => sum + d.tokenCount, 0);

  return {
    totalDocuments: documents.length,
    totalSize,
    totalChunks,
    totalTokens,
    avgSize: Math.round(totalSize / documents.length),
    avgChunks: Math.round(totalChunks / documents.length),
  };
}
