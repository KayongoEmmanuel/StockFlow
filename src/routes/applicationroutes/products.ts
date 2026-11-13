import express, { Response } from "express";
import type { Prisma } from "@prisma/client";
import prisma from "../../prismaconfig";
import authMiddleware from "../../middleware/authmiddleware";

interface AuthenticatedRequest extends express.Request {
    userId?: number;
}

const productsRouter = express.Router();

productsRouter.get(
    "/",
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            // 1. Get authenticated user's ID
            const userId = req.userId;

            if (!userId) {
                return res.status(401).json({
                    message: "User not authenticated"
                });
            }

            // 2. Extract pagination parameters
            const pageParam = req.query.page ?? "1";
            const limitParam = req.query.limit ?? "10";

            // 3. Extract search and filter parameters
            const searchParam = req.query.search;
            const minPriceParam = req.query.minPrice;
            const maxPriceParam = req.query.maxPrice;
            const minQuantityParam = req.query.minQuantity;
            const maxQuantityParam = req.query.maxQuantity;

            // 4. Validate pagination parameters
            if (
                typeof pageParam !== "string" ||
                typeof limitParam !== "string" ||
                !/^[1-9]\d*$/.test(pageParam) ||
                !/^[1-9]\d*$/.test(limitParam)
            ) {
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

            // 5. Validate search parameter
            if (
                searchParam !== undefined &&
                (
                    typeof searchParam !== "string" ||
                    searchParam.trim() === ""
                )
            ) {
                return res.status(400).json({
                    message: "Search must be a non-empty string"
                });
            }

            // Remove unnecessary whitespace from the search term
            const search =
                typeof searchParam === "string"
                    ? searchParam.trim()
                    : undefined;

            // 6. Validate price parameters
            const isValidPriceParam = (value: unknown): value is string => {
                return (
                    typeof value === "string" &&
                    value.trim() !== "" &&
                    Number.isFinite(Number(value))
                );
            };

            if (
                (minPriceParam !== undefined &&
                    !isValidPriceParam(minPriceParam)) ||
                (maxPriceParam !== undefined &&
                    !isValidPriceParam(maxPriceParam))
            ) {
                return res.status(400).json({
                    message: "Price filters must be valid numbers"
                });
            }

            // Convert price parameters into numbers
            const minPrice =
                minPriceParam !== undefined
                    ? Number(minPriceParam)
                    : undefined;

            const maxPrice =
                maxPriceParam !== undefined
                    ? Number(maxPriceParam)
                    : undefined;

            // Validate price range
            if (
                (minPrice !== undefined && minPrice < 0) ||
                (maxPrice !== undefined && maxPrice < 0) ||
                (
                    minPrice !== undefined &&
                    maxPrice !== undefined &&
                    minPrice > maxPrice
                )
            ) {
                return res.status(400).json({
                    message: "Invalid price range"
                });
            }

            // 7. Validate quantity parameters
            const isValidQuantityParam = (value: unknown): value is string => {
                return (
                    typeof value === "string" &&
                    /^(0|[1-9]\d*)$/.test(value) &&
                    Number.isSafeInteger(Number(value))
                );
            };

            if (
                (minQuantityParam !== undefined &&
                    !isValidQuantityParam(minQuantityParam)) ||
                (maxQuantityParam !== undefined &&
                    !isValidQuantityParam(maxQuantityParam))
            ) {
                return res.status(400).json({
                    message: "Quantity filters must be non-negative integers"
                });
            }

            // Convert quantity parameters into numbers
            const minQuantity =
                minQuantityParam !== undefined
                    ? Number(minQuantityParam)
                    : undefined;

            const maxQuantity =
                maxQuantityParam !== undefined
                    ? Number(maxQuantityParam)
                    : undefined;

            // Validate quantity range
            if (
                minQuantity !== undefined &&
                maxQuantity !== undefined &&
                minQuantity > maxQuantity
            ) {
                return res.status(400).json({
                    message: "Invalid quantity range"
                });
            }

            // 8. Construct the Prisma where object
            const where: Prisma.ProductWhereInput = {
                userId: userId
            };

            // Search by product name, SKU or description
            if (search !== undefined) {
                where.OR = [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive"
                        }
                    },
                    {
                        sku: {
                            contains: search,
                            mode: "insensitive"
                        }
                    },
                    {
                        description: {
                            contains: search,
                            mode: "insensitive"
                        }
                    }
                ];
            }

            // Apply price filters
            if (minPrice !== undefined || maxPrice !== undefined) {
                where.price = {
                    ...(minPrice !== undefined && { gte: minPrice }),
                    ...(maxPrice !== undefined && { lte: maxPrice })
                };
            }

            // Apply quantity filters
            if (minQuantity !== undefined || maxQuantity !== undefined) {
                where.quantity = {
                    ...(minQuantity !== undefined && { gte: minQuantity }),
                    ...(maxQuantity !== undefined && { lte: maxQuantity })
                };
            }

            // 9. Calculate pagination offset
            const skip = (page - 1) * limit;

            if (!Number.isSafeInteger(skip)) {
                return res.status(400).json({
                    message: "Requested page is too large"
                });
            }

            // 10. Retrieve matching products and count them
            const [products, totalProducts] = await prisma.$transaction([
                prisma.product.findMany({
                    where: where,
                    skip: skip,
                    take: limit,
                    orderBy: [
                        { createdAt: "desc" },
                        { id: "desc" }
                    ]
                }),

                prisma.product.count({
                    where: where
                })
            ]);

            // 11. Calculate pagination metadata
            const totalPages = Math.ceil(totalProducts / limit);

            // 12. Return response
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