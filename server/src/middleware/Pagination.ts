import { NextFunction, Request, Response } from "express";

export function minChangeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.query.min) {
    let min = parseInt(req.query.min as string);
    if (min < 0) min = 0;
    req.query.min = min.toString();
  } else {
    req.query.min = "0";
  }
  next();
}

export function itemsPerPageHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.query.itemsPerPage) {
    let itemsPerPage = parseInt(req.query.itemsPerPage as string);
    if (itemsPerPage < 0) itemsPerPage = 5;
    req.query.itemsPerPage = itemsPerPage.toString();
  } else {
    req.query.itemsPerPage = "5";
  }
  next();
}

export function sortHandler(req: Request, res: Response, next: NextFunction) {
  if (req.query.sort) {
    let sort = req.query.sort as string;
    sort = sort.toLowerCase();
    if (sort === "asc" || sort === "desc") {
      req.query.sort = sort;
    } else {
      return res.status(400).json({ msg: "Sort must be asc or desc" });
    }
  } else {
    req.query.sort = "desc";
  }
  next();
}
