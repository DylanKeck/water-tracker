import postgres from 'postgres';
import type { Route } from './+types/version';

// The loader function runs on the server
export async function loader() {
    const sql = postgres(process.env.DATABASE_URL as string);
    const response = await sql`SELECT version()`;
    return { version: response[0].version };
}

// The component runs in the browser
export default function Version({ loaderData }: Route.ComponentProps) {
    return (
        <div>
            <h1>Database Version</h1>
            <p>{loaderData.version}</p>
        </div>
    );
}