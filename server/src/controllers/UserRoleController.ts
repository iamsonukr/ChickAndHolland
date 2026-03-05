import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import NewUserRoles from "../models/NewUserRoles";
import db from "../db";
import { TABLE_NAMES } from "../constants";
import { Like } from "typeorm";

const router = Router();

// GET ALL ROLES
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { page, query } = req.query as { page?: string; query?: string };

    if (!page) {
      let userRoles = await NewUserRoles.find();

      userRoles = userRoles.map((role: any) => ({
        ...role,
        permissions:
          typeof role.permissions === "string"
            ? JSON.parse(role.permissions)
            : role.permissions,
      }));

      const totalCount = await NewUserRoles.count({});

      const roleCounts = await db.query(`
        SELECT roleId, COUNT(*) as totalCount
        FROM ${TABLE_NAMES.USERS}
        GROUP BY roleId
      `);

      userRoles = userRoles.map((role: any) => {
        const match = roleCounts.find((x: any) => x.roleId === role.id);
        return {
          ...role,
          totalCount: match ? match.totalCount : 0,
        };
      });

      return res.json({ userRoles, totalCount });
    }

    // PAGINATED
    const skip = (Number(page) - 1) * 10;
    const like = `%${query?.toLowerCase() || ""}%`;

    let userRoles = await NewUserRoles.find({
      where: { roleName: Like(like) },
      skip,
      take: 10,
    });

    userRoles = userRoles.map((role: any) => ({
      ...role,
      permissions:
        typeof role.permissions === "string"
          ? JSON.parse(role.permissions)
          : role.permissions,
    }));

    const totalCount = await NewUserRoles.count({
      where: { roleName: Like(like) },
    });

    const roleCounts = await db.query(`
      SELECT roleId, COUNT(*) as totalCount
      FROM ${TABLE_NAMES.USERS}
      GROUP BY roleId
    `);

    userRoles = userRoles.map((role: any) => {
      const match = roleCounts.find((x: any) => x.roleId === role.id);
      return {
        ...role,
        totalCount: match ? match.totalCount : 0,
      };
    });

    return res.json({ userRoles, totalCount });
  })
);

// CREATE ROLE
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { roleName, permissions } = req.body;

    const role = new NewUserRoles();
    role.roleName = roleName;
    role.permissions = permissions;

    await role.save();
    res.json({ success: true, message: "Role created successfully" });
  })
);

// UPDATE ROLE

// DELETE ROLE
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // unassign role from users
      await db.query(`UPDATE users SET roleId = NULL WHERE roleId = ?`, [id]);

      // delete role
      await db.query(`DELETE FROM new_user_roles WHERE id = ?`, [id]);

      res.json({ success: true, message: "Role deleted successfully" });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to delete role"
      });
    }
  })
);


// APPLY ROLE TO USER
router.put("/apply",
  asyncHandler(async (req: Request, res: Response) => {
    let { userId, roleId } = req.body;
    
    console.log("RAW BODY RECEIVED:", req.body);
    
    userId = Number(userId);
    roleId = Number(roleId);
    
    console.log("PARSED:", { userId, roleId });
    
    if (isNaN(userId) || isNaN(roleId)) {
      return res.status(400).json({ msg: "Invalid userId or roleId" });
    }
    
    
    await db.query(`UPDATE ${TABLE_NAMES.USERS} SET roleId = ? WHERE id = ?`, [
      roleId,
      userId,
    ]);
    
    res.json({ success: true, message: "Role applied to user successfully" });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { roleName, permissions } = req.body;

    const role = await NewUserRoles.findOne({ where: { id: Number(id) } });

    if (!role) return res.status(404).json({ message: "Role not found" });

    role.roleName = roleName;
    role.permissions = permissions;

    await role.save();
    res.json({ success: true, message: "Role updated successfully" });
  })
);

export default router;
