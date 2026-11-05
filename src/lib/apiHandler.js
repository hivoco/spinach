/**
 * Ported from the archetype app's `apiHandler`: turns a thrown error into the
 * same `{ msg, error }` payload the old backend returned. Route Handlers only
 * export the methods they allow, so Next answers other methods with a 405.
 */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const assertOrThrow = (condition, statusCode, message) => {
  if (!condition) throw new HttpError(statusCode, message);
};

/** The request body as JSON; a missing or malformed body reads as `{}`, as Express's parser left it. */
export const readJson = (request) => request.json().catch(() => ({}));

export const apiHandler = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (err) {
    console.error(`[api] ${request.method} ${request.nextUrl.pathname}`, err);
    return Response.json(
      { msg: "something unwanted occured....", error: err.message },
      { status: err.statusCode || 500 }
    );
  }
};

export default apiHandler;
