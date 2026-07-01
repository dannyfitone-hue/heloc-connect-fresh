V41 deploy fix:
- Removed package-lock.json that pointed to an internal npm registry URL.
- This fixes Vercel npm install ETIMEDOUT against packages.applied-caas-gateway1.internal.api.openai.org.
- No frontend/voice/functionality changes were made.
- ElevenLabs welcome voice remains included.
