"use server";

import { cookies } from "next/headers";
import { API_URL } from "../constants";
import { LoginForm } from "../formSchemas";
import { actionClient } from "./safe-action";
import z from "zod";

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
});

export const submitEnquiryForm = actionClient
  .schema(enquireNowFormSchema)
  .action(async ({ parsedInput: values }) => {
    try {
      await fetch(`${API_URL}/products/enquiry-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      return {
        success: true,
        message: "Enquiry submitted successfully",
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: "Something went wrong",
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
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Something went wrong",
    };
  }
});
