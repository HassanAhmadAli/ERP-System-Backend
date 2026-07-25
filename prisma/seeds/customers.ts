import { type Prisma, UserRole } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { faker } from "./data/generators";
import { HashingService } from "@/hashing/hashing.service";

export const CUSTOMER_COUNT = 1000;
export const CUSTOMER_ID_OFFSET = 13;
const PASSWORD = "12345678";

const CITIES = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "Austin, TX",
  "Miami, FL",
  "Denver, CO",
  "Boston, MA",
  "Seattle, WA",
  "Portland, OR",
];

export async function seedCustomers(tx: Prisma.TransactionClient, hashingService: HashingService) {
  const passwordHash = await hashingService.hash(PASSWORD);

  const userData: Prisma.UserCreateManyInput[] = [];
  const customerData: Prisma.CustomerCreateManyInput[] = [];

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const id = CUSTOMER_ID_OFFSET + i;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const city = CITIES[Math.floor(Math.random() * CITIES.length)]!;

    userData.push({
      id,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      fullName: `${firstName} ${lastName}`,
      fullNameAr: null,
      phoneNumber: faker.phone.number({ style: "national" }),
      nationalId: String(2_000_000_000 + id),
      passwordHash,
      role: UserRole.CUSTOMER,
      isActive: true,
      language: Math.random() > 0.7 ? "ar" : "en",
      isVerified: true,
    });

    customerData.push({
      id,
      userId: id,
      address: `${faker.location.streetAddress({ useFullAddress: true })}, ${city}`,
      addressAr: null,
      loyaltyPoints: 0,
      totalSpent: "0",
    });
  }

  userData[0] = {
    ...userData[0]!,
    email: "customer.user@example.com",
    fullName: "Rose Fritz",
  };

  customerData[0] = {
    ...customerData[0]!,
    address: "123 Main St, Springfield",
  };

  await tx.user.createMany({ data: userData });
  await tx.customer.createMany({ data: customerData });
}
