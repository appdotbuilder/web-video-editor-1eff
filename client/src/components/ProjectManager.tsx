import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Play, Clock, Monitor } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Project, User, CreateProjectInput, UpdateProjectInput, ProjectStatus } from '../../../server/src/schema';

interface ProjectManagerProps {
  projects: Project[];
  currentUser: User;
  isLoading: boolean;
  onProjectSelect: (project: Project) => void;
  onProjectCreated: (project: Project) => void;
  onProjectUpdated: (project: Project) => void;
  onProjectDeleted: (projectId: number) => void;
}

export function ProjectManager({
  projects,
  currentUser,
  isLoading,
  onProjectSelect,
  onProjectCreated,
  onProjectUpdated,
  onProjectDeleted
}: ProjectManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateProjectInput>({
    title: '',
    description: null,
    frame_rate: 30,
    resolution_width: 1920,
    resolution_height: 1080,
    user_id: currentUser.id
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateProjectInput>>({});

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newProject = await trpc.createProject.mutate(createFormData);
      onProjectCreated(newProject);
      setCreateFormData({
        title: '',
        description: null,
        frame_rate: 30,
        resolution_width: 1920,
        resolution_height: 1080,
        user_id: currentUser.id
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    
    setIsSubmitting(true);
    try {
      const updatedProject = await trpc.updateProject.mutate({
        id: editingProject.id,
        ...editFormData
      });
      onProjectUpdated(updatedProject);
      setEditingProject(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await trpc.deleteProject.mutate({ id: projectId });
      onProjectDeleted(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setEditFormData({
      title: project.title,
      description: project.description,
      status: project.status,
      frame_rate: project.frame_rate,
      resolution_width: project.resolution_width,
      resolution_height: project.resolution_height
    });
  };

  const getStatusColor = (status: ProjectStatus) => {
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Not set';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreateProject}>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up your new video project with the desired specifications.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={createFormData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateProjectInput) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter project title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateProjectInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Describe your project"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Select
                    value={createFormData.resolution_width.toString()}
                    onValueChange={(value: string) =>
                      setCreateFormData((prev: CreateProjectInput) => ({
                        ...prev,
                        resolution_width: parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1920">1920 (1080p)</SelectItem>
                      <SelectItem value="1280">1280 (720p)</SelectItem>
                      <SelectItem value="3840">3840 (4K)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Select
                    value={createFormData.resolution_height.toString()}
                    onValueChange={(value: string) =>
                      setCreateFormData((prev: CreateProjectInput) => ({
                        ...prev,
                        resolution_height: parseInt(value)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1080">1080</SelectItem>
                      <SelectItem value="720">720</SelectItem>
                      <SelectItem value="2160">2160</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="framerate">Frame Rate</Label>
                <Select
                  value={createFormData.frame_rate.toString()}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateProjectInput) => ({
                      ...prev,
                      frame_rate: parseFloat(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 fps</SelectItem>
                    <SelectItem value="30">30 fps</SelectItem>
                    <SelectItem value="60">60 fps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open: boolean) => !open && setEditingProject(null)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleUpdateProject}>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your project settings and information.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Project Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter project title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  placeholder="Describe your project"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editFormData.status || ''}
                  onValueChange={(value: ProjectStatus) =>
                    setEditFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-gray-600 mb-4 max-w-sm">
              Create your first video project to get started with editing and organizing your content.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      Created {project.created_at.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Monitor className="w-4 h-4" />
                    <span>{project.resolution_width}x{project.resolution_height}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Play className="w-4 h-4" />
                    <span>{project.frame_rate} fps</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(project.duration)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onProjectSelect(project)}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                  
                  <Button
                    onClick={() => openEditDialog(project)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{project.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProject(project.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Project
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