/**
 * One-time data migration script to assign existing users and contracts
 * to a default organization after adding multi-tenancy support.
 *
 * Run this script ONCE after applying the schema migration:
 * npx tsx prisma/migrate-existing-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateData() {
  console.log('Starting data migration...\n')

  try {
    // Check if default organization already exists
    let defaultOrg = await prisma.organization.findUnique({
      where: { slug: 'default' },
    })

    if (defaultOrg) {
      console.log('✓ Default organization already exists:', defaultOrg.name)
    } else {
      // Create default organization
      defaultOrg = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          plan: 'FREE',
        },
      })
      console.log('✓ Created default organization:', defaultOrg.name)
    }

    // Count users without organization
    const usersWithoutOrg = await prisma.user.count({
      where: { organizationId: null },
    })

    if (usersWithoutOrg > 0) {
      // Assign all users without an organization to default org
      const updatedUsers = await prisma.user.updateMany({
        where: { organizationId: null },
        data: { organizationId: defaultOrg.id },
      })
      console.log(
        `✓ Assigned ${updatedUsers.count} users to default organization`
      )
    } else {
      console.log('✓ All users already have an organization')
    }

    // Count contracts without organization
    const contractsWithoutOrg = await prisma.contract.count({
      where: { organizationId: null },
    })

    if (contractsWithoutOrg > 0) {
      // Assign all contracts without an organization to default org
      const updatedContracts = await prisma.contract.updateMany({
        where: { organizationId: null },
        data: { organizationId: defaultOrg.id },
      })
      console.log(
        `✓ Assigned ${updatedContracts.count} contracts to default organization`
      )
    } else {
      console.log('✓ All contracts already have an organization')
    }

    console.log('\n✅ Data migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\nYou can now safely use the multi-tenant features.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration error:', error)
    process.exit(1)
  })
