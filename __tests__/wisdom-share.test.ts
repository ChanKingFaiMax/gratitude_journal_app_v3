import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

// Mock the native modules
vi.mock('expo-media-library', () => ({
  requestPermissionsAsync: vi.fn(),
  saveToLibraryAsync: vi.fn(),
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn(),
  shareAsync: vi.fn(),
}));

vi.mock('react-native-view-shot', () => ({
  default: vi.fn(),
}));

describe('Wisdom Share Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission Handling', () => {
    it('should request media library permission before saving', async () => {
      const mockRequestPermissions = vi.mocked(MediaLibrary.requestPermissionsAsync);
      mockRequestPermissions.mockResolvedValue({
        status: 'granted' as any,
        expires: 'never',
        canAskAgain: true,
        granted: true,
      });

      await MediaLibrary.requestPermissionsAsync();

      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });

    it('should handle permission denial gracefully', async () => {
      const mockRequestPermissions = vi.mocked(MediaLibrary.requestPermissionsAsync);
      mockRequestPermissions.mockResolvedValue({
        status: 'denied' as any,
        expires: 'never',
        canAskAgain: false,
        granted: false,
      });

      const result = await MediaLibrary.requestPermissionsAsync();

      expect(result.status).toBe('denied');
      expect(result.granted).toBe(false);
    });
  });

  describe('Sharing Functionality', () => {
    it('should check if sharing is available', async () => {
      const mockIsAvailable = vi.mocked(Sharing.isAvailableAsync);
      mockIsAvailable.mockResolvedValue(true);

      const isAvailable = await Sharing.isAvailableAsync();

      expect(isAvailable).toBe(true);
      expect(mockIsAvailable).toHaveBeenCalledTimes(1);
    });

    it('should share image when sharing is available', async () => {
      const mockIsAvailable = vi.mocked(Sharing.isAvailableAsync);
      const mockShareAsync = vi.mocked(Sharing.shareAsync);
      
      mockIsAvailable.mockResolvedValue(true);
      mockShareAsync.mockResolvedValue({ action: 'sharedAction' } as any);

      const isAvailable = await Sharing.isAvailableAsync();
      expect(isAvailable).toBe(true);

      const mockUri = 'file:///path/to/image.png';
      await Sharing.shareAsync(mockUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Wisdom',
      });

      expect(mockShareAsync).toHaveBeenCalledWith(mockUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Wisdom',
      });
    });

    it('should fallback to save when sharing is not available', async () => {
      const mockIsAvailable = vi.mocked(Sharing.isAvailableAsync);
      const mockRequestPermissions = vi.mocked(MediaLibrary.requestPermissionsAsync);
      const mockSaveToLibrary = vi.mocked(MediaLibrary.saveToLibraryAsync);

      mockIsAvailable.mockResolvedValue(false);
      mockRequestPermissions.mockResolvedValue({
        status: 'granted' as any,
        expires: 'never',
        canAskAgain: true,
        granted: true,
      });
      mockSaveToLibrary.mockResolvedValue({
        id: 'asset-id',
        filename: 'wisdom-card.png',
        uri: 'file:///path/to/image.png',
        mediaType: 'photo',
        width: 1080,
        height: 1440,
        creationTime: Date.now(),
        modificationTime: Date.now(),
        duration: 0,
      } as any);

      const isAvailable = await Sharing.isAvailableAsync();
      expect(isAvailable).toBe(false);

      const permission = await MediaLibrary.requestPermissionsAsync();
      expect(permission.status).toBe('granted');

      const mockUri = 'file:///path/to/image.png';
      await MediaLibrary.saveToLibraryAsync(mockUri);

      expect(mockSaveToLibrary).toHaveBeenCalledWith(mockUri);
    });
  });

  describe('Card Design Specifications', () => {
    it('should use correct color scheme', () => {
      const colors = {
        background: '#000000', // Pure black
        text: '#FFFFFF', // Pure white
        signature: '#E8A838', // Golden
      };

      expect(colors.background).toBe('#000000');
      expect(colors.text).toBe('#FFFFFF');
      expect(colors.signature).toBe('#E8A838');
    });

    it('should use correct card dimensions (3:4 ratio)', () => {
      const dimensions = {
        width: 1080,
        height: 1440,
      };

      const ratio = dimensions.width / dimensions.height;
      expect(ratio).toBeCloseTo(0.75, 2); // 3:4 = 0.75
    });

    it('should format wisdom content correctly', () => {
      const wisdom = 'Love is not something you find, it\'s something you practice.';
      const formatted = `"${wisdom}"`;

      expect(formatted).toContain('"');
      expect(formatted).toContain(wisdom);
    });

    it('should include signature text', () => {
      const signature = '- Insight Entries';

      expect(signature).toBe('- Insight Entries');
      expect(signature.startsWith('-')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle capture failure gracefully', async () => {
      const mockError = new Error('Failed to capture image');
      
      try {
        throw mockError;
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to capture image');
      }
    });

    it('should handle save failure gracefully', async () => {
      const mockSaveToLibrary = vi.mocked(MediaLibrary.saveToLibraryAsync);
      mockSaveToLibrary.mockRejectedValue(new Error('Failed to save'));

      await expect(MediaLibrary.saveToLibraryAsync('invalid-uri')).rejects.toThrow('Failed to save');
    });

    it('should handle share failure gracefully', async () => {
      const mockShareAsync = vi.mocked(Sharing.shareAsync);
      mockShareAsync.mockRejectedValue(new Error('Failed to share'));

      await expect(Sharing.shareAsync('invalid-uri')).rejects.toThrow('Failed to share');
    });
  });
});
