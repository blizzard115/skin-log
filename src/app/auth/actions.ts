"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

function getTextField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

function validateAuthForm(formData: FormData) {
  const email = getTextField(formData, "email");
  const password = getTextField(formData, "password");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (email === "") {
    fieldErrors.email = "メールアドレスを入力してください";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "メールアドレスの形式で入力してください";
  }

  if (password === "") {
    fieldErrors.password = "パスワードを入力してください";
  } else if (password.length < 6) {
    fieldErrors.password = "パスワードは6文字以上で入力してください";
  }

  return {
    email,
    password,
    fieldErrors,
    hasErrors: Boolean(fieldErrors.email || fieldErrors.password),
  };
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateAuthForm(formData);

  if (validation.hasErrors) {
    return {
      fieldErrors: validation.fieldErrors,
      error: "入力内容を確認してください。",
    };
  }

  const supabase = await createSupabaseServerClient();

  try {
    const { error } = await supabase.auth.signUp({
      email: validation.email,
      password: validation.password,
    });

    if (error) {
      return {
        error: "新規登録できませんでした。入力内容を確認してください。",
      };
    }
  } catch {
    return {
      error: "新規登録できませんでした。時間をおいてもう一度お試しください。",
    };
  }

  revalidatePath("/", "layout");
  redirect("/records/new?auth=signup");
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateAuthForm(formData);

  if (validation.hasErrors) {
    return {
      fieldErrors: validation.fieldErrors,
      error: "入力内容を確認してください。",
    };
  }

  const supabase = await createSupabaseServerClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: validation.email,
      password: validation.password,
    });

    if (error) {
      return {
        error: "ログインできませんでした。メールアドレスまたはパスワードを確認してください。",
      };
    }
  } catch {
    return {
      error: "ログインできませんでした。時間をおいてもう一度お試しください。",
    };
  }

  revalidatePath("/", "layout");
  redirect("/records/new?auth=login");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  try {
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) {
      await supabase.auth.signOut();
    }
  } catch {
    // Even if the token is already invalid, send the user back to login.
  }

  revalidatePath("/", "layout");
  redirect("/auth/login?notice=logged-out");
}
