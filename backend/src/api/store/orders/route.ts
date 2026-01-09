import { updateStoresWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError, Modules } from "@medusajs/framework/utils";

type StoreOrderItem = {
  id: string;
  title: string;
  quantity: number;
  price: number;
  image?: string | null;
};

type StoreOrder = {
  id: string;
  customerName: string;
  email: string;
  customerKey?: string;
  total: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  items: StoreOrderItem[];
  itemsCount: number;
  date: string;
  createdAt: string;
  shippingAddress: string;
};

const SETTINGS_KEY = "daw_store";
const ORDERS_KEY = "daw_store_orders";

const buildAddress = (payload: any) => {
  const parts = [
    payload.address,
    payload.city,
    payload.state,
    payload.zipCode,
    payload.country,
  ].filter(Boolean);
  return parts.join(", ");
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const getEmailLocal = (email: string) => email.split("@")[0] || "";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const orders = ((metadata[ORDERS_KEY] || []) as StoreOrder[]).slice().reverse();
  const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
  const name = typeof req.query.name === "string" ? req.query.name.trim().toLowerCase() : "";
  const customerKey = typeof req.query.customerKey === "string" ? req.query.customerKey.trim() : "";
  const filtered = email || name || customerKey
    ? orders.filter((order) => {
        const orderEmail = (order.email || "").toLowerCase();
        const orderName = (order.customerName || "").toLowerCase();
        const orderEmailLocal = getEmailLocal(orderEmail);
        const normalizedQuery = normalize(name);
        const normalizedName = normalize(orderName);
        const normalizedEmailLocal = normalize(orderEmailLocal);
        const matchesCustomerKey = customerKey ? order.customerKey === customerKey : false;
        const matchesEmail = email ? orderEmail === email : false;
        const matchesName = name
          ? (
              normalizedName === normalizedQuery ||
              normalizedEmailLocal === normalizedQuery ||
              normalizedEmailLocal.includes(normalizedQuery) ||
              normalizedQuery.includes(normalizedEmailLocal)
            )
          : false;
        return matchesCustomerKey || matchesEmail || matchesName;
      })
    : orders;

  res.status(200).json({ orders: filtered });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const payload = (req.body || {}) as {
    customerName?: string;
    email?: string;
    customerKey?: string;
    total?: number;
    currency?: string;
    items?: StoreOrderItem[];
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  if (!payload.email || !payload.customerName || !Array.isArray(payload.items)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing required order fields");
  }

  const settings = ((store.metadata || {}) as Record<string, any>)[SETTINGS_KEY] || {};
  const currency = payload.currency || settings.currency || "USD";
  const normalizedEmail = payload.email.trim().toLowerCase();
  const createdAt = new Date().toISOString();
  const order: StoreOrder = {
    id: `ORD-${Date.now()}`,
    customerName: payload.customerName.trim(),
    email: normalizedEmail,
    customerKey: payload.customerKey?.trim() || undefined,
    total: typeof payload.total === "number" ? payload.total : 0,
    currency,
    status: "pending",
    items: payload.items,
    itemsCount: payload.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    date: createdAt.slice(0, 10),
    createdAt,
    shippingAddress: buildAddress(payload),
  };

  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const existingOrders = (metadata[ORDERS_KEY] || []) as StoreOrder[];
  const nextOrders = [...existingOrders, order];

  await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id },
      update: {
        metadata: {
          ...metadata,
          [ORDERS_KEY]: nextOrders,
        },
      },
    },
  });

  res.status(200).json({ order });
}
