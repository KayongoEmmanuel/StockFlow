import express, {Request,Response} from "express";


const productsRouter = express.Router();
productsRouter.get("/", (req: Request, res: Response) => {
  res.json({ message: "Products route is working" });
});

export default productsRouter;