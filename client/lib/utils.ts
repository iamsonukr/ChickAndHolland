import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_URL } from "./constants";
import { imageFormatsSupportedByPDF } from "@/lib/formSchemas";

export let fresh = "Store Web Order";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCookie(name: string) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

export const getJpegImage = async (imageUrl: string) => {
  const url = `${API_URL}/image-to-jpeg?imageUrl=${imageUrl}&convertToJpeg=true`;

  // fetch the above url and return the blob  response

  const res = await fetch(url);
  const blob = await res.blob();

  return URL.createObjectURL(blob);
};

export const isImageFormatSupportedByPDF = (imageUrl: string) => {
  const imageFormat = imageUrl.split(".").pop();

  // console.log(imageFormat, imageFormatsSupportedByPDF.includes(imageFormat));

  if (!imageFormat) return false;

  return imageFormatsSupportedByPDF.includes(imageFormat);
};

// Function to calculate the brightness of a color
const getBrightness = (color: string) => {
  const rgb = parseInt(color.slice(1), 16); // Remove '#' and parse to integer
  const r = (rgb >> 16) & 0xff; // Red
  const g = (rgb >> 8) & 0xff; // Green
  const b = (rgb >> 0) & 0xff; // Blue

  // Calculate brightness using the luminosity formula
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

export const generateRandomColour = () => {
  const randomColor =
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");

  const brightness = getBrightness(randomColor);
  const textColor = brightness > 186 ? "#000000" : "#FFFFFF"; // Choose black for light colors and white for dark colors

  return {
    background: randomColor,
    text: textColor,
  };
};
