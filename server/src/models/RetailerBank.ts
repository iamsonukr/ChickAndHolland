import {
  Column,
  Entity,
  ManyToOne,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { TABLE_NAMES } from "../constants";
import BaseModel from "./BaseModel";
import Retailer from "./Retailer";
import * as crypto from "crypto";
import CONFIG from "../config";

@Entity(TABLE_NAMES.RETAILERBANK)
export default class RetailerBank extends BaseModel {
  @OneToOne(() => Retailer, (retailer) => retailer.retailerBank)
  @JoinColumn()
  retailer: Retailer;

  // Private properties to store decrypted values temporarily
  private _decryptedBankName: string | null = null;
  private _decryptedAccount: string | null = null;
  private _decryptedIfc: string | null = null;
  private _decryptedBranch: string | null = null;
  private _decryptedCardNumber: string | null = null;
  private _decryptedExpiryDate: string | null = null;
  private _decryptedCardAddress: string | null = null;

  @Column("text", { nullable: true, default: null })
  bank_name: string | null = null;

  @Column("text", { nullable: true, default: null })
  account: string | null = null;

  @Column("text", { nullable: true, default: null })
  ifc: string | null = null;

  @Column("text", { nullable: true, default: null })
  branch: string | null = null;

  @Column("text", { nullable: true, default: null })
  card_name: string | null = null;

  @Column("text", { nullable: true, default: null })
  card_number: string | null = null;

  @Column("text", { nullable: true, default: null })
  expiry_date: string | null = null;

  @Column("text", { nullable: true, default: null })
  card_address: string | null = null;

  @Column("text", { nullable: true, default: null })
  address: string;

  // Getters and setters for existing fields
  get decryptedBankName(): string | null {
    return this._decryptedBankName;
  }

  set decryptedBankName(value: string | null) {
    this._decryptedBankName = value;
    if (value !== null) {
      this.bank_name = this.encrypt(value);
    } else {
      this.bank_name = null;
    }
  }

  get decryptedAccount(): string | null {
    return this._decryptedAccount;
  }

  set decryptedAccount(value: string | null) {
    this._decryptedAccount = value;
    if (value !== null) {
      this.account = this.encrypt(value);
    } else {
      this.account = null;
    }
  }

  get decryptedIfc(): string | null {
    return this._decryptedIfc;
  }

  set decryptedIfc(value: string | null) {
    this._decryptedIfc = value;
    if (value !== null) {
      this.ifc = this.encrypt(value);
    } else {
      this.ifc = null;
    }
  }

  get decryptedBranch(): string | null {
    return this._decryptedBranch;
  }

  set decryptedBranch(value: string | null) {
    this._decryptedBranch = value;
    if (value !== null) {
      this.branch = this.encrypt(value);
    } else {
      this.branch = null;
    }
  }

  get decryptedCardNumber(): string | null {
    return this._decryptedCardNumber;
  }

  set decryptedCardNumber(value: string | null) {
    this._decryptedCardNumber = value;
    if (value !== null) {
      this.card_number = this.encrypt(value);
    } else {
      this.card_number = null;
    }
  }

  get decryptedExpiryDate(): string | null {
    return this._decryptedExpiryDate;
  }

  set decryptedExpiryDate(value: string | null) {
    this._decryptedExpiryDate = value;
    if (value !== null) {
      this.expiry_date = this.encrypt(value);
    } else {
      this.expiry_date = null;
    }
  }

  // New getter and setter for card_address
  get decryptedCardAddress(): string | null {
    return this._decryptedCardAddress;
  }

  set decryptedCardAddress(value: string | null) {
    this._decryptedCardAddress = value;
    if (value !== null) {
      this.card_address = this.encrypt(value);
    } else {
      this.card_address = null;
    }
  }

  // Encryption and decryption methods
  private encrypt(text: string): string {
    try {
      const key = Buffer.from(CONFIG.ENCRYPTION_KEY, "hex");
      const iv = Buffer.from(CONFIG.IV, "hex");
      const cipher = crypto.createCipheriv(CONFIG.ALGORITHM, key, iv);
      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");
      return encrypted;
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      const key = Buffer.from(CONFIG.ENCRYPTION_KEY, "hex");
      const iv = Buffer.from(CONFIG.IV, "hex");
      const decipher = crypto.createDecipheriv(CONFIG.ALGORITHM, key, iv);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  // Lifecycle hooks
  @AfterLoad()
  decryptFields(): void {
    if (this.bank_name) {
      this._decryptedBankName = this.decrypt(this.bank_name);
    }
    if (this.account) {
      this._decryptedAccount = this.decrypt(this.account);
    }
    if (this.ifc) {
      this._decryptedIfc = this.decrypt(this.ifc);
    }
    if (this.branch) {
      this._decryptedBranch = this.decrypt(this.branch);
    }
    if (this.card_number) {
      this._decryptedCardNumber = this.decrypt(this.card_number);
    }
    if (this.expiry_date) {
      this._decryptedExpiryDate = this.decrypt(this.expiry_date);
    }
    if (this.card_address) {
      this._decryptedCardAddress = this.decrypt(this.card_address);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  encryptFields(): void {}
}
