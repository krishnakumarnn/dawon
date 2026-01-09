import { updateStoresWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError, Modules } from "@medusajs/framework/utils";

type NewsletterEntry = {
  email: string;
  createdAt: string;
};

const NEWSLETTER_KEY = "daw_store_newsletter";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const subscribers = (metadata[NEWSLETTER_KEY] || []) as NewsletterEntry[];

  res.status(200).json({ subscribers });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const payload = (req.body || {}) as { email?: string };
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

  if (!email) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Email is required");
  }

  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const existing = (metadata[NEWSLETTER_KEY] || []) as NewsletterEntry[];

  const already = existing.find((entry) => entry.email === email);
  if (already) {
    res.status(200).json({ subscriber: already });
    return;
  }

  const next = [...existing, { email, createdAt: new Date().toISOString() }];

  await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id },
      update: {
        metadata: {
          ...metadata,
          [NEWSLETTER_KEY]: next,
        },
      },
    },
  });

  res.status(200).json({ subscriber: next[next.length - 1] });
}
