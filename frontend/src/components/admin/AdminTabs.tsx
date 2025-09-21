
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, BookOpen, School, GraduationCap, FileText } from 'lucide-react';
import UsersTab from './UsersTab';
import ConcoursTab from './ConcoursTab';
import FilieresTab from './FilieresTab';
import BoursesTab from './BoursesTab';
import RessourcesTab from './RessourcesTab';

const AdminTabs = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white shadow-sm border">
        <TabsTrigger value="users" className="flex items-center gap-2 h-14">
          <UserPlus className="h-4 w-4" />
          <span className="hidden md:inline">Utilisateurs</span>
        </TabsTrigger>
        <TabsTrigger value="concours" className="flex items-center gap-2 h-14">
          <BookOpen className="h-4 w-4" />
          <span className="hidden md:inline">Concours</span>
        </TabsTrigger>
        <TabsTrigger value="filieres" className="flex items-center gap-2 h-14">
          <School className="h-4 w-4" />
          <span className="hidden md:inline">Filières</span>
        </TabsTrigger>
        <TabsTrigger value="bourses" className="flex items-center gap-2 h-14">
          <GraduationCap className="h-4 w-4" />
          <span className="hidden md:inline">Bourses</span>
        </TabsTrigger>
        <TabsTrigger value="ressources" className="flex items-center gap-2 h-14">
          <FileText className="h-4 w-4" />
          <span className="hidden md:inline">Ressources</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="users" className="border rounded-md bg-white p-6 shadow-sm">
        <UsersTab />
      </TabsContent>
      
      <TabsContent value="concours" className="border rounded-md bg-white p-6 shadow-sm">
        <ConcoursTab />
      </TabsContent>
      
      <TabsContent value="filieres" className="border rounded-md bg-white p-6 shadow-sm">
        <FilieresTab />
      </TabsContent>
      
      <TabsContent value="bourses" className="border rounded-md bg-white p-6 shadow-sm">
        <BoursesTab />
      </TabsContent>
      
      <TabsContent value="ressources" className="border rounded-md bg-white p-6 shadow-sm">
        <RessourcesTab />
      </TabsContent>
    </Tabs>
  );
};

export default AdminTabs;
