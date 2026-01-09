import { createProductCategoriesWorkflow, deleteProductsWorkflow, updateProductsWorkflow } from "@medusajs/core-flows";
import { MedusaRequest, MedusaResponse, refetchEntities } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils";

type AdminProductUpdate = {
  title?: string;
  description?: string;
  price?: number | string;
  sku?: string;
  quantity?: number;
  category?: string;
  image?: string;
  image_url?: string;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as AdminProductUpdate;
  const productId = req.params.id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: existingData } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id", "variants.prices.id", "variants.prices.currency_code", "metadata"],
    filters: { id: productId },
  });
  const existingProduct = existingData[0];

  if (!existingProduct) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product with id "${productId}" not found`);
  }

  let categoryId: string | undefined;
  if (body.category) {
    const { data: categories } = await refetchEntities({
      entity: "product_category",
      idOrFilter: { name: body.category },
      scope: req.scope,
      fields: ["id", "name"],
    });
    if (categories[0]) {
      categoryId = categories[0].id;
    } else {
      const { result } = await createProductCategoriesWorkflow(req.scope).run({
        input: {
          product_categories: [{ name: body.category, is_active: true }],
        },
      });
      categoryId = result[0]?.id;
    }
  }

  const storeModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();
  const metadata = (store?.metadata || {}) as Record<string, unknown>;
  const settings = (metadata["daw_store"] || {}) as { currency?: string };
  const defaultCurrency =
    store?.supported_currencies?.find((currency) => currency.is_default) ||
    store?.supported_currencies?.[0];
  const currencyCode = (settings.currency || defaultCurrency?.currency_code || "usd").toLowerCase();

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    update.title = body.title.trim();
  }
  if (typeof body.description === "string") {
    update.description = body.description;
  }
  if (categoryId) {
    update.categories = [{ id: categoryId }];
  }
  if (typeof body.quantity === "number") {
    update.metadata = {
      ...(existingProduct.metadata || {}),
      admin_quantity: body.quantity,
    };
  }

  const imageUrl = body.image_url || body.image;
  if (imageUrl) {
    update.images = [{ url: imageUrl }];
    update.thumbnail = imageUrl;
  }

  const rawPrice = typeof body.price === "string" ? Number(body.price) : body.price;
  const variant = existingProduct.variants?.[0];
  const variantId = variant?.id;
  if (Number.isFinite(rawPrice) && variantId) {
    const existingPrice = variant?.prices?.find((price: any) => price.currency_code === currencyCode);
    const priceInput: { id?: string; amount: number; currency_code: string } = {
      amount: Math.round(Number(rawPrice) * 100),
      currency_code: currencyCode,
    };
    if (existingPrice?.id) {
      priceInput.id = existingPrice.id;
    }
    update.variants = [
      {
        id: variantId,
        sku: typeof body.sku === "string" ? body.sku.trim() : undefined,
        prices: [
          priceInput,
        ],
      },
    ];
  }

  if (!Object.keys(update).length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "No valid fields provided");
  }

  await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id: productId },
      update,
    },
  });

  const { data: productData } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "thumbnail",
      "images.url",
      "variants.id",
      "variants.sku",
      "variants.inventory_quantity",
      "variants.prices.amount",
      "variants.prices.currency_code",
      "categories.id",
      "categories.name",
      "collection.id",
      "collection.title",
      "metadata",
    ],
    filters: {
      id: productId,
    },
  });
  const product = productData[0];

  res.status(200).json({ product });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id;
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  await deleteProductsWorkflow(req.scope).run({
    input: { ids: [productId] },
  });

  logger.info(`Deleted product ${productId}`);
  res.status(200).json({
    id: productId,
    object: "product",
    deleted: true,
  });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: productData } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "thumbnail",
      "images.url",
      "variants.id",
      "variants.sku",
      "variants.inventory_quantity",
      "variants.prices.amount",
      "variants.prices.currency_code",
      "categories.id",
      "categories.name",
      "collection.id",
      "collection.title",
      "metadata",
    ],
    filters: {
      id: productId,
    },
  });
  const product = productData[0];

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product with id "${productId}" not found`);
  }

  res.status(200).json({ product });
}
