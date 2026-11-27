import { z } from "zod";

const username = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_.]+$/, "Only letters, numbers, underscores, and dots");

const password = z.string().min(8, "Password must be at least 8 characters");

export const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username,
  email: z.email("Invalid email address"),
  password,
});

export const onboardingSchema = z.object({
  displayUsername: username,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;
