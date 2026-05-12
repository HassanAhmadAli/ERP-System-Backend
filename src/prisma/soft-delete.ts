/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { Prisma } from "./generated/prisma-client/client";

const softDeleteQueryOptions = {
  async aggregate({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
  async count({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
  async findFirst({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
  async findFirstOrThrow({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
  async findMany({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
  async findUnique({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
  async findUniqueOrThrow({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
  async groupBy({ args, query }: any) {
    if (args.where) {
      if (args.where != undefined && "deletedAt" in args.where) {
        return query(args);
      }
      args.where = {
        deletedAt: null,
        ...args.where,
      };
    } else {
      args.where = {
        deletedAt: null,
      };
    }
    return query(args);
  },
  async update({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
  async updateMany({ args, query }: any) {
    if (args.where != undefined) {
      if ("deletedAt" in args.where) {
        return query(args);
      }
      args.where = {
        deletedAt: null,
        ...args.where,
      };
    } else {
      args.where = {
        deletedAt: null,
      };
    }
    return query(args);
  },
  async updateManyAndReturn({ args, query }: any) {
    if (args.where != undefined) {
      if ("deletedAt" in args.where) {
        return query(args);
      }
      args.where = {
        deletedAt: null,
        ...args.where,
      };
    } else {
      args.where = {
        deletedAt: null,
      };
    }
    return query(args);
  },
  async upsert({ args, query }: any) {
    if (args.where != undefined && "deletedAt" in args.where) {
      return query(args);
    }
    args.where = {
      deletedAt: null,
      ...args.where,
    };
    return query(args);
  },
};

export const softDeletePrismaExtension = Prisma.defineExtension({
  query: {
    attachment: softDeleteQueryOptions,
  },
});
