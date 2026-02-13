import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const mailbox = await prisma.mailbox.upsert({
        where: { email: 'demo@mailien.dev' },
        update: {},
        create: {
            id: 'demo-mailbox',
            email: 'demo@mailien.dev',
            name: 'Demo User',
        },
    })

    console.log('Seeded mailbox:', mailbox.email)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
