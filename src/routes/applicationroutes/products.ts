import express, { Response } from "express";
import prisma from "../../prismaconfig";
import authMiddleware from "../../middleware/authmiddleware";

interface AuthenticatedRequest extends express.Request {
    userId?: number;
}

const productsRouter = express.Router();

productsRouter.get("/",authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
        const userId = req.userId;
        if (!userId) {
          return res.status(401).json({
            message: "User not authenticated"
            });
        }

      const products = await prisma.product.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      return res.status(200).json({
        message: "Products retrieved successfully",
          data: products
      });

} catch (error) {
  console.error("Error retrieving products:", error);

  return res.status(500).json({
    message: "Failed to retrieve products"
  });
}
});

export default productsRouter;