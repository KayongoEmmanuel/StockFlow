import express, { Response } from "express";
import prisma from "../../prismaconfig";
import authMiddleware from "../../middleware/authmiddleware";

interface AuthenticatedRequest extends express.Request {
    userId?: number;
}

const productsRouter = express.Router();

productsRouter.get("/",authMiddleware,async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Get the authenticated user's ID
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    // 2. Read pagination parameters
    const pageParam = req.query.page ?? "1";
    const limitParam = req.query.limit ?? "10";

    // 3. Validate the parameters and ensure they are positive integers
    if (
      typeof pageParam !== "string" ||
      typeof limitParam !== "string" ||
      !/^[1-9]\d*$/.test(pageParam) ||
      !/^[1-9]\d*$/.test(limitParam)) {
        return res.status(400).json({
          message: "Page and limit must be positive integers"
        });
      }

            const page = Number(pageParam);
            const limit = Number(limitParam);

            if (
                !Number.isSafeInteger(page) ||
                !Number.isSafeInteger(limit) ||
                limit > 100
            ) {
                return res.status(400).json({
                    message: "Invalid pagination values. Maximum limit is 100."
                });
            }

            // 4. Calculate how many records to skip
            const skip = (page - 1) * limit;

            // 5. Retrieve products and count matching products
            const [products, totalProducts] = await prisma.$transaction([
                prisma.product.findMany({
                    where: {
                        userId: userId
                    },
                    skip: skip,
                    take: limit,
                    orderBy: [
                        { createdAt: "desc" },
                        { id: "desc" }
                    ]
                }),

                prisma.product.count({
                    where: {
                        userId: userId
                    }
                })
            ]);

            // 6. Calculate pagination metadata
            const totalPages = Math.ceil(totalProducts / limit);

            return res.status(200).json({
                message: "Products retrieved successfully",
                data: products,
                pagination: {
                    currentPage: page,
                    limit: limit,
                    totalProducts: totalProducts,
                    totalPages: totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            });

        } catch (error) {
            console.error("Error retrieving products:", error);

            return res.status(500).json({
                message: "Failed to retrieve products"
            });
        }
    }
);

export default productsRouter;