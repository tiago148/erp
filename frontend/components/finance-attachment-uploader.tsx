'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { api, FinanceAttachment } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, FileText } from 'lucide-react';

interface Props {
  financeEntryId: string;
}

const MAX_DIMENSION = 1600;
const IMAGE_QUALITY = 0.8;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Redimensiona e recomprime a imagem no navegador antes do upload — a maioria
// das fotos de nota fiscal tiradas por celular vem em 3-5MB sem necessidade,
// e isso reduz o tempo de upload e o espaço usado no Storage.
function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        IMAGE_QUALITY,
      );
    };
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = objectUrl;
  });
}

export function FinanceAttachmentUploader({ financeEntryId }: Props) {
  const { token } = useAuth();
  const [attachments, setAttachments] = useState<FinanceAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setAttachments(await api.listFinanceAttachments(token, financeEntryId));
    } finally {
      setLoading(false);
    }
  }, [token, financeEntryId]);

  useEffect(() => { load(); }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!token || !files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const toUpload = file.type.startsWith('image/') ? await compressImage(file) : file;
        await api.uploadFinanceAttachment(token, financeEntryId, toUpload);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(attachment: FinanceAttachment) {
    if (!token || !confirm(`Excluir o anexo "${attachment.fileName}"?`)) return;
    await api.deleteFinanceAttachment(token, attachment.id);
    load();
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}`}
      >
        <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {uploading ? 'Enviando...' : 'Arraste uma foto ou PDF da nota fiscal aqui, ou clique para selecionar'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP ou PDF — até 10MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando anexos...</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum anexo ainda.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attachments.map((a) => (
            <div key={a.id} className="border rounded-md overflow-hidden group relative">
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                {a.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.fileName} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 flex items-center justify-center bg-muted">
                    <FileText size={32} className="text-muted-foreground" />
                  </div>
                )}
              </a>
              <div className="p-2 flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" title={a.fileName}>{a.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(a.size)}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => handleDelete(a)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
