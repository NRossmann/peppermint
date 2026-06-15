import handlebars from "handlebars";
import { prisma } from "../../../prisma";
import { buildTicketTemplateContext } from "./templateContext";
import {
  getEmailTemplateSettings,
  shouldSendTicketStatusEmail,
} from "./settings";
import { createTransportProvider } from "../transport";

export async function sendTicketStatus(
  ticket: any,
  event: { isResolutionChange: boolean; isStateChange: boolean }
) {
  const email = await prisma.email.findFirst();
  const stateName = ticket.state?.name;

  if (!stateName || !ticket?.email) {
    return;
  }

  if (email) {
    const settings = await getEmailTemplateSettings();

    if (!shouldSendTicketStatusEmail(settings, event)) {
      return;
    }

    const transport = await createTransportProvider();

    const testhtml = await prisma.emailTemplate.findFirst({
      where: {
        type: "ticket_status_changed",
      },
    });

    var template = handlebars.compile(testhtml?.html || "");
    var replacements = buildTicketTemplateContext(ticket, {
      status: stateName.toUpperCase(),
    });
    var htmlToSend = template(replacements);

    await transport
      .sendMail({
        from: email?.reply,
        to: ticket.email,
        subject: `Issue #${
          ticket.Number
        } status is now ${stateName.toUpperCase()}`,
        text: `Hello there, Issue #${
          ticket.Number
        }, now has a status of ${stateName.toUpperCase()}`,
        html: htmlToSend,
      })
      .then((info: any) => {
        console.log("Message sent: %s", info.messageId);
      })
      .catch((err: any) => console.log(err));
  }
}
