import { Request, Response, Router } from "express";
import db from "../db";
import asyncHandler from "../middleware/AsyncHandler";
import { TABLE_NAMES } from "../constants";
import bcrypt from "bcrypt";
import CONFIG from "../config";
import { NotFound } from "../errors/Errors";
import jwt from "jsonwebtoken";
import { dbDelete, dbUpdate, validate } from "../middleware/Validator";
import { cartAndWishlistValidator, idValidater } from "../lib/Validations";
import { mail } from "../lib/Utils";
import NewUserRoles from "../models/NewUserRoles";
import { Like } from "typeorm";

const router = Router(); // create a new router

type UserDto = {
  username: string;
  password: string;
  email: string;
  userRoleId: number;
};

type CartAdder = { productId: string };

router.get(
  "/wishlist",
  asyncHandler(async (req: any, res: Response) => {
    const sql = `
        SELECT p.*,(select name from ${TABLE_NAMES.PRODUCT_IMAGES} pi where pi.productId = p.id limit 1) as image
        FROM ${TABLE_NAMES.WISHLIST_ITEMS} w 
        JOIN ${TABLE_NAMES.PRODUCTS} p ON w.product_id = p.id
        JOIN ${TABLE_NAMES.PRODUCT_IMAGES} pi ON pi.productId = p.id
        WHERE w.user_id = ${req.user.id}
        GROUP BY p.id
    `;
    const wishListItems = await db.query(sql);
    res.json(wishListItems);
  })
);

router.get(
  "/cart",
  asyncHandler(async (req: any, res: Response) => {
    const sql = `
        SELECT p.*,(select name from ${TABLE_NAMES.PRODUCT_IMAGES} pi where pi.productId = p.id limit 1) as image
        FROM ${TABLE_NAMES.CART_ITEMS} c 
        JOIN ${TABLE_NAMES.PRODUCTS} p ON c.product_id = p.id
        JOIN ${TABLE_NAMES.PRODUCT_IMAGES} pi ON pi.productId = p.id
        WHERE c.user_id = ${req.user.id}
        GROUP BY p.id
    `;
    const cartItems = await db.query(sql);
    res.json(cartItems);
  })
);

router.get(
  "/cart/add",
  validate(cartAndWishlistValidator),
  asyncHandler(async (req: any, res: Response) => {
    const { productId } = req.query as CartAdder;

    const sql = `INSERT INTO ${TABLE_NAMES.CART_ITEMS} (user_id , product_id) VALUES (? , ?)`;

    await db.transaction(async (manager) => {
      const [existingProduct] = await manager.query(
        `SELECT * FROM ${TABLE_NAMES.CART_ITEMS} WHERE user_id = ? AND product_id = ?`,
        [req.user.id, productId]
      );

      if (existingProduct) {
        throw new NotFound("Product already in cart");
      }
      await manager.query(sql, [req.user.id, productId]);
    });

    res.json({ msg: "Product Added To Cart" });
  })
);

router.get(
  "/wishlist/add",
  validate(cartAndWishlistValidator),
  asyncHandler(async (req: any, res: Response) => {
    const { productId } = req.query as CartAdder;

    const sql = `INSERT INTO ${TABLE_NAMES.WISHLIST_ITEMS} (user_id , product_id) VALUES (? , ?)`;

    await db.transaction(async (manager) => {
      const [existingProduct] = await manager.query(
        `SELECT * FROM ${TABLE_NAMES.WISHLIST_ITEMS} WHERE user_id = ? AND product_id = ?`,
        [req.user.id, productId]
      );
      if (existingProduct) {
        throw new NotFound("Product already in wishlist");
      }
      await manager.query(sql, [req.user.id, productId]);
    });

    res.json({ msg: "Product Added To Wishlist" });
  })
);

router.get(
  "/wishlist/remove",
  validate(cartAndWishlistValidator),
  asyncHandler(async (req: any, res: Response) => {
    const { productId } = req.query as CartAdder;

    const sql = `DELETE FROM ${TABLE_NAMES.WISHLIST_ITEMS} WHERE user_id = ? AND product_id = ?`;

    await db.transaction(async (manager) => {
      await manager.query(sql, [req.user.id, productId]);
    });

    res.json({ msg: "Product Removed From Wishlist" });
  })
);

