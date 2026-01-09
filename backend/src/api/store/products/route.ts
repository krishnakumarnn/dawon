import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve("query");
    
    // Fetch products from database (query.graph may return { data, metadata })
    const raw = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "status",
        "created_at",
        "updated_at",
      ],
    });

    const items = (raw && (raw.data ?? raw)) || [];

    res.json({
      products: items,
      count: Array.isArray(items) ? items.length : 0,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Failed to fetch products",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
