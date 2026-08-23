import { NotificationTargetType, UserRole } from "@/prisma/client";
import type { PrismaTransactionClient } from "./data/generators";
import { lowStockProducts } from "./inventory";
import { WAREHOUSE_USER_ID, CASHIER_EMPLOYEE_IDS } from "./staff";
import { CUSTOMERS } from "./customers";

function daysAgo(days: number, hour = 9): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export async function seedNotifications(tx: PrismaTransactionClient) {
  let recipientId = 0;
  const nextRecipientId = () => ++recipientId;

  const lowStock = lowStockProducts();
  const alertProduct = lowStock[0];

  await tx.notification.create({
    data: {
      senderId: 1,
      title: "Low stock alert",
      titleAr: "تنبيه انخفاض المخزون",
      body: alertProduct
        ? `${alertProduct.name} has dropped below its minimum level (${alertProduct.quantityInStock} left, minimum ${alertProduct.minQuantity}). Please create a restock request.`
        : "Some products have reached their minimum stock level. Please review the inventory report.",
      bodyAr: alertProduct
        ? `وصل ${alertProduct.nameAr} إلى الحد الأدنى للمخزون (${alertProduct.quantityInStock} قطعة متبقية من أصل ${alertProduct.minQuantity}). يرجى إعداد طلب توريد عاجل.`
        : "بعض المنتجات وصلت إلى الحد الأدنى للمخزون، برجاء مراجعة تقرير الجرد.",
      targetType: NotificationTargetType.ROLE,
      targetRole: UserRole.WAREHOUSE_WORKER,
      sentAt: daysAgo(1, 8),
      recipients: {
        create: [{ id: nextRecipientId(), userId: WAREHOUSE_USER_ID, isRead: false }],
      },
    },
  });

  await tx.notification.create({
    data: {
      senderId: 1,
      title: "Welcome to ShopLink",
      titleAr: "أهلًا بك في شوب لينك",
      body: "Your account is ready. Browse our latest arrivals and start earning loyalty points today.",
      bodyAr: "تم تجهيز حسابك بنجاح. تصفح أحدث المنتجات وابدأ في جمع نقاط الولاء من اليوم.",
      targetType: NotificationTargetType.USER,
      sentAt: daysAgo(30, 12),
      recipients: {
        create: [
          { id: nextRecipientId(), userId: 6, isRead: true, readAt: daysAgo(29, 18) },
          { id: nextRecipientId(), userId: 9, isRead: false },
        ],
      },
    },
  });

  await tx.notification.create({
    data: {
      senderId: 1,
      title: "Weekend deals are live - up to 10% off",
      titleAr: "بدأت عروض نهاية الأسبوع - خصم يصل إلى 10%",
      body: "Enjoy up to 10% off dairy, produce and pantry staples for a limited time.",
      bodyAr: "استمتع بخصم يصل إلى 10% على الألبان والخضار ومواد المونة لفترة محدودة.",
      targetType: NotificationTargetType.ROLE,
      targetRole: UserRole.CUSTOMER,
      sentAt: daysAgo(7, 10),
      recipients: {
        create: CUSTOMERS.map((customer) => ({
          id: nextRecipientId(),
          userId: customer.id,
          isRead: customer.id % 3 === 0,
          readAt: customer.id % 3 === 0 ? daysAgo(6, 20) : null,
        })),
      },
    },
  });

  const [cashierA, cashierB] = CASHIER_EMPLOYEE_IDS;

  await tx.notification.create({
    data: {
      senderId: 1,
      title: "Shift reminder",
      titleAr: "تذكير بالوردية",
      body: "Evening shift starts at 4:00 PM. Please sign in at the POS terminal.",
      bodyAr: "تبدأ الوردية المسائية الساعة الرابعة عصرًا، برجاء تسجيل الحضور على جهاز نقاط البيع.",
      targetType: NotificationTargetType.ROLE,
      targetRole: UserRole.CASHIER,
      sentAt: daysAgo(2, 13),
      recipients: {
        create: [
          { id: nextRecipientId(), userId: cashierA!, isRead: true, readAt: daysAgo(2, 14) },
          { id: nextRecipientId(), userId: cashierB!, isRead: false },
        ],
      },
    },
  });
}
