import { z } from "zod";

export const userCodeSchema = z.object({
  code: z.string()
    .min(5, "O código deve ter no mínimo 5 caracteres.")
    .max(5, "O código deve ter no máximo 5 caracteres.")
    .regex(/^V\d{4}$/, "Formato inválido. Use V#### (ex.: V0042)")
    .transform(val => val.toUpperCase().trim())
});

export const activateUserSchema = z.object({
  realName: z.string()
    .min(2, "O nome deve ter no mínimo 2 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres.")
    .regex(/^[a-zA-Z\sÀ-ÿ]+$/, "O nome deve conter apenas letras e espaços.")
    .transform(val => val.trim()),

  ngoId: z.string()
    .min(3, "O ID da ONG é obrigatório.")
    .max(20, "O ID da ONG deve ter no máximo 20 caracteres.")
    .regex(/^(NGO|ONG)-\d{3}$/i, "O ID da ONG deve estar no formato NGO-001 ou ONG-001.")
    .transform(val => val.toUpperCase().trim()),

  dateOfBirth: z.string()
    .min(10, "A data de nascimento é obrigatória.")
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato inválido. Use DD/MM/AAAA")
    .transform(val => val.trim()),

  initialSkills: z.string()
    .max(500, "As habilidades devem ter no máximo 500 caracteres.")
    .transform(val => val.trim())
    .optional()
    .or(z.literal("")),

  phone: z.string()
    .regex(/^\+?\d{8,15}$/, "O telefone deve estar em formato internacional (ex.: +258841234567).")
    .transform(val => val.trim())
    .optional()
    .or(z.literal(""))
});

export const monitorFilterSchema = z.object({
  status: z.enum(['all', 'Ativo', 'Inativo'])
});

export const sanitizeInput = {
  text: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .trim();
  },

  name: (input: string): string => {
    return input
      .replace(/[^a-zA-Z\sÀ-ÿ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  code: (input: string): string => {
    return input
      .toUpperCase()
      .replace(/[^V\d]/g, "")
      .substring(0, 5);
  },

  id: (input: string): string => {
    return input
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .trim();
  }
};

export const validateDate = (dateString: string): boolean => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date >= new Date(1900, 0, 1) &&
    date <= new Date()
  );
};

export type ActivateUserFormData = z.infer<typeof activateUserSchema>;
export type UserCodeFormData = z.infer<typeof userCodeSchema>;
export type MonitorFilterData = z.infer<typeof monitorFilterSchema>;
