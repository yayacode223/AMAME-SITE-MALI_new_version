
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
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow
} from '@/components/ui/table';

const ConcoursTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    titre: '',
    type: '',
    institution: '',
    description: '',
    deadline: null as Date | null,
  });

  // Fetch concours
  const { data: concours, isLoading: loadingConcours } = useQuery({
    queryKey: ['concours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concours')
        .select('*') as { data: any[], error: any };
      
      if (error) throw error;
      return data || [];
    }
  });

  // Add concours mutation
  const addConcoursMutation = useMutation({
    mutationFn: async (concoursData: any) => {
      const { error } = await supabase
        .from('concours')
        .insert([concoursData]);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concours'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Nouveau concours ajouté",
      });
    },
    onError: (error) => {
      console.error("Error adding concours:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le concours",
        variant: "destructive",
      });
    }
  });

  // Edit concours mutation
  const editConcoursMutation = useMutation({
    mutationFn: async (concoursData: any) => {
      const { id, ...updateData } = concoursData;
      const { error } = await supabase
        .from('concours')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concours'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Concours mis à jour",
      });
    },
    onError: (error) => {
      console.error("Error editing concours:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le concours",
        variant: "destructive",
      });
    }
  });

  // Delete concours mutation
  const deleteConcoursMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('concours')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concours'] });
      setIsDeleteDialogOpen(false);
      setCurrentItem(null);
      toast({
        title: "Succès",
        description: "Concours supprimé",
      });
    },
    onError: (error) => {
      console.error("Error deleting concours:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le concours",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, deadline: date }));
  };

  const openEditDialog = (item: any) => {
    setCurrentItem(item);
    setFormData({
      titre: item.titre || '',
      type: item.type || '',
      institution: item.institution || '',
      description: item.description || '',
      deadline: item.deadline ? new Date(item.deadline) : null,
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
      type: '',
      institution: '',
      description: '',
      deadline: null,
    });
    setCurrentItem(null);
  };

  const handleSubmit = (isEdit: boolean = false) => {
    const dataToSubmit = { ...formData };
    
    if (isEdit && currentItem) {
      editConcoursMutation.mutate({ ...dataToSubmit, id: currentItem.id });
    } else {
      addConcoursMutation.mutate(dataToSubmit);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Concours</h2>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter un concours
        </Button>
      </div>
      
      {loadingConcours ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableCaption>Liste des concours disponibles</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Date limite</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {concours && concours.length > 0 ? (
              concours.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.titre}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.institution}</TableCell>
                  <TableCell>
                    {item.deadline ? format(new Date(item.deadline), 'dd/MM/yyyy') : '—'}
                  </TableCell>
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
                  Aucun concours disponible. Ajoutez-en un !
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Add Concours Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un concours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input 
                id="titre" 
                name="titre" 
                value={formData.titre} 
                onChange={handleInputChange}
                placeholder="Titre du concours"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input 
                  id="type" 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange}
                  placeholder="Type du concours"
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
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                placeholder="Décrivez le concours"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Date limite</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="deadline"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, 'dd/MM/yyyy') : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline || undefined}
                    onSelect={handleDateChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
              {addConcoursMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Concours Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier un concours</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-titre">Titre</Label>
              <Input 
                id="edit-titre" 
                name="titre" 
                value={formData.titre} 
                onChange={handleInputChange}
                placeholder="Titre du concours"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Input 
                  id="edit-type" 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange}
                  placeholder="Type du concours"
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange}
                placeholder="Décrivez le concours"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Date limite</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="edit-deadline"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, 'dd/MM/yyyy') : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline || undefined}
                    onSelect={handleDateChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
              {editConcoursMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              <Save className="h-4 w-4 mr-2" />
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Concours Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer le concours "{currentItem?.titre}" ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setCurrentItem(null);
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => deleteConcoursMutation.mutate(currentItem.id)}>
              {deleteConcoursMutation.isPending ? (
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

export default ConcoursTab;
