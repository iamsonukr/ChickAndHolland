export class NotFound extends Error {
  code = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFound";
  }
}

export class BadRequest extends Error {
  code = 400;
  constructor(message: string | string[]) {
    if (message instanceof Array) message = message.join(", ");
    super(message.toString());
    this.name = "BadRequest";
  }
}

export class Unauthorized extends Error {
  code = 401;
  constructor(message: string) {
    super(message);
    this.name = "Unauthorized";
  }
}

export class Forbidden extends Error {
  code = 403;
  constructor(message: string) {
    super(message);
    this.name = "Forbidden";
  }
}
