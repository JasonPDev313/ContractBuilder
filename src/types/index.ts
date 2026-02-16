import { Contract, Signature, User } from '@prisma/client'

export type ContractWithSignatures = Contract & {
  signatures: Signature[]
  createdBy: User
}

export type SignatureWithContract = Signature & {
  contract: Contract
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      organizationId: string | null
    }
  }

  interface User {
    role: string
    organizationId?: string | null
  }
}

// Note: next-auth/jwt module augmentation removed due to bundling issues
// JWT types are inferred from the actual next-auth configuration
