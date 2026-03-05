import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { TABLE_NAMES } from "../constants";
import Clients from "../models/ClientsModel";
import axios from "axios";
import db from "../db";
import { Like } from "typeorm";
import Customer from "../models/Customer";

const Clientrouter = Router();

Clientrouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const clients = await Clients.find({
      where: { isDeleted: false },
    });
    res.json(clients);
  })
);

Clientrouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, address, proximity } = req.body;
    const existingAddresses = await db.query(
      `SELECT * FROM ${TABLE_NAMES.Clients} WHERE address LIKE '%${address}%' AND isDeleted = false`
    );
    if (existingAddresses.length > 0) {
      for (let index = 0; index < existingAddresses.length; index++) {
        const element = existingAddresses[index];
        const { data } = await axios.get(
          `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${address}&origins=${element.address}&key=AIzaSyCUA3uUquQ88On7YaIFbBpByARvNj64GAU`
        );
        if (
          parseFloat(data.rows[0].elements[0].distance.value) <
          parseFloat(proximity) * 1000
        ) {
          res.status(400).json({ msg: "Address already exists" });
          return;
        }
      }
    }
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyCUA3uUquQ88On7YaIFbBpByARvNj64GAU`
    );
    const latitude = data.results[0].geometry.location.lat;
    const longitude = data.results[0].geometry.location.lng;
    await Clients.create({
      name,
      address,
      proximity,
      latitude,
      longitude,
    }).save();
    res.json({ msg: "created" });
  })
);

Clientrouter.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const client = await Clients.findOne({
      where: { id: Number(id), isDeleted: false },
    });
    
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }
    
    client.isDeleted = true;
    await client.save();
    res.json({ msg: "deleted" });
  })
);

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

Clientrouter.get(
  "/new",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      query,
    }: {
      page?: string;
      query?: string;
    } = req.query;

    const allClients = await Clients.find({
      where: { isDeleted: false },
    });

    const clashingStatus = allClients.map((client) => ({
      ...client,
      isClashing: false,
    }));

    for (let i = 0; i < clashingStatus.length; i++) {
      const clientA = clashingStatus[i];
      const proximityA = clientA.proximity;

      for (let j = i + 1; j < clashingStatus.length; j++) {
        const clientB = clashingStatus[j];
        const proximityB = clientB.proximity;

        if (
          clientA.latitude &&
          clientA.longitude &&
          clientB.latitude &&
          clientB.longitude
        ) {
          const distance = haversineDistance(
            clientA.latitude,
            clientA.longitude,
            clientB.latitude,
            clientB.longitude
          );

          // console.log(`Distance between ${clientA.name} and ${clientB.name} is ${distance} KM, Proximity A: ${proximityA * 1.60934}, Proximity B: ${proximityB * 1.60934}`);

         // proximity is in MILES → convert to KM
const radiusA = proximityA * 1.60934;
const radiusB = proximityB * 1.60934;

if (distance < radiusA || distance < radiusB) {
  clashingStatus[i].isClashing = true;
  clashingStatus[j].isClashing = true;
}

        }
      }
    }

    const mapClients = clashingStatus;

    if (!page) {
      const totalCount = allClients.length;

      return res.json({
        clients: mapClients,
        totalCount,
         mapClients,
      });
    } else {
      const skip = (Number(page) - 1) * 100;

      const likeQuery = query?.toLowerCase() || "";

      const filteredClients = clashingStatus.filter(
        (client) =>
          client.name.toLowerCase().includes(likeQuery) ||
          client.address.toLowerCase().includes(likeQuery) ||
          client.city_name.toLowerCase().includes(likeQuery)
      );

      const paginatedClients = filteredClients.slice(skip, skip + 100);
      const totalCount = filteredClients.length;

      res.json({
        clients: paginatedClients,
        totalCount,
        mapClients, // Include all clients for the map
      });
    }
  })
);

Clientrouter.delete(
  "/new/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const client = await Clients.findOne({ 
      where: { id: Number(id), isDeleted: false } 
    });
    if (!client) {
      res.status(400).json({ msg: "Client not found" });
      return;
    }
    client.isDeleted = true;
    await client.save();
    res.json({ success: true, message: "Client deleted successfully" });
  })
);

Clientrouter.post(
  "/new",
  asyncHandler(async (req: Request, res: Response) => {
    const { name, address, proximity, coordinates } = req.body;

    const existingName = await Clients.findOne({
      where: { name: Like(`%${name}%`), isDeleted: false },
    });

    if (existingName) {
      res.status(400).json({ msg: "Name already exists" });
      return;
    }

    // so before creating a new client, we need to check if any other clients exist in the proximity (miles) mentioned
    // const conflicts = checkProximityConflict(
    //   {
    //     latitude: coordinates.latitude,
    //     longitude: coordinates.longitude,
    //     proximity,
    //   },
    //   await Clients.find()
    // );
    //
    // console.log(conflicts);
    //
    // if (conflicts.length > 0) {
    //   // get the closest conflict, and it's distance in miles
    //   const closestConflict = conflicts.reduce((a, b) => {
    //     return a.distance < b.distance ? a : b;
    //   });
    //   res.status(400).json({
    //     success: false,
    //     message: `There is already a client within ${closestConflict.distance.toFixed(
    //       2
    //     )} miles of your location.`,
    //   });
    //   return;
    // }

    // create new client
    await Clients.create({
      name,
      address,
      proximity,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }).save();

    res.json({ success: true, message: "Store location created successfully" });
  })
);

Clientrouter.put(
  "/new/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, address, proximity, coordinates, city_name } = req.body;
    const client = await Clients.findOne({
      where: { id: Number(id), isDeleted: false },
      relations: ["customer"],
    });

    if (!client) {
      res.status(400).json({ msg: "Client not found" });
      return;
    }

    const customer = await Customer.findOne({
      where: {
        id: client.customer.id,
        isDeleted: false,
      },
    });

    if (!customer) {
      res.status(400).json({ msg: "Customer not found" });
      return;
    }

    client.name = name;
    client.address = address;
    client.proximity = proximity;
    client.latitude = coordinates.latitude;
    client.longitude = coordinates.longitude;
    client.city_name = city_name;
    await client.save();

    customer.storeName = name;
    customer.storeAddress = address;

    await customer?.save();

    res.json({ success: true, message: "Client updated successfully" });
  })
);

export default Clientrouter;
