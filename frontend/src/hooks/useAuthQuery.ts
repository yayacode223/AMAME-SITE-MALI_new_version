// import { useQueryClient } from "@tanstack/react-query";
// import { useGetCurrentUser, authKeys } from "@/service/userService";
// import { useEffect, useState } from "react";

// const GUEST_MODE_KEY = "amame_guest_mode";

// export const useAuthQuery = () => {
//   const queryClient = useQueryClient();
//   const [isGuest, setIsGuest] = useState(() => {
//     return localStorage.getItem(GUEST_MODE_KEY) === "true";
//   });

//   // La requête est désactivée si on est en mode guest
//   const {
//     data: user,
//     isLoading,
//     error,
//     refetch,
//   } = useGetCurrentUser({
//     enabled: !isGuest, // ← La condition est ICI, pas dans le service
//   });

//   useEffect(() => {
//     if (error) {
//       const status = (error as any)?.response?.status;
//       if (status === 401 || status === 403) {
//         localStorage.setItem(GUEST_MODE_KEY, "true");
//         setIsGuest(true);
//       }
//     }
//   }, [error]);

//   const refetchUser = async () => {
//     localStorage.removeItem(GUEST_MODE_KEY);
//     setIsGuest(false);
//     return refetch();
//   };

//   const clearUser = () => {
//     localStorage.setItem(GUEST_MODE_KEY, "true");
//     setIsGuest(true);
//     queryClient.setQueryData(authKeys.currentUser(), null);
//   };

//   return {
//     user: user ?? null,
//     isLoading,
//     isAuthenticated: !!user && !isGuest,
//     isGuest,
//     refetchUser,
//     clearUser,
//   };
// };
