
import express, { Response } from "express";
import prisma from "../../prismaconfig";
import authMiddleware from "../../middleware/authmiddleware";

interface AuthenticatedRequest extends express.Request {
    userId?: number;
}

const ordersRouter = express.Router();

ordersRouter.get ("/", async (req: AuthenticatedRequest, res: Response) => {
    try {
            // 1. Get authenticated user's ID
            const userId = req.userId;

            if (!userId) {
                return res.status(401).json({
                    message: "User not authenticated"
                });
            }

            // 2. Read pagination parameters
            const pageParam = req.query.page ?? "1";
            const limitParam = req.query.limit ?? "10";

            // 3. Validate pagination parameters
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

            // 4. Calculate pagination offset
            const skip = (page - 1) * limit;

            if (!Number.isSafeInteger(skip)) {
                return res.status(400).json({
                    message: "Requested page is too large"
                });
            }

            // 5. Retrieve orders and count them
            const [orders, totalOrders] = await prisma.$transaction([
                prisma.order.findMany({
                    where: {
                        userId: userId
                    },
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    skip: skip,
                    take: limit,
                    orderBy: [
                        { createdAt: "desc" },
                        { id: "desc" }
                    ]
                }),

                prisma.order.count({
                    where: {
                        userId: userId
                    }
                })
            ]);

            // 6. Calculate pagination metadata
            const totalPages = Math.ceil(totalOrders / limit);

            // 7. Return response
            return res.status(200).json({
                message: "Orders retrieved successfully",
                data: orders,
                pagination: {
                    currentPage: page,
                    limit: limit,
                    totalOrders: totalOrders,
                    totalPages: totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            });

        } catch (error) {
            console.error("Error retrieving orders:", error);

            return res.status(500).json({
                message: "Failed to retrieve orders"
            });
        }
    }
);

export default ordersRouter;
