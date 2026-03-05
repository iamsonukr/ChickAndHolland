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
import Currency from "./Currency";

@Entity(TABLE_NAMES.ADMINBANK)
export default class AdminBank extends BaseModel {
  // Private properties to store decrypted values temporarily
  private _decryptedBankName: string | null = null;
  private _decryptedAccountNumber: string | null = null;
  private _decryptedAccountHolder: string | null = null;
  private _decryptedIfscCode: string | null = null;
private _decryptedSwiftCode: string | null = null;

  @Column("text", { nullable: true, default: null })
  bank_name: string | null = null;

  @Column("text", { nullable: true, default: null })
  account_number: string | null = null;

  @Column("text", { nullable: true, default: null })
  account_holder: string | null = null;

  @Column("text", { nullable: true, default: null })
  ifsc_code: string | null = null;

  @Column("text", { nullable: true, default: null })
swift_code: string | null = null;


  @Column({ nullable: true })
  currencyId: number | null;   // 👈 NEW FIELD

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: "currencyId" })
  currency: Currency;

  @Column("int", { nullable: true, default: 0 })
  is_active: number;

  @Column("text", { nullable: true, default: null })
  address: string;


  // Getters and setters for matching form fields
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

  get decryptedAccountNumber(): string | null {
    return this._decryptedAccountNumber;
  }

  set decryptedAccountNumber(value: string | null) {
    this._decryptedAccountNumber = value;
    if (value !== null) {
      this.account_number = this.encrypt(value);
    } else {
      this.account_number = null;
    }
  }

  get decryptedAccountHolder(): string | null {
    return this._decryptedAccountHolder;
  }

  set decryptedAccountHolder(value: string | null) {
    this._decryptedAccountHolder = value;
    if (value !== null) {
      this.account_holder = this.encrypt(value);
    } else {
      this.account_holder = null;
    }
  }

  get decryptedIfscCode(): string | null {
    return this._decryptedIfscCode;
  }

  set decryptedIfscCode(value: string | null) {
    this._decryptedIfscCode = value;
    if (value !== null) {
      this.ifsc_code = this.encrypt(value);
    } else {
      this.ifsc_code = null;
    }
  }


  get decryptedSwiftCode(): string | null {
  return this._decryptedSwiftCode;
}

set decryptedSwiftCode(value: string | null) {
  this._decryptedSwiftCode = value;
  if (value !== null) {
    this.swift_code = this.encrypt(value);
  } else {
    this.swift_code = null;
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
    if (this.account_number) {
      this._decryptedAccountNumber = this.decrypt(this.account_number);
    }
    if (this.account_holder) {
      this._decryptedAccountHolder = this.decrypt(this.account_holder);
    }
    if (this.ifsc_code) {
      this._decryptedIfscCode = this.decrypt(this.ifsc_code);
    }
    if (this.swift_code) {
  this._decryptedSwiftCode = this.decrypt(this.swift_code);
}

  }

  @BeforeInsert()
  @BeforeUpdate()
  encryptFields(): void {
    // This method can be empty since encryption happens in setters
    // Keeping it for consistency with TypeORM lifecycle hooks
  }
}
