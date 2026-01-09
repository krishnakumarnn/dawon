import { createProductCategoriesWorkflow, createProductsWorkflow } from "@medusajs/core-flows";
import { MedusaRequest, MedusaResponse, refetchEntities } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils";

type AdminProductInput = {
  title?: string;
  description?: string;
  price?: number | string;
  sku?: string;
  quantity?: number;
  category?: string;
  image?: string;
  image_url?: string;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const limit = Number(req.query.limit ?? 200);
  const offset = Number(req.query.offset ?? 0);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products, metadata } = await query.graph({
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
    pagination: {
      skip: Number.isFinite(offset) && offset >= 0 ? offset : 0,
      take: Number.isFinite(limit) && limit > 0 ? limit : 200,
    },
  });

  res.status(200).json({
    products,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as AdminProductInput;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const rawPrice = typeof body.price === "string" ? Number(body.price) : body.price;

  if (!title) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Product title is required");
  }
  if (!sku) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "SKU is required");
  }
  if (!Number.isFinite(rawPrice)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Valid price is required");
  }

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = req.scope.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = req.scope.resolve(Modules.STORE);

  const [store] = await storeModuleService.listStores();
  const metadata = (store?.metadata || {}) as Record<string, unknown>;
  const settings = (metadata["daw_store"] || {}) as { currency?: string };
  const defaultCurrency =
    store?.supported_currencies?.find((currency) => currency.is_default) ||
    store?.supported_currencies?.[0];
  const currencyCode = (settings.currency || defaultCurrency?.currency_code || "usd").toLowerCase();

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
  const shippingProfile = shippingProfiles[0];
  if (!shippingProfile) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "No default shipping profile found");
  }

  const salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });
  const defaultSalesChannel = salesChannels[0];
  if (!defaultSalesChannel) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "No default sales channel found");
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

  const imageUrl = body.image_url || body.image;
  const { result } = await createProductsWorkflow(req.scope).run({
    input: {
      products: [
        {
          title,
          description: body.description,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          sales_channels: [{ id: defaultSalesChannel.id }],
          category_ids: categoryId ? [categoryId] : undefined,
          images: imageUrl ? [{ url: imageUrl }] : undefined,
          metadata: {
            admin_quantity: typeof body.quantity === "number" ? body.quantity : 0,
          },
          options: [
            {
              title: "Default",
              values: ["Default"],
            },
          ],
          variants: [
            {
              title,
              sku,
              options: {
                Default: "Default",
              },
              prices: [
                {
                  amount: Math.round(Number(rawPrice) * 100),
                  currency_code: currencyCode,
                },
              ],
            },
          ],
        },
      ],
    },
  });

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
      id: result[0].id,
    },
  });
  const product = productData[0];

  logger.info(`Created product ${product?.id || ""}`);
  res.status(200).json({ product });
}
