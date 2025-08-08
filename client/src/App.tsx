import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, Settings, Upload, Video, Image, Music } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { ProjectManager } from '@/components/ProjectManager';
import { MediaLibrary } from '@/components/MediaLibrary';
import { TimelineEditor } from '@/components/TimelineEditor';
import type { Project, MediaAsset, User } from '../../server/src/schema';

function App() {
  const [currentUser] = useState<User>({
    id: 1,
    username: 'demo_user',
    email: 'demo@example.com',
    created_at: new Date(),
    updated_at: new Date()
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getProjectsByUser.query({ user_id: currentUser.id });
      setProjects(result);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  const loadMediaAssets = useCallback(async () => {
    try {
      const result = await trpc.getMediaAssetsByUser.query({ user_id: currentUser.id });
      setMediaAssets(result);
    } catch (error) {
      console.error('Failed to load media assets:', error);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadProjects();
    loadMediaAssets();
  }, [loadProjects, loadMediaAssets]);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('timeline');
  };

  const handleProjectCreated = (project: Project) => {
    setProjects((prev: Project[]) => [project, ...prev]);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects((prev: Project[]) => 
      prev.map((p: Project) => p.id === updatedProject.id ? updatedProject : p)
    );
    if (selectedProject?.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  const handleProjectDeleted = (projectId: number) => {
    setProjects((prev: Project[]) => prev.filter((p: Project) => p.id !== projectId));
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      setActiveTab('projects');
    }
  };

  const handleMediaAssetCreated = (asset: MediaAsset) => {
    setMediaAssets((prev: MediaAsset[]) => [asset, ...prev]);
  };

  const handleMediaAssetDeleted = (assetId: number) => {
    setMediaAssets((prev: MediaAsset[]) => prev.filter((a: MediaAsset) => a.id !== assetId));
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎬 Video Studio
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage your video projects with ease
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Video className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{projects.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Assets</CardTitle>
              <Upload className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{mediaAssets.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Play className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {projects.filter((p: Project) => p.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-gray-50/50 px-6">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-white">
                <TabsTrigger 
                  value="projects" 
                  className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                >
                  📁 Projects
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  📚 Media Library
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                  disabled={!selectedProject}
                >
                  🎞️ Timeline
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="projects" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
                    <p className="text-gray-600">Manage and organize your video projects</p>
                  </div>
                </div>

                <ProjectManager
                  projects={projects}
                  currentUser={currentUser}
                  isLoading={isLoading}
                  onProjectSelect={handleProjectSelect}
                  onProjectCreated={handleProjectCreated}
                  onProjectUpdated={handleProjectUpdated}
                  onProjectDeleted={handleProjectDeleted}
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
                    <p className="text-gray-600">Upload and manage your video, image, and audio files</p>
                  </div>
                </div>

                <MediaLibrary
                  mediaAssets={mediaAssets}
                  currentUser={currentUser}
                  onMediaAssetCreated={handleMediaAssetCreated}
                  onMediaAssetDeleted={handleMediaAssetDeleted}
                />
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="p-6">
              {selectedProject ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge className={getStatusColor(selectedProject.status)}>
                          {selectedProject.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {selectedProject.resolution_width}x{selectedProject.resolution_height} @ {selectedProject.frame_rate}fps
                        </span>
                        {selectedProject.duration && (
                          <span className="text-sm text-gray-500">
                            Duration: {Math.round(selectedProject.duration)}s
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('projects')}
                    >
                      ← Back to Projects
                    </Button>
                  </div>

                  <TimelineEditor
                    project={selectedProject}
                    mediaAssets={mediaAssets}
                    onProjectUpdated={handleProjectUpdated}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Settings className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h3>
                  <p className="text-gray-600 mb-4">Select a project from the Projects tab to start editing</p>
                  <Button onClick={() => setActiveTab('projects')}>
                    Go to Projects
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

export default App;