import { Prisma } from "./generated/prisma-client/client";

export const softDeletePrismaExtension = Prisma.defineExtension({
  query: {
    $allModels: {
      async aggregate({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async count({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async findFirst({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async findFirstOrThrow({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async findMany({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async findUnique({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async findUniqueOrThrow({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async groupBy({ args, query }) {
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
      async update({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async updateMany({ args, query }) {
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
      async updateManyAndReturn({ args, query }) {
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
      async upsert({ args, query }) {
        if (args.where != undefined && "deletedAt" in args.where) {
          return query(args);
        }
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
    },
  },
});
