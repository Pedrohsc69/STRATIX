import { api } from "../../../services/api";
import type {
  ChangePasswordPayload,
  ProfileResponse,
} from "../types/profile.types";

export async function fetchProfile() {
  const response = await api.get<ProfileResponse>("/users/me");
  return response.data;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await api.patch<{ success: boolean; message: string }>(
    "/auth/change-password",
    payload,
  );

  return response.data;
}

export async function requestOwnPasswordRecovery(email: string) {
  const response = await api.post<{ success: boolean; message: string }>("/auth/forgot-password", {
    email,
  });

  return response.data;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.patch<ProfileResponse>("/users/me/avatar-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
