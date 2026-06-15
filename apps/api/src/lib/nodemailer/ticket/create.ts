import handlebars from "handlebars";
import { prisma } from "../../../prisma";
import { buildTicketTemplateContext } from "./templateContext";
import {
  getEmailTemplateSettings,
  shouldSendTicketCreatedEmail,
} from "./settings";
import { createTransportProvider } from "../transport";

export async function sendTicketCreate(
  ticket: any,
  source: "internal" | "public"
) {
  try {
    const email = await prisma.email.findFirst();

    if (email && ticket?.email) {
      const settings = await getEmailTemplateSettings();

      if (!shouldSendTicketCreatedEmail(settings, source)) {
        return;
      }

      const transport = await createTransportProvider();

      const testhtml = await prisma.emailTemplate.findFirst({
        where: {
          type: "ticket_created",
        },
      });

      var template = handlebars.compile(testhtml?.html || "");
      var replacements = buildTicketTemplateContext(ticket);
      var htmlToSend = template(replacements);

      await transport
        .sendMail({
          from: email?.reply,
          to: ticket.email,
          subject: `Issue #${ticket.id} has just been created & logged`,
          text: `Hello there, Issue #${ticket.id}, which you reported on ${ticket.createdAt}, has now been created and logged`,
          html: htmlToSend,
        })
        .then((info: any) => {
          console.log("Message sent: %s", info.messageId);
        })
        .catch((err: any) => console.log(err));
    }
  } catch (error) {
    console.log(error);
  }
}
