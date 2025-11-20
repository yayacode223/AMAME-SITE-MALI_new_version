import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Check, ChevronRight, ChevronLeft, Upload, User, School, FileText, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { RegisterPayload, RegisterType } from "@/types/userType";
import { useAuth } from "@/context/AuthContext"; 
import { useNavigate } from "react-router-dom";

// Validation avec ZOD - Séparée en 3 étapes
const personalInfoSchema = z.object({
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  phone: z.string().min(8, "Veuillez entrer un numéro de téléphone valide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"),
  confirmPassword: z.string(),
  birthDate: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  sexe: z.enum(["HOMME", "FEMME"], {
    required_error: "Veuillez sélectionner votre genre",
  }),
});

const addressInfoSchema = z.object({
  adresse: z.string().min(5, "Veuillez entrer une adresse valide"),
  etablissement: z.string().min(2, "Veuillez entrer votre établissement"),
  ville: z.string().min(2, "Veuillez entrer une ville valide"),
  codePostal: z.coerce.number().min(1000, "Code postal invalide"),
  pays: z.string().min(2, "Veuillez entrer un pays valide"),
});

const profileSchema = z.object({
  niveauEtude: z.enum(["PRIMAIRE", "SECONDAIRE", "LYCEE", "BACHELIER", "BAC_2", "LICENCE", "MASTER", "DOCTORAT"], {
    required_error: "Veuillez sélectionner votre genre"}),
  image: z
    .any()
    .refine(
      (file) => !file || file instanceof File,
      "Veuillez sélectionner une image valide"
    )
    .optional(),
  cv: z
    .any()
    .refine(
      (file) => !file || file instanceof File,
      "Veuillez sélectionner un fichier valide"
    )
    .optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez accepter les termes et conditions",
    }),
  }),
});

const inscriptionFormSchema = personalInfoSchema
  .merge(addressInfoSchema)
  .merge(profileSchema)
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

type InscriptionFormValues = z.infer<typeof inscriptionFormSchema>;

const educationLevels = [
  { value: "PRIMAIRE", label: "Primaire" },
  { value: "SECONDAIRE", label: "Sécondaire" },
  { value: "LYCEE", label: "Lycée" },
  { value: "BACHELIER", label: "Baccalauréat" },
  { value: "BAC_2", label: "BTS, DUT, DEUG" },
  { value: "LICENCE", label: "Licence" },
  { value: "MASTER", label: "Master" },
  { value: "DOCTORAT", label: "Doctorat" },
  { value: "AUTRE", label: "Autre" },
];

const countries = [
  "Mali", "Sénégal", "Côte d'Ivoire", "Burkina Faso", "Guinée", 
  "Niger", "Bénin", "Togo", "Ghana", "France", "Canada", "Autre"
];

// Composant pour l'input de mot de passe avec toggle
const PasswordInput = ({ field, placeholder, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        {...field}
        className="h-12 pr-10"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-500" />
        ) : (
          <Eye className="h-4 w-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
};

// Composant pour l'indicateur de force du mot de passe
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const strengthMap = [
      { label: "Très faible", color: "bg-red-500" },
      { label: "Faible", color: "bg-orange-500" },
      { label: "Moyen", color: "bg-yellow-500" },
      { label: "Fort", color: "bg-green-500" },
      { label: "Très fort", color: "bg-green-600" }
    ];

    return { ...strengthMap[score - 1], score };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              index <= strength.score ? strength.color : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <p className={cn(
        "text-xs font-medium transition-colors duration-300",
        strength.score === 1 && "text-red-600",
        strength.score === 2 && "text-orange-600",
        strength.score === 3 && "text-yellow-600",
        strength.score >= 4 && "text-green-600"
      )}>
        Force du mot de passe : {strength.label}
      </p>
    </div>
  );
};

