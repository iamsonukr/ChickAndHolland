import {  Request, Response, Router } from "express";
import Country from "../models/Country";
import asyncHandler from "../middleware/AsyncHandler";


const CountryController = Router();

CountryController.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const clients = await Country.find();
      res.json(clients);
    })
);

export default CountryController;
