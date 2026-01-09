import { updateStoresWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils";

type StoreSettingsPayload = {
  storeName?: string;
  storeDescription?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  currency?: string;
  businessHours?: string;
  logoUrl?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  logo?: string;
};

const SETTINGS_KEY = "daw_store";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const settings = (metadata[SETTINGS_KEY] || {}) as StoreSettingsPayload;
  const defaultCurrency =
    store.supported_currencies?.find((currency) => currency.is_default)?.currency_code ||
    store.supported_currencies?.[0]?.currency_code ||
    "USD";

  res.status(200).json({
    settings: {
      storeName: store.name || "DAW Store",
      storeDescription: settings.storeDescription || "Your premier digital audio workstation equipment store",
      email: settings.email || "info@dawstore.com",
      phone: settings.phone || "(555) 123-4567",
      address: settings.address || "123 Music Street",
      city: settings.city || "Nashville",
      state: settings.state || "Tennessee",
      zipCode: settings.zipCode || "37201",
      country: settings.country || "United States",
      currency: settings.currency || defaultCurrency,
      businessHours: settings.businessHours || "Monday - Friday: 9AM - 6PM EST",
      logoUrl: settings.logoUrl || "",
      facebook: settings.facebook || "",
      instagram: settings.instagram || "",
      twitter: settings.twitter || "",
      linkedin: settings.linkedin || "",
      logo: settings.logo || "",
    },
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const payload = (req.body || {}) as StoreSettingsPayload;
  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const nextSettings: StoreSettingsPayload = {
    ...((metadata[SETTINGS_KEY] || {}) as StoreSettingsPayload),
    ...payload,
  };

  await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id },
      update: {
        name: payload.storeName || store.name,
        metadata: {
          ...metadata,
          [SETTINGS_KEY]: nextSettings,
        },
      },
    },
  });

  logger.info(`Updated store settings for ${store.id}`);

  res.status(200).json({ settings: nextSettings });
}
