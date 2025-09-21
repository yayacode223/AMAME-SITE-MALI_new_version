
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
import { CalendarIcon } from "lucide-react";
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

const BoursesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    titre: '',
    provider: '',
    country: '',
    niveau: '',
    montant: '',
    description: '',
    deadline: null as Date | null,
    lien_candidature: ''
  });

  // Fetch bourses
  const { data: bourses, isLoading: loadingBourses } = useQuery({
    queryKey: ['bourses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bourses')
        .select('*') as { data: any[], error: any };
      
      if (error) throw error;
      return data || [];
    }
  });

  // Add bourse mutation
  const addBourseMutation = useMutation({
    mutationFn: async (bourseData: any) => {
      const { error } = await supabase
        .from('bourses')
        .insert([bourseData]);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bourses'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Nouvelle bourse ajoutée",
      });
    },
    onError: (error) => {
      console.error("Error adding bourse:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la bourse",
        variant: "destructive",
      });
    }
  });

  // Edit bourse mutation
  const editBourseMutation = useMutation({
    mutationFn: async (bourseData: any) => {
      const { id, ...updateData } = bourseData;
      const { error } = await supabase
        .from('bourses')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bourses'] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Bourse mise à jour",
      });
    },
    onError: (error) => {
      console.error("Error editing bourse:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la bourse",
        variant: "destructive",
      });
    }
  });

  // Delete bourse mutation
  const deleteBourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bourses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bourses'] });
      setIsDeleteDialogOpen(false);
      setCurrentItem(null);
      toast({
        title: "Succès",
        description: "Bourse supprimée",
      });
    },
    onError: (error) => {
      console.error("Error deleting bourse:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la bourse",
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
      provider: item.provider || '',
      country: item.country || '',
      niveau: item.niveau || '',
      montant: item.montant || '',
      description: item.description || '',
      deadline: item.deadline ? new Date(item.deadline) : null,
      lien_candidature: item.lien_candidature || ''
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
      provider: '',
      country: '',
      niveau: '',
      montant: '',
      description: '',
      deadline: null,
      lien_candidature: ''
    });
    setCurrentItem(null);
  };

  const handleSubmit = (isEdit: boolean = false) => {
    const dataToSubmit = { ...formData };
    
    if (isEdit && currentItem) {
      editBourseMutation.mutate({ ...dataToSubmit, id: currentItem.id });
    } else {
      addBourseMutation.mutate(dataToSubmit);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Bourses</h2>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter une bourse
        </Button>
      </div>
      
      {loadingBourses ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableCaption>Liste des bourses disponibles</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Date limite</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bourses && bourses.length > 0 ? (
              bourses.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.titre}</TableCell>
                  <TableCell>{item.provider || '—'}</TableCell>
                  <TableCell>{item.country || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.niveau || '—'}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.deadline ? format(new Date(item.deadline), 'dd/MM/yyyy') : '—'}
                  </TableCell>
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
                  Aucune bourse disponible. Ajoutez-en une !
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Add Bourse Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une bourse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre</Label>
              <Input 
                id="titre" 
                name="titre" 
                value={formData.titre} 
                onChange={handleInputChange}
                placeholder="Titre de la bourse"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Fournisseur</Label>
                <Input 
                  id="provider" 
                  name="provider" 
                  value={formData.provider} 
                  onChange={handleInputChange}
                  placeholder="Nom du fournisseur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleInputChange}
                  placeholder="Pays concerné"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niveau">Niveau</Label>
                <Input 
                  id="niveau" 
                  name="niveau" 
                  value={formData.niveau} 
                  onChange={handleInputChange}
                  placeholder="Niveau d'études requis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="montant">Montant</Label>
                <Input 
                  id="montant" 
                  name="montant" 
                  value={formData.montant} 
                  onChange={handleInputChange}
                  placeholder="Ex: 10000€/an, Variable, etc."
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
                placeholder="Décrivez la bourse"
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
            <div className="space-y-2">
              <Label htmlFor="lien_candidature">Lien de candidature</Label>
              <Input 
                id="lien_candidature" 
                name="lien_candidature" 
                value={formData.lien_candidature} 
                onChange={handleInputChange}
                placeholder="URL du site de candidature"
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
              {addBourseMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bourse Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier une bourse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="edit-titre">Titre</Label>
              <Input 
                id="edit-titre" 
                name="titre" 
                value={formData.titre} 
                onChange={handleInputChange}
                placeholder="Titre de la bourse"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-provider">Fournisseur</Label>
                <Input 
                  id="edit-provider" 
                  name="provider" 
                  value={formData.provider} 
                  onChange={handleInputChange}
                  placeholder="Nom du fournisseur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Pays</Label>
                <Input 
                  id="edit-country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleInputChange}
                  placeholder="Pays concerné"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-niveau">Niveau</Label>
                <Input 
                  id="edit-niveau" 
                  name="niveau" 
                  value={formData.niveau} 
                  onChange={handleInputChange}
                  placeholder="Niveau d'études requis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-montant">Montant</Label>
                <Input 
                  id="edit-montant" 
                  name="montant" 
                  value={formData.montant} 
                  onChange={handleInputChange}
                  placeholder="Ex: 10000€/an, Variable, etc."
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
                placeholder="Décrivez la bourse"
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
            <div className="space-y-2">
              <Label htmlFor="edit-lien_candidature">Lien de candidature</Label>
              <Input 
                id="edit-lien_candidature" 
                name="lien_candidature" 
                value={formData.lien_candidature} 
                onChange={handleInputChange}
                placeholder="URL du site de candidature"
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
              {editBourseMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              <Save className="h-4 w-4 mr-2" />
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Bourse Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer la bourse "{currentItem?.titre}" ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setCurrentItem(null);
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => deleteBourseMutation.mutate(currentItem.id)}>
              {deleteBourseMutation.isPending ? (
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

export default BoursesTab;
