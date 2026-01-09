import { defineMiddlewares } from "@medusajs/framework/http";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/admin-upload-image",
      bodyParser: {
        sizeLimit: "5mb",
      },
    },
  ],
});
