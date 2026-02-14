import { Resend } from "resend";
import ejs from "ejs";
import path from "path";
import config from "../config";

const resend = new Resend(config.RESEND_API_KEY);

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  const { email, subject, template, data } = options;

  // Get the path to the email template
  const templatePath = path.join(__dirname, "../mails", template);

  // Render with EJS
  const html: string = await ejs.renderFile(templatePath, data);

  // Send with Resend
  await resend.emails.send({
    from: "NGECP <onboarding@happinessani.com>",
    to: email,
    subject,
    html,
  });
};

export default sendMail;

