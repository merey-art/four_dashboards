import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo123456", 10);

  await prisma.user.deleteMany();
  await prisma.dashboardBuiltinColumnLabel.deleteMany();
  await prisma.dashboardCustomColumn.deleteMany();
  await prisma.accountingAct.deleteMany();
  await prisma.legalContract.deleteMany();
  await prisma.logisticsContainer.deleteMany();
  await prisma.clientServiceOrder.deleteMany();

  const users = [
    { email: "director@logistics.kz", name: "Айгерим Нурланова", role: "DIRECTOR" },
    { email: "clients@logistics.kz", name: "Ерлан Садыков", role: "CLIENT_SERVICE" },
    { email: "logistics@logistics.kz", name: "Марат Абдуллин", role: "LOGISTICS" },
    { email: "legal@logistics.kz", name: "Дана Омирова", role: "LEGAL" },
    { email: "accounting@logistics.kz", name: "Асель Серикова", role: "ACCOUNTING" },
  ];

  await prisma.user.createMany({
    data: users.map((u) => ({
      ...u,
      passwordHash,
    })),
  });

  const crossings = ["Достык (ЖВК)", "Алтынколь", "Коргас — Хоргос", "Бакты", "Жемчужина"];

  await prisma.clientServiceOrder.createMany({
    data: [
      { clientName: "ТОО «КазТранзит»", orderNumber: "KT-24118", quantity: 22, expectedDelivery: new Date("2026-05-03"), codeIssued: true },
      { clientName: "ТОО «Азия Логистик»", orderNumber: "AL-9821", quantity: 14, expectedDelivery: new Date("2026-05-08"), codeIssued: false },
      { clientName: "ИП Өтепберген", orderNumber: "IO-7742", quantity: 8, expectedDelivery: new Date("2026-05-02"), codeIssued: true },
      { clientName: "ТОО «Северный коридор»", orderNumber: "SK-1104", quantity: 30, expectedDelivery: new Date("2026-05-12"), codeIssued: false },
      { clientName: "ТОО «Атырау Контейнер»", orderNumber: "AK-6610", quantity: 18, expectedDelivery: new Date("2026-04-29"), codeIssued: true },
      { clientName: "ТОО «Степной экспресс»", orderNumber: "SE-2209", quantity: 12, expectedDelivery: new Date("2026-05-15"), codeIssued: false },
      { clientName: "ТОО «Павлодар Терминал»", orderNumber: "PT-5501", quantity: 26, expectedDelivery: new Date("2026-05-01"), codeIssued: true },
      { clientName: "ТОО «Алматы Форвардинг»", orderNumber: "AF-3344", quantity: 9, expectedDelivery: new Date("2026-04-27"), codeIssued: true },
      { clientName: "ИП Тоқбаева", orderNumber: "IT-8871", quantity: 6, expectedDelivery: new Date("2026-05-20"), codeIssued: false },
      { clientName: "ТОО «Каспий Логистик»", orderNumber: "KL-4022", quantity: 20, expectedDelivery: new Date("2026-05-06"), codeIssued: true },
      { clientName: "ТОО «Шым Фрейт»", orderNumber: "SF-1199", quantity: 11, expectedDelivery: new Date("2026-05-18"), codeIssued: false },
      { clientName: "ТОО «Транзит Жетысу»", orderNumber: "TJ-7600", quantity: 40, expectedDelivery: new Date("2026-05-09"), codeIssued: true },
    ],
  });

  const logisticsStatuses = [
    "ON_GROUND_BORDER",
    "IN_TRANSIT_BORDER",
    "SHIPPED",
    "NOT_DEPARTED",
    "ON_GROUND_BORDER",
    "IN_TRANSIT_BORDER",
    "NOT_DEPARTED",
    "SHIPPED",
    "ON_GROUND_BORDER",
    "IN_TRANSIT_BORDER",
    "SHIPPED",
    "NOT_DEPARTED",
  ];

  for (let i = 0; i < 12; i++) {
    await prisma.logisticsContainer.create({
      data: {
        containerNumber: `MSKU-${900000 + i}-${String.fromCharCode(65 + (i % 5))}`,
        borderCrossing: crossings[i % crossings.length],
        routeNote:
          i % 3 === 0 ? "Алматы — Достык (ж/д блок)" : i % 3 === 1 ? "Кентау — Жетысай" : "В ходу через Китай",
        status: logisticsStatuses[i],
      },
    });
  }

  await prisma.legalContract.createMany({
    data: [
      { counterparty: "ТОО «КазХимПоставка»", partyType: "CLIENT", phase: "SIGNING", originalReceived: false, contractDate: new Date("2026-04-20") },
      { counterparty: "Sinotrans (Shanghai)", partyType: "SUPPLIER", phase: "COMPLETED", originalReceived: true, contractDate: new Date("2026-03-12") },
      { counterparty: "ТОО «Ойл Транспорт»", partyType: "CLIENT", phase: "COMPLETED", originalReceived: true, contractDate: new Date("2026-03-05") },
      { counterparty: "OOO «Южный коридор» (РФ)", partyType: "SUPPLIER", phase: "SIGNING", originalReceived: false, contractDate: new Date("2026-05-02") },
      { counterparty: "ТОО «Павлодар Терминал»", partyType: "CLIENT", phase: "SIGNING", originalReceived: false, contractDate: new Date("2026-05-10") },
      { counterparty: "COSCO Shipping Lines", partyType: "SUPPLIER", phase: "COMPLETED", originalReceived: false, contractDate: new Date("2026-02-18") },
      { counterparty: "ТОО «Актобе Пресс»", partyType: "CLIENT", phase: "COMPLETED", originalReceived: true, contractDate: new Date("2026-01-22") },
      { counterparty: "ТОО «Темир Джол»", partyType: "SUPPLIER", phase: "COMPLETED", originalReceived: true, contractDate: new Date("2026-02-03") },
      { counterparty: "ТОО «Нурлы Жол Карго»", partyType: "CLIENT", phase: "SIGNING", originalReceived: false, contractDate: new Date("2026-05-14") },
      { counterparty: "Maersk Line", partyType: "SUPPLIER", phase: "COMPLETED", originalReceived: true, contractDate: new Date("2025-11-09") },
      { counterparty: "ТОО «Алматы Трейд»", partyType: "CLIENT", phase: "COMPLETED", originalReceived: false, contractDate: new Date("2026-03-29") },
      { counterparty: "OOO Логистика (Москва)", partyType: "SUPPLIER", phase: "SIGNING", originalReceived: false, contractDate: new Date("2026-05-21") },
    ],
  });

  const suppliers = ["Sinotrans", "COSCO", "Maersk", "ЖД Казахстан", "CP World", "KazTrans Terminal"];
  const clientsAcc = ["КазТранзит", "Атырау Контейнер", "Павлодар Терминал", "Жетысу Карго"];

  for (let i = 0; i < 6; i++) {
    await prisma.accountingAct.create({
      data: {
        counterpartName: suppliers[i],
        party: "SUPPLIER",
        actKind: "RECONCILIATION",
        actDate: new Date(2026, 3, 5 + i),
        originalReceived: i % 2 === 0,
      },
    });
    await prisma.accountingAct.create({
      data: {
        counterpartName: clientsAcc[i % clientsAcc.length],
        party: "CLIENT",
        actKind: "RECONCILIATION",
        actDate: new Date(2026, 3, 10 + i),
        originalReceived: i % 3 !== 1,
      },
    });
    await prisma.accountingAct.create({
      data: {
        counterpartName: suppliers[(i + 2) % suppliers.length],
        party: "SUPPLIER",
        actKind: "ORIGINAL_ACT",
        actDate: new Date(2026, 2, 20 + i),
        originalReceived: i % 2 === 1,
      },
    });
    await prisma.accountingAct.create({
      data: {
        counterpartName: clientsAcc[(i + 1) % clientsAcc.length],
        party: "CLIENT",
        actKind: "ORIGINAL_ACT",
        actDate: new Date(2026, 2, 25 + i),
        originalReceived: i % 2 === 0,
      },
    });
  }

  console.log(
    JSON.stringify({
      seededUsers: users.map((u) => u.email),
      passwordDemo: "demo123456",
    }),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
