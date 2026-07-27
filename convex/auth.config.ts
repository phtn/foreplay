import type { AuthConfig } from 'convex/server'

const firebaseProjectId = 'fairway-tournaments'

export default {
  providers: [
    {
      type: 'customJwt',
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
      jwks: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
      algorithm: 'RS256',
      applicationID: firebaseProjectId
    }
  ]
} satisfies AuthConfig
