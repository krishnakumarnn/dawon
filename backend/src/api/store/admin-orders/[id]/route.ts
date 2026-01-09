import { updateStoresWorkflow } from "@medusajs/medusa/core-flows";
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

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id;
  const payload = (req.body || {}) as { status?: StoreOrder["status"] };

  if (!payload.status) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Status is required");
  }

  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const orders = (metadata[ORDERS_KEY] || []) as StoreOrder[];
  const nextOrders = orders.map((order) =>
    order.id === orderId ? { ...order, status: payload.status } : order
  );

  const updated = nextOrders.find((order) => order.id === orderId);
  if (!updated) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Order ${orderId} not found`);
  }

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

  res.status(200).json({ order: updated });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id;
  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Store not found");
  }

  const metadata = (store.metadata || {}) as Record<string, unknown>;
  const orders = (metadata[ORDERS_KEY] || []) as StoreOrder[];
  const nextOrders = orders.filter((order) => order.id !== orderId);

  if (nextOrders.length === orders.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Order ${orderId} not found`);
  }

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

  res.status(200).json({ deleted: orderId });
}