router.get(
  "/cart/remove",
  validate(cartAndWishlistValidator),
  asyncHandler(async (req: any, res: Response) => {
    const { productId } = req.query as CartAdder;

    const sql = `DELETE FROM ${TABLE_NAMES.CART_ITEMS} WHERE user_id = ? AND product_id = ?`;

    await db.transaction(async (manager) => {
      await manager.query(sql, [req.user.id, productId]);
    });

    res.json({ msg: "Product Removed From Cart" });
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const sql = `INSERT INTO ${TABLE_NAMES.USERS} (username, password) VALUES (?, ?)`;

    const hashedPassword = await bcrypt.hash(password, CONFIG.SALT_ROUNDS);

    await db.transaction(async (manager) => {
      await manager.query(sql, [username, hashedPassword]);
    });

    res.json({ success: true, message: "User created successfully" });
  })
);


router.put(
  "/:id",
  // validate(updateUserValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { username, password } = req.body as UserDto;

    // First check if user exists
    const checkUserSql = `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = ?`;
    const existingUser = await db.query(checkUserSql, [id]);

    if (!existingUser || existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build update query dynamically based on provided fields
    const updateFields: any = [];
    const queryParams: any = [];
    let updateSql = `UPDATE ${TABLE_NAMES.USERS} SET `;

    if (username) {
      // Check if username is already taken by another user
      const checkUsernameSql = `SELECT * FROM ${TABLE_NAMES.USERS} WHERE username = ? AND id != ?`;
      const existingUsername = await db.query(checkUsernameSql, [username, id]);

      if (existingUsername && existingUsername.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }

      updateFields.push("username = ?");
      queryParams.push(username);
    }

    if (password) {
      // Only hash and update password if it's provided
      const hashedPassword = await bcrypt.hash(password, CONFIG.SALT_ROUNDS);
      updateFields.push("password = ?");
      queryParams.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    // Complete the SQL query
    updateSql += updateFields.join(", ");
    updateSql += " WHERE id = ?";
    queryParams.push(id);

    // Execute update within transaction
    await db.transaction(async (manager) => {
      await manager.query(updateSql, queryParams);
    });

    res.json({
      success: true,
      message: "User updated successfully",
    });
  })
);
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { userName: username, password } = req.body;

    // Fix 1: No email, no roleId — use only username
    const sql = `
      SELECT * FROM ${TABLE_NAMES.USERS}
      WHERE username = ?
      LIMIT 1
    `;

    const [user] = await db.query(sql, [username]);

    if (!user) {
      throw new NotFound("User not found");
    }

    // Password check
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new NotFound("Invalid password");
    }

    // Token data — no role permissions because no roles column
    const tokenData = {
      id: user.id,
      username: user.username,
      type: "USER",
    };

    const token = jwt.sign(tokenData, CONFIG.JWT_SECRET, {
      expiresIn: CONFIG.JWT_EXPIRES_IN,
    });

   res.json({
  id: user.id,
  token,
  msg: "User logged in successfully",
  rolePermissions: ["ALL"], // give full admin access
});

  })
);



// router.get(
//   "/user-roles",
//   asyncHandler(async (req: Request, res: Response) => {
//     const {
//       page,
//       query,
//     }: {
//       page?: string;
//       query?: string;
//     } = req.query;

//     if (!page) {
// let userRoles = await NewUserRoles.find();

// userRoles = userRoles.map((role: any) => ({
//   ...role,
//   permissions: typeof role.permissions === "string"
//     ? JSON.parse(role.permissions)
//     : role.permissions
// }));
//       const totalCount = await NewUserRoles.count({});

//       const rawQuery = `
//   SELECT roleId, COUNT(*) as totalCount 
//   FROM ${TABLE_NAMES.USERS}
//   GROUP BY roleId
// `;
//       const roleUserCounts = await db.query(rawQuery);

//       userRoles.forEach((role) => {
//         const count = roleUserCounts.find(
//           (r: { roleId: number }) => r.roleId === role.id
//         );
//         (role as any).totalCount = count ? count.totalCount : 0;
//       });

//       return res.json({
//         userRoles,
//         totalCount,
//       });
//     } else {
//       const skip = (page ? Number(page) - 1 : 0) * 10;

//       const likeQuery = `%${query?.toLowerCase()}%`;

//       const whereConditions = [{ roleName: Like(likeQuery) }];

//       let userRoles = await NewUserRoles.find({
//   where: whereConditions,
//   skip,
//   take: 10,
// });

// userRoles = userRoles.map((role: any) => ({
//   ...role,
//   permissions: typeof role.permissions === "string"
//     ? JSON.parse(role.permissions)
//     : role.permissions
// }));


//       const totalCount = await NewUserRoles.count({
//         where: whereConditions,
//       });

