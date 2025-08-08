import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Video, Image, Music, FileText, Trash2, Filter, Search, Clock, HardDrive } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { MediaAsset, User, CreateMediaAssetInput, MediaType } from '../../../server/src/schema';

interface MediaLibraryProps {
  mediaAssets: MediaAsset[];
  currentUser: User;
  onMediaAssetCreated: (asset: MediaAsset) => void;
  onMediaAssetDeleted: (assetId: number) => void;
}

export function MediaLibrary({
  mediaAssets,
  currentUser,
  onMediaAssetCreated,
  onMediaAssetDeleted
}: MediaLibraryProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock upload form data - in real app this would handle actual file uploads
  const [uploadFormData, setUploadFormData] = useState<CreateMediaAssetInput>({
    filename: '',
    original_filename: '',
    file_path: '',
    file_size: 0,
    mime_type: '',
    media_type: 'video',
    duration: null,
    width: null,
    height: null,
    user_id: currentUser.id
  });

  const handleUploadAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // In a real app, this would handle file upload to storage
      // For now, we'll create a mock asset
      const mockAsset: CreateMediaAssetInput = {
        ...uploadFormData,
        filename: `${Date.now()}-${uploadFormData.original_filename}`,
        file_path: `/uploads/${uploadFormData.filename}`,
        file_size: Math.floor(Math.random() * 10000000), // Random file size for demo
        mime_type: getMimeType(uploadFormData.media_type),
        duration: uploadFormData.media_type !== 'image' ? Math.floor(Math.random() * 300) + 10 : null,
        width: uploadFormData.media_type !== 'audio' ? 1920 : null,
        height: uploadFormData.media_type !== 'audio' ? 1080 : null,
      };

      const newAsset = await trpc.createMediaAsset.mutate(mockAsset);
      onMediaAssetCreated(newAsset);
      
      setUploadFormData({
        filename: '',
        original_filename: '',
        file_path: '',
        file_size: 0,
        mime_type: '',
        media_type: 'video',
        duration: null,
        width: null,
        height: null,
        user_id: currentUser.id
      });
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Failed to upload media asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    try {
      await trpc.deleteMediaAsset.mutate({ id: assetId });
      onMediaAssetDeleted(assetId);
    } catch (error) {
      console.error('Failed to delete media asset:', error);
    }
  };

  const getMimeType = (mediaType: MediaType): string => {
    switch (mediaType) {
      case 'video':
        return 'video/mp4';
      case 'image':
        return 'image/jpeg';
      case 'audio':
        return 'audio/mp3';
      default:
        return 'application/octet-stream';
    }
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'video':
        return <Video className="w-8 h-8 text-red-500" />;
      case 'image':
        return <Image className="w-8 h-8 text-green-500" />;
      case 'audio':
        return <Music className="w-8 h-8 text-blue-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const filteredAssets = mediaAssets.filter((asset: MediaAsset) => {
    const matchesType = filterType === 'all' || asset.media_type === filterType;
    const matchesSearch = searchQuery === '' || 
      asset.original_filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const assetsByType = {
    video: mediaAssets.filter((a: MediaAsset) => a.media_type === 'video'),
    image: mediaAssets.filter((a: MediaAsset) => a.media_type === 'image'),
    audio: mediaAssets.filter((a: MediaAsset) => a.media_type === 'audio')
  };

  return (
    <div className="space-y-6">
      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleUploadAsset}>
            <DialogHeader>
              <DialogTitle>Upload Media Asset</DialogTitle>
              <DialogDescription>
                Add a new media file to your library. (This is a demo - file upload is simulated)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="filename">File Name</Label>
                <Input
                  id="filename"
                  value={uploadFormData.original_filename}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUploadFormData((prev: CreateMediaAssetInput) => ({
                      ...prev,
                      original_filename: e.target.value
                    }))
                  }
                  placeholder="example.mp4"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="media-type">Media Type</Label>
                <Select
                  value={uploadFormData.media_type}
                  onValueChange={(value: MediaType) =>
                    setUploadFormData((prev: CreateMediaAssetInput) => ({
                      ...prev,
                      media_type: value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Video
                      </div>
                    </SelectItem>
                    <SelectItem value="image">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Image
                      </div>
                    </SelectItem>
                    <SelectItem value="audio">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Audio
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  📝 <strong>Demo Note:</strong> This simulates file upload. In a real application, 
                  you would select files from your device and they would be uploaded to storage.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : 'Upload Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filterType} onValueChange={(value: MediaType | 'all') => setFilterType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Media</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search media..."
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{assetsByType.video.length}</p>
                <p className="text-sm text-red-600">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Image className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{assetsByType.image.length}</p>
                <p className="text-sm text-green-600">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{assetsByType.audio.length}</p>
                <p className="text-sm text-blue-600">Audio Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{mediaAssets.length}</p>
                <p className="text-sm text-purple-600">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Media Assets */}
      {filteredAssets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || filterType !== 'all' ? 'No Matching Assets' : 'No Media Assets Yet'}
            </h3>
            <p className="text-gray-600 mb-4 max-w-sm">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Upload your first media file to start building your library.'}
            </p>
            {(!searchQuery && filterType === 'all') && (
              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First Asset
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset: MediaAsset) => (
            <Card key={asset.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {getMediaIcon(asset.media_type)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate" title={asset.original_filename}>
                      {asset.original_filename}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {asset.created_at.toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2 text-xs">
                  <Badge variant="outline" className="text-xs">
                    {asset.media_type.toUpperCase()}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <HardDrive className="w-3 h-3" />
                    <span>{formatFileSize(asset.file_size)}</span>
                  </div>
                  
                  {asset.duration && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(asset.duration)}</span>
                    </div>
                  )}
                  
                  {asset.width && asset.height && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📐 {asset.width}x{asset.height}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" className="flex-1 mr-2">
                    Preview
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Media Asset</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{asset.original_filename}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Asset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}