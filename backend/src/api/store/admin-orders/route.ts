import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError, Modules } from "@medusajs/framework/utils";

type StoreOrder = {
  id: string;
  customerName: string;
  email: string;
  total: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  itemsCount: number;
  date: string;
  shippingAddress: string;
};

const ORDERS_KEY = "daw_store_orders";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const orders = ((metadata[ORDERS_KEY] || []) as StoreOrder[]).slice().reverse();

  res.status(200).json({ orders });
}
