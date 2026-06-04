import type { Server } from 'http';
import request from 'supertest';
export async function seedProjectAndApiKey(
  server: Server,
  projectName = 'E2E Project',
): Promise<{ projectId: string; apiKey: string }> {
  const projectRes = await request(server)
    .post('/v1/web/projects')
    .send({ name: projectName })
    .expect(201);

  const projectId = projectRes.body.data.id as string;

  const keyRes = await request(server)
    .post('/v1/web/api-keys')
    .send({ projectId, name: 'e2e' })
    .expect(201);

  return { projectId, apiKey: keyRes.body.data.key as string };
}