// Main Component
const Register = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate(); 
  const { register, isRegistering } = useAuth(); 

  const form = useForm<InscriptionFormValues>({
    resolver: zodResolver(inscriptionFormSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      email: "",
      phone: "",
      adresse: "",
      ville: "",
      codePostal: undefined,
      pays: "Mali",
      etablissement: "",
      termsAccepted: undefined,
    },
    mode: "onChange",
  });

  const watchPassword = form.watch("password");

  const nextStep = async () => {
    const stepFields = {
      1: ["prenom", "nom", "email", "phone", "password", "confirmPassword", "birthDate", "sexe"],
      2: ["adresse", "etablissement", "ville", "codePostal", "pays"],
    };

    const fieldsToValidate = stepFields[currentStep as keyof typeof stepFields];
    const isValid = await form.trigger(fieldsToValidate as (keyof InscriptionFormValues)[]);

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3) as 1 | 2 | 3);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3);
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit = async (formValues: InscriptionFormValues) => {
    const { cv, image, confirmPassword, termsAccepted, ...userData } = formValues;

    const payload: RegisterPayload = {
      user: userData as unknown as RegisterType,
      cv,
      image,
    };

    try {
      await register(payload);
      form.reset(); 
      toast({
        title: "Inscription Réussie !",
        description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
        variant: "default",
      });
      navigate("/login"); 
    } catch (error) {
      toast({
        title: "Erreur lors de l'inscription",
        description: "Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.",
        variant: "destructive",
      });
      console.error(error); 
    }
  };

  const StepIndicator = ({
    step,
    label,
    active,
    completed,
    icon,
  }: {
    step: number;
    label: string;
    active: boolean;
    completed: boolean;
    icon: React.ReactNode;
  }) => (
    <div className="flex flex-col items-center flex-1">
      <div className="flex items-center w-full">
        {/* Ligne de connexion */}
        {step > 1 && (
          <div
            className={cn(
              "h-1 flex-1 mr-2 transition-all duration-300",
              completed ? "bg-purple-600" : "bg-gray-200"
            )}
          />
        )}
        
        {/* Cercle de l'étape */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative",
            active 
              ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200" 
              : completed 
              ? "bg-green-500 border-green-500 text-white" 
              : "bg-white border-gray-300 text-gray-400"
          )}
        >
          {completed ? <Check className="h-5 w-5" /> : icon}
        </div>

        {/* Ligne de connexion */}
        {step < 3 && (
          <div
            className={cn(
              "h-1 flex-1 ml-2 transition-all duration-300",
              completed ? "bg-purple-600" : "bg-gray-200"
            )}
          />
        )}
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-sm font-medium mt-3 text-center transition-colors duration-300",
        active ? "text-purple-600" : completed ? "text-green-600" : "text-gray-500"
      )}>
        {label}
      </span>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Inscription - AMAME</title>
        <meta name="description" content="Rejoignez l'AMAME - Association Malienne d'Appui aux Meilleurs Élèves" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
              <img
                src="/amame-uploads/24ceb186-cbc8-4d01-99bd-635d9bd2df31.png"
                alt="AMAME Logo"
                className="w-10 h-10 rounded-full"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Rejoignez l'<span className="text-purple-600">AMAME</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Créez votre compte et accédez à toutes les opportunités académiques
            </p>
          </div>

          {/* Carte principale */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Barre de progression */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <StepIndicator
                  step={1}
                  label="Informations Personnelles"
                  active={currentStep === 1}
                  completed={currentStep > 1}
                  icon={<User className="h-5 w-5" />}
                />
                <StepIndicator
                  step={2}
                  label="Adresse & Établissement"
                  active={currentStep === 2}
                  completed={currentStep > 2}
                  icon={<School className="h-5 w-5" />}
                />
                <StepIndicator
                  step={3}
                  label="Profil & Documents"
                  active={currentStep === 3}
                  completed={currentStep > 3}
                  icon={<FileText className="h-5 w-5" />}
                />
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-8">
                {/* Étape 1: Informations Personnelles */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Informations Personnelles
                      </h2>
                      <p className="text-gray-600">
                        Renseignez vos informations de base pour créer votre compte
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="prenom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Prénom</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Votre prénom" 
                                {...field} 
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Nom</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Votre nom" 
                                {...field} 
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="votre.email@example.com"
                                type="email"
                                {...field}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Téléphone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+223 XX XX XX XX"
                                {...field}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Mot de Passe</FormLabel>
                            <FormControl>
                              <PasswordInput 
                                field={field}
                                placeholder="••••••••"
                              />
                            </FormControl>
                            <PasswordStrengthIndicator password={watchPassword} />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Confirmer le Mot de Passe</FormLabel>
                            <FormControl>
                              <PasswordInput 
                                field={field}
                                placeholder="••••••••"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-gray-700">Date de Naissance</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "h-12 pl-3 text-left font-normal justify-start",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "dd MMMM yyyy", { locale: fr })
                                    ) : (
                                      <span>Choisir une date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                  className="rounded-md border"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sexe"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-gray-700">Genre</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="HOMME" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    Homme
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="FEMME" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    Femme
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-purple-600 hover:bg-purple-700 h-12 px-8 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg"
                      >
                        Continuer <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Étape 2: Adresse & Établissement */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Adresse & Établissement
                      </h2>
                      <p className="text-gray-600">
                        Où étudiez-vous et où vous situez-vous ?
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="adresse"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-gray-700">Adresse Complète</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Votre adresse complète" 
                                {...field} 
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ville"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Ville</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Votre ville" 
                                {...field} 
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="codePostal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Code Postal</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 1000"
                                type="number"
                                {...field}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Pays</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Sélectionnez votre pays" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="etablissement"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-gray-700">Établissement</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Votre école, lycée ou université"
                                {...field}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        onClick={prevStep}
                        variant="outline"
                        className="h-12 px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Retour
                      </Button>
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-purple-600 hover:bg-purple-700 h-12 px-8 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg"
                      >
                        Continuer <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Étape 3: Profil & Documents */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Profil & Documents
                      </h2>
                      <p className="text-gray-600">
                        Complétez votre profil académique et téléchargez vos documents
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="niveauEtude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Niveau d'Études</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Sélectionnez votre niveau" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {educationLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Photo de Profil</FormLabel>
                              <FormControl>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                      {imagePreview ? (
                                        <img 
                                          src={imagePreview} 
                                          alt="Preview" 
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <User className="h-6 w-6 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null;
                                          field.onChange(file);
                                          handleImageChange(file);
                                        }}
                                        className="cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Format recommandé : JPG, PNG (max 2MB)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Curriculum Vitae (CV)</FormLabel>
                              <FormControl>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600 mb-2">
                                    Glissez-déposez votre CV ou cliquez pour parcourir
                                  </p>
                                  <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => {
                                      field.onChange(e.target.files?.[0] || null);
                                    }}
                                    className="hidden"
                                    id="cv-upload"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('cv-upload')?.click()}
                                    className="h-10"
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Choisir un fichier
                                  </Button>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Formats acceptés : PDF, DOC, DOCX (max 5MB)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="termsAccepted"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 bg-gray-50">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value === true}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked === true ? true : undefined);
                                    }}
                                    className="mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-gray-700 cursor-pointer">
                                    J'accepte les conditions générales d'adhésion et la politique de confidentialité
                                  </FormLabel>
                                  <FormDescription className="text-sm">
                                    Je certifie l'exactitude des informations fournies et m'engage à respecter les statuts de l'AMAME.
                                  </FormDescription>
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            🎯 Pourquoi rejoindre l'AMAME ?
                          </h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Accès aux bourses d'études nationales et internationales</li>
                            <li>• Orientation académique personnalisée</li>
                            <li>• Ressources éducatives exclusives</li>
                            <li>• Réseau d'anciens élèves et mentors</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        onClick={prevStep}
                        variant="outline"
                        className="h-12 px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Retour
                      </Button>
                      <Button
                        type="submit"
                        disabled={isRegistering}
                        className="bg-purple-600 hover:bg-purple-700 h-12 px-8 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRegistering ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Création du compte...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Créer mon compte
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </div>

          {/* Lien de connexion */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Déjà membre ?{" "}
              <Button 
                variant="link" 
                className="text-purple-600 hover:text-purple-700 font-semibold p-0 h-auto"
                onClick={() => navigate("/login")}
              >
                Connectez-vous ici
              </Button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;