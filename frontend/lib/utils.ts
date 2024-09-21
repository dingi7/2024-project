import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
}

/**
 * Decodes a Base64 string and converts it into a Blob URL for downloading or viewing.
 * @param base64Data - The Base64-encoded string of the file (e.g., PDF).
 * @param mimeType - The MIME type of the file (e.g., 'application/pdf').
 * @returns A Blob URL that can be used to download or view the file.
 */
export function decodeBase64ToBlobUrl(base64Data: string, mimeType: string = 'application/pdf'): string {
    // Decode the Base64 string
    const byteCharacters = atob(base64Data);
    
    // Convert the decoded string to an array of byte numbers
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
  
    // Convert the byte numbers to a Uint8Array (binary data)
    const byteArray = new Uint8Array(byteNumbers);
  
    // Create a Blob from the binary data and specify the MIME type
    const blob = new Blob([byteArray], { type: mimeType });
  
    // Create a URL for the Blob and return it
    return URL.createObjectURL(blob);
  }
  