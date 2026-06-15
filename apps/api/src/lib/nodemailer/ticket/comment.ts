import handlebars from "handlebars";
import { prisma } from "../../../prisma";
import { buildTicketTemplateContext } from "./templateContext";
import { createTransportProvider } from "../transport";

export async function sendComment(comment: string, ticket: any) {
  try {
    const provider = await prisma.email.findFirst();

    const transport = await createTransportProvider();

    const testhtml = await prisma.emailTemplate.findFirst({
      where: {
        type: "ticket_comment",
      },
    });

    if (!ticket?.email) {
      return;
    }

    var template = handlebars.compile(testhtml?.html || "");
    var replacements = buildTicketTemplateContext(ticket, {
      comment,
    });
    var htmlToSend = template(replacements);

    console.log("Sending email to: ", ticket.email);
    await transport
      .sendMail({
        from: provider?.reply,
        to: ticket.email,
        subject: `New comment on Issue #${ticket.title} ref: #${ticket.Number || ticket.id}`,
        text: `Hello there, Issue #${ticket.title}, has had an update with a comment of ${comment}`,
        html: htmlToSend,
      })
      .then((info: any) => {
        console.log("Message sent: %s", info.messageId);
      })
      .catch((err: any) => console.log(err));
  } catch (error) {
    console.log(error);
  }
}
