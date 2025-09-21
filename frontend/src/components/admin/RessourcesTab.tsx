
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Loader2, Plus, Edit, Trash2, Save, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table';

const RessourcesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    titre: '',
    type: 'document',
    category: '',
    description: '',
    source: '',
    lien_externe: '',
    file_size: ''
  });

  // Resource types
  const resourceTypes = [
    'document', 'guide', 'vidéo', 'article', 'cours', 'foire aux questions', 'autre'
  ];

  // Fetch ressources
  const { data: ressources, isLoading: loadingRessources } = useQuery({
    queryKey: ['ressources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ressources')
        .select('*') as { data: any[], error: any };
      
      if (error) throw error;
      return data || [];
    }
  });

  // Add ressource mutation
  const addRessourceMutation = useMutation({
    mutationFn: async (ressourceData: any) => {
      const { error } = await supabase
        .from('ressources')
        .insert([ressourceData]);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ressources'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Nouvelle ressource ajoutée",
      });
    },
    onError: (error) => {
      console.error("Error adding ressource:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la ressource",
        variant: "destructive",
      });
    }
  });

  // Edit ressource mutation
  const editRessourceMutation = useMutation({
    mutationFn: async (ressourceData: any) => {
      const { id, ...updateData } = ressourceData;
      const { error } = await supabase
        .from('ressources')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ressources'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Ressource mise à jour",
      });
    },
    onError: (error) => {
      console.error("Error editing ressource:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la ressource",
        variant: "destructive",
      });
    }
  });

  // Delete ressource mutation
  const deleteRessourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ressources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ressources'] });
      setIsDeleteDialogOpen(false);
      setCurrentItem(null);
      toast({
        title: "Succès",
        description: "Ressource supprimée",
      });
    },
    onError: (error) => {
      console.error("Error deleting ressource:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la ressource",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openEditDialog = (item: any) => {
    setCurrentItem(item);
    setFormData({
      titre: item.titre || '',
      type: item.type || 'document',
      category: item.category || '',
      description: item.description || '',
      source: item.source || '',
      lien_externe: item.lien_externe || '',
      file_size: item.file_size || ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: any) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      type: 'document',
      category: '',
      description: '',
      source: '',
      lien_externe: '',
      file_size: ''
    });
    setCurrentItem(null);
  };

  const handleSubmit = (isEdit: boolean = false) => {
    const dataToSubmit = { ...formData };
    
    if (isEdit && currentItem) {
      editRessourceMutation.mutate({ ...dataToSubmit, id: currentItem.id });
    } else {
      addRessourceMutation.mutate(dataToSubmit);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Ressources</h2>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter une ressource
        </Button>
      </div>
      
      {loadingRessources ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableCaption>Liste des ressources disponibles</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ressources && ressources.length > 0 ? (
              ressources.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.titre}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.category || '—'}</TableCell>
                  <TableCell>{item.source || '—'}</TableCell>
                  <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(item)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Aucune ressource disponible. Ajoutez-en une !
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Add Ressource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une ressource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input 
                id="titre" 
                name="titre" 
                value={formData.titre} 
                onChange={handleInputChange}
                placeholder="Titre de la ressource"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  placeholder="Catégorie de la ressource"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                placeholder="Décrivez la ressource"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input 
                  id="source" 
                  name="source" 
                  value={formData.source} 
                  onChange={handleInputChange}
                  placeholder="Source de la ressource"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file_size">Taille du fichier</Label>
                <Input 
                  id="file_size" 
                  name="file_size" 
                  value={formData.file_size} 
                  onChange={handleInputChange}
                  placeholder="Ex: 2.5 MB"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lien_externe">Lien externe</Label>
              <Input 
                id="lien_externe" 
                name="lien_externe" 
                value={formData.lien_externe} 
                onChange={handleInputChange}
                placeholder="URL de la ressource"
              />
            </div>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Télécharger un fichier (Bientôt disponible)
              </Button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Le téléchargement de fichier sera disponible prochainement
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Annuler
            </Button>
            <Button onClick={() => handleSubmit(false)}>
              {addRessourceMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ressource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier une ressource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titre">Titre</Label>
              <Input 
                id="edit-titre" 
                name="titre" 
                value={formData.titre} 
                onChange={handleInputChange}
                placeholder="Titre de la ressource"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Catégorie</Label>
                <Input 
                  id="edit-category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  placeholder="Catégorie de la ressource"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                placeholder="Décrivez la ressource"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-source">Source</Label>
                <Input 
                  id="edit-source" 
                  name="source" 
                  value={formData.source} 
                  onChange={handleInputChange}
                  placeholder="Source de la ressource"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-file_size">Taille du fichier</Label>
                <Input 
                  id="edit-file_size" 
                  name="file_size" 
                  value={formData.file_size} 
                  onChange={handleInputChange}
                  placeholder="Ex: 2.5 MB"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lien_externe">Lien externe</Label>
              <Input 
                id="edit-lien_externe" 
                name="lien_externe" 
                value={formData.lien_externe} 
                onChange={handleInputChange}
                placeholder="URL de la ressource"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Annuler
            </Button>
            <Button onClick={() => handleSubmit(true)}>
              {editRessourceMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              <Save className="h-4 w-4 mr-2" />
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ressource Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer la ressource "{currentItem?.titre}" ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setCurrentItem(null);
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => deleteRessourceMutation.mutate(currentItem.id)}>
              {deleteRessourceMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RessourcesTab;
