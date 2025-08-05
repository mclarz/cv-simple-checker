import fs from "fs";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FormData {
  fullName: string;
  email: string;
  phone?: string;
  skills: string;
  experience?: string;
  pdfPath: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  matchedFields: string[];
}

// validate CV using n8n webhook
export async function validateCVWithN8n(formData: FormData) {
  const pdfBuffer = fs.readFileSync(formData.pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  const cvText = pdfData.text;

  // url  can be change once deployed to n8n server
  const response = await fetch(
    // "http://localhost:5678/webhook-test/validate-cv",
    "http://host.docker.internal:5678/webhook-test/validate-cv",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, cvText }),
    },
  );
  return await response.json();
}

// generic validation function using AI
export async function validateCV(
  formData: FormData,
): Promise<ValidationResult> {
  try {
    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(formData.pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const cvText = pdfData.text;

    // Create validation prompt for OpenAI
    const prompt = `
You are a CV validation assistant. Compare the form data with the CV content and determine if they match.

Form Data:
- Full Name: ${formData.fullName}
- Email: ${formData.email}
- Phone: ${formData.phone || "Not provided"}
- Skills: ${formData.skills || "Not provided"}
- Experience: ${formData.experience || "Not provided"}

CV Content:
${cvText}

Please analyze if the form data matches the CV content. Return a JSON response with:
1. "isValid": boolean indicating if all provided form fields match the CV
2. "errors": array of strings describing any mismatches
3. "matchedFields": array of field names that matched successfully

Rules:
- Names should match approximately (consider different formats like "John Smith" vs "Smith, John")
- Email should match exactly if present in CV
- Phone should match (allow for different formatting)
- Skills should be present in the CV (exact matches or synonyms are acceptable)
- Experience should be consistent with what's mentioned in the CV
- If a field is not provided in the form, don't consider it an error
- If a field is not found in the CV, note it as a potential issue but be lenient

Return only valid JSON, no additional text.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that validates CV data. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const validationResult: ValidationResult = JSON.parse(responseText);

    return validationResult;
  } catch (error) {
    console.error("CV validation error:", error);

    // Fallback validation result in case of errors
    return {
      isValid: false,
      errors: [
        "Unable to validate CV due to technical error. Please try again.",
      ],
      matchedFields: [],
    };
  }
}
