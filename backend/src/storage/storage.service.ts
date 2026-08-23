import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

// supabase-js sempre inicializa um cliente Realtime (websocket), mesmo quando
// so usamos Storage. Node 20 nao tem WebSocket nativo estavel, entao
// precisamos polyfillar antes de criar o client — senao createClient() lanca.
if (!globalThis.WebSocket) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  globalThis.WebSocket = require('ws');
}

const BUCKET = 'attachments';

@Injectable()
export class StorageService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configurados no .env.',
      );
    }
    this.client = createClient(url, key);
  }

  async upload(path: string, buffer: Buffer, contentType: string) {
    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: false });
    if (error) {
      throw new InternalServerErrorException(
        `Falha ao enviar arquivo: ${error.message}`,
      );
    }
  }

  async getSignedUrl(path: string, expiresInSeconds = 3600) {
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data) {
      throw new InternalServerErrorException(
        `Falha ao gerar link do arquivo: ${error?.message}`,
      );
    }
    return data.signedUrl;
  }

  async remove(path: string) {
    await this.client.storage.from(BUCKET).remove([path]);
  }
}
