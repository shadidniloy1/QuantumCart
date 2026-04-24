// import { PrismaClient } from "../app/generated/prisma/client"; 
// import { PrismaPg } from "@prisma/adapter-pg"; 
// const globalForPrisma = global as unknown as {
//   prisma: PrismaClient; 
// }; 
// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL, 
// }); 
// const prisma =
//   globalForPrisma.prisma ||
//   new PrismaClient({
//     adapter, 
//   }); 
// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; 
// export default prisma; 

// import { PrismaClient } from "../app/generated/prisma";

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
//   });

// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.prisma = prisma;
// }

// export default prisma;

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const pool    = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;