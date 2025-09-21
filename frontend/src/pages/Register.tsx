import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Check, ChevronRight, ChevronLeft } from "lucide-react";
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
import {useAuth} from "@/context/AuthContext"; 
import { useNavigate } from "react-router-dom";


//Validation avec ZOD
const personalInfoSchema = z.object({
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  phone: z.string().min(8, "Veuillez entrer un numéro de téléphone valide"),
  password: z
    .string()
    .min(8, "Le mot de pass doit contenir au moins 8 carecteres"),
  confirmPassword: z
    .string()
    .min(8, "Le mot de pass doit contenir au moins 8 caracters"),
  birthDate: z.date({
    required_error: "Veuillez sélectionner une date",
  }),
  sexe: z.enum(["HOMME", "FEMME"], {
    required_error: "Veuillez sélectionner votre genre",
  }),
  adresse: z.string().min(2, "Veuillez entrer une adresse valide"),
  etablissement: z.string().min(2, "Veuillez entrer une adresse valide"),
  ville: z.string().min(2, "Veuillez entrer une ville valide"),
  codePostal: z.coerce.number(),
  pays: z.string().min(2, "Veuillez entrer un pays valide"),
});

const profileSchema = z.object({
  niveauEtude: z.string().min(1, "Veuillez sélectionner votre niveau d'études"),
  image: z
    .any()
    .refine(
      (file) => file instanceof File || file === undefined || file === null,
      {
        message: "Veuillez sélectionner une image valide",
      }
    )
    .optional(),

  cv: z
    .any()
    .refine(
      (file) => file instanceof File || file === undefined || file === null,
      {
        message: "Veuillez sélectionner une image valide",
      }
    )
    .optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez accepter les termes et conditions",
    }),
  }),
});

const inscriptionFormSchema = profileSchema
  .merge(personalInfoSchema)
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de pass ne correspondent pas !",
  });

type InscriptionFormValues = z.infer<typeof inscriptionFormSchema>;

const educationLevels = [
  { value: "primaire", label: "Primaire" },
  { value: "Secondaire", label: "Secondaire" },
  { value: "Lycee", label: "Lycee" },
  { value: "Universite", label: "Universite" },
  { value: "autre", label: "Autres" },
];

