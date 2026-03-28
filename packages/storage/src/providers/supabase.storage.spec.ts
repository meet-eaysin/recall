import { SupabaseStorageProvider } from './supabase.storage';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('tus-js-client', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
  })),
}));

describe('SupabaseStorageProvider', () => {
  let provider: SupabaseStorageProvider;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      storage: {
        getBucket: jest.fn(),
        createBucket: jest.fn(),
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: jest.fn(),
        remove: jest.fn(),
        download: jest.fn(),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    provider = new SupabaseStorageProvider(
      'https://xyz.supabase.co',
      'key',
      'recall',
    );
  });

  describe('ensureBucketExists', () => {
    it('should create bucket if it does not exist', async () => {
      mockSupabase.storage.getBucket.mockResolvedValue({
        data: null,
        error: { message: 'not found', status: 404 },
      });
      mockSupabase.storage.createBucket.mockResolvedValue({
        data: {},
        error: null,
      });
      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'test' },
        error: null,
      });

      await provider.upload(Buffer.from('test'), 'test.txt');

      expect(mockSupabase.storage.createBucket).toHaveBeenCalledWith(
        'recall',
        expect.any(Object),
      );
    });

    it('should not create bucket if it already exists', async () => {
      mockSupabase.storage.getBucket.mockResolvedValue({
        data: {},
        error: null,
      });
      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'test' },
        error: null,
      });

      await provider.upload(Buffer.from('test'), 'test.txt');

      expect(mockSupabase.storage.createBucket).not.toHaveBeenCalled();
    });
  });

  describe('getSignedUrl', () => {
    it('should call createSignedUrl with default expiry', async () => {
      mockSupabase.storage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://signed.url' },
        error: null,
      });

      const url = await provider.getSignedUrl('test.txt');

      expect(url).toBe('https://signed.url');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('recall');
      expect(mockSupabase.storage.createSignedUrl).toHaveBeenCalledWith(
        'test.txt',
        3600,
      );
    });
  });
});
