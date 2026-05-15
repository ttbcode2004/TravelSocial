import { useEffect, useState } from "react";

import {
  useSearchParams,
  Link,
} from "react-router-dom";

import { api } from "../../lib/api";

import { Spinner } from "../../components/ui/Avatar";

import {
  CheckCircle,
  XCircle,
} from "lucide-react";

type VerifyState = {
  status:
    | "loading"
    | "success"
    | "error";

  message: string;
};

export default function VerifyEmailPage() {
  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token");

  const [state, setState] =
    useState<VerifyState>({
      status: token
        ? "loading"
        : "error",

      message: token
        ? ""
        : "Token không hợp lệ.",
    });

  useEffect(() => {
    if (!token) return;

    const verifyEmail =
      async () => {
        try {
          const res =
            await api.get(
              `/auth/verify-email?token=${token}`
            );

          setState({
            status: "success",

            message:
              res.data.message,
          });
        } catch (err: any) {
          setState({
            status: "error",

            message:
              err?.response?.data
                ?.message ??
              "Token không hợp lệ hoặc đã hết hạn.",
          });
        }
      };

    verifyEmail();
  }, [token]);

  return (
    <div className="card p-10 text-center animate-slide-up">
      {state.status ===
        "loading" && (
        <>
          <Spinner className="w-10 h-10 mx-auto mb-4" />

          <h2 className="text-lg font-semibold">
            Đang xác nhận
            email...
          </h2>
        </>
      )}

      {state.status ===
        "success" && (
        <>
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle
              size={32}
              className="text-success"
            />
          </div>

          <h2 className="text-xl font-semibold mb-2">
            Xác nhận thành
            công!
          </h2>

          <p className="text-sm text-fg-muted mb-6">
            {state.message}
          </p>

          <Link
            to="/login"
            className="btn-primary px-8"
          >
            Đăng nhập ngay
          </Link>
        </>
      )}

      {state.status ===
        "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <XCircle
              size={32}
              className="text-danger"
            />
          </div>

          <h2 className="text-xl font-semibold mb-2">
            Xác nhận thất bại
          </h2>

          <p className="text-sm text-fg-muted mb-6">
            {state.message}
          </p>

          <div className="flex gap-3 justify-center">
            <Link
              to="/login"
              className="btn-secondary px-6"
            >
              Đăng nhập
            </Link>

            <Link
              to="/register"
              className="btn-primary px-6"
            >
              Đăng ký
            </Link>
          </div>
        </>
      )}
    </div>
  );
}