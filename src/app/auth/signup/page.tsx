"use client";
import Link from "next/link";

import { signUp } from "@/app/authenticate/auth.action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FcGoogle } from "react-icons/fc";
import { GoogleSignInBtn } from "@/components/GoogleSignInBtn";

export const signUpSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" })
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(6, { message: "Password is too short" })
    .transform((pass) => pass.replace(/\s+/g, ""))
    .refine((pass) => !/\s/.test(pass), {
      message: "Password should not contain spaces",
    }),
});

export const description =
  "A sign up form with first name, last name, email and password inside a card. There's an option to sign up with GitHub and a link to login if you already have an account";

export default function SignupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    mode: "all",
  });

  //TODO handle form submission
  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    const res = await signUp(data);
    if (res.success) {
      toast.success("Signed up successfully 👻");
      router.push("/dashboard");
    } else {
      toast.error(res.error);
    }
  };

  // Handle keydown event for password field to prevent spaces
  const handlePasswordKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === " ") {
      event.preventDefault();
      toast.warning("Space is not allowed in password field", {
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="post"
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  {...register("firstName")}
                  id="first-name"
                  placeholder="Max"
                />
                {errors.firstName && (
                  <p className="text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  {...register("lastName")}
                  id="last-name"
                  placeholder="Robinson"
                />
                {errors.lastName && (
                  <p className="text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                onKeyDown={handlePasswordKeyDown}
                {...register("password")}
                id="password"
                type="password"
              />
              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Create an account
            </Button>
            <GoogleSignInBtn>
              <div className="flex items-center gap-2">
                <FcGoogle size={20} />
                Continue with Google
              </div>
            </GoogleSignInBtn>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