//       const rawQuery = `
//   SELECT roleId, COUNT(*) as totalCount 
//   FROM ${TABLE_NAMES.USERS}
//   GROUP BY roleId
// `;
//       const roleUserCounts = await db.query(rawQuery);

//       userRoles.forEach((role) => {
//         const count = roleUserCounts.find(
//           (r: { roleId: number }) => r.roleId === role.id
//         );
//         (role as any).totalCount = count ? count.totalCount : 0;
//       });

//       res.json({
//         userRoles,
//         totalCount,
//       });
//     }
//   })
// );

 
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { page, query } = req.query as { page?: string; query?: string };

    if (!page) {
const users = await db.query(`
  SELECT u.*, r.roleName
  FROM users u
  LEFT JOIN new_user_roles r ON u.roleId = r.id
`);
      const total = await db.query(`SELECT COUNT(*) as totalCount FROM users`);

      return res.json({
        users,
        totalCount: Number(total[0].totalCount),
      });
    }

    const skip = (Number(page) - 1) * 10;

    const users = await db.query(`
  SELECT u.*, r.roleName
  FROM users u
  LEFT JOIN new_user_roles r ON u.roleId = r.id
  WHERE u.username LIKE '%${query || ""}%'
  LIMIT 10 OFFSET ${skip}
`);

    const total = await db.query(
      `SELECT COUNT(*) as totalCount FROM users 
       WHERE username LIKE '%${query || ""}%'`
    );

    return res.json({
      users,
      totalCount: Number(total[0].totalCount),
    });
  })
);


router.get(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const [user] = await db.query(
      `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = ?`,
      [req.params.id]
    );

    delete user.password;

    res.json(user);
  })
);

router.patch(
  "/:id",
  validate(idValidater),
  dbUpdate(TABLE_NAMES.USERS),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password, email } = req.body as UserDto;
    const { id } = req.params;

    let sql = `UPDATE ${TABLE_NAMES.USERS} SET `;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, CONFIG.SALT_ROUNDS);
      sql += `password = '${hashedPassword}'`;
    }

    if (username) {
      if (sql[sql.length - 1] !== " ") sql += ", ";
      sql += `username = '${username}'`;
    }

    if (email) {
      if (sql[sql.length - 1] !== " ") sql += ", ";
      sql += `email = '${email}'`;
    }

    sql += ` WHERE id = ${id}`;

    await db.transaction(async (manager) => {
      await manager.query(sql);
    });

    res.json({ msg: "User updated successfully" });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  dbDelete(TABLE_NAMES.USERS),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, msg: "User deleted successfully" });
  })
);

router.post(
  "/sendquote",
  asyncHandler(async (req: Request, res: Response) => {
    const products: any[] = req.body.products;
    const html = `<h1>Quote Request</h1>
${products
  .map(
    (product: any) => `<img src="${product.images[0]}" alt="product image" />`
  )
  .join("")}
  <br/>
  <p>Product Code: ${products[0].productCode}</p>
  <p>Size: ${products[0].size}</p>
  <p>Color: ${products[0].color}</p>
  <p>Quantity: ${products[0].quantity}</p>
  <p>Category Name: ${products[0].categoryName}</p>
  `;
    const subject = "Quote Request";
    const to = "gowtham@ymtsindia.org";
    await mail({ html, to, subject });
    res.json({ msg: "Quote request sent successfully" });
  })
);

// router.post(
//   "/user-roles",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { roleName, permissions } = req.body;
//     const userRole = new NewUserRoles();
//     userRole.roleName = roleName;
//     userRole.permissions = permissions;
//     await userRole.save();
//     res.json({ success: true, message: "User role created successfully" });
//   })
// );

// router.put(
//   "/user-roles/apply",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { userId, roleId } = req.body;

//     const user = await db.query(
//       `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = ?`,
//       [Number(userId)]
//     );
//     if (!user) {
//       throw new NotFound("User not found");
//     }
//     await db.query(`UPDATE ${TABLE_NAMES.USERS} SET roleId = ? WHERE id = ?`, [
//       roleId,
//       Number(userId),
//     ]);
//     res.json({ success: true, message: "Role applied to user successfully" });
//   })
// );

// router.put(
//   "/user-roles/:id",
//   asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const { roleName, permissions } = req.body;
//     const userRole = await NewUserRoles.findOne({
//       where: {
//         id: Number(id),
//       },
//     });
//     if (!userRole) {
//       throw new NotFound("User role not found");
//     }

//     userRole.roleName = roleName;
//     userRole.permissions = permissions;
//     await userRole.save();

//     res.json({ success: true, message: "User role updated successfully" });
//   })
// );

export default router;
