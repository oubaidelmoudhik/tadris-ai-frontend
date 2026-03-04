/**
 * Client-side PPTX Text Extraction Utility
 * 
 * This module provides client-side extraction of text from PPTX files
 * without uploading the entire 150MB file to the server.
 * 
 * Usage:
 * 1. User selects a PPTX file in the browser
 * 2. JSZip unzips the PPTX (which is a ZIP archive)
 * 3. Extract <a:t> text nodes from slide XML files
 * 4. Send extracted text as JSON to the backend
 * 
 * Install: npm install jszip
 */
import JSZip from 'jszip';

/**
 * Result of PPTX text extraction
 */
export interface ExtractedPPTX {
  text: string;
  slides: string[];
  metadata: {
    title: string;
    subject: string;
    level: string;
    period: string;
    week: string;
    session: string;
  };
}

/**
 * Validate that a file is a PPTX file
 * @param file - The file to validate
 * @returns true if valid PPTX
 */
export function isValidPPTX(file: File): boolean {
  return file.name.toLowerCase().endsWith('.pptx') || 
         file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
}

/**
 * Extract text content from a PPTX file client-side
 * 
 * PPTX files are ZIP archives containing XML files.
 * Text is stored in <a:t> tags within slide XML files.
 * 
 * @param file - The PPTX file to extract from
 * @returns Promise with extracted text and metadata
 */
export async function extractPPTXText(file: File): Promise<ExtractedPPTX> {
  if (!isValidPPTX(file)) {
    throw new Error('Invalid file type. Please select a .pptx file.');
  }

  try {
    // Load the PPTX as a ZIP archive
    const zip = await JSZip.loadAsync(file);
    
    // Find all slide XML files (ppt/slides/slide*.xml)
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        // Sort by slide number
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    if (slideFiles.length === 0) {
      throw new Error('No slides found in PPTX file');
    }

    // Extract text from each slide
    const slides: string[] = [];
    
    for (const slidePath of slideFiles) {
      const slideXml = await zip.file(slidePath)?.async('string');
      if (slideXml) {
        const slideText = extractTextFromXML(slideXml);
        slides.push(slideText);
      }
    }

    const fullText = slides.join('\n\n');

    // Extract metadata from filename
    const metadata = extractMetadataFromFilename(file.name);

    return {
      text: fullText,
      slides,
      metadata,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract PPTX: ${error.message}`);
    }
    throw new Error('Failed to extract PPTX: Unknown error');
  }
}

/**
 * Extract text from PPTX slide XML
 * Text in PPTX is stored in <a:t> (anchor text) tags
 */
function extractTextFromXML(xml: string): string {
  // Match all <a:t>...</a:t> tags and extract content
  const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
  
  if (!textMatches) {
    return '';
  }

  // Extract text content and clean up
  const texts = textMatches
    .map(match => {
      // Extract content between tags
      const content = match.replace(/<[^>]+>/g, '');
      return content.trim();
    })
    .filter(text => text.length > 0);

  return texts.join(' ');
}

/**
 * Extract metadata from PPTX filename
 * Supports formats:
 * - FR_N5_P1_SEM1_S3_V2.pptx
 * - Français_Niv5_Parcour1_Palier3_Séance1.pptx
 */
function extractMetadataFromFilename(filename: string): ExtractedPPTX['metadata'] {
  const name = filename.replace(/\.pptx$/i, '');
  const parts = name.split('_');

  const metadata: ExtractedPPTX['metadata'] = {
    title: name.replace(/_/g, ' '),
    subject: 'français',
    level: '',
    period: '',
    week: '',
    session: '',
  };

  // Try Short Format: FR_N5_P1_SEM1_S3...
  if (parts.length >= 5 && parts[0].length <= 4) {
    const subjectMap: Record<string, string> = {
      'FR': 'français',
      'MATH': 'mathématiques',
      'AR': 'langue arabe',
    };
    metadata.subject = subjectMap[parts[0].toUpperCase()] || 'français';

    // Level (N5 -> 5)
    if (parts[1]?.startsWith('N')) {
      metadata.level = parts[1].slice(1);
    }

    // Period (P1 -> 1)
    if (parts[2]?.startsWith('P')) {
      metadata.period = parts[2].slice(1);
    }

    // Week (SEM1 -> 1)
    if (parts[3]?.startsWith('SEM')) {
      metadata.week = parts[3].slice(3);
    }

    // Session (S3 -> 3)
    if (parts[4]?.startsWith('S')) {
      metadata.session = parts[4].slice(1);
    }
  } 
  // Try Long Format
  else {
    for (const part of parts) {
      const lower = part.toLowerCase();
      
      if (lower.includes('français') || lower.includes('francais')) {
        metadata.subject = 'français';
      } else if (lower.includes('math')) {
        metadata.subject = 'mathématiques';
      } else if (lower.includes('arabe')) {
        metadata.subject = 'langue arabe';
      }

      if (lower.startsWith('niv')) {
        metadata.level = lower.replace('niv', '');
      }

      if (lower.startsWith('parcour')) {
        metadata.week = lower.replace(/\D/g, '');
      }

      if (lower.startsWith('palier')) {
        metadata.period = lower.replace(/\D/g, '');
      }

      if (lower.startsWith('séance') || lower.startsWith('seance')) {
        metadata.session = lower.replace(/\D/g, '');
      }
    }
  }

  return metadata;
}

/**
 * Upload extracted lesson data to backend
 * Sends JSON payload instead of file upload
 */
export async function uploadLessonJson(
  extractedData: ExtractedPPTX,
  accessToken: string,
  apiUrl: string = 'http://localhost:8000/api'
): Promise<{
  lesson_id: number;
  created: boolean;
  message: string;
}> {
  const payload = {
    title: extractedData.metadata.title,
    subject: extractedData.metadata.subject,
    level: extractedData.metadata.level,
    period: extractedData.metadata.period,
    week: extractedData.metadata.week,
    session: extractedData.metadata.session,
    content: extractedData.text,
  };

  const response = await fetch(`${apiUrl}/lessons/upload-json/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to upload lesson');
  }

  return response.json();
}

/**
 * React Hook for PPTX extraction and upload
 * 
 * Usage:
 * ```tsx
 * const { extract, upload, isLoading, error } = usePPTXExtractor();
 * 
 * const handleFileSelect = async (file: File) => {
 *   const extracted = await extract(file);
 *   await upload(extracted, token);
 * };
 * ```
 */
export function createPPTXHandler(
  accessToken: string,
  apiUrl: string = 'http://localhost:8000/api'
) {
  return {
    /**
     * Extract text from PPTX file
     */
    async extract(file: File): Promise<ExtractedPPTX> {
      return extractPPTXText(file);
    },

    /**
     * Extract and upload in one step
     */
    async extractAndUpload(file: File): Promise<{
      lesson_id: number;
      created: boolean;
      message: string;
    }> {
      // Validate first
      if (!isValidPPTX(file)) {
        throw new Error('Invalid file type. Please select a .pptx file.');
      }

      // Extract text
      const extracted = await extractPPTXText(file);

      // Upload to backend
      return uploadLessonJson(extracted, accessToken, apiUrl);
    },
  };
}
