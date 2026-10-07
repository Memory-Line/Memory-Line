import { prisma } from "@/lib/prisma";
import { ownerIsActive } from "@/lib/ownerAccess";
import { cleanItems } from "@/lib/forms";

// A form for the public to fill in. It only works while its owner has a working
// account and still has the "questionnaires" feature switched on; otherwise the
// link says "not found". Never gives out the address the answers are sent to.
export async function getFormByToken(token: string) {
  const form = await prisma.sharedForm.findUnique({
    where: { token },
    include: {
      user: { select: { name: true, accountType: true, plan: true, email: true, subscriptionStatus: true, features: true } },
    },
  });
  if (!form) return null;
  if (!form.user.features.includes("questionnaires") || !ownerIsActive(form.user)) return null;
  return {
    id: form.id,
    token: form.token,
    title: form.title,
    intro: form.intro,
    thanks: form.thanks,
    items: cleanItems(form.items),
    notifyEmail: form.notifyEmail,
    // A care home is named after the home; a personal account's name stays private.
    homeName: form.user.accountType === "care-home" ? form.user.name : null,
  };
}
