import handlebars from "handlebars";
import { prisma } from "../../../prisma";
import { buildTicketTemplateContext } from "./templateContext";
import {
  getEmailTemplateSettings,
  shouldSendTicketAssignedEmail,
} from "./settings";
import { createTransportProvider } from "../transport";

export async function sendAssignedEmail(
  email: any,
  ticket: any,
  trigger: "create" | "transfer"
) {
  try {
    const provider = await prisma.email.findFirst();

    if (provider && email) {
      const settings = await getEmailTemplateSettings();

      if (!shouldSendTicketAssignedEmail(settings, trigger)) {
        return;
      }

      const mail = await createTransportProvider();

      console.log("Sending email to: ", email);

      const testhtml = await prisma.emailTemplate.findFirst({
        where: {
          type: "ticket_assigned",
        },
      });

      var template = handlebars.compile(testhtml?.html || "");
      var htmlToSend = template(buildTicketTemplateContext(ticket));

      await mail
        .sendMail({
          from: provider?.reply,
          to: email,
          subject: `A new ticket has been assigned to you: ${
            ticket?.title || ticket?.id || ""
          }`,
          text: `Hello there, ticket ${
            ticket?.title || ticket?.id || ""
          } has been assigned to you`,
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
