"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import nodemailer from "nodemailer";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    signalCode: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    // We expect GMAIL_USER and GMAIL_APP_PASSWORD to be set in Convex environment variables.
    // Given password from prompt: pcgwepxuxpnydgdr
    const user = process.env.GMAIL_USER || "your-email@gmail.com"; 
    const pass = process.env.GMAIL_APP_PASSWORD || "pcgwepxuxpnydgdr"; 

    if (!user || !pass) {
      throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass,
      },
    });

    const signalCodeHtml = args.signalCode 
      ? `<div style="margin: 20px 0; padding: 15px; background-color: #1e293b; border-radius: 8px; border-left: 4px solid #3b82f6;">
           <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: bold;">Signal Code</p>
           <p style="margin: 5px 0 0 0; color: #f8fafc; font-size: 24px; font-weight: 900; letter-spacing: 2px;">${args.signalCode}</p>
         </div>`
      : "";

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 150px; height: auto; }
          .content { background-color: #1e293b; border-radius: 16px; padding: 30px; border: 1px solid #334155; }
          .message { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; white-space: pre-wrap; }
          .mascot-container { text-align: center; margin-top: 40px; margin-bottom: 20px; }
          .mascot { max-width: 120px; height: auto; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
          .footer a { color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://luxx.team/email/luxurious_logo.webp" alt="Luxurious Logo" class="logo" />
          </div>
          
          <div class="content">
            <div class="message">${args.text}</div>
            ${signalCodeHtml}
            
            <div class="mascot-container">
              <img src="https://luxx.team/email/back-right.webp" alt="Mascot" class="mascot" />
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Luxurious Trading. All rights reserved.</p>
            <p>Visit us at <a href="https://luxx.team">luxx.team</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"Luxurious Trading" <${user}>`,
        to: args.to,
        subject: args.subject,
        text: args.text, // fallback
        html: htmlBody,
      });
      return { success: true };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email: " + error.message);
    }
  },
});
