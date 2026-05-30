import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields, adminClient } from 'better-auth/client/plugins'

const client = createAuthClient({
  baseURL: 'http://localhost:3000',
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: 'string', required: false }
      }
    }),
    adminClient()
  ]
})

export const authClient = client;
