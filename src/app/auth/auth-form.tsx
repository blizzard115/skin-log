"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "./actions";

type AuthFormProps = {
  mode: "login" | "signup";
  notice?: string;
};

const initialState: AuthActionState = {};

const inputClassName =
  "mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

export function AuthForm({ mode, notice }: AuthFormProps) {
  const isLogin = mode === "login";
  const action = isLogin ? signInAction : signUpAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
      {notice ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="text-sm font-semibold text-slate-900"
          >
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={
              state.fieldErrors?.email ? "email-error" : undefined
            }
            className={inputClassName}
            placeholder="you@example.com"
          />
          {state.fieldErrors?.email ? (
            <p
              id="email-error"
              className="mt-2 text-sm font-medium text-red-600"
            >
              {state.fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-semibold text-slate-900"
          >
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={
              state.fieldErrors?.password ? "password-error" : undefined
            }
            className={inputClassName}
            placeholder="6文字以上"
          />
          {state.fieldErrors?.password ? (
            <p
              id="password-error"
              className="mt-2 text-sm font-medium text-red-600"
            >
              {state.fieldErrors.password}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center rounded-lg bg-sky-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending
            ? isLogin
              ? "ログイン中..."
              : "登録中..."
            : isLogin
              ? "ログイン"
              : "新規登録"}
        </button>

        {state.error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {state.success}
          </p>
        ) : null}

        <p className="mt-5 text-sm leading-6 text-slate-500">
          {isLogin
            ? "アカウントをお持ちでない方は"
            : "すでにアカウントをお持ちの方は"}
          <Link
            href={isLogin ? "/auth/signup" : "/auth/login"}
            className="ml-1 font-semibold text-sky-700 transition-colors hover:text-sky-800"
          >
            {isLogin ? "新規登録" : "ログイン"}
          </Link>
          へ進んでください。
        </p>
      </div>
    </form>
  );
}
