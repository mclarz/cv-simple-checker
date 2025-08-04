import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { validateCV, validateCVWithN8n } from "~/server/services/cvValidator";

export const cvRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        fullName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        skills: z.string(),
        experience: z.string(),
        pdfPath: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      console.log("Validation input:", input);
      const validationResult = await validateCVWithN8n(input);
      console.log("Validation Result:", validationResult);

      if (validationResult.isValid) {
        await ctx.db.user.create({ data: input });
        return { status: "success", message: "CV submitted successfully!" };
      } else {
        return {
          status: "fail",
          message:
            "CV validation failed. Mismatched fields are: " +
            validationResult.matchedFields.join(", "),
          errors: validationResult.errors,
        };
      }
    }),
});
