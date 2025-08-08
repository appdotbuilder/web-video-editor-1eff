import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Eye, RotateCw, Move3D, Plus, Trash2, Clock, Layers } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Project, MediaAsset, TimelineItem, CreateTimelineItemInput, UpdateTimelineItemInput } from '../../../server/src/schema';

interface TimelineEditorProps {
  project: Project;
  mediaAssets: MediaAsset[];
  onProjectUpdated: (project: Project) => void;
}

export function TimelineEditor({
  project,
  mediaAssets,
  onProjectUpdated
}: TimelineEditorProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoom, setZoom] = useState(50);

  const [addItemFormData, setAddItemFormData] = useState<CreateTimelineItemInput>({
    project_id: project.id,
    media_asset_id: 0,
    track_number: 0,
    start_time: 0,
    end_time: 10,
    media_start_offset: 0,
    volume: 1,
    opacity: 1,
    position_x: 0,
    position_y: 0,
    scale: 1,
    rotation: 0
  });

  const loadTimelineItems = useCallback(async () => {
    try {
      const items = await trpc.getTimelineItemsByProject.query({ project_id: project.id });
      setTimelineItems(items);
    } catch (error) {
      console.error('Failed to load timeline items:', error);
    }
  }, [project.id]);

  useEffect(() => {
    loadTimelineItems();
  }, [loadTimelineItems]);

  const handleAddTimelineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newItem = await trpc.createTimelineItem.mutate(addItemFormData);
      setTimelineItems((prev: TimelineItem[]) => [...prev, newItem]);
      
      // Update project duration if this item extends beyond current duration
      const maxEndTime = Math.max(...timelineItems.map((item: TimelineItem) => item.end_time), newItem.end_time);
      if (!project.duration || maxEndTime > project.duration) {
        const updatedProject = await trpc.updateProject.mutate({
          id: project.id,
          duration: maxEndTime
        });
        onProjectUpdated(updatedProject);
      }

      setAddItemFormData({
        project_id: project.id,
        media_asset_id: 0,
        track_number: 0,
        start_time: 0,
        end_time: 10,
        media_start_offset: 0,
        volume: 1,
        opacity: 1,
        position_x: 0,
        position_y: 0,
        scale: 1,
        rotation: 0
      });
      setIsAddItemDialogOpen(false);
    } catch (error) {
      console.error('Failed to add timeline item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTimelineItem = async (updates: Partial<UpdateTimelineItemInput>) => {
    if (!selectedItem) return;

    try {
      const updatedItem = await trpc.updateTimelineItem.mutate({
        id: selectedItem.id,
        ...updates
      });
      setTimelineItems((prev: TimelineItem[]) => 
        prev.map((item: TimelineItem) => item.id === updatedItem.id ? updatedItem : item)
      );
      setSelectedItem(updatedItem);
    } catch (error) {
      console.error('Failed to update timeline item:', error);
    }
  };

  const handleDeleteTimelineItem = async (itemId: number) => {
    try {
      await trpc.deleteTimelineItem.mutate({ id: itemId });
      setTimelineItems((prev: TimelineItem[]) => prev.filter((item: TimelineItem) => item.id !== itemId));
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete timeline item:', error);
    }
  };

  const getMediaAssetForItem = (item: TimelineItem): MediaAsset | undefined => {
    return mediaAssets.find((asset: MediaAsset) => asset.id === item.media_asset_id);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTrackColor = (trackNumber: number): string => {
    const colors = [
      'bg-red-100 border-red-300',
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-yellow-100 border-yellow-300',
      'bg-purple-100 border-purple-300',
      'bg-pink-100 border-pink-300',
    ];
    return colors[trackNumber % colors.length] || 'bg-gray-100 border-gray-300';
  };

  const maxTracks = Math.max(...timelineItems.map((item: TimelineItem) => item.track_number), 2);
  const timelineDuration = project.duration || 30;
  const pixelsPerSecond = zoom;

  return (
    <div className="space-y-6">
      {/* Add Timeline Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Media to Timeline
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleAddTimelineItem}>
            <DialogHeader>
              <DialogTitle>Add Media to Timeline</DialogTitle>
              <DialogDescription>
                Place a media asset on the project timeline.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="media-asset">Media Asset</Label>
                <Select
                  value={addItemFormData.media_asset_id.toString()}
                  onValueChange={(value: string) =>
                    setAddItemFormData((prev: CreateTimelineItemInput) => ({
                      ...prev,
                      media_asset_id: parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select media asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaAssets.map((asset: MediaAsset) => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {asset.media_type}
                          </Badge>
                          {asset.original_filename}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="track">Track</Label>
                  <Input
                    id="track"
                    type="number"
                    min="0"
                    max="10"
                    value={addItemFormData.track_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddItemFormData((prev: CreateTimelineItemInput) => ({
                        ...prev,
                        track_number: parseInt(e.target.value) || 0
                      }))
                    }
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time (s)</Label>
                  <Input
                    id="start-time"
                    type="number"
                    min="0"
                    step="0.1"
                    value={addItemFormData.start_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAddItemFormData((prev: CreateTimelineItemInput) => ({
                        ...prev,
                        start_time: parseFloat(e.target.value) || 0
                      }))
                    }
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time (s)</Label>
                <Input
                  id="end-time"
                  type="number"
                  min="0"
                  step="0.1"
                  value={addItemFormData.end_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAddItemFormData((prev: CreateTimelineItemInput) => ({
                      ...prev,
                      end_time: parseFloat(e.target.value) || 0
                    }))
                  }
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddItemDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || addItemFormData.media_asset_id === 0}>
                {isSubmitting ? 'Adding...' : 'Add to Timeline'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Timeline Controls */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Timeline
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Zoom:</span>
                  <div className="w-32">
                    <Slider
                      value={[zoom]}
                      onValueChange={(value: number[]) => setZoom(value[0] || 50)}
                      min={20}
                      max={200}
                      step={10}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <Button size="sm" variant="outline">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline">
                  <Square className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-8" />
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{formatTime(currentTime)} / {formatTime(timelineDuration)}</span>
                </div>
              </div>

              {/* Timeline Ruler */}
              <div className="mb-2">
                <div className="relative h-6 bg-gray-100 border rounded">
                  {Array.from({ length: Math.ceil(timelineDuration) + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex items-center"
                      style={{ left: `${(i * pixelsPerSecond / timelineDuration) * 100}%` }}
                    >
                      <div className="w-px h-full bg-gray-400" />
                      <span className="text-xs text-gray-600 ml-1">{i}s</span>
                    </div>
                  ))}
                  
                  {/* Playhead */}
                  <div
                    className="absolute top-0 w-px h-full bg-red-500 z-10"
                    style={{ left: `${(currentTime / timelineDuration) * 100}%` }}
                  />
                </div>
              </div>

              {/* Timeline Tracks */}
              <ScrollArea className="h-64 border rounded">
                <div className="p-2 space-y-1">
                  {Array.from({ length: maxTracks + 1 }, (_, trackIndex) => (
                    <div key={trackIndex} className="relative h-12 border rounded bg-gray-50">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 z-10">
                        Track {trackIndex}
                      </div>
                      
                      {timelineItems
                        .filter((item: TimelineItem) => item.track_number === trackIndex)
                        .map((item: TimelineItem) => {
                          const asset = getMediaAssetForItem(item);
                          const leftPercent = (item.start_time / timelineDuration) * 100;
                          const widthPercent = ((item.end_time - item.start_time) / timelineDuration) * 100;
                          
                          return (
                            <div
                              key={item.id}
                              className={`absolute top-1 h-10 border-2 rounded cursor-pointer transition-all hover:shadow-md ${
                                selectedItem?.id === item.id
                                  ? 'ring-2 ring-blue-500'
                                  : ''
                              } ${getTrackColor(trackIndex)}`}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                minWidth: '60px'
                              }}
                              onClick={() => setSelectedItem(item)}
                            >
                              <div className="p-1 h-full flex flex-col justify-between text-xs">
                                <div className="font-medium truncate">
                                  {asset?.original_filename || 'Unknown'}
                                </div>
                                <div className="text-gray-600">
                                  {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Media Asset</h4>
                    <p className="text-sm text-gray-600">
                      {getMediaAssetForItem(selectedItem)?.original_filename || 'Unknown'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="volume" className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Volume
                      </Label>
                      <div className="mt-2">
                        <Slider
                          value={[selectedItem.volume || 1]}
                          onValueChange={(value: number[]) => 
                            handleUpdateTimelineItem({ volume: value[0] })
                          }
                          min={0}
                          max={1}
                          step={0.1}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round((selectedItem.volume || 1) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="opacity" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Opacity
                      </Label>
                      <div className="mt-2">
                        <Slider
                          value={[selectedItem.opacity || 1]}
                          onValueChange={(value: number[]) => 
                            handleUpdateTimelineItem({ opacity: value[0] })
                          }
                          min={0}
                          max={1}
                          step={0.1}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round((selectedItem.opacity || 1) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="scale" className="flex items-center gap-2">
                        <Move3D className="w-4 h-4" />
                        Scale
                      </Label>
                      <div className="mt-2">
                        <Slider
                          value={[selectedItem.scale || 1]}
                          onValueChange={(value: number[]) => 
                            handleUpdateTimelineItem({ scale: value[0] })
                          }
                          min={0.1}
                          max={3}
                          step={0.1}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round((selectedItem.scale || 1) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="rotation" className="flex items-center gap-2">
                        <RotateCw className="w-4 h-4" />
                        Rotation
                      </Label>
                      <div className="mt-2">
                        <Slider
                          value={[selectedItem.rotation || 0]}
                          onValueChange={(value: number[]) => 
                            handleUpdateTimelineItem({ rotation: value[0] })
                          }
                          min={-180}
                          max={180}
                          step={5}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedItem.rotation || 0}°
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from Timeline
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Timeline Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this item from the timeline? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTimelineItem(selectedItem.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove Item
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a timeline item to edit its properties</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-medium">{timelineItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tracks Used:</span>
                <span className="font-medium">{maxTracks + 1}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">{formatTime(timelineDuration)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}