import axios from "axios";
import CONFIG from "../config";

type VerifyRecaptchaOptions = {
  token: string;
};

type VerifyRecaptchaResult = {
  success: boolean;
  errorCodes: string[];
};

export const verifyRecaptchaToken = async ({
  token,
}: VerifyRecaptchaOptions): Promise<VerifyRecaptchaResult> => {
  if (!CONFIG.RECAPTCHA_SECRET_KEY) {
    return {
      success: false,
      errorCodes: ["missing-recaptcha-secret"],
    };
  }

  const body = new URLSearchParams({
    secret: CONFIG.RECAPTCHA_SECRET_KEY,
    response: token,
  });

  try {
    const response = await axios.post("https://www.google.com/recaptcha/api/siteverify", body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response.data as {
      success?: boolean;
      ["error-codes"]?: string[];
    };

    const result = {
      success: data.success === true,
      errorCodes: data["error-codes"] ?? [],
    };

    if (!result.success) {
      console.error("reCAPTCHA rejected token:", result.errorCodes);
    }

    return result;
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);

    return {
      success: false,
      errorCodes: ["recaptcha-request-failed"],
    };
  }
};