//Main Component
const Register = () => {

  //Use State && Hook personnalises
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const navigate = useNavigate(); 
  const {register, isRegistering} = useAuth(); 

  const form = useForm<InscriptionFormValues>({
    resolver: zodResolver(inscriptionFormSchema),
    defaultValues: {
      prenom: "",
      nom: "",
      email: "",
      phone: "",
      adresse: "",
      ville: "",
      codePostal: 0,
      pays: "Mali",
      etablissement: "",
      termsAccepted: undefined,
    },
    mode: "onChange",
  });

  const nextStep = async () => {
    // Liste des champs de la première étape
    const fieldsToValidate: (keyof InscriptionFormValues)[] = [
      "prenom",
      "nom",
      "email",
      "phone",
      "password",
      "confirmPassword",
      "birthDate",
      "sexe",
      "adresse",
      "etablissement",
      "ville",
      "codePostal",
      "pays",
    ];

    // Déclencher la validation uniquement pour ces champs
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(2); // Passer à l'étape 2
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1) as 1 | 2);
  };

  const onSubmit = async (formValues: InscriptionFormValues) => {
    const { cv, image, confirmPassword, termsAccepted, ...userData } =
      formValues;

    const payload: RegisterPayload = {
      user: userData as unknown as RegisterType,
      cv,
      image,
    };

    try {
       await register(payload);
       form.reset(); 
       toast({
        title: "Inscription Reussie !!!",
        description: "Veuillez-vous connectez votre compte !"
       })
       navigate("/login"); 
    } catch (error) {
      toast({
        title: "Erreur lors de l'inscription",
        description:"Un probleme est survenu lors de l'inscription"
      })
      console.log(error); 
    }
  };

  const StepIndicator = ({
    step,
    label,
    active,
    completed,
  }: {
    step: number;
    label: string;
    active: boolean;
    completed: boolean;
  }) => (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-white mb-1",
          active ? "bg-purple-600" : completed ? "bg-green-500" : "bg-gray-300"
        )}
      >
        {completed ? <Check className="h-5 w-5" /> : step}
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Regoingnez AMAME</title>
        <meta name="description" content="Rejoignez AMAME" />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        {/* <Navbar /> */}

        <main className="flex-grow py-12 bg-gradient-to-b from-purple-50 to-blue-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                Formulaire d'Inscription
              </h1>
              <p className="text-gray-600">
                Rejoignez l'Association Malienne d'Appui aux Meilleurs Eleves
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex justify-center items-center">
                  <StepIndicator
                    step={1}
                    label="Informations"
                    active={currentStep === 1}
                    completed={currentStep > 1}
                  />
                  <div
                    className={`h-1 w-16 md:w-24 mr-5 ${
                      currentStep > 1 ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  ></div>
                  <StepIndicator
                    step={2}
                    label="Profil"
                    active={currentStep === 2}
                    completed={currentStep > 2}
                  />
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-6">
                        Informations personnelles
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="nom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom</FormLabel>
                              <FormControl>
                                <Input placeholder="Votre nom" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="prenom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prénom</FormLabel>
                              <FormControl>
                                <Input placeholder="Votre prénom" {...field} />
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="votre.email@example.com"
                                  type="email"
                                  {...field}
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
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Votre numéro de téléphone"
                                  {...field}
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
                              <FormLabel>Mot de Pass</FormLabel>
                              <FormControl>
                                <Input placeholder="********" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmer le mot de pass</FormLabel>
                              <FormControl>
                                <Input placeholder="********" {...field} />
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
                              <FormLabel>Date de naissance</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd MMMM yyyy", {
                                          locale: fr,
                                        })
                                      ) : (
                                        <span>Sélectionnez une date</span>
                                      )}
                                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() ||
                                      date < new Date("1900-01-01")
                                    }
                                    initialFocus
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
                              <FormLabel>Genre</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="HOMME" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Homme
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="FEMME" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Femme
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="adresse"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <Input placeholder="Votre ville" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="etablissement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Etablissement</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Votre ecole, lycee, universite"
                                  {...field}
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
                              <FormLabel>Ville</FormLabel>
                              <FormControl>
                                <Input placeholder="Votre ville" {...field} />
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
                              <FormLabel>Code postal</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Votre code postal"
                                  {...field}
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
                            <FormItem className="md:col-span-2">
                              <FormLabel>Pays</FormLabel>
                              <FormControl>
                                <Input placeholder="Votre pays" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-8 flex justify-end">
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Suivant <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Professional Profile */}
                  {currentStep === 2 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-6">
                        Profil professionnel
                      </h2>

                      <div className="grid grid-cols-1 gap-6">
                        <FormField
                          control={form.control}
                          name="niveauEtude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Niveau d'études</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez votre niveau d'études" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {educationLevels.map((level) => (
                                    <SelectItem
                                      key={level.value}
                                      value={level.value}
                                    >
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
                              <FormLabel>Selectionnez une image</FormLabel>
                              <FormControl>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  // On ne passe PAS value ici !
                                  onChange={(e) => {
                                    field.onChange(e.target.files?.[0] || null);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Une image recente(Photo Profil, Optionnel)
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
                              <FormLabel>
                                Selectionnez votre fichier CV
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  // On ne passe PAS value ici !
                                  onChange={(e) => {
                                    field.onChange(e.target.files?.[0] || null);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Un cv recente (Optionnel)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="termsAccepted"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value === true}
                                    onCheckedChange={(checked) => {
                                      field.onChange(
                                        checked === true ? true : undefined
                                      );
                                    }}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    J'accepte les conditions générales
                                    d'adhésion et la politique de
                                    confidentialité, et je certifie l'exactitude
                                    des informations fournies
                                  </FormLabel>
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-8 flex justify-between">
                        <Button
                          type="button"
                          onClick={prevStep}
                          variant="outline"
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
                        </Button>
                        <Button
                          type="submit"
                          disabled={isRegistering}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isRegistering
                            ? "Inscription en cours..."
                            : "S'inscrire"}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          </div>
        </main>

        {/* <Footer /> */}
      </div>
    </>
  );
};

export default Register;
