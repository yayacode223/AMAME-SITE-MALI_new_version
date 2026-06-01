import { Api } from "@/utils/axiosInstance";
import { useMutation } from "@tanstack/react-query";

const forgotPassword = async (email: string): Promise<void> => {
  await Api.post("/visitor/auth/forgot-password", { email });
};

const resetPassword = async (data: { token: string; newPassword: string }): Promise<void> => {
  await Api.post("/visitor/auth/reset-password", data);
};

export const useForgotPassword = () =>
  useMutation({ mutationFn: forgotPassword });

export const useResetPassword = () =>
  useMutation({ mutationFn: resetPassword });
