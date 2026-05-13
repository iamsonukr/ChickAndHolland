"use server";

import { cookies } from "next/headers";
import { API_URL, getApiUrl } from "../constants";
import { LoginForm } from "../formSchemas";
import { actionClient } from "./safe-action";
import z from "zod";

const disposableEmailDomains = [
  "10minutemail.com",
  "dispostable.com",
  "fakeinbox.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.com",
  "guerrillamail.net",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "moakt.com",
  "sharklasers.com",
  "temp-mail.org",
  "tempail.com",
  "tempmail.com",
  "tempmailo.com",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.net",
] as const;

const isDisposableEmailDomain = (email: string) => {
  const [, domain = ""] = email.trim().toLowerCase().split("@");

  return disposableEmailDomains.some(
    (blockedDomain) =>
      domain === blockedDomain || domain.endsWith(`.${blockedDomain}`),
  );
};

const enquireNowFormSchema = z.object({
  firstName: z.string().min(1, {
    message: "First Name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last Name is required",
  }),
  contactNumber: z.string().min(1, {
    message: "Contact Number is required",
  }),
  email: z.string().email({
    message: "Invalid Email Address",
  }).refine((value) => !isDisposableEmailDomain(value), {
    message:
      "Please use a business or personal email address. Temporary email services are not allowed.",
  }),
  city: z.string().min(1, {
    message: "City is required",
  }),
  country: z.string().min(1, {
    message: "Country is required",
  }),
  message: z.string().min(1, {
    message: "Message is required",
  }),
  productCodes: z.string().min(1, {
    message: "Product Code is required",
  }),
  page: z.string().optional(),
  recaptchaToken: z.string().min(1, {
    message: "Please complete the reCAPTCHA verification",
  }),
});

export const submitEnquiryForm = actionClient
  .schema(enquireNowFormSchema)
  .action(async ({ parsedInput: values }) => {
    try {
      const requestUrl = getApiUrl("/products/enquiry-email");
      console.log("Product Query API Request URL:", requestUrl);
      console.log("Product Query API Request Payload:", values);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      console.log("Product Query API Response Status:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const rawResponse = await response.text();
      let data: any = null;

      try {
        data = rawResponse ? JSON.parse(rawResponse) : null;
      } catch (parseError) {
        console.error("Product Query API Response Parse Error:", parseError);
        console.log("Product Query API Raw Response:", rawResponse);
      }

      console.log("Product Query API Response Body:", data);

      if (!response.ok || !data.success) {
        const validationMessage = Array.isArray(data?.msg)
          ? data.msg
              .map((error: any) => `${error.path}: ${error.msg}`)
              .join(", ")
          : "";

        return {
          success: false,
          status: response.status,
          message:
            data?.message ||
            validationMessage ||
            data?.msg ||
            response.statusText ||
            "Something went wrong",
          error: data,
        };
      }

      return {
        success: true,
        status: response.status,
        message: data.message || "Enquiry submitted successfully",
        queryId: data.queryId,
        emailSent: data.emailSent,
      };
    } catch (error) {
      console.error("Product Query API Error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Something went wrong",
      };
    }
  });

export const loginForm = async (values: LoginForm) => {
  try {
    const res = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      return {
        success: false,
        message: data.message || "Invalid credentials",
      };
    }

    const userId = data.id;
    const token = data.token;
    const rolePermissions = data.rolePermissions || [];
    const oneDay = 24 * 60 * 60;
    const cookieStore = await cookies();
    const accountUsername = data.username || values.userName;
    const accountDisplayName = data.name || accountUsername || "Admin";
    const accountStoreName = data.storeName || "Chic & Holland";

    cookieStore.set("token", token, {
      maxAge: oneDay,
    });
    cookieStore.set("userId", userId, {
      maxAge: oneDay,
    });
    cookieStore.set("rolePermissions", JSON.stringify(rolePermissions), {
      maxAge: oneDay,
    });
    cookieStore.set("userType", "ADMIN", {
      maxAge: oneDay,
    });
    cookieStore.set("accountDisplayName", accountDisplayName, {
      maxAge: oneDay,
    });
    cookieStore.set("accountUsername", accountUsername, {
      maxAge: oneDay,
    });
    cookieStore.set("accountStoreName", accountStoreName, {
      maxAge: oneDay,
    });

    return {
      success: true,
      message: "Login successful",
      ...data,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Something went wrong",
    };
  }
};

export const retailerLoginForm = async (values: LoginForm) => {
  try {
    const res = await fetch(`${API_URL}/retailers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok || !data.success || !data.token || !data.retailerId) {
      return {
        success: false,
        message: data.message || "Invalid username or password",
      };
    }

    const oneDay = 24 * 60 * 60;
    const accountUsername = data.username || values.userName;
    const accountDisplayName =
      data.name || data.retailerName || accountUsername || "Retailer";
    const accountStoreName = data.storeName || "Store";
    const cookieStore = await cookies();

    cookieStore.set("token", data.token, {
      httpOnly: true,
      maxAge: oneDay,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("retailerId", String(data.retailerId), {
      httpOnly: false,
      maxAge: oneDay,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("userType", "RETAILER", {
      httpOnly: false,
      maxAge: oneDay,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("countryId", String(data.countryId ?? ""), {
      httpOnly: false,
      maxAge: oneDay,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("currencyId", String(data.currencyId ?? ""), {
      httpOnly: false,
      maxAge: oneDay,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("accountDisplayName", accountDisplayName, {
      httpOnly: false,
      maxAge: oneDay,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("accountUsername", accountUsername, {
      httpOnly: false,
      maxAge: oneDay,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("accountStoreName", accountStoreName, {
      httpOnly: false,
      maxAge: oneDay,
      sameSite: "lax",
      path: "/",
    });

    return {
      success: true,
      message: "Login successful",
      ...data,
    };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, message: "Something went wrong" };
  }
};

export const logout = actionClient.action(async () => {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("token");
    cookieStore.delete("userId");
    cookieStore.delete("roleDetails");
    cookieStore.delete("userType");
    cookieStore.delete("retailerId");
    cookieStore.delete("rolePermissions");
    cookieStore.delete("countryId");
    cookieStore.delete("currencyId");
    cookieStore.delete("accountDisplayName");
    cookieStore.delete("accountUsername");
    cookieStore.delete("accountStoreName");
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Something went wrong",
    };
  }
});
