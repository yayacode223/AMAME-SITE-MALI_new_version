
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Loader2, Plus, Edit, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table';

const FilieresTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    titre: '',
    niveau: '',
    description: '',
    institution: '',
    duree: '',
    debouches: ''
  });

  // Fetch filieres
  const { data: filieres, isLoading: loadingFilieres } = useQuery({
    queryKey: ['filieres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filieres')
        .select('*') as { data: any[], error: any };
      
      if (error) throw error;
      return data || [];
    }
  });

  // Add filiere mutation
  const addFiliereMutation = useMutation({
    mutationFn: async (filiereData: any) => {
      const { error } = await supabase
        .from('filieres')
        .insert([filiereData]);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filieres'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Nouvelle filière ajoutée",
      });
    },
    onError: (error) => {
      console.error("Error adding filiere:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la filière",
        variant: "destructive",
      });
    }
  });

  // Edit filiere mutation
  const editFiliereMutation = useMutation({
    mutationFn: async (filiereData: any) => {
      const { id, ...updateData } = filiereData;
      const { error } = await supabase
        .from('filieres')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filieres'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Filière mise à jour",
      });
    },
    onError: (error) => {
      console.error("Error editing filiere:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la filière",
        variant: "destructive",
      });
    }
  });

  // Delete filiere mutation
  const deleteFiliereMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('filieres')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filieres'] });
      setIsDeleteDialogOpen(false);
      setCurrentItem(null);
      toast({
        title: "Succès",
        description: "Filière supprimée",
      });
    },
    onError: (error) => {
      console.error("Error deleting filiere:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la filière",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openEditDialog = (item: any) => {
    setCurrentItem(item);
    setFormData({
      titre: item.titre || '',
      niveau: item.niveau || '',
      description: item.description || '',
      institution: item.institution || '',
      duree: item.duree || '',
      debouches: item.debouches || '',
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
      niveau: '',
      description: '',
      institution: '',
      duree: '',
      debouches: ''
    });
    setCurrentItem(null);
  };

  const handleSubmit = (isEdit: boolean = false) => {
    const dataToSubmit = { ...formData };
    
    if (isEdit && currentItem) {
      editFiliereMutation.mutate({ ...dataToSubmit, id: currentItem.id });
    } else {
      addFiliereMutation.mutate(dataToSubmit);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Filières</h2>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter une filière
        </Button>
      </div>
      
      {loadingFilieres ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableCaption>Liste des filières disponibles</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filieres && filieres.length > 0 ? (
              filieres.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.titre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.niveau}</Badge>
                  </TableCell>
                  <TableCell>{item.institution || '—'}</TableCell>
                  <TableCell>{item.duree || '—'}</TableCell>
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
                  Aucune filière disponible. Ajoutez-en une !
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Add Filiere Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une filière</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input 
                id="titre" 
                name="titre" 
                value={formData.titre} 
                onChange={handleInputChange}
                placeholder="Titre de la filière"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niveau">Niveau</Label>
                <Input 
                  id="niveau" 
                  name="niveau" 
                  value={formData.niveau} 
                  onChange={handleInputChange}
                  placeholder="Niveau d'études"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input 
                  id="institution" 
                  name="institution" 
                  value={formData.institution} 
                  onChange={handleInputChange}
                  placeholder="Nom de l'institution"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duree">Durée</Label>
              <Input 
                id="duree" 
                name="duree" 
                value={formData.duree} 
                onChange={handleInputChange}
                placeholder="Ex: 2 ans, 4 semestres, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                placeholder="Décrivez la filière"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debouches">Débouchés</Label>
              <Textarea 
                id="debouches" 
                name="debouches" 
                value={formData.debouches} 
                onChange={handleInputChange}
                placeholder="Listez les débouchés possibles"
                rows={2}
              />
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
              {addFiliereMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Filiere Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier une filière</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titre">Titre</Label>
              <Input 
                id="edit-titre" 
                name="titre" 
                value={formData.titre} 
                onChange={handleInputChange}
                placeholder="Titre de la filière"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-niveau">Niveau</Label>
                <Input 
                  id="edit-niveau" 
                  name="niveau" 
                  value={formData.niveau} 
                  onChange={handleInputChange}
                  placeholder="Niveau d'études"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-institution">Institution</Label>
                <Input 
                  id="edit-institution" 
                  name="institution" 
                  value={formData.institution} 
                  onChange={handleInputChange}
                  placeholder="Nom de l'institution"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duree">Durée</Label>
              <Input 
                id="edit-duree" 
                name="duree" 
                value={formData.duree} 
                onChange={handleInputChange}
                placeholder="Ex: 2 ans, 4 semestres, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                placeholder="Décrivez la filière"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-debouches">Débouchés</Label>
              <Textarea 
                id="edit-debouches" 
                name="debouches" 
                value={formData.debouches} 
                onChange={handleInputChange}
                placeholder="Listez les débouchés possibles"
                rows={2}
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
              {editFiliereMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              <Save className="h-4 w-4 mr-2" />
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Filiere Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer la filière "{currentItem?.titre}" ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setCurrentItem(null);
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => deleteFiliereMutation.mutate(currentItem.id)}>
              {deleteFiliereMutation.isPending ? (
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

export default FilieresTab;
