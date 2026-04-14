import {  Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { syncCountryCatalog } from "../services/countryCatalog";


const CountryController = Router();

CountryController.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
      const countries = await syncCountryCatalog();
      res.json(countries);
    })
);

export default CountryController;
