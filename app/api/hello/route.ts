/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Returns hello world
 *     responses:
 *       200:
 *         description: Hello World!
 */
export async function GET() {
  return Response.json({ message: 'Hello World!' });
}