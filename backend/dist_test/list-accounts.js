"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const journals = await prisma.journal.findMany({
        select: {
            id: true,
            code: true,
            name: true,
            type: true,
        }
    });
    // Hardcode check
    console.log("JOURNALS:");
    for (const j of journals) {
        console.log(`${j.id}:${j.code}:${j.type}`);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
